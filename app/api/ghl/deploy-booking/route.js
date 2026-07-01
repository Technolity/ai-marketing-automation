import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import { supabase as supabaseAdmin } from '@/lib/supabaseServiceRole';
import { resolveWorkspace } from '@/lib/workspaceHelper';
import { funnelCopyToRenderData } from '@/lib/funnelTemplates/booking-v1/funnelCopyMapper';
import { renderCodedSegments } from '@/lib/funnelTemplates/coded-v1/registry';
import { minifySegments } from '@/lib/funnelTemplates/segments';
import { minifyHtml } from '@/lib/funnelTemplates/escape';
import { calendarPathForSlot } from '@/lib/funnelTemplates/booking-v1/landingPage';
import { getFunnelConfig } from '@/lib/funnelTemplates/funnelTypeRegistry';
import { getAbfv2SlotKeys, ABFV2_PREFIX } from '@/lib/ghl/slots/abfv2KeyTemplate';
import { buildCampaignCustomValues } from '@/lib/ghl/slotDeployMapper';
import { bulkCreateCustomValues } from '@/lib/integrations/ghl';

/**
 * Per-user BOOKING (ABFv2) deploy. Booking equivalent of /api/ghl/deploy-workflow:
 *  1. bake the page HTML into `{NN}_abfv2_bv1_*` keys (render libs, calendar path from slot)
 *  2. push workflow content (emails/sms/reminders/company) into `{NN}_abfv2_<base>` keys, reusing
 *     buildCampaignCustomValues (proven vault reading) rekeyed to abfv2 (auto-drops free-gift)
 *  3. one bulkCreateCustomValues UPSERT (creates missing values → snapshot approach) + set deployed_at
 * The funnel must already have a booking slot (assign via /api/ghl/booking-slots first).
 * vsl deploy is untouched.
 */

export const dynamic = 'force-dynamic';
export const maxDuration = 120;

// Fixed non-3 slot fed to the campaign mapper ONLY to get a consistent 2-digit prefix we can
// strip — getSlotPrefixes(3) returns an EMPTY prefix (vsl base slot), which would break the rekey.
const CAMPAIGN_PREFIX_SLOT = 4;

const parse = (v) => { if (typeof v !== 'string') return v; try { return JSON.parse(v); } catch { return v; } };

/** Group current-version vault_content_fields rows into { sectionId: { field_id: value } }. */
function groupFields(rows) {
    const out = {};
    for (const r of rows || []) {
        if (String(r.field_id).includes('.')) continue; // nested entry already merged into parent
        (out[r.section_id] = out[r.section_id] || {})[r.field_id] = parse(r.field_value);
    }
    return out;
}

export async function POST(req) {
    try {
        const { userId } = auth();
        if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { workspaceId: ownerId, error: wsErr } = await resolveWorkspace(userId);
        if (wsErr) return NextResponse.json({ error: wsErr }, { status: 403 });

        const { funnelId } = await req.json();
        if (!funnelId) return NextResponse.json({ error: 'funnelId required' }, { status: 400 });

        // 1. Verify funnel is a booking funnel owned by this workspace.
        const { data: funnel } = await supabaseAdmin
            .from('user_funnels')
            .select('id, user_id, selected_funnel_type')
            .eq('id', funnelId)
            .maybeSingle();
        if (!funnel) return NextResponse.json({ error: 'Funnel not found' }, { status: 404 });
        if (funnel.user_id !== ownerId) return NextResponse.json({ error: 'You do not own this funnel' }, { status: 403 });
        if (funnel.selected_funnel_type !== 'booking') {
            return NextResponse.json({ error: 'Not a booking funnel — use the standard deploy' }, { status: 400 });
        }

        // 2. Resolve the assigned booking slot + location.
        const { data: assignment } = await supabaseAdmin
            .from('funnel_slot_assignments')
            .select('slot_index, location_id')
            .eq('funnel_id', funnelId)
            .maybeSingle();
        if (!assignment?.slot_index || !assignment?.location_id) {
            return NextResponse.json({ error: 'No booking slot assigned. Assign a slot first.' }, { status: 400 });
        }
        const slot = assignment.slot_index;
        const locationId = assignment.location_id;
        const keyPrefix = String(slot).padStart(2, '0') + '_' + ABFV2_PREFIX;

        // 3. BAKE page HTML from vault (funnelCopy + media + colors live in vault_content_fields).
        const { data: fieldRows } = await supabaseAdmin
            .from('vault_content_fields')
            .select('section_id, field_id, field_value')
            .eq('funnel_id', funnelId)
            .eq('user_id', ownerId)
            .eq('is_current_version', true)
            .in('section_id', ['funnelCopy', 'media', 'colors']);
        const grouped = groupFields(fieldRows);
        const funnelCopy = grouped.funnelCopy || {};
        const media = grouped.media || {};
        let colorPalette = (grouped.colors && grouped.colors.colorPalette) || grouped.colors || {};
        if (!colorPalette || !Object.keys(colorPalette).length) {
            const { data: vc } = await supabaseAdmin
                .from('vault_content').select('content')
                .eq('funnel_id', funnelId).eq('user_id', ownerId).eq('section_id', 'colors').maybeSingle();
            colorPalette = (vc && vc.content && vc.content.colorPalette) || colorPalette;
        }

        const { data: profile } = await supabaseAdmin
            .from('user_profiles').select('business_name, email').eq('id', ownerId).maybeSingle();
        const businessName = profile?.business_name || '';

        const cfg = getFunnelConfig('booking');
        const design = cfg.design || 'booking-v1';
        const calendarPath = calendarPathForSlot(slot);

        const bakedValues = {};
        for (const page of cfg.pages) {
            const data = funnelCopyToRenderData(page, { funnelCopy, media, colorPalette, businessName, calendarPath });
            const segments = minifySegments(renderCodedSegments(design, page, data), minifyHtml);
            for (const s of segments) bakedValues[keyPrefix + s.name] = s.html;
        }

        // 4. WORKFLOW content (emails/sms/reminders) via the proven campaign mapper, rekeyed to abfv2.
        const { data: vaultSections } = await supabaseAdmin
            .from('vault_content')
            .select('section_id, content')
            .eq('funnel_id', funnelId)
            .eq('user_id', ownerId)
            .eq('is_current_version', true);
        const vaultContent = {};
        (vaultSections || []).forEach((s) => { vaultContent[s.section_id] = s.content; });

        const campaign = buildCampaignCustomValues({ vaultContent, slotIndex: CAMPAIGN_PREFIX_SLOT });
        const abfvBaseToKey = {};
        for (const k of getAbfv2SlotKeys(slot)) if (k.source === 'vault') abfvBaseToKey[k.base] = k.ghlKey;

        const workflowValues = {};
        for (const [k, v] of Object.entries(campaign)) {
            const base = k.replace(/^\d{2}_/, '');       // strip the fixed CAMPAIGN_PREFIX_SLOT prefix
            if (abfvBaseToKey[base]) workflowValues[abfvBaseToKey[base]] = v; // only abfv2 keys → free-gift dropped
        }
        // company_name / company_email aren't in the campaign mapper — fill from the profile.
        if (abfvBaseToKey['company_name'] && businessName) workflowValues[abfvBaseToKey['company_name']] = businessName;
        if (abfvBaseToKey['company_email'] && profile?.email) workflowValues[abfvBaseToKey['company_email']] = profile.email;

        // 5. PUSH — one upsert (creates any missing values → satisfies the snapshot approach).
        const allValues = { ...bakedValues, ...workflowValues };
        const result = await bulkCreateCustomValues(locationId, allValues);

        // 6. Mark deployed (same as the vsl deploy path).
        await supabaseAdmin.from('user_funnels')
            .update({ deployed_at: new Date().toISOString() })
            .eq('id', funnelId);

        return NextResponse.json({
            success: result.success,
            funnelId,
            slot,
            locationId,
            baked: Object.keys(bakedValues).length,
            workflow: Object.keys(workflowValues).length,
            total: result.total,
            created: result.created,
            updated: result.updated,
            failed: result.failed,
            failedKeys: (result.results || []).filter((r) => !r.success).map((r) => ({ key: r.key, error: r.error })),
        });
    } catch (err) {
        console.error('[DeployBooking] Error:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
