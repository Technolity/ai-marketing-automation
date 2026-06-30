/**
 * ADMIN-ONLY — Create the GHL custom-value PLACEHOLDERS a baked funnel needs.
 *
 * One button → all the funnel's custom values exist (empty placeholders) in the
 * target location. The real minified HTML/CSS is pushed into them later by the
 * bake-push step; because GHL upserts by name, that push UPDATES these in place.
 *
 *   GET  ?funnelType=booking          → { keys:[{name,kind,page}], grouped:[...] } (no writes)
 *   POST { locationId, funnelType }   → bulk-create the placeholders in that location
 *
 * The key list is derived from the renderers (lib/funnelTemplates/bakedKeys), so it
 * always matches what the bake produces. NO Supabase writes (honors shared-prod-DB rule).
 */

import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import { verifyAdmin } from '@/lib/adminAuth';
import { listBakedFunnelKeys, groupBakedFunnelKeys } from '@/lib/funnelTemplates/bakedKeys';
import { bulkCreateCustomValues } from '@/lib/integrations/ghl';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// Context-safe, non-empty placeholders: invisible if a page is published before the
// real bake-push, and guaranteed to satisfy GHL's "value required" on create.
const PLACEHOLDER = { css: '/* pending bake */', html: '<!-- pending bake -->' };

async function requireAdmin() {
    const { userId } = auth();
    if (!userId) return { error: 'Unauthorized', status: 401 };
    if (!(await verifyAdmin(userId))) return { error: 'Admin access required', status: 403 };
    return { userId };
}

export async function GET(req) {
    const gate = await requireAdmin();
    if (gate.error) return NextResponse.json({ error: gate.error }, { status: gate.status });

    const { searchParams } = new URL(req.url);
    const funnelType = searchParams.get('funnelType') || 'booking';
    const keys = listBakedFunnelKeys(funnelType);
    return NextResponse.json({
        funnelType,
        total: keys.length,
        keys,
        grouped: groupBakedFunnelKeys(funnelType),
    });
}

export async function POST(req) {
    try {
        const gate = await requireAdmin();
        if (gate.error) return NextResponse.json({ error: gate.error }, { status: gate.status });

        const { locationId, funnelType = 'booking' } = await req.json();
        if (!locationId || typeof locationId !== 'string' || !locationId.trim()) {
            return NextResponse.json({ error: 'locationId is required' }, { status: 400 });
        }

        const keys = listBakedFunnelKeys(funnelType);
        if (!keys.length) {
            return NextResponse.json({ error: `No baked keys for funnel type "${funnelType}"` }, { status: 400 });
        }

        // Map each key to a context-appropriate placeholder value.
        const customValues = {};
        for (const k of keys) customValues[k.name] = PLACEHOLDER[k.kind] || PLACEHOLDER.html;

        const result = await bulkCreateCustomValues(locationId.trim(), customValues);

        if (!result.success && (!result.results || result.results.length === 0)) {
            return NextResponse.json(
                { error: result.error || 'Bulk creation failed', created: 0, updated: 0, failed: keys.length },
                { status: 502 }
            );
        }

        return NextResponse.json({
            success: result.success,
            funnelType,
            locationId: locationId.trim(),
            total: result.total,
            created: result.created,
            updated: result.updated,
            failed: result.failed,
            failedKeys: (result.results || []).filter((r) => !r.success).map((r) => ({ key: r.key, error: r.error })),
            keys,
        });
    } catch (err) {
        console.error('[CreateBakedValues] Error:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
