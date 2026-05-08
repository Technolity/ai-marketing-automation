import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import { verifyAdmin } from '@/lib/adminAuth';
import { supabase as supabaseAdmin } from '@/lib/supabaseServiceRole';
import { getSlotKeys, KEY_TEMPLATE } from '@/lib/ghl/slots';

export const dynamic = 'force-dynamic';

const TOTAL_KEYS = KEY_TEMPLATE.length;
const GHL_VERSION = '2021-07-28';

async function refreshAgencyToken(tokenData) {
    if (!tokenData?.refresh_token) return null;
    try {
        const res = await fetch('https://services.leadconnectorhq.com/oauth/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                client_id: process.env.GHL_CLIENT_ID,
                client_secret: process.env.GHL_CLIENT_SECRET,
                grant_type: 'refresh_token',
                refresh_token: tokenData.refresh_token,
            }).toString(),
        });
        if (!res.ok) return null;
        const data = await res.json();
        await supabaseAdmin.from('ghl_tokens').update({
            access_token: data.access_token,
            refresh_token: data.refresh_token || tokenData.refresh_token,
            expires_at: new Date(Date.now() + data.expires_in * 1000).toISOString(),
            updated_at: new Date().toISOString(),
        }).eq('id', tokenData.id);
        return data.access_token;
    } catch {
        return null;
    }
}

async function getLocationToken(locationId) {
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
            const res = await fetch('https://services.leadconnectorhq.com/oauth/locationToken', {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                    Version: GHL_VERSION,
                },
                body: JSON.stringify({ companyId: tokenData.company_id, locationId }),
                signal: controller.signal,
            });
            clearTimeout(timeout);
            const text = await res.text();
            if (res.ok && !text.trim().startsWith('<')) {
                return { success: true, access_token: JSON.parse(text).access_token };
            }
            if (res.status === 401 && attempt === 1) {
                const newToken = await refreshAgencyToken(tokenData);
                if (newToken) { accessToken = newToken; continue; }
                return { success: false, error: 'Token expired and refresh failed' };
            }
            return { success: false, error: `OAuth failed (${res.status})` };
        } catch (e) {
            clearTimeout(timeout);
            if (attempt >= 2) return { success: false, error: e.message };
        }
    }
    return { success: false, error: 'Max OAuth attempts exceeded' };
}

async function fetchAllGHLValues(locationId, accessToken) {
    const all = [];
    const seenIds = new Set();
    let skip = 0;
    const limit = 100;
    const MAX_PAGES = 20; // safety cap: 2000 values max
    let page = 0;

    console.log(`[fetchAllGHLValues] start — location: ${locationId}`);

    while (page < MAX_PAGES) {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 12000);
        let res;
        try {
            res = await fetch(
                `https://services.leadconnectorhq.com/locations/${locationId}/customValues?skip=${skip}&limit=${limit}`,
                {
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                        Version: GHL_VERSION,
                    },
                    signal: controller.signal,
                }
            );
            clearTimeout(timeout);
        } catch (e) {
            clearTimeout(timeout);
            console.error(`[fetchAllGHLValues] page ${page} fetch error:`, e.message);
            break;
        }

        if (!res.ok) {
            const body = await res.text().catch(() => '');
            console.error(`[fetchAllGHLValues] page ${page} HTTP ${res.status}:`, body.slice(0, 200));
            break;
        }

        const data = await res.json().catch(e => {
            console.error(`[fetchAllGHLValues] page ${page} JSON parse error:`, e.message);
            return null;
        });
        if (!data) break;

        const items = data.customValues || [];
        console.log(`[fetchAllGHLValues] page ${page}: got ${items.length} values (skip=${skip})`);

        // Dedup — if API ignores skip and returns same set, detect it and stop
        let newItems = 0;
        for (const item of items) {
            if (!seenIds.has(item.id)) {
                seenIds.add(item.id);
                all.push(item);
                newItems++;
            }
        }

        if (newItems === 0) {
            console.log(`[fetchAllGHLValues] no new items on page ${page} — stopping (API may not paginate)`);
            break;
        }
        if (items.length < limit) {
            console.log(`[fetchAllGHLValues] last page (${items.length} < ${limit})`);
            break;
        }

        skip += limit;
        page++;
    }

    console.log(`[fetchAllGHLValues] done — ${all.length} unique values fetched`);
    return all;
}

async function createGHLValue(locationId, accessToken, ghlKey) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    try {
        const res = await fetch(
            `https://services.leadconnectorhq.com/locations/${locationId}/customValues`,
            {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                    Version: GHL_VERSION,
                },
                body: JSON.stringify({ name: ghlKey, value: '' }),
                signal: controller.signal,
            }
        );
        clearTimeout(timeout);
        if (!res.ok) {
            const text = await res.text();
            return { success: false, error: `HTTP ${res.status}`, body: text };
        }
        const data = await res.json();
        const cv = data.customValue || data;
        return { success: true, id: cv.id, name: cv.name };
    } catch (e) {
        clearTimeout(timeout);
        return { success: false, error: e.message };
    }
}

async function createMissingSlotKeys({ targetUserId, locationId, accessToken, slotIndex }) {
    const slotKeys = getSlotKeys(slotIndex);

    // Check which keys already exist in our DB (for retry/backfill support).
    const { data: existingRows, error: existingRowsError } = await supabaseAdmin
        .from('ghl_slot_custom_value_ids')
        .select('ghl_key')
        .eq('user_id', targetUserId)
        .eq('location_id', locationId)
        .eq('slot_index', slotIndex);

    if (existingRowsError) {
        return {
            slot_index: slotIndex,
            total: slotKeys.length,
            created: 0,
            skipped: 0,
            failed: slotKeys.length,
            failedKeys: [],
            error: `Could not read existing slot keys: ${existingRowsError.message}`,
        };
    }

    const existingSet = new Set((existingRows || []).map(r => r.ghl_key));
    const keysToCreate = slotKeys.filter(k => !existingSet.has(k.ghlKey));

    const created = [];
    const failed = [];
    const toInsert = [];

    for (const keyEntry of keysToCreate) {
        await new Promise(r => setTimeout(r, 100)); // 100ms rate-limit delay

        let result = await createGHLValue(
            locationId,
            accessToken,
            keyEntry.ghlKey
        );

        // 429 back-off.
        if (!(result.success && result.id) && (result.error?.includes('429') || result.body?.includes('429'))) {
            await new Promise(r => setTimeout(r, 2000));
            result = await createGHLValue(
                locationId,
                accessToken,
                keyEntry.ghlKey
            );
        }

        if (result.success && result.id) {
            created.push(keyEntry.ghlKey);
            toInsert.push({
                user_id: targetUserId,
                location_id: locationId,
                slot_index: slotIndex,
                ghl_key: keyEntry.ghlKey,
                ghl_id: result.id,
                section: keyEntry.section,
            });
        } else {
            failed.push({ key: keyEntry.ghlKey, error: result.error });
        }
    }

    if (toInsert.length > 0) {
        const { error: upsertErr } = await supabaseAdmin
            .from('ghl_slot_custom_value_ids')
            .upsert(toInsert, { onConflict: 'user_id,location_id,slot_index,ghl_key' });
        if (upsertErr) {
            return {
                slot_index: slotIndex,
                created: created.length,
                skipped: existingSet.size,
                failed: failed.length,
                failedKeys: failed,
                error: `GHL values created but DB save failed: ${upsertErr.message}`,
            };
        }
    }

    return {
        slot_index: slotIndex,
        total: slotKeys.length,
        created: created.length,
        skipped: existingSet.size,
        failed: failed.length,
        failedKeys: failed,
    };
}

// GET /api/admin/ghl-custom-values?userId=xxx   (user mode)
// GET /api/admin/ghl-custom-values?locationId=xxx  (direct location mode)
export async function GET(req) {
    try {
        const { userId: adminId } = auth();
        if (!adminId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        const isAdmin = await verifyAdmin(adminId);
        if (!isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

        const { searchParams } = new URL(req.url);
        const rawLocationId = searchParams.get('locationId');
        const rawUserId = searchParams.get('userId');

        if (!rawLocationId && !rawUserId) {
            return NextResponse.json({ error: 'userId or locationId required' }, { status: 400 });
        }

        // Direct location mode: admin supplies locationId directly
        let locationId, targetUserId;
        if (rawLocationId) {
            locationId = rawLocationId;
            targetUserId = `loc_${locationId}`; // synthetic user_id for direct-location rows
        } else {
            targetUserId = rawUserId;
            const { data: subaccount } = await supabaseAdmin
                .from('ghl_subaccounts')
                .select('location_id')
                .eq('user_id', targetUserId)
                .single();
            locationId = subaccount?.location_id || null;
        }

        const { data: rows } = await supabaseAdmin
            .from('ghl_slot_custom_value_ids')
            .select('slot_index, ghl_key, created_at')
            .eq('user_id', targetUserId);

        const slotMap = {};
        for (const row of rows || []) {
            if (!slotMap[row.slot_index]) {
                slotMap[row.slot_index] = { count: 0, created_at: row.created_at };
            }
            slotMap[row.slot_index].count++;
            if (row.created_at < slotMap[row.slot_index].created_at) {
                slotMap[row.slot_index].created_at = row.created_at;
            }
        }

        const slots = Array.from({ length: 10 }, (_, i) => i + 3).map(idx => {
            const info = slotMap[idx];
            const count = info?.count || 0;
            // Slot 3 is hardcoded in the codebase — treat it as always active regardless of stored IDs
            const status = idx === 3
                ? 'active'
                : count === 0 ? 'not_created' : count < TOTAL_KEYS ? 'partial' : 'active';
            return {
                slot_index: idx,
                prefix: `${String(idx).padStart(2, '0')}_`,
                key_count: idx === 3 ? TOTAL_KEYS : count,
                total_keys: TOTAL_KEYS,
                created_at: info?.created_at || null,
                status,
            };
        });

        return NextResponse.json({
            location_id: locationId || null,
            mode: rawLocationId ? 'direct' : 'user',
            slots,
        });
    } catch (err) {
        console.error('[ghl-custom-values GET]', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

// POST /api/admin/ghl-custom-values
export async function POST(req) {
    try {
        const { userId: adminId } = auth();
        if (!adminId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        const isAdmin = await verifyAdmin(adminId);
        if (!isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

        const body = await req.json();
        const { action, userId: rawTargetUserId, location_id: directLocationId, slot_index: rawSlot, slot_indices: rawSlots } = body;

        if (!rawTargetUserId && !directLocationId) {
            return NextResponse.json({ error: 'userId or location_id required' }, { status: 400 });
        }

        // Direct location mode: admin supplied location_id directly (no user sub-account lookup)
        const isDirect = Boolean(directLocationId);
        const trimmedLocationId = directLocationId?.trim();
        const targetUserId = isDirect ? `loc_${trimmedLocationId}` : rawTargetUserId;

        // ── sync_slot — import existing GHL values into our DB by name match ──
        if (action === 'sync_slot') {
            const slotIndex = Number(rawSlot);
            if (!Number.isInteger(slotIndex) || slotIndex < 3 || slotIndex > 12) {
                return NextResponse.json({ error: 'slot_index must be an integer 3–12' }, { status: 400 });
            }

            let syncLocationId = trimmedLocationId;
            if (!isDirect) {
                const { data: subaccount } = await supabaseAdmin
                    .from('ghl_subaccounts')
                    .select('location_id')
                    .eq('user_id', targetUserId)
                    .single();
                if (!subaccount?.location_id) {
                    return NextResponse.json({ error: 'No GHL subaccount found for user' }, { status: 404 });
                }
                syncLocationId = subaccount.location_id;
            }

            const tokenResult = await getLocationToken(syncLocationId);
            if (!tokenResult.success) {
                return NextResponse.json({ error: tokenResult.error }, { status: 502 });
            }

            console.log(`[sync_slot] slot=${slotIndex} user=${targetUserId} location=${syncLocationId}`);
            console.log(`[sync_slot] fetching all GHL custom values…`);

            const ghlValues = await fetchAllGHLValues(syncLocationId, tokenResult.access_token);
            console.log(`[sync_slot] fetched ${ghlValues.length} total GHL values`);

            const ghlByName = new Map(ghlValues.map(v => [v.name, v.id]));

            const slotKeys = getSlotKeys(slotIndex);
            console.log(`[sync_slot] matching ${slotKeys.length} template keys against GHL names…`);

            const toInsert = [];
            const notFound = [];

            for (const keyEntry of slotKeys) {
                const ghlId = ghlByName.get(keyEntry.ghlKey);
                if (ghlId) {
                    toInsert.push({
                        user_id: targetUserId,
                        location_id: syncLocationId,
                        slot_index: slotIndex,
                        ghl_key: keyEntry.ghlKey,
                        ghl_id: ghlId,
                        section: keyEntry.section,
                    });
                } else {
                    notFound.push(keyEntry.ghlKey);
                }
            }

            console.log(`[sync_slot] matched=${toInsert.length} not_found=${notFound.length}`);
            if (notFound.length > 0) {
                console.log(`[sync_slot] first 10 not found:`, notFound.slice(0, 10));
            }

            if (toInsert.length > 0) {
                const dedupedInsert = [...new Map(toInsert.map(r => [r.ghl_key, r])).values()];
                console.log(`[sync_slot] upserting ${dedupedInsert.length} rows (deduped from ${toInsert.length}) into ghl_slot_custom_value_ids…`);
                console.log(`[sync_slot] user_id="${targetUserId}" location_id="${syncLocationId}" slot_index=${slotIndex}`);
                const { error: upsertErr } = await supabaseAdmin
                    .from('ghl_slot_custom_value_ids')
                    .upsert(dedupedInsert, { onConflict: 'user_id,location_id,slot_index,ghl_key' });
                if (upsertErr) {
                    console.error('[sync_slot] upsert error:', upsertErr.message, upsertErr.details, upsertErr.hint);
                    return NextResponse.json({ error: `DB save failed: ${upsertErr.message}`, details: upsertErr.details }, { status: 500 });
                }

                // Verify rows actually landed in DB
                const { count: dbCount, error: countErr } = await supabaseAdmin
                    .from('ghl_slot_custom_value_ids')
                    .select('*', { count: 'exact', head: true })
                    .eq('user_id', targetUserId)
                    .eq('location_id', syncLocationId)
                    .eq('slot_index', slotIndex);
                console.log(`[sync_slot] DB verify: ${dbCount} rows in DB (error: ${countErr?.message || 'none'})`);
                if (countErr) console.error('[sync_slot] DB count error:', countErr.message);
            }

            // Final DB count for accurate response
            const { count: finalCount } = await supabaseAdmin
                .from('ghl_slot_custom_value_ids')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', targetUserId)
                .eq('slot_index', slotIndex);

            console.log(`[sync_slot] done — final DB count for slot ${slotIndex}: ${finalCount}`);
            return NextResponse.json({
                synced: toInsert.length,
                db_count: finalCount ?? 0,
                not_found: notFound.length,
                not_found_keys: notFound,
                total_in_ghl: ghlValues.length,
            });
        }

        // ── export_slot ──────────────────────────────────────────────────────
        if (action === 'export_slot') {
            const slotIndex = Number(rawSlot);
            if (!Number.isInteger(slotIndex) || slotIndex < 3 || slotIndex > 12) {
                return NextResponse.json({ error: 'slot_index must be an integer 3–12' }, { status: 400 });
            }

            const { data: rows } = await supabaseAdmin
                .from('ghl_slot_custom_value_ids')
                .select('ghl_key, ghl_id, section')
                .eq('user_id', targetUserId)
                .eq('slot_index', slotIndex);

            const slotKeys = getSlotKeys(slotIndex);
            const vaultPathByKey = Object.fromEntries(slotKeys.map(k => [k.ghlKey, k.vaultPath]));

            const enriched = (rows || []).map(r => ({
                slot_index: slotIndex,
                section: r.section,
                ghl_key: r.ghl_key,
                ghl_id: r.ghl_id,
                vault_path: vaultPathByKey[r.ghl_key] || '',
            }));

            const format = body.format || 'json';
            if (format === 'csv') {
                const header = 'slot_index,section,ghl_key,ghl_id,vault_path\n';
                const csv = enriched.map(r =>
                    `${r.slot_index},${r.section},${r.ghl_key},${r.ghl_id},${r.vault_path}`
                ).join('\n');
                return new Response(header + csv, {
                    headers: {
                        'Content-Type': 'text/csv',
                        'Content-Disposition': `attachment; filename="slot_${slotIndex}_keys.csv"`,
                    },
                });
            }

            return NextResponse.json({ slot_index: slotIndex, keys: enriched });
        }

        // ── list_values ───────────────────────────────────────────────────────
        if (action === 'list_values') {
            let listLocationId = trimmedLocationId;
            if (!isDirect) {
                const { data: subaccount } = await supabaseAdmin
                    .from('ghl_subaccounts')
                    .select('location_id')
                    .eq('user_id', targetUserId)
                    .single();
                if (!subaccount?.location_id) {
                    return NextResponse.json({ error: 'No GHL subaccount found for user' }, { status: 404 });
                }
                listLocationId = subaccount.location_id;
            }
            const { data: rows, error: listErr } = await supabaseAdmin
                .from('ghl_slot_custom_value_ids')
                .select('slot_index, ghl_key, ghl_id, section')
                .eq('user_id', targetUserId)
                .eq('location_id', listLocationId)
                .order('slot_index')
                .order('ghl_key');
            if (listErr) return NextResponse.json({ error: listErr.message }, { status: 500 });
            return NextResponse.json({ values: rows || [], location_id: listLocationId });
        }

        // ── push_value ────────────────────────────────────────────────────────
        if (action === 'push_value') {
            const { ghl_id, ghl_key, value = '' } = body;
            if (!ghl_id || !ghl_key) {
                return NextResponse.json({ error: 'ghl_id and ghl_key are required' }, { status: 400 });
            }
            let pvLocationId = trimmedLocationId;
            if (!isDirect) {
                const { data: subaccount } = await supabaseAdmin
                    .from('ghl_subaccounts')
                    .select('location_id')
                    .eq('user_id', targetUserId)
                    .single();
                if (!subaccount?.location_id) {
                    return NextResponse.json({ error: 'No GHL subaccount found' }, { status: 404 });
                }
                pvLocationId = subaccount.location_id;
            }
            const pvToken = await getLocationToken(pvLocationId);
            if (!pvToken.success) {
                return NextResponse.json({ error: pvToken.error }, { status: 502 });
            }
            const pvRes = await fetch(
                `https://services.leadconnectorhq.com/locations/${pvLocationId}/customValues/${ghl_id}`,
                {
                    method: 'PUT',
                    headers: {
                        Authorization: `Bearer ${pvToken.access_token}`,
                        'Content-Type': 'application/json',
                        Version: GHL_VERSION,
                    },
                    body: JSON.stringify({ name: ghl_key, value }),
                }
            );
            if (!pvRes.ok) {
                const pvText = await pvRes.text().catch(() => '');
                return NextResponse.json({ error: `GHL API error (${pvRes.status})`, detail: pvText.slice(0, 200) }, { status: 502 });
            }
            return NextResponse.json({ success: true, ghl_key, value });
        }

        // ── push_default_colors ───────────────────────────────────────────────
        if (action === 'push_default_colors') {
            const { primary, secondary, tertiary } = body;
            if (!primary || !secondary || !tertiary) {
                return NextResponse.json({ error: 'primary, secondary, and tertiary are required' }, { status: 400 });
            }
            let pdcLocationId = trimmedLocationId;
            if (!isDirect) {
                const { data: subaccount } = await supabaseAdmin
                    .from('ghl_subaccounts')
                    .select('location_id')
                    .eq('user_id', targetUserId)
                    .single();
                if (!subaccount?.location_id) {
                    return NextResponse.json({ error: 'No GHL subaccount found' }, { status: 404 });
                }
                pdcLocationId = subaccount.location_id;
            }
            const pdcToken = await getLocationToken(pdcLocationId);
            if (!pdcToken.success) {
                return NextResponse.json({ error: pdcToken.error }, { status: 502 });
            }
            const { data: colorRows, error: colorDbErr } = await supabaseAdmin
                .from('ghl_slot_custom_value_ids')
                .select('slot_index, ghl_key, ghl_id')
                .eq('user_id', targetUserId)
                .eq('location_id', pdcLocationId)
                .eq('section', 'colors');
            if (colorDbErr) return NextResponse.json({ error: colorDbErr.message }, { status: 500 });
            if (!colorRows?.length) {
                return NextResponse.json({ error: 'No color custom values found. Create or sync slots first.' }, { status: 404 });
            }
            const colorMap = { primary_color: primary, secondary_color: secondary, tertiary_color: tertiary };
            let updated = 0, failed = 0;
            const errors = [];
            for (const row of colorRows) {
                const base = Object.keys(colorMap).find(k => row.ghl_key === k || row.ghl_key.endsWith('_' + k));
                if (!base) continue;
                await new Promise(r => setTimeout(r, 50));
                const cr = await fetch(
                    `https://services.leadconnectorhq.com/locations/${pdcLocationId}/customValues/${row.ghl_id}`,
                    {
                        method: 'PUT',
                        headers: {
                            Authorization: `Bearer ${pdcToken.access_token}`,
                            'Content-Type': 'application/json',
                            Version: GHL_VERSION,
                        },
                        body: JSON.stringify({ name: row.ghl_key, value: colorMap[base] }),
                    }
                );
                if (cr.ok) { updated++; }
                else {
                    failed++;
                    const t = await cr.text().catch(() => '');
                    errors.push({ key: row.ghl_key, error: `HTTP ${cr.status}`, detail: t.slice(0, 100) });
                }
            }
            return NextResponse.json({
                success: failed === 0,
                updated,
                failed,
                errors,
                total: colorRows.length,
                colors: { primary, secondary, tertiary },
            });
        }

        // ── create_slot ──────────────────────────────────────────────────────
        if (action !== 'create_slot' && action !== 'create_all_slots') {
            return NextResponse.json({ error: 'action must be one of: create_slot, create_all_slots, sync_slot, export_slot, list_values, push_value, push_default_colors' }, { status: 400 });
        }

        const slotIndices = action === 'create_all_slots'
            ? (Array.isArray(rawSlots) && rawSlots.length > 0 ? rawSlots.map(Number) : [4, 5, 6, 7, 8, 9, 10, 11, 12])
            : [Number(rawSlot)];

        if (slotIndices.some(slotIndex => !Number.isInteger(slotIndex) || slotIndex < 3 || slotIndex > 12)) {
            return NextResponse.json({ error: 'slot indices must be integers 3–12' }, { status: 400 });
        }

        if (action === 'create_all_slots' && slotIndices.includes(3)) {
            return NextResponse.json({ error: 'create_all_slots only backfills provisioned slots 4–12; slot 3 is the reference slot' }, { status: 400 });
        }

        let createLocationId = trimmedLocationId;
        if (!isDirect) {
            const { data: subaccount } = await supabaseAdmin
                .from('ghl_subaccounts')
                .select('location_id')
                .eq('user_id', targetUserId)
                .single();
            if (!subaccount?.location_id) {
                return NextResponse.json({ error: 'No GHL subaccount found for user' }, { status: 404 });
            }
            createLocationId = subaccount.location_id;
        }

        const tokenResult = await getLocationToken(createLocationId);
        if (!tokenResult.success) {
            return NextResponse.json({ error: tokenResult.error }, { status: 502 });
        }

        if (action === 'create_all_slots') {
            const slotResults = [];
            for (const slotIndex of slotIndices) {
                slotResults.push(await createMissingSlotKeys({
                    targetUserId,
                    locationId: createLocationId,
                    accessToken: tokenResult.access_token,
                    slotIndex,
                }));
            }

            const errorResults = slotResults.filter(result => result.error);
            if (errorResults.length > 0) {
                return NextResponse.json({
                    error: 'One or more slots failed while backfilling missing keys',
                    created: slotResults.reduce((sum, result) => sum + result.created, 0),
                    skipped: slotResults.reduce((sum, result) => sum + result.skipped, 0),
                    failed: slotResults.reduce((sum, result) => sum + result.failed, 0),
                    slots: slotResults,
                }, { status: 500 });
            }

            return NextResponse.json({
                created: slotResults.reduce((sum, result) => sum + result.created, 0),
                skipped: slotResults.reduce((sum, result) => sum + result.skipped, 0),
                failed: slotResults.reduce((sum, result) => sum + result.failed, 0),
                slots: slotResults,
            });
        }

        const slotResult = await createMissingSlotKeys({
            targetUserId,
            locationId: createLocationId,
            accessToken: tokenResult.access_token,
            slotIndex: slotIndices[0],
        });

        if (slotResult.created === 0 && slotResult.failed === 0) {
            return NextResponse.json({
                created: 0, skipped: slotResult.skipped, failed: 0,
                message: 'All keys already exist',
            }, { status: 409 });
        }

        if (slotResult.error) {
            return NextResponse.json({
                error: slotResult.error,
                created_in_ghl: slotResult.created,
            }, { status: 500 });
        }

        return NextResponse.json({
            created: slotResult.created,
            skipped: slotResult.skipped,
            failed: slotResult.failed,
            failedKeys: slotResult.failedKeys,
        });
    } catch (err) {
        console.error('[ghl-custom-values POST]', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
