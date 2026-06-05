import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import { verifyAdmin, getSupabaseClient } from '@/lib/adminAuth';
import { supabase as supabaseAdmin } from '@/lib/supabaseServiceRole';
import { pushSingleCustomValue, fetchGHLCustomValues } from '@/lib/ghl/pushSystem';
import {
    buildSlotDeployCustomValues,
    buildCampaignCustomValues,
    mergeVaultFieldRowsIntoContent,
} from '@/lib/ghl/slotDeployMapper';
import { FUNNEL_COPY_MAP } from '@/lib/ghl/customValuesMap';
import { toEmbedUrl } from '@/lib/utils/videoUrl';

export const dynamic = 'force-dynamic';

const supabase = getSupabaseClient();

// Slot 3 is default (no prefix). Other slots prepend e.g. "04_".
function getSlotPrefixes(slotIndex) {
    const slotPrefix = String(slotIndex).padStart(2, '0') + '_';
    const basePrefix = slotIndex === 3 ? '' : slotPrefix;
    return { slotPrefix, basePrefix };
}

// Remap a page-map's 03_* values to the current slot prefix.
function dynMap(map, slotIndex) {
    if (slotIndex === 3) return map;
    const sp = String(slotIndex).padStart(2, '0') + '_';
    return Object.fromEntries(
        Object.entries(map).map(([k, v]) => [k, v.replace(/^03_/, sp)])
    );
}

/**
 * Get a valid location-scoped GHL access token.
 * Uses the global agency token (user_type='Company') from ghl_tokens.
 */
async function resolveLocationToken(locationId) {
    const { data: tokenData } = await supabaseAdmin
        .from('ghl_tokens')
        .select('id, access_token, refresh_token, expires_at, company_id')
        .eq('user_type', 'Company')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

    if (!tokenData?.access_token || !tokenData?.company_id) {
        return { success: false, error: 'No agency token found in ghl_tokens' };
    }

    let agencyToken = tokenData.access_token;

    if (new Date(tokenData.expires_at) <= new Date(Date.now() + 5 * 60 * 1000)) {
        try {
            const refreshResp = await fetch('https://services.leadconnectorhq.com/oauth/token', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: new URLSearchParams({
                    client_id: process.env.GHL_CLIENT_ID,
                    client_secret: process.env.GHL_CLIENT_SECRET,
                    grant_type: 'refresh_token',
                    refresh_token: tokenData.refresh_token,
                    user_type: 'Company',
                }).toString(),
            });
            if (refreshResp.ok) {
                const refreshed = await refreshResp.json();
                agencyToken = refreshed.access_token;
                await supabaseAdmin
                    .from('ghl_tokens')
                    .update({
                        access_token: agencyToken,
                        refresh_token: refreshed.refresh_token,
                        expires_at: new Date(Date.now() + refreshed.expires_in * 1000).toISOString(),
                        updated_at: new Date().toISOString(),
                    })
                    .eq('id', tokenData.id);
            }
        } catch (e) {
            console.warn('[AdminGHLPush] Agency token refresh failed:', e.message);
        }
    }

    const resp = await fetch('https://services.leadconnectorhq.com/oauth/locationToken', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${agencyToken}`,
            'Content-Type': 'application/json',
            'Version': '2021-07-28',
        },
        body: JSON.stringify({ companyId: tokenData.company_id, locationId }),
    });

    if (!resp.ok) {
        const txt = await resp.text();
        return { success: false, error: `GHL locationToken ${resp.status}: ${txt.substring(0, 200)}` };
    }

    const data = await resp.json();
    return { success: true, access_token: data.access_token };
}

/**
 * POST /api/admin/funnels/:funnelId/push-to-ghl
 *
 * Push vault content to GHL on behalf of a user.
 * Uses the same slot-aware 03_* key format as deploy-workflow.
 * Credentials resolved from ghl_subaccounts + ghl_tokens (no user auth needed).
 *
 * Body:
 *   sectionIds?: string[]  — reserved for future per-section filtering (ignored for now;
 *                             full slot push is always performed for correctness)
 */
export async function POST(req, { params }) {
    const log = (msg) => console.log(msg);
    const startTime = Date.now();

    try {
        const { userId: adminUserId } = auth();
        if (!adminUserId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const isAdmin = await verifyAdmin(adminUserId);
        if (!isAdmin) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const { funnelId } = params;

        // 1. Get funnel + owner
        const { data: funnel, error: funnelError } = await supabase
            .from('user_funnels')
            .select('id, user_id, funnel_name')
            .eq('id', funnelId)
            .single();

        if (funnelError || !funnel) {
            return NextResponse.json({ error: 'Funnel not found' }, { status: 404 });
        }
        const targetUserId = funnel.user_id;

        // 2. Resolve slot index (default 3)
        const { data: slotRow } = await supabaseAdmin
            .from('funnel_slot_assignments')
            .select('slot_index')
            .eq('funnel_id', funnelId)
            .maybeSingle();
        const slotIndex = slotRow?.slot_index ?? 3;
        const { slotPrefix, basePrefix } = getSlotPrefixes(slotIndex);

        // Page maps adapted to current slot
        const OPTIN_MAP   = dynMap(FUNNEL_COPY_MAP.optinPage,    slotIndex);
        const SALES_MAP   = dynMap(FUNNEL_COPY_MAP.salesPage,    slotIndex);
        const CALENDAR_MAP = dynMap(FUNNEL_COPY_MAP.calendarPage, slotIndex);
        const THANKYOU_MAP = dynMap(FUNNEL_COPY_MAP.thankYouPage, slotIndex);

        log(`[AdminGHLPush] funnelId=${funnelId} userId=${targetUserId} slot=${slotIndex}`);

        // 3. Resolve location_id from ghl_subaccounts
        let locationId = null;
        const { data: subaccount } = await supabaseAdmin
            .from('ghl_subaccounts')
            .select('location_id')
            .eq('user_id', targetUserId)
            .eq('is_active', true)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

        locationId = subaccount?.location_id;
        if (!locationId) {
            const { data: profile } = await supabaseAdmin
                .from('user_profiles')
                .select('ghl_location_id')
                .eq('id', targetUserId)
                .maybeSingle();
            locationId = profile?.ghl_location_id;
        }

        if (!locationId) {
            return NextResponse.json(
                { error: 'User has no GHL sub-account mapped. Complete GHL setup first.', code: 'NO_SUBACCOUNT' },
                { status: 400 }
            );
        }

        // 4. Get location-scoped access token
        const tokenResult = await resolveLocationToken(locationId);
        if (!tokenResult.success) {
            return NextResponse.json(
                { error: `Cannot obtain GHL token: ${tokenResult.error}`, code: 'TOKEN_ERROR' },
                { status: 400 }
            );
        }
        const accessToken = tokenResult.access_token;

        // 5. Load stored GHL value IDs for fast path (skip full fetch when cached)
        const { data: storedIds } = await supabaseAdmin
            .from('ghl_slot_custom_value_ids')
            .select('ghl_key, ghl_id')
            .eq('user_id', targetUserId)
            .eq('location_id', locationId)
            .eq('slot_index', slotIndex);
        const idMap = new Map((storedIds || []).map(r => [r.ghl_key, r.ghl_id]));
        log(`[AdminGHLPush] Loaded ${idMap.size} stored IDs`);

        // 6. Fetch existing GHL values
        let existingValues = [];
        const KEY_TEMPLATE_LENGTH = 178; // approximate total slot keys
        if (idMap.size < KEY_TEMPLATE_LENGTH) {
            existingValues = await fetchGHLCustomValues(locationId, accessToken);
        }
        log(`[AdminGHLPush] Existing GHL values: ${existingValues.length}`);

        // Build lookup map (multiple formats, mirrors deploy-workflow)
        const existingMap = new Map();
        existingValues.forEach(v => {
            existingMap.set(v.name, { id: v.id, name: v.name });
            existingMap.set(v.name.toLowerCase(), { id: v.id, name: v.name });
            existingMap.set(v.name.replace(/\s+/g, '_'), { id: v.id, name: v.name });
            existingMap.set(v.name.toLowerCase().replace(/\s+/g, '_'), { id: v.id, name: v.name });
            existingMap.set(v.name.replace(/[-\s]+/g, '_').toLowerCase(), { id: v.id, name: v.name });
            existingMap.set(v.name.replace(/\s*-\s*/g, '_').replace(/\s+/g, '_').toLowerCase(), { id: v.id, name: v.name });
        });

        const findExisting = (ghlKey) => {
            if (idMap.has(ghlKey)) return { id: idMap.get(ghlKey), name: ghlKey };
            if (existingMap.has(ghlKey)) return existingMap.get(ghlKey);
            const lower = ghlKey.toLowerCase();
            if (existingMap.has(lower)) return existingMap.get(lower);
            const lowerUnder = lower.replace(/\s+/g, '_');
            if (existingMap.has(lowerUnder)) return existingMap.get(lowerUnder);
            const underToSpaces = ghlKey.replace(/_/g, ' ');
            if (existingMap.has(underToSpaces)) return existingMap.get(underToSpaces);
            const titleCase = ghlKey.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
            if (existingMap.has(titleCase)) return existingMap.get(titleCase);
            const lowerSpaces = ghlKey.replace(/_/g, ' ').toLowerCase();
            if (existingMap.has(lowerSpaces)) return existingMap.get(lowerSpaces);
            const withoutPrefix = ghlKey.replace(/^0[234567890]\d?_/, '');
            const titleNoPrefix = withoutPrefix.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
            if (existingMap.has('03 ' + titleNoPrefix)) return existingMap.get('03 ' + titleNoPrefix);
            if (existingMap.has('02 ' + titleNoPrefix)) return existingMap.get('02 ' + titleNoPrefix);
            return null;
        };

        // Helper to push one value (update-only)
        const results = { updated: 0, skipped: 0, notFound: 0, failed: 0 };
        const pushValue = async (ghlKey, value) => {
            if (!ghlKey || value === null || value === undefined || value === '') return;
            const existing = findExisting(ghlKey);
            if (!existing) { results.notFound++; return; }
            const result = await pushSingleCustomValue(locationId, accessToken, ghlKey, value, existing.id);
            if (result.success) { results.updated++; } else { results.failed++; }
            await new Promise(r => setTimeout(r, 80));
        };

        // 7. Load vault content + ALL field rows
        const [vaultSectionsResult, fieldRowsResult, userProfileResult, colorFieldResult] = await Promise.all([
            supabaseAdmin
                .from('vault_content')
                .select('section_id, content')
                .eq('funnel_id', funnelId)
                .eq('is_current_version', true),
            supabaseAdmin
                .from('vault_content_fields')
                .select('section_id, field_id, field_value, field_type')
                .eq('funnel_id', funnelId)
                .eq('is_current_version', true),
            supabaseAdmin
                .from('user_profiles')
                .select('business_name, email')
                .eq('id', targetUserId)
                .maybeSingle(),
            supabaseAdmin
                .from('vault_content_fields')
                .select('field_value')
                .eq('funnel_id', funnelId)
                .eq('section_id', 'colors')
                .eq('field_id', 'colorPalette')
                .eq('is_current_version', true)
                .maybeSingle(),
        ]);

        // Build base vault content keyed by section_id
        let vaultContent = {};
        (vaultSectionsResult.data || []).forEach(s => { vaultContent[s.section_id] = s.content; });

        // Merge granular field rows into vault content (same as mergeVaultFieldRowsIntoContent)
        const allFieldRows = fieldRowsResult.data || [];
        vaultContent = mergeVaultFieldRowsIntoContent(vaultContent, allFieldRows);
        log(`[AdminGHLPush] Vault sections: ${Object.keys(vaultContent).join(', ')}`);

        // Media fields (separate, uploaded files)
        const mediaFromFields = {};
        allFieldRows.filter(f => f.section_id === 'media' && f.field_value)
            .forEach(f => { mediaFromFields[f.field_id] = f.field_value; });

        // Color palette from fields
        let colorPaletteFromFields = null;
        if (colorFieldResult.data?.field_value) {
            try {
                colorPaletteFromFields = typeof colorFieldResult.data.field_value === 'string'
                    ? JSON.parse(colorFieldResult.data.field_value)
                    : colorFieldResult.data.field_value;
            } catch (_) {}
        }

        const userProfile = userProfileResult.data || {};

        // 8. FunnelCopy — mirrors deploy-workflow line 822 (handle double-nesting)
        const funnelCopy = vaultContent.funnelCopy || {};
        const fcContent = funnelCopy.funnelCopy || funnelCopy;
        log(`[AdminGHLPush] FunnelCopy pages: ${Object.keys(fcContent).join(', ')}`);

        for (const [vaultKey, value] of Object.entries(fcContent.optinPage || {})) {
            await pushValue(OPTIN_MAP[vaultKey], value);
        }
        for (const [vaultKey, value] of Object.entries(fcContent.salesPage || {})) {
            await pushValue(SALES_MAP[vaultKey], value);
        }
        for (const [vaultKey, value] of Object.entries(fcContent.calendarPage || {})) {
            await pushValue(CALENDAR_MAP[vaultKey], value);
        }
        for (const [vaultKey, value] of Object.entries(fcContent.thankYouPage || {})) {
            await pushValue(THANKYOU_MAP[vaultKey], value);
        }

        // 9. Company name + email
        if (userProfile.business_name) await pushValue(basePrefix + 'company_name', userProfile.business_name);
        if (userProfile.email)         await pushValue(slotPrefix + 'company_email', userProfile.email);

        // 10. Colors, media, logo (via buildSlotDeployCustomValues)
        const slotValues = buildSlotDeployCustomValues({
            vaultContent,
            mediaFromFields,
            userProfile,
            colorPaletteFromFields,
            defaultMediaValues: {},
            slotIndex,
        });
        for (const [ghlKey, value] of Object.entries(slotValues)) {
            await pushValue(ghlKey, value);
        }

        // 11. Emails, SMS, appointment reminders (via buildCampaignCustomValues)
        const campaignValues = buildCampaignCustomValues({ vaultContent, slotIndex });
        for (const [ghlKey, value] of Object.entries(campaignValues)) {
            await pushValue(ghlKey, value);
        }

        const duration = Math.round((Date.now() - startTime) / 1000) + 's';
        log(`[AdminGHLPush] Done in ${duration} — updated=${results.updated} notFound=${results.notFound} failed=${results.failed}`);

        return NextResponse.json({
            success: true,
            message: `Pushed to GHL (slot ${slotIndex})`,
            summary: {
                updated: results.updated,
                notFound: results.notFound,
                failed: results.failed,
                duration,
            },
            funnelName: funnel.funnel_name,
            locationId,
            slotIndex,
        });

    } catch (error) {
        console.error('[AdminGHLPush] Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
