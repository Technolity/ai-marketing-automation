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
        const { action, userId: rawTargetUserId, location_id: directLocationId, slot_index: rawSlot } = body;

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
                syncLocationId = createLocationId;
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

        // ── create_slot ──────────────────────────────────────────────────────
        if (action !== 'create_slot') {
            return NextResponse.json({ error: 'action must be create_slot or export_slot' }, { status: 400 });
        }

        const slotIndex = Number(rawSlot);
        if (!Number.isInteger(slotIndex) || slotIndex < 3 || slotIndex > 12) {
            return NextResponse.json({ error: 'slot_index must be an integer 3–12' }, { status: 400 });
        }

        let createLocationId = directLocationId;
        if (!isDirect) {
            const { data: subaccount } = await supabaseAdmin
                .from('ghl_subaccounts')
                .select('location_id')
                .eq('user_id', targetUserId)
                .single();
            if (!subaccount?.location_id) {
                return NextResponse.json({ error: 'No GHL subaccount found for user' }, { status: 404 });
            }
            createLocationId = createLocationId;
        }

        const tokenResult = await getLocationToken(createLocationId);
        if (!tokenResult.success) {
            return NextResponse.json({ error: tokenResult.error }, { status: 502 });
        }

        const slotKeys = getSlotKeys(slotIndex);

        // Check which keys already exist in our DB (for retry support)
        const { data: existingRows } = await supabaseAdmin
            .from('ghl_slot_custom_value_ids')
            .select('ghl_key')
            .eq('user_id', targetUserId)
            .eq('location_id', createLocationId)
            .eq('slot_index', slotIndex);

        const existingSet = new Set((existingRows || []).map(r => r.ghl_key));
        const keysToCreate = slotKeys.filter(k => !existingSet.has(k.ghlKey));

        if (keysToCreate.length === 0) {
            return NextResponse.json({
                created: 0, skipped: slotKeys.length, failed: 0,
                message: 'All keys already exist',
            }, { status: 409 });
        }

        const created = [];
        const failed = [];
        const toInsert = [];

        for (const keyEntry of keysToCreate) {
            await new Promise(r => setTimeout(r, 100)); // 100ms rate-limit delay

            const result = await createGHLValue(
                createLocationId,
                tokenResult.access_token,
                keyEntry.ghlKey
            );

            if (result.success && result.id) {
                created.push(keyEntry.ghlKey);
                toInsert.push({
                    user_id: targetUserId,
                    location_id: createLocationId,
                    slot_index: slotIndex,
                    ghl_key: keyEntry.ghlKey,
                    ghl_id: result.id,
                    section: keyEntry.section,
                });
            } else {
                // 429 back-off
                if (result.error?.includes('429') || result.body?.includes('429')) {
                    await new Promise(r => setTimeout(r, 2000));
                    const retry = await createGHLValue(
                        createLocationId,
                        tokenResult.access_token,
                        keyEntry.ghlKey
                    );
                    if (retry.success && retry.id) {
                        created.push(keyEntry.ghlKey);
                        toInsert.push({
                            user_id: targetUserId,
                            location_id: createLocationId,
                            slot_index: slotIndex,
                            ghl_key: keyEntry.ghlKey,
                            ghl_id: retry.id,
                            section: keyEntry.section,
                        });
                        continue;
                    }
                }
                failed.push({ key: keyEntry.ghlKey, error: result.error });
            }
        }

        if (toInsert.length > 0) {
            const { error: upsertErr } = await supabaseAdmin
                .from('ghl_slot_custom_value_ids')
                .upsert(toInsert, { onConflict: 'user_id,location_id,slot_index,ghl_key' });
            if (upsertErr) {
                console.error('[ghl-custom-values] upsert error:', upsertErr.message);
                return NextResponse.json({
                    error: `GHL values created but DB save failed: ${upsertErr.message}`,
                    created_in_ghl: created.length,
                    db_error: upsertErr.message,
                }, { status: 500 });
            }
        }

        return NextResponse.json({
            created: created.length,
            skipped: existingSet.size,
            failed: failed.length,
            failedKeys: failed,
        });
    } catch (err) {
        console.error('[ghl-custom-values POST]', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
