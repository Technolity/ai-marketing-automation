import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import { verifyAdmin } from '@/lib/adminAuth';
import { supabase as supabaseAdmin } from '@/lib/supabaseServiceRole';
import { refreshGHLToken } from '@/lib/ghl/tokenHelper';
import { renderCodedPage, renderCodedSegments, pageRenderMode } from '@/lib/funnelTemplates/coded-v1/registry';
import { minifyHtml } from '@/lib/funnelTemplates/escape';
import { minifySegments, byteLength } from '@/lib/funnelTemplates/segments';

export const dynamic = 'force-dynamic';
export const maxDuration = 120;

// GHL custom value we bake a single-doc page HTML into (coded-v1). In GHL this is
// referenced as {{custom_values.test}} inside a Custom Code element on a blank page.
const TARGET_NAME = 'test';

// Backstop on per-custom-value size. The whole point of segmenting a page is to stay
// under GHL's per-value cap; this guard rejects a segment that somehow blows past it.
// TODO: confirm GHL's real documented limit and tighten this number accordingly.
const GHL_VALUE_MAX_BYTES = 90000;

async function requireAdmin() {
    const { userId } = auth();
    if (!userId) return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
    const isAdmin = await verifyAdmin(userId);
    if (!isAdmin) return { error: NextResponse.json({ error: 'Admin access required' }, { status: 403 }) };
    return { userId };
}

/**
 * Mint a location-scoped OAuth token for ANY location under the agency, straight
 * from the agency token (ghl_tokens, user_type='Company'). No sub-account row
 * required — so we can push to any location the admin can see. Refreshes on 401.
 */
async function mintLocationToken(locationId) {
    const { data: tokenData } = await supabaseAdmin
        .from('ghl_tokens')
        .select('*')
        .eq('user_type', 'Company')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

    if (!tokenData) return { success: false, error: 'No agency token (ghl_tokens user_type=Company) found.' };
    const companyId = tokenData.company_id;
    if (!companyId) return { success: false, error: 'Agency token is missing company_id.' };

    let accessToken = tokenData.access_token;
    for (let attempt = 1; attempt <= 2; attempt++) {
        const resp = await fetch('https://services.leadconnectorhq.com/oauth/locationToken', {
            method: 'POST',
            headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json', Version: '2021-07-28' },
            body: JSON.stringify({ companyId, locationId }),
        });

        if (resp.status === 401 && attempt === 1) {
            const refreshed = await refreshGHLToken(tokenData);
            if (!refreshed) return { success: false, error: 'Agency token expired and refresh failed. Reconnect GHL.', needsReconnect: true };
            accessToken = refreshed;
            continue;
        }

        const text = await resp.text();
        if (!resp.ok) {
            return { success: false, error: `Location token mint failed (${resp.status}): ${text.slice(0, 160)}` };
        }
        let json;
        try { json = JSON.parse(text); } catch { return { success: false, error: 'Location token response was not JSON.' }; }
        if (!json.access_token) return { success: false, error: 'Location token response missing access_token.' };
        return { success: true, access_token: json.access_token };
    }
    return { success: false, error: 'Failed to mint location token.' };
}

/**
 * GET /api/admin/coded-funnel-test
 * Lists target locations from BOTH ghl_subaccounts (active) and
 * user_profiles.ghl_location_id, deduped — so every connected account appears.
 */
export async function GET() {
    const gate = await requireAdmin();
    if (gate.error) return gate.error;

    const [{ data: subs }, { data: profs }] = await Promise.all([
        supabaseAdmin
            .from('ghl_subaccounts')
            .select('location_id, location_name, ghl_user_email, created_at')
            .eq('is_active', true)
            .order('created_at', { ascending: false }),
        supabaseAdmin
            .from('user_profiles')
            .select('ghl_location_id, ghl_location_name, business_name, email')
            .not('ghl_location_id', 'is', null),
    ]);

    const seen = new Set();
    const locations = [];
    const add = (locationId, name) => {
        if (!locationId || seen.has(locationId)) return;
        seen.add(locationId);
        locations.push({ locationId, label: `${name || 'Location'} (${locationId.slice(0, 8)}…)` });
    };
    (subs || []).forEach((s) => add(s.location_id, s.location_name || s.ghl_user_email));
    (profs || []).forEach((p) => add(p.ghl_location_id, p.ghl_location_name || p.business_name || p.email));

    return NextResponse.json({ locations });
}

/**
 * Upsert ONE custom value (name → value) at a location, given the already-fetched
 * list of existing values (so we list once per request, not once per segment).
 * Returns a plain result object — never throws — so a segment loop can report each.
 */
async function upsertCustomValue(loc, accessToken, name, value, existingList) {
    const existing = (existingList || []).find(
        (v) => v.fieldKey === `custom_values.${name}` || v.name?.trim().toLowerCase() === name.toLowerCase()
    );
    const url = existing
        ? `https://services.leadconnectorhq.com/locations/${loc}/customValues/${existing.id}`
        : `https://services.leadconnectorhq.com/locations/${loc}/customValues`;
    const method = existing ? 'PUT' : 'POST';

    const res = await fetch(url, {
        method,
        headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json', Version: '2021-07-28' },
        body: JSON.stringify({ name, value }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
        return { ok: false, name, mode: existing ? 'updated' : 'created', ghlStatus: res.status, ghlResponse: data, error: data.message || data.error || 'GHL rejected the push' };
    }
    return { ok: true, name, mode: existing ? 'updated' : 'created', ghlResponse: data };
}

/** Build the GHL paste-string for an ordered list of segment names. */
function concatMergeTags(names) {
    return names.map((n) => `{{custom_values.${n}}}`).join('');
}

/**
 * POST /api/admin/coded-funnel-test
 * Renders a coded-funnel page (minified) for the given design + page, then either
 * previews it (pushToGhl=false) or bakes it into GHL custom value(s) at a location.
 *
 * - 'doc' designs (coded-v1): one value named {{custom_values.test}}.
 * - 'segments' designs (booking-v1): one value PER segment (bv1_landing_head, …);
 *   you concatenate them in the GHL page builder using the returned mergeTag string.
 *
 * Body: { designId='coded-v1', page, brand, copy, media, embeds, pushToGhl, locationId }
 */
export async function POST(req) {
    try {
        const gate = await requireAdmin();
        if (gate.error) return gate.error;

        const body = await req.json();
        const {
            designId = 'coded-v1', brand = {}, copy = {}, media = {}, embeds = {},
            pushToGhl = false, locationId = '', page = 'optin',
        } = body;

        const mode = pageRenderMode(designId, page);
        const renderData = { brand, copy, media, embeds };

        // ---- DOC MODE (coded-v1): unchanged behavior — one value named "test". ----
        if (mode === 'doc') {
            const html = minifyHtml(renderCodedPage(designId, page, renderData));
            const bytes = byteLength(html);

            if (!pushToGhl) {
                return NextResponse.json({ success: true, pushed: false, mode, bytes, html });
            }

            const loc = String(locationId || '').trim();
            if (!loc) return NextResponse.json({ error: 'Select a location to push to.', code: 'NO_LOCATION' }, { status: 400 });

            const tok = await mintLocationToken(loc);
            if (!tok.success) {
                return NextResponse.json({ success: false, pushed: false, bytes, locationId: loc, error: tok.error, needsReconnect: tok.needsReconnect || false }, { status: 502 });
            }
            const accessToken = tok.access_token;

            const listRes = await fetch(`https://services.leadconnectorhq.com/locations/${loc}/customValues`, { headers: { Authorization: `Bearer ${accessToken}`, Version: '2021-07-28' } });
            const listData = await listRes.json().catch(() => ({}));
            if (!listRes.ok) {
                return NextResponse.json({ success: false, pushed: false, bytes, locationId: loc, error: listData.message || 'Failed to list custom values', ghlStatus: listRes.status }, { status: 502 });
            }

            const result = await upsertCustomValue(loc, accessToken, TARGET_NAME, html, listData.customValues || []);
            if (!result.ok) {
                return NextResponse.json({ success: false, pushed: false, bytes, locationId: loc, ghlStatus: result.ghlStatus, ghlResponse: result.ghlResponse, error: result.error }, { status: 502 });
            }
            return NextResponse.json({ success: true, pushed: true, mode, bytes, locationId: loc, segmentMode: result.mode, mergeTag: '{{custom_values.test}}', ghlResponse: result.ghlResponse });
        }

        // ---- SEGMENTS MODE (booking-v1): one custom value per named segment. ----
        const segments = minifySegments(renderCodedSegments(designId, page, renderData), minifyHtml);
        const sized = segments.map((s) => ({ name: s.name, bytes: byteLength(s.html), html: s.html }));
        const assembledHtml = sized.map((s) => s.html).join('');
        const totalBytes = sized.reduce((sum, s) => sum + s.bytes, 0);
        const names = sized.map((s) => s.name);

        // Guard: reject any segment that blows past the per-value backstop.
        const tooBig = sized.filter((s) => s.bytes > GHL_VALUE_MAX_BYTES);
        if (tooBig.length) {
            return NextResponse.json({
                success: false, pushed: false, mode, totalBytes,
                error: `Segment(s) exceed GHL_VALUE_MAX_BYTES (${GHL_VALUE_MAX_BYTES}): ${tooBig.map((s) => `${s.name}=${s.bytes}`).join(', ')}. Split the page further.`,
                segments: sized.map(({ name, bytes }) => ({ name, bytes })),
            }, { status: 400 });
        }

        if (!pushToGhl) {
            return NextResponse.json({
                success: true, pushed: false, mode, totalBytes,
                mergeTag: concatMergeTags(names),
                segments: sized.map(({ name, bytes }) => ({ name, bytes })),
                assembledHtml,
            });
        }

        const loc = String(locationId || '').trim();
        if (!loc) return NextResponse.json({ error: 'Select a location to push to.', code: 'NO_LOCATION' }, { status: 400 });

        const tok = await mintLocationToken(loc);
        if (!tok.success) {
            return NextResponse.json({ success: false, pushed: false, totalBytes, locationId: loc, error: tok.error, needsReconnect: tok.needsReconnect || false }, { status: 502 });
        }
        const accessToken = tok.access_token;

        // List custom values ONCE, then upsert each segment in order against that list.
        const listRes = await fetch(`https://services.leadconnectorhq.com/locations/${loc}/customValues`, { headers: { Authorization: `Bearer ${accessToken}`, Version: '2021-07-28' } });
        const listData = await listRes.json().catch(() => ({}));
        if (!listRes.ok) {
            return NextResponse.json({ success: false, pushed: false, totalBytes, locationId: loc, error: listData.message || 'Failed to list custom values', ghlStatus: listRes.status }, { status: 502 });
        }
        const existingList = listData.customValues || [];

        const results = [];
        for (const seg of sized) {
            results.push(await upsertCustomValue(loc, accessToken, seg.name, seg.html, existingList));
        }
        const failed = results.filter((r) => !r.ok);

        return NextResponse.json({
            success: failed.length === 0,
            pushed: failed.length === 0,
            mode,
            totalBytes,
            locationId: loc,
            mergeTag: concatMergeTags(names),
            results: results.map((r) => ({ name: r.name, ok: r.ok, mode: r.mode, error: r.error || null })),
            failed: failed.map((r) => ({ name: r.name, error: r.error, ghlStatus: r.ghlStatus })),
        }, { status: failed.length ? 502 : 200 });
    } catch (err) {
        console.error('[Coded Funnel Test] Error:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
