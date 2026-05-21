import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import { supabase as supabaseAdmin } from '@/lib/supabaseServiceRole';
import { resolveWorkspace } from '@/lib/workspaceHelper';

export const dynamic = 'force-dynamic';

const TIER_SLOT_LIMITS = { starter: 1, growth: 3, scale: 10, admin: 10 };

// GET /api/ghl/funnel-slot?funnel_id=xxx
// Returns { assignment: { slot_index, assigned_at } | null }
export async function GET(req) {
    const { userId } = auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const funnelId = searchParams.get('funnel_id');
    if (!funnelId) return NextResponse.json({ error: 'funnel_id required' }, { status: 400 });

    const { workspaceId: targetUserId, error: workspaceError } = await resolveWorkspace(userId);
    if (workspaceError) return NextResponse.json({ error: workspaceError }, { status: 403 });

    const { data: profile } = await supabaseAdmin
        .from('user_profiles')
        .select('subscription_tier, is_admin')
        .eq('id', userId)
        .maybeSingle();
    const isAdmin = profile?.is_admin || profile?.subscription_tier === 'admin';

    let query = supabaseAdmin
        .from('funnel_slot_assignments')
        .select('slot_index, assigned_at')
        .eq('funnel_id', funnelId);

    if (!isAdmin) {
        query = query.eq('user_id', targetUserId);
    }

    const { data, error } = await query.maybeSingle();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ assignment: data || null });
}

// POST /api/ghl/funnel-slot
// Body: { funnel_id, slot_index }
// Assigns a slot to a funnel.
export async function POST(req) {
    const { userId } = auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { workspaceId: targetUserId, error: workspaceError } = await resolveWorkspace(userId);
    if (workspaceError) return NextResponse.json({ error: workspaceError }, { status: 403 });

    const body = await req.json();
    const funnelId = body.funnel_id;
    const slotIndexRaw = body.slot_index;

    if (!funnelId) return NextResponse.json({ error: 'funnel_id required' }, { status: 400 });
    if (slotIndexRaw === undefined || slotIndexRaw === null) {
        return NextResponse.json({ error: 'slot_index required' }, { status: 400 });
    }

    const slotIndex = Number(slotIndexRaw);
    if (!Number.isInteger(slotIndex) || slotIndex < 3 || slotIndex > 12) {
        return NextResponse.json({ error: 'slot_index must be an integer 3–12' }, { status: 400 });
    }

    // 1. Verify user owns the funnel
    const { data: funnel, error: funnelError } = await supabaseAdmin
        .from('user_funnels')
        .select('id, user_id')
        .eq('id', funnelId)
        .maybeSingle();

    if (funnelError) return NextResponse.json({ error: funnelError.message }, { status: 500 });
    if (!funnel) return NextResponse.json({ error: 'Funnel not found' }, { status: 404 });
    if (funnel.user_id !== targetUserId) {
        return NextResponse.json({ error: 'You do not own this funnel' }, { status: 403 });
    }

    // Get authenticated and target profiles for tier/admin checks.
    const [{ data: authProfile }, { data: profileData }] = await Promise.all([
        supabaseAdmin
            .from('user_profiles')
            .select('subscription_tier, is_admin')
            .eq('id', userId)
            .maybeSingle(),
        supabaseAdmin
            .from('user_profiles')
            .select('subscription_tier, is_admin')
            .eq('id', targetUserId)
            .maybeSingle(),
    ]);

    const authTier = authProfile?.subscription_tier || 'starter';
    const targetTier = profileData?.subscription_tier || 'starter';
    const isAdmin = authProfile?.is_admin || profileData?.is_admin || authTier === 'admin' || targetTier === 'admin';
    const planTier = isAdmin ? 'admin' : targetTier;

    // 3. Check plan tier allows this slot (admins bypass)
    if (!isAdmin) {
        const limit = TIER_SLOT_LIMITS[planTier] ?? 1;
        if (slotIndex > 2 + limit) {
            return NextResponse.json(
                { error: `Your plan allows up to ${limit} slot(s). Upgrade to access more.` },
                { status: 403 }
            );
        }
    }

    // Get the user's GHL location
    const { data: subaccount } = await supabaseAdmin
        .from('ghl_subaccounts')
        .select('location_id')
        .eq('user_id', targetUserId)
        .eq('is_active', true)
        .maybeSingle();

    if (!subaccount?.location_id) {
        return NextResponse.json({ error: 'GHL sub-account not found' }, { status: 400 });
    }

    const locationId = subaccount.location_id;

    // Check if this funnel already has a slot assigned
    const { data: existingAssignment } = await supabaseAdmin
        .from('funnel_slot_assignments')
        .select('slot_index')
        .eq('funnel_id', funnelId)
        .maybeSingle();

    if (existingAssignment) {
        return NextResponse.json(
            { error: 'This funnel already has a slot assigned. Delete the funnel to release the slot.' },
            { status: 409 }
        );
    }

    // 2. Check slot not already taken by another funnel of this user at this location
    const { data: takenByOther } = await supabaseAdmin
        .from('funnel_slot_assignments')
        .select('funnel_id')
        .eq('user_id', targetUserId)
        .eq('slot_index', slotIndex)
        .eq('location_id', locationId)
        .neq('funnel_id', funnelId)
        .maybeSingle();

    if (takenByOther) {
        return NextResponse.json(
            { error: `Slot ${slotIndex} is already assigned to another funnel.` },
            { status: 409 }
        );
    }

    // 4. Insert the assignment
    const { data: inserted, error: insertError } = await supabaseAdmin
        .from('funnel_slot_assignments')
        .insert({
            funnel_id: funnelId,
            user_id: targetUserId,
            slot_index: slotIndex,
            location_id: locationId,
        })
        .select('slot_index, assigned_at')
        .single();

    if (insertError) return NextResponse.json({ error: insertError.message }, { status: 500 });

    return NextResponse.json({ assignment: inserted });
}

// DELETE /api/ghl/funnel-slot?funnel_id=xxx
// Admin-only: deletes a slot assignment.
export async function DELETE(req) {
    const { userId } = auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: profile } = await supabaseAdmin
        .from('user_profiles')
        .select('subscription_tier, is_admin')
        .eq('id', userId)
        .maybeSingle();

    if (!profile?.is_admin && profile?.subscription_tier !== 'admin') {
        return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const funnelId = searchParams.get('funnel_id');
    if (!funnelId) return NextResponse.json({ error: 'funnel_id required' }, { status: 400 });

    const { error } = await supabaseAdmin
        .from('funnel_slot_assignments')
        .delete()
        .eq('funnel_id', funnelId);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ released: true });
}
