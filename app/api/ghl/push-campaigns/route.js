/**
 * GHL Push Campaigns — Phase 3
 * Pushes email campaigns, SMS, and appointment reminders to GHL custom values.
 * Called by the "Push to Campaign Builder" button in the vault Phase 3 tab.
 */

import { auth } from '@clerk/nextjs';
import { NextResponse } from 'next/server';
import { supabase as supabaseAdmin } from '@/lib/supabaseServiceRole';
import { resolveWorkspace } from '@/lib/workspaceHelper';
import { buildCampaignCustomValues, mergeVaultFieldRowsIntoContent, extractSmsMessage } from '@/lib/ghl/slotDeployMapper';

export const dynamic = 'force_dynamic';
export const maxDuration = 120;

async function refreshGHLToken(tokenData) {
    if (!tokenData?.refresh_token) return null;
    try {
        const resp = await fetch('https://services.leadconnectorhq.com/oauth/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                client_id: process.env.GHL_CLIENT_ID,
                client_secret: process.env.GHL_CLIENT_SECRET,
                grant_type: 'refresh_token',
                refresh_token: tokenData.refresh_token,
            }),
        });
        if (!resp.ok) return null;
        const newTokens = await resp.json();
        await supabaseAdmin.from('ghl_tokens').update({
            access_token: newTokens.access_token,
            refresh_token: newTokens.refresh_token || tokenData.refresh_token,
            expires_at: new Date(Date.now() + newTokens.expires_in * 1000).toISOString(),
            updated_at: new Date().toISOString(),
        }).eq('id', tokenData.id);
        return newTokens.access_token;
    } catch {
        return null;
    }
}

async function getLocationToken(userId, locationId) {
    const { data: tokenData } = await supabaseAdmin
        .from('ghl_tokens')
        .select('*')
        .eq('user_type', 'Company')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

    if (!tokenData?.access_token || !tokenData?.company_id) {
        return { success: false, error: 'No agency token found' };
    }

    let accessToken = tokenData.access_token;
    for (let attempt = 1; attempt <= 2; attempt++) {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 10000);
        try {
            const resp = await fetch('https://services.leadconnectorhq.com/oauth/locationToken', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                    'Version': '2021-07-28',
                },
                body: JSON.stringify({ companyId: tokenData.company_id, locationId }),
                signal: controller.signal,
            });
            clearTimeout(timeout);
            const text = await resp.text();
            if (resp.ok && !text.trim().startsWith('<')) {
                const data = JSON.parse(text);
                return { success: true, access_token: data.access_token };
            }
            if (resp.status === 401 && attempt === 1) {
                const newToken = await refreshGHLToken(tokenData);
                if (newToken) { accessToken = newToken; continue; }
                return { success: false, error: 'GHL token expired and refresh failed. Please reconnect your GHL account.', needsReconnect: true };
            }
            return { success: false, error: 'OAuth failed', status: resp.status };
        } catch (e) {
            clearTimeout(timeout);
            if (attempt >= 2) return { success: false, error: e.message };
        }
    }
    return { success: false, error: 'Max OAuth attempts exceeded' };
}

async function fetchExistingValues(locationId, accessToken) {
    const allValues = [];
    let skip = 0;
    for (let page = 0; page < 3; page++) {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 15000);
        try {
            const resp = await fetch(
                `https://services.leadconnectorhq.com/locations/${locationId}/customValues?skip=${skip}&limit=100`,
                { headers: { 'Authorization': `Bearer ${accessToken}`, 'Version': '2021-07-28' }, signal: controller.signal }
            );
            clearTimeout(timeout);
            if (!resp.ok) break;
            const data = await resp.json();
            const values = data.customValues || [];
            allValues.push(...values);
            if (values.length < 100) break;
            skip += 100;
        } catch {
            clearTimeout(timeout);
            break;
        }
    }
    return allValues;
}

async function updateValue(locationId, accessToken, existingId, ghlKey, value) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    try {
        const resp = await fetch(
            `https://services.leadconnectorhq.com/locations/${locationId}/customValues/${existingId}`,
            {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                    'Version': '2021-07-28',
                },
                body: JSON.stringify({ name: ghlKey, value: String(value) }),
                signal: controller.signal,
            }
        );
        clearTimeout(timeout);
        return { success: resp.ok, key: ghlKey };
    } catch (e) {
        clearTimeout(timeout);
        return { success: false, key: ghlKey, error: e.message };
    }
}

export async function POST(req) {
    const startTime = Date.now();
    const logs = [];
    const log = (msg) => { console.log(msg); logs.push({ time: Date.now() - startTime, msg }); };

    try {
        const { userId } = auth();
        if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { workspaceId: targetUserId, error: workspaceError } = await resolveWorkspace(userId);
        if (workspaceError) return NextResponse.json({ error: workspaceError }, { status: 403 });

        const body = await req.json();
        const funnelId = body.funnelId || body.funnel_id;
        if (!funnelId) return NextResponse.json({ error: 'funnelId required' }, { status: 400 });

        // Resolve slot for campaign key prefixing (base keys use '' for slot 3, '{N}_' for others)
        let slotIndex = 3;
        const { data: assignment } = await supabaseAdmin
            .from('funnel_slot_assignments')
            .select('slot_index')
            .eq('funnel_id', funnelId)
            .single();
        if (assignment?.slot_index) {
            slotIndex = assignment.slot_index;
            log(`[Campaigns] Auto-resolved slot ${slotIndex} from funnel assignment`);
        }

        log(`[Campaigns] ========== STARTING CAMPAIGN PUSH ==========`);
        log(`[Campaigns] Funnel ID: ${funnelId} | Slot: ${slotIndex} | User: ${userId} → ${targetUserId}`);

        // Subaccount
        const { data: subaccount } = await supabaseAdmin
            .from('ghl_subaccounts')
            .select('location_id')
            .eq('user_id', targetUserId)
            .eq('is_active', true)
            .single();
        if (!subaccount?.location_id) return NextResponse.json({ error: 'GHL sub-account not found' }, { status: 400 });

        // OAuth token
        const tokenResult = await getLocationToken(targetUserId, subaccount.location_id);
        if (!tokenResult.success) return NextResponse.json({ error: tokenResult.error }, { status: 401 });

        // Load vault content for campaign sections
        const { data: vaultSections } = await supabaseAdmin
            .from('vault_content')
            .select('section_id, content')
            .eq('funnel_id', funnelId)
            .eq('user_id', targetUserId)
            .eq('is_current_version', true)
            .in('section_id', ['emails', 'sms', 'appointmentReminders']);

        let vaultContent = {};
        (vaultSections || []).forEach(s => { vaultContent[s.section_id] = s.content; });

        // Merge granular field rows (emails, sms, appointmentReminders)
        const { data: fieldRows } = await supabaseAdmin
            .from('vault_content_fields')
            .select('section_id, field_id, field_value')
            .eq('funnel_id', funnelId)
            .eq('user_id', targetUserId)
            .in('section_id', ['emails', 'sms', 'appointmentReminders'])
            .eq('is_current_version', true);

        if (fieldRows?.length) {
            vaultContent = mergeVaultFieldRowsIntoContent(vaultContent, fieldRows);
            log(`[Campaigns] Merged ${fieldRows.length} granular field rows`);
        }

        log(`[Campaigns] Vault sections: ${Object.keys(vaultContent).join(', ')}`);

        // Fetch existing GHL custom values for name-matching
        const existingValues = await fetchExistingValues(subaccount.location_id, tokenResult.access_token);
        const existingMap = new Map();
        existingValues.forEach(v => {
            existingMap.set(v.name, { id: v.id, name: v.name });
            existingMap.set(v.name.toLowerCase(), { id: v.id, name: v.name });
            existingMap.set(v.name.replace(/\s+/g, '_'), { id: v.id, name: v.name });
            existingMap.set(v.name.toLowerCase().replace(/\s+/g, '_'), { id: v.id, name: v.name });
            existingMap.set(v.name.replace(/[-\s]+/g, '_').toLowerCase(), { id: v.id, name: v.name });
        });
        log(`[Campaigns] Existing GHL values in lookup: ${existingMap.size}`);

        const findExisting = (ghlKey) => {
            if (existingMap.has(ghlKey)) return existingMap.get(ghlKey);
            const lower = ghlKey.toLowerCase();
            if (existingMap.has(lower)) return existingMap.get(lower);
            const underscored = lower.replace(/\s+/g, '_');
            if (existingMap.has(underscored)) return existingMap.get(underscored);
            const spaced = ghlKey.replace(/_/g, ' ');
            if (existingMap.has(spaced)) return existingMap.get(spaced);
            const titleCase = ghlKey.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
            if (existingMap.has(titleCase)) return existingMap.get(titleCase);
            return null;
        };

        // Build campaign custom values via shared mapper
        const campaignValues = buildCampaignCustomValues({ vaultContent, slotIndex });
        log(`[Campaigns] Campaign values to push: ${Object.keys(campaignValues).length}`);

        const results = { updated: 0, skipped: 0, notFound: 0, failed: 0 };
        const updatedKeys = [];
        const notFoundKeys = [];

        for (const [ghlKey, value] of Object.entries(campaignValues)) {
            if (!value && value !== 0) { results.skipped++; continue; }
            const existing = findExisting(ghlKey);
            if (existing) {
                const result = await updateValue(subaccount.location_id, tokenResult.access_token, existing.id, ghlKey, value);
                if (result.success) {
                    results.updated++;
                    updatedKeys.push(ghlKey);
                    log(`[Campaigns] ✓ ${ghlKey}`);
                } else {
                    results.failed++;
                    log(`[Campaigns] ✗ Failed: ${ghlKey}`);
                }
            } else {
                results.notFound++;
                notFoundKeys.push(ghlKey);
                log(`[Campaigns] ⚠ Not found: ${ghlKey}`);
            }
        }

        const duration = Math.round((Date.now() - startTime) / 1000);
        log(`[Campaigns] ========== COMPLETE — ${duration}s | updated=${results.updated} notFound=${results.notFound} failed=${results.failed} ==========`);

        return NextResponse.json({
            success: results.updated > 0 || results.notFound === 0,
            message: `Updated ${results.updated} campaign values (${results.notFound} not found, ${results.failed} failed)`,
            summary: results,
            duration: `${duration}s`,
            updatedKeys: updatedKeys.slice(0, 30),
            notFoundKeys: notFoundKeys.slice(0, 10),
            logs,
        });

    } catch (error) {
        console.error('[Campaigns] FATAL ERROR:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
