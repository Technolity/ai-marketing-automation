/**
 * ADMIN-ONLY — Create the GHL custom-value PLACEHOLDERS a baked funnel needs.
 *
 * Two modes:
 *  - NO slot  → the 11 baked HTML/CSS segments only, UN-prefixed (quick single-funnel test).
 *  - slot=N   → the FULL ABFv2 template (117 keys) prefixed `{NN}_abfv2_` for that slot
 *               (11 baked + emails/sms/appointment-reminders/company). This is the real
 *               multi-slot creation; the bake/push fills the same prefixed keys.
 *
 *   GET  ?funnelType=booking[&slot=N]      → the key list (no writes)
 *   POST { locationId, funnelType, slot? } → bulk-create placeholders in that location
 *
 * Idempotent (bulkCreateCustomValues upserts by name). NO Supabase writes.
 */

import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import { verifyAdmin } from '@/lib/adminAuth';
import { listBakedFunnelKeys, groupBakedFunnelKeys } from '@/lib/funnelTemplates/bakedKeys';
import { getAbfv2SlotKeys, abfv2KeyCounts } from '@/lib/ghl/slots/abfv2KeyTemplate';
import { bulkCreateCustomValues } from '@/lib/integrations/ghl';

export const dynamic = 'force-dynamic';
export const maxDuration = 120; // a full slot is 117 keys, batched

// Context-safe placeholders: baked CSS/HTML stay invisible if published early; workflow
// content gets a short non-empty marker so GHL accepts the create.
const PLACEHOLDER = { css: '/* pending bake */', html: '<!-- pending bake -->', text: 'pending' };

async function requireAdmin() {
    const { userId } = auth();
    if (!userId) return { error: 'Unauthorized', status: 401 };
    if (!(await verifyAdmin(userId))) return { error: 'Admin access required', status: 403 };
    return { userId };
}

const parseSlot = (v) => {
    const n = Number(v);
    return Number.isInteger(n) && n >= 1 && n <= 99 ? n : null;
};

/** Build the { ghlKey: placeholderValue } map + a display list for the requested mode. */
function buildKeySet(funnelType, slot) {
    if (slot) {
        const keys = getAbfv2SlotKeys(slot);
        const customValues = {};
        for (const k of keys) {
            customValues[k.ghlKey] = k.section === 'funnelHtml'
                ? (PLACEHOLDER[k.kind] || PLACEHOLDER.html)
                : PLACEHOLDER.text;
        }
        const display = keys.map((k) => ({ name: k.ghlKey, section: k.section, kind: k.kind || null }));
        return { customValues, display, total: keys.length, counts: abfv2KeyCounts() };
    }
    // No slot → 11 baked segments only, un-prefixed.
    const keys = listBakedFunnelKeys(funnelType);
    const customValues = {};
    for (const k of keys) customValues[k.name] = PLACEHOLDER[k.kind] || PLACEHOLDER.html;
    const display = keys.map((k) => ({ name: k.name, section: 'funnelHtml', kind: k.kind }));
    return { customValues, display, total: keys.length, grouped: groupBakedFunnelKeys(funnelType) };
}

export async function GET(req) {
    const gate = await requireAdmin();
    if (gate.error) return NextResponse.json({ error: gate.error }, { status: gate.status });

    const { searchParams } = new URL(req.url);
    const funnelType = searchParams.get('funnelType') || 'booking';
    const slot = parseSlot(searchParams.get('slot'));
    const { display, total, grouped, counts } = buildKeySet(funnelType, slot);
    return NextResponse.json({ funnelType, slot: slot || null, total, keys: display, grouped, counts });
}

export async function POST(req) {
    try {
        const gate = await requireAdmin();
        if (gate.error) return NextResponse.json({ error: gate.error }, { status: gate.status });

        const { locationId, funnelType = 'booking', slot: rawSlot } = await req.json();
        if (!locationId || typeof locationId !== 'string' || !locationId.trim()) {
            return NextResponse.json({ error: 'locationId is required' }, { status: 400 });
        }
        const slot = parseSlot(rawSlot);

        const { customValues, total } = buildKeySet(funnelType, slot);
        if (!total) {
            return NextResponse.json({ error: `No keys for funnel type "${funnelType}"` }, { status: 400 });
        }

        const result = await bulkCreateCustomValues(locationId.trim(), customValues);
        if (!result.success && (!result.results || result.results.length === 0)) {
            return NextResponse.json(
                { error: result.error || 'Bulk creation failed', created: 0, updated: 0, failed: total },
                { status: 502 }
            );
        }

        return NextResponse.json({
            success: result.success,
            funnelType,
            slot: slot || null,
            locationId: locationId.trim(),
            total: result.total,
            created: result.created,
            updated: result.updated,
            failed: result.failed,
            failedKeys: (result.results || []).filter((r) => !r.success).map((r) => ({ key: r.key, error: r.error })),
        });
    } catch (err) {
        console.error('[CreateBakedValues] Error:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
