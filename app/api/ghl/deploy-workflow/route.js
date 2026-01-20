/**
 * GHL Deploy Workflow - SIMPLIFIED
 * Calls individual push APIs directly with proper auth
 * Uses the customValuesMap.js based routes (push-funnel-copy, push-emails, etc.)
 */

import { auth } from '@clerk/nextjs';
import { NextResponse } from 'next/server';
import { supabase as supabaseAdmin } from '@/lib/supabaseServiceRole';

// Import the individual push handlers directly instead of making HTTP calls
import { FUNNEL_COPY_MAP, COLORS_MAP, EMAIL_MAP, SMS_MAP, MEDIA_MAP } from '@/lib/ghl/customValuesMap';
import { polishTextContent, polishSMSContent } from '@/lib/ghl/contentPolisher';

export const dynamic = 'force-dynamic';
export const maxDuration = 60; // 60 second timeout

/**
 * Get location access token for GHL API calls (OAuth)
 */
async function getLocationToken(userId, locationId) {
    // Get user's sub-account
    const { data: subaccount, error: subErr } = await supabaseAdmin
        .from('ghl_subaccounts')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .single();

    if (subErr || !subaccount) {
        return { success: false, error: 'No sub-account found' };
    }

    // Get agency token
    const { data: tokenData, error: tokenErr } = await supabaseAdmin
        .from('ghl_tokens')
        .select('*')
        .eq('user_type', 'Company')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

    if (tokenErr || !tokenData) {
        return { success: false, error: 'No agency token found' };
    }

    const companyId = tokenData.company_id;
    if (!companyId) {
        return { success: false, error: 'companyId missing from token' };
    }

    // Generate location token
    try {
        const resp = await fetch('https://services.leadconnectorhq.com/oauth/locationToken', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${tokenData.access_token}`,
                'Content-Type': 'application/json',
                'Version': '2021-07-28',
            },
            body: JSON.stringify({
                companyId: companyId,
                locationId: locationId || subaccount.location_id,
            }),
        });

        const text = await resp.text();

        // Check for HTML (error page)
        if (text.trim().startsWith('<')) {
            console.error('[Deploy] GHL returned HTML:', text.substring(0, 200));
            return { success: false, error: 'GHL OAuth error - token may be expired' };
        }

        if (!resp.ok) {
            return { success: false, error: `GHL OAuth failed: ${text.substring(0, 100)}` };
        }

        const data = JSON.parse(text);
        if (!data.access_token) {
            return { success: false, error: 'No access_token in response' };
        }

        return {
            success: true,
            access_token: data.access_token,
            location_id: locationId || subaccount.location_id
        };
    } catch (e) {
        return { success: false, error: `OAuth error: ${e.message}` };
    }
}

/**
 * Fetch existing GHL custom values
 */
async function fetchExistingValues(locationId, accessToken) {
    const allValues = [];
    let skip = 0;

    while (true) {
        try {
            const resp = await fetch(
                `https://services.leadconnectorhq.com/locations/${locationId}/customValues?skip=${skip}&limit=100`,
                {
                    headers: {
                        'Authorization': `Bearer ${accessToken}`,
                        'Version': '2021-07-28',
                    }
                }
            );

            const text = await resp.text();
            if (text.trim().startsWith('<')) {
                console.error('[Deploy] GHL values fetch returned HTML');
                break;
            }

            if (!resp.ok) break;

            const data = JSON.parse(text);
            const values = data.customValues || [];
            allValues.push(...values);

            if (values.length < 100) break;
            skip += 100;
            if (allValues.length >= 500) break;
        } catch (e) {
            console.error('[Deploy] Error fetching values:', e);
            break;
        }
    }

    return allValues;
}

/**
 * Push a single custom value to GHL
 */
async function pushValue(locationId, accessToken, key, value, existingValueId = null) {
    const url = existingValueId
        ? `https://services.leadconnectorhq.com/locations/${locationId}/customValues/${existingValueId}`
        : `https://services.leadconnectorhq.com/locations/${locationId}/customValues`;

    try {
        const resp = await fetch(url, {
            method: existingValueId ? 'PUT' : 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
                'Version': '2021-07-28',
            },
            body: JSON.stringify({ name: key, value: value }),
        });

        if (!resp.ok) {
            const errText = await resp.text();
            return { success: false, error: errText.substring(0, 100) };
        }

        return { success: true, updated: !!existingValueId };
    } catch (e) {
        return { success: false, error: e.message };
    }
}

export async function POST(req) {
    const startTime = Date.now();

    try {
        const { userId } = auth();
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const funnelId = body.funnelId || body.funnel_id;

        if (!funnelId) {
            return NextResponse.json({ error: 'funnelId required' }, { status: 400 });
        }

        console.log(`[Deploy] Starting for funnel ${funnelId}`);

        // 1. Get sub-account
        const { data: subaccount } = await supabaseAdmin
            .from('ghl_subaccounts')
            .select('location_id')
            .eq('user_id', userId)
            .eq('is_active', true)
            .single();

        if (!subaccount?.location_id) {
            return NextResponse.json({ error: 'GHL sub-account not found' }, { status: 400 });
        }

        const locationId = subaccount.location_id;
        console.log(`[Deploy] Location: ${locationId}`);

        // 2. Get OAuth token
        const tokenResult = await getLocationToken(userId, locationId);
        if (!tokenResult.success) {
            console.error('[Deploy] Token error:', tokenResult.error);
            return NextResponse.json({ error: tokenResult.error }, { status: 401 });
        }

        const accessToken = tokenResult.access_token;
        console.log('[Deploy] Got OAuth token');

        // 3. Fetch existing values for ID lookup
        const existingValues = await fetchExistingValues(locationId, accessToken);
        console.log(`[Deploy] Found ${existingValues.length} existing values`);

        // Build lookup map (multiple key formats)
        const existingMap = new Map();
        existingValues.forEach(v => {
            existingMap.set(v.name, v.id);
            existingMap.set(v.name.toLowerCase(), v.id);
            existingMap.set(v.name.replace(/\s+/g, '_'), v.id);
            existingMap.set(v.name.toLowerCase().replace(/\s+/g, '_'), v.id);
        });

        // 4. Fetch vault content
        const { data: vaultSections } = await supabaseAdmin
            .from('vault_content')
            .select('section_id, content')
            .eq('funnel_id', funnelId)
            .eq('is_current_version', true);

        const vaultContent = {};
        (vaultSections || []).forEach(s => {
            vaultContent[s.section_id] = s.content;
        });

        console.log(`[Deploy] Vault sections: ${Object.keys(vaultContent).join(', ')}`);

        // 5. Build and push values
        const results = { pushed: 0, updated: 0, failed: 0, errors: [] };

        // Helper to find existing ID
        const findId = (key) => {
            return existingMap.get(key) ||
                existingMap.get(key.toLowerCase()) ||
                existingMap.get(key.replace(/\s+/g, '_')) ||
                existingMap.get(key.toLowerCase().replace(/\s+/g, '_'));
        };

        // === FUNNEL COPY ===
        const funnelCopy = vaultContent.funnelCopy || {};
        console.log(`[Deploy] Processing funnel copy...`);

        for (const [page, fields] of Object.entries(FUNNEL_COPY_MAP)) {
            const pageContent = funnelCopy[page] || {};
            for (const [field, ghlKey] of Object.entries(fields)) {
                const rawValue = pageContent[field];
                if (rawValue) {
                    const existingId = findId(ghlKey);
                    const result = await pushValue(locationId, accessToken, ghlKey, String(rawValue), existingId);
                    if (result.success) {
                        results.pushed++;
                        if (result.updated) results.updated++;
                    } else {
                        results.failed++;
                        results.errors.push({ key: ghlKey, error: result.error });
                    }
                }
            }
        }

        console.log(`[Deploy] Funnel copy done: ${results.pushed} pushed`);

        // === EMAILS ===
        const emails = vaultContent.emails || {};
        console.log(`[Deploy] Processing emails...`);

        // Process free gift email
        if (emails.freeGift) {
            for (const [field, ghlKey] of Object.entries(EMAIL_MAP.freeGift || {})) {
                const value = emails.freeGift[field];
                if (value) {
                    const existingId = findId(ghlKey);
                    const result = await pushValue(locationId, accessToken, ghlKey, String(value), existingId);
                    if (result.success) results.pushed++;
                    else results.failed++;
                }
            }
        }

        // Process optin sequence
        const optinSequence = EMAIL_MAP.optinSequence || {};
        for (const [day, dayMap] of Object.entries(optinSequence)) {
            const dayContent = emails[day] || emails.optinSequence?.[day] || {};
            for (const [field, ghlKey] of Object.entries(dayMap)) {
                const value = dayContent[field];
                if (value) {
                    const existingId = findId(ghlKey);
                    const result = await pushValue(locationId, accessToken, ghlKey, String(value), existingId);
                    if (result.success) results.pushed++;
                    else results.failed++;
                }
            }
        }

        console.log(`[Deploy] Emails done, total: ${results.pushed} pushed`);

        // === COLORS ===
        const colors = vaultContent.colors || vaultContent.brandColors || {};
        console.log(`[Deploy] Processing colors...`);

        for (const [section, fields] of Object.entries(COLORS_MAP)) {
            const sectionColors = colors[section] || {};
            for (const [field, ghlKey] of Object.entries(fields)) {
                const value = sectionColors[field] || colors[field];
                if (value) {
                    const existingId = findId(ghlKey);
                    const result = await pushValue(locationId, accessToken, ghlKey, String(value), existingId);
                    if (result.success) results.pushed++;
                    else results.failed++;
                }
            }
        }

        console.log(`[Deploy] Colors done, total: ${results.pushed} pushed`);

        const duration = Math.round((Date.now() - startTime) / 1000);
        console.log(`[Deploy] Complete in ${duration}s: ${results.pushed} pushed, ${results.failed} failed`);

        // Log deployment
        await supabaseAdmin.from('ghl_oauth_logs').insert({
            user_id: userId,
            event_type: 'deploy_completed',
            location_id: locationId,
            metadata: { funnel_id: funnelId, ...results, duration_seconds: duration }
        });

        // Update funnel status
        await supabaseAdmin
            .from('user_funnels')
            .update({
                deployed_at: new Date().toISOString(),
                deployment_status: results.failed === 0 ? 'deployed' : 'partial'
            })
            .eq('id', funnelId);

        return NextResponse.json({
            success: results.failed === 0,
            message: `Deployed ${results.pushed} values (${results.updated} updated, ${results.failed} failed)`,
            summary: { ...results, duration: `${duration}s` },
            errors: results.errors.length > 0 ? results.errors.slice(0, 10) : undefined
        });

    } catch (error) {
        console.error('[Deploy] Fatal:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
