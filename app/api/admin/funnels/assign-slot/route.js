import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import { verifyAdmin, getSupabaseClient } from '@/lib/adminAuth';

export const dynamic = 'force-dynamic';

const supabase = getSupabaseClient();

// GET /api/admin/funnels/assign-slot?funnel_id=xxx
// Returns current slot assignment for a funnel
export async function GET(req) {
    const { userId } = auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const isAdmin = await verifyAdmin(userId);
    if (!isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { searchParams } = new URL(req.url);
    const funnelId = searchParams.get('funnel_id');
    if (!funnelId) return NextResponse.json({ error: 'funnel_id required' }, { status: 400 });

    const { data: assignment } = await supabase
        .from('funnel_slot_assignments')
        .select('slot_index, assigned_at')
        .eq('funnel_id', funnelId)
        .maybeSingle();

    return NextResponse.json({ assignment: assignment || null });
}

// POST /api/admin/funnels/assign-slot
// Body: { funnel_id, slot_index }
// Admin-only upsert: assigns a slot to any funnel, overriding any existing assignment
export async function POST(req) {
    const { userId } = auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const isAdmin = await verifyAdmin(userId);
    if (!isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const body = await req.json();
    const funnelId = body.funnel_id;
    const slotIndex = Number(body.slot_index);

    if (!funnelId) return NextResponse.json({ error: 'funnel_id required' }, { status: 400 });
    if (!Number.isInteger(slotIndex) || slotIndex < 3 || slotIndex > 12) {
        return NextResponse.json({ error: 'slot_index must be an integer 3–12' }, { status: 400 });
    }

    // Look up funnel to get owner's user_id
    const { data: funnel } = await supabase
        .from('user_funnels')
        .select('id, user_id')
        .eq('id', funnelId)
        .maybeSingle();

    if (!funnel) return NextResponse.json({ error: 'Funnel not found' }, { status: 404 });

    const ownerId = funnel.user_id;

    // Look up owner's GHL subaccount for location_id
    const { data: subaccount } = await supabase
        .from('ghl_subaccounts')
        .select('location_id')
        .eq('user_id', ownerId)
        .eq('is_active', true)
        .maybeSingle();

    if (!subaccount?.location_id) {
        return NextResponse.json({ error: 'No active GHL sub-account found for funnel owner' }, { status: 400 });
    }

    const locationId = subaccount.location_id;

    // Check if slot is already taken by a DIFFERENT funnel of this owner
    const { data: takenByOther } = await supabase
        .from('funnel_slot_assignments')
        .select('funnel_id')
        .eq('user_id', ownerId)
        .eq('location_id', locationId)
        .eq('slot_index', slotIndex)
        .neq('funnel_id', funnelId)
        .maybeSingle();

    if (takenByOther) {
        return NextResponse.json({
            error: `Slot ${slotIndex} is already assigned to another funnel (${takenByOther.funnel_id.substring(0, 8)}…)`
        }, { status: 409 });
    }

    // Delete any existing assignment for this funnel, then insert new
    await supabase
        .from('funnel_slot_assignments')
        .delete()
        .eq('funnel_id', funnelId);

    const { data: inserted, error: insertError } = await supabase
        .from('funnel_slot_assignments')
        .insert({
            funnel_id: funnelId,
            user_id: ownerId,
            slot_index: slotIndex,
            location_id: locationId,
        })
        .select('slot_index, assigned_at')
        .single();

    if (insertError) return NextResponse.json({ error: insertError.message }, { status: 500 });

    return NextResponse.json({ assignment: inserted });
}

// DELETE /api/admin/funnels/assign-slot?funnel_id=xxx
// Admin-only: removes a slot assignment
export async function DELETE(req) {
    const { userId } = auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const isAdmin = await verifyAdmin(userId);
    if (!isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { searchParams } = new URL(req.url);
    const funnelId = searchParams.get('funnel_id');
    if (!funnelId) return NextResponse.json({ error: 'funnel_id required' }, { status: 400 });

    const { error } = await supabase
        .from('funnel_slot_assignments')
        .delete()
        .eq('funnel_id', funnelId);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ released: true });
}
