import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabase } from '@/lib/supabaseServiceRole';

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const token = searchParams.get('token');

        if (!token) {
            return NextResponse.json({ error: 'Invite token required' }, { status: 400 });
        }

        // Find the invitation
        const { data: seat, error } = await supabase
            .from('organization_seats')
            .select(`
                id,
                seat_email,
                status,
                owner_user_id
            `)
            .eq('invite_token', token)
            .single();

        if (error || !seat) {
            return NextResponse.json({ error: 'Invalid or expired invitation' }, { status: 404 });
        }

        if (seat.status !== 'pending') {
            return NextResponse.json({
                error: seat.status === 'active' ? 'Invitation already accepted' : 'Invitation has been revoked',
                status: seat.status
            }, { status: 400 });
        }

        // Get owner info
        const { data: owner } = await supabase
            .from('user_profiles')
            .select('full_name, email, business_name')
            .eq('id', seat.owner_user_id)
            .single();

        return NextResponse.json({
            valid: true,
            email: seat.seat_email,
            owner: {
                name: owner?.full_name || owner?.email,
                business: owner?.business_name
            }
        });
    } catch (error) {
        console.error('Accept GET error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: 'Please sign in to accept the invitation' }, { status: 401 });
        }

        const body = await request.json();
        const { token } = body;

        if (!token) {
            return NextResponse.json({ error: 'Invite token required' }, { status: 400 });
        }

        // Get current user's email
        const { data: currentUser } = await supabase
            .from('user_profiles')
            .select('email')
            .eq('id', userId)
            .single();

        // Find and validate the invitation
        const { data: seat, error: findError } = await supabase
            .from('organization_seats')
            .select('id, seat_email, status, owner_user_id')
            .eq('invite_token', token)
            .single();

        if (findError || !seat) {
            return NextResponse.json({ error: 'Invalid or expired invitation' }, { status: 404 });
        }

        if (seat.status !== 'pending') {
            return NextResponse.json({
                error: seat.status === 'active' ? 'Invitation already accepted' : 'Invitation has been revoked'
            }, { status: 400 });
        }

        // Verify email matches (case insensitive)
        if (currentUser?.email?.toLowerCase() !== seat.seat_email?.toLowerCase()) {
            return NextResponse.json({
                error: 'This invitation was sent to a different email address. Please sign in with the correct account.'
            }, { status: 403 });
        }

        // Accept the invitation
        const { error: updateError } = await supabase
            .from('organization_seats')
            .update({
                seat_user_id: userId,
                status: 'active',
                accepted_at: new Date().toISOString(),
                invite_token: null // Clear token after use
            })
            .eq('id', seat.id);

        if (updateError) {
            console.error('Error accepting invitation:', updateError);
            return NextResponse.json({ error: 'Failed to accept invitation' }, { status: 500 });
        }

        // Update owner's seat count
        await supabase
            .from('user_profiles')
            .update({ current_seat_count: supabase.raw('current_seat_count + 1') })
            .eq('id', seat.owner_user_id);

        return NextResponse.json({
            success: true,
            message: 'You have joined the team successfully!',
            ownerId: seat.owner_user_id
        });
    } catch (error) {
        console.error('Accept POST error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
