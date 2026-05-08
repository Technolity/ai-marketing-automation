import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import { supabase as supabaseAdmin } from '@/lib/supabaseServiceRole';
import { KEY_TEMPLATE } from '@/lib/ghl/slots';

export const dynamic = 'force-dynamic';

const TOTAL_KEYS = KEY_TEMPLATE.length;

const TIER_SLOT_LIMITS = { starter: 1, growth: 3, scale: 10, admin: 10 };
const ALL_SLOT_INDICES = [3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

// GET /api/ghl/available-slots?funnel_id=xxx (funnel_id optional)
// Returns the current user's plan tier and which slots are fully provisioned in their GHL location.
export async function GET(req) {
    const { userId } = auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const thisFunnelId = searchParams.get('funnel_id') || null;

    // Get subscription tier + admin flag in one query
    const { data: profile } = await supabaseAdmin
        .from('user_profiles')
        .select('subscription_tier, is_admin')
        .eq('id', userId)
        .maybeSingle();

    const subscriptionTier = profile?.subscription_tier || 'starter';
    const isAdmin = profile?.is_admin || subscriptionTier === 'admin';
    const planTier = isAdmin ? 'admin' : subscriptionTier;
    const limit = isAdmin ? 10 : (TIER_SLOT_LIMITS[planTier] ?? 1);

    // Allowed slot indices for this plan (always includes slot 3)
    const allowedSlots = isAdmin
        ? ALL_SLOT_INDICES
        : Array.from({ length: limit }, (_, i) => i + 3);

    // Get their GHL location
    const { data: subaccount } = await supabaseAdmin
        .from('ghl_subaccounts')
        .select('location_id')
        .eq('user_id', userId)
        .single();

    const locationId = subaccount?.location_id || null;

    // Slot 3 is always available (hardcoded in codebase, no provisioning needed)
    // For slots 4+, check how many keys are in ghl_slot_custom_value_ids.
    // Rows may be stored with user_id = userId (user-mode) OR user_id = loc_${locationId} (direct-mode).
    // Admins see all slots as provisioned so they can push to any slot for testing.
    let provisionedSlots = isAdmin ? [...ALL_SLOT_INDICES] : [3];

    if (locationId && !isAdmin) {
        const syntheticUserId = `loc_${locationId}`;

        const [{ data: userRows }, { data: directRows }] = await Promise.all([
            supabaseAdmin
                .from('ghl_slot_custom_value_ids')
                .select('slot_index')
                .eq('user_id', userId)
                .eq('location_id', locationId)
                .gte('slot_index', 4),
            supabaseAdmin
                .from('ghl_slot_custom_value_ids')
                .select('slot_index')
                .eq('user_id', syntheticUserId)
                .eq('location_id', locationId)
                .gte('slot_index', 4),
        ]);

        // Merge both result sets, count keys per slot
        const countBySlot = {};
        for (const row of [...(userRows || []), ...(directRows || [])]) {
            countBySlot[row.slot_index] = (countBySlot[row.slot_index] || 0) + 1;
        }

        // A slot is provisioned if it has all TOTAL_KEYS in DB
        for (const [slotIdx, count] of Object.entries(countBySlot)) {
            if (count >= TOTAL_KEYS) {
                provisionedSlots.push(Number(slotIdx));
            }
        }
    }

    // Query all slot assignments for this user+location
    let currentAssignment = null;
    let takenSlots = [];
    // Use allowedSlots (tier-based) as the base — provisioning is an optimization, not a gate
    let availableForAssignment = [...allowedSlots];

    if (locationId) {
        const { data: assignments } = await supabaseAdmin
            .from('funnel_slot_assignments')
            .select('funnel_id, slot_index')
            .eq('user_id', userId)
            .eq('location_id', locationId);

        if (assignments && assignments.length > 0) {
            const currentRow = thisFunnelId
                ? assignments.find(a => a.funnel_id === thisFunnelId)
                : null;
            currentAssignment = currentRow ? currentRow.slot_index : null;

            takenSlots = assignments
                .filter(a => a.funnel_id !== thisFunnelId)
                .map(a => a.slot_index);

            // Available = allowed by tier, not taken by another funnel (or is this funnel's own slot)
            availableForAssignment = allowedSlots.filter(
                s => !takenSlots.includes(s) || s === currentAssignment
            );
        }
    }

    return NextResponse.json({
        plan_tier: planTier,
        is_admin: isAdmin,
        allowed_slots: allowedSlots,
        provisioned_slots: provisionedSlots,
        current_assignment: currentAssignment,
        taken_slots: takenSlots,
        available_for_assignment: availableForAssignment,
        location_id: locationId,
    });
}
