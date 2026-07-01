import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import { supabase as supabaseAdmin } from '@/lib/supabaseServiceRole';
import { resolveWorkspace } from '@/lib/workspaceHelper';

/**
 * Booking-funnel (ABFv2) slot allocation — SEPARATE 1-based pool from the vsl 3–12 pool.
 * Booking slots are `{NN}_abfv2_`-prefixed, so slot numbers may overlap vsl safely; we keep
 * them isolated by ONLY counting booking funnels (user_funnels.selected_funnel_type='booking')
 * against booking slots. Own per-tier limit (independent of vsl). The vsl endpoints
 * (available-slots / funnel-slot) are left untouched.
 */

export const dynamic = 'force-dynamic';

// Booking is a Growth/Scale feature; starter gets none.
const BOOKING_TIER_LIMITS = { starter: 0, growth: 3, scale: 10, admin: 10 };

async function resolveTier(userId) {
    const { data: profile } = await supabaseAdmin
        .from('user_profiles')
        .select('subscription_tier, is_admin')
        .eq('id', userId)
        .maybeSingle();
    const tier = profile?.subscription_tier || 'starter';
    const isAdmin = profile?.is_admin || tier === 'admin';
    const planTier = isAdmin ? 'admin' : tier;
    const limit = isAdmin ? 10 : (BOOKING_TIER_LIMITS[planTier] ?? 0);
    return { isAdmin, planTier, limit };
}

async function bookingFunnelIds(effectiveUserId) {
    const { data } = await supabaseAdmin
        .from('user_funnels')
        .select('id')
        .eq('user_id', effectiveUserId)
        .eq('selected_funnel_type', 'booking');
    return (data || []).map((f) => f.id);
}

async function locationFor(effectiveUserId) {
    const { data: sub } = await supabaseAdmin
        .from('ghl_subaccounts')
        .select('location_id')
        .eq('user_id', effectiveUserId)
        .eq('is_active', true)
        .maybeSingle();
    return sub?.location_id || null;
}

// GET /api/ghl/booking-slots?funnel_id=xxx → booking slots available to assign for this user.
export async function GET(req) {
    const { userId } = auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const thisFunnelId = new URL(req.url).searchParams.get('funnel_id') || null;
    const { workspaceId: targetUserId } = await resolveWorkspace(userId);
    const effectiveUserId = targetUserId || userId;

    const { isAdmin, planTier, limit } = await resolveTier(userId);
    const allowedSlots = Array.from({ length: limit }, (_, i) => i + 1); // 1..limit
    const locationId = await locationFor(effectiveUserId);

    let currentAssignment = null;
    let takenSlots = [];
    let availableForAssignment = [...allowedSlots];

    const bookingIds = await bookingFunnelIds(effectiveUserId);
    if (locationId && bookingIds.length) {
        const { data: assignments } = await supabaseAdmin
            .from('funnel_slot_assignments')
            .select('funnel_id, slot_index')
            .eq('location_id', locationId)
            .in('funnel_id', bookingIds);

        if (assignments && assignments.length) {
            const currentRow = thisFunnelId ? assignments.find((a) => a.funnel_id === thisFunnelId) : null;
            currentAssignment = currentRow ? currentRow.slot_index : null;
            takenSlots = assignments.filter((a) => a.funnel_id !== thisFunnelId).map((a) => a.slot_index);
            availableForAssignment = allowedSlots.filter((s) => !takenSlots.includes(s) || s === currentAssignment);
        }
    }

    return NextResponse.json({
        funnel_type: 'booking',
        plan_tier: planTier,
        is_admin: isAdmin,
        allowed_slots: allowedSlots,
        current_assignment: currentAssignment,
        taken_slots: takenSlots,
        available_for_assignment: availableForAssignment,
        location_id: locationId,
    });
}

// POST /api/ghl/booking-slots  { funnel_id, slot_index } → assign a booking slot.
export async function POST(req) {
    const { userId } = auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { workspaceId: targetUserId } = await resolveWorkspace(userId);
    const { funnel_id: funnelId, slot_index: slotIndexRaw } = await req.json();
    if (!funnelId) return NextResponse.json({ error: 'funnel_id required' }, { status: 400 });
    const slotIndex = Number(slotIndexRaw);
    if (!Number.isInteger(slotIndex) || slotIndex < 1) {
        return NextResponse.json({ error: 'slot_index must be a positive integer' }, { status: 400 });
    }

    // Verify ownership + that this is actually a booking funnel.
    const { data: funnel } = await supabaseAdmin
        .from('user_funnels')
        .select('id, user_id, selected_funnel_type')
        .eq('id', funnelId)
        .maybeSingle();
    if (!funnel) return NextResponse.json({ error: 'Funnel not found' }, { status: 404 });
    if (funnel.user_id !== targetUserId) return NextResponse.json({ error: 'You do not own this funnel' }, { status: 403 });
    if (funnel.selected_funnel_type !== 'booking') {
        return NextResponse.json({ error: 'Not a booking funnel — use the standard slot endpoint' }, { status: 400 });
    }

    const { isAdmin, limit } = await resolveTier(userId);
    if (!isAdmin && (slotIndex < 1 || slotIndex > limit)) {
        return NextResponse.json({ error: `Your plan allows up to ${limit} booking slot(s). Upgrade to access more.` }, { status: 403 });
    }

    const locationId = await locationFor(targetUserId);
    if (!locationId) return NextResponse.json({ error: 'GHL sub-account not found' }, { status: 400 });

    // Already assigned?
    const { data: existing } = await supabaseAdmin
        .from('funnel_slot_assignments')
        .select('slot_index')
        .eq('funnel_id', funnelId)
        .maybeSingle();
    if (existing) {
        return NextResponse.json({ error: 'This funnel already has a slot assigned.' }, { status: 409 });
    }

    // Slot taken by ANOTHER booking funnel of this user at this location?
    const bookingIds = (await bookingFunnelIds(targetUserId)).filter((id) => id !== funnelId);
    if (bookingIds.length) {
        const { data: takenByOther } = await supabaseAdmin
            .from('funnel_slot_assignments')
            .select('funnel_id')
            .eq('location_id', locationId)
            .eq('slot_index', slotIndex)
            .in('funnel_id', bookingIds)
            .maybeSingle();
        if (takenByOther) {
            return NextResponse.json({ error: `Booking slot ${slotIndex} is already assigned to another funnel.` }, { status: 409 });
        }
    }

    const { data: inserted, error: insertError } = await supabaseAdmin
        .from('funnel_slot_assignments')
        .insert({ funnel_id: funnelId, user_id: targetUserId, slot_index: slotIndex, location_id: locationId })
        .select('slot_index, assigned_at')
        .single();
    if (insertError) return NextResponse.json({ error: insertError.message }, { status: 500 });

    return NextResponse.json({ assignment: inserted });
}
