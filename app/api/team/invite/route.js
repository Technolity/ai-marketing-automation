import { NextResponse } from 'next/server';
import { auth, clerkClient } from '@clerk/nextjs/server';
import { supabase } from '@/lib/supabaseServiceRole';

/**
 * GET /api/team/invite
 * List current team members/seats for the authenticated owner
 */
export async function GET(request) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        console.log(`[Team API] GET: Fetching seats for owner ${userId}`);

        // Get user's seats
        const { data: seats, error } = await supabase
            .from('organization_seats')
            .select('*')
            .eq('owner_user_id', userId)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('[Team API] Error fetching seats:', error);
            return NextResponse.json({ error: 'Failed to fetch team members' }, { status: 500 });
        }

        // Get user profile for limits
        const { data: profile } = await supabase
            .from('user_profiles')
            .select('max_seats, current_seat_count, subscription_tier')
            .eq('id', userId)
            .single();

        console.log(`[Team API] Found ${seats?.length || 0} seats, tier: ${profile?.subscription_tier}`);

        return NextResponse.json({
            seats: seats || [],
            limits: {
                max: profile?.max_seats || 1,
                current: seats?.filter(s => s.status === 'active').length || 0,
                tier: profile?.subscription_tier || 'starter'
            }
        });
    } catch (error) {
        console.error('[Team API] GET error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

/**
 * POST /api/team/invite
 * Provision a new team member by creating their Clerk account directly
 */
export async function POST(request) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { firstName, lastName, email, password } = body;

        console.log(`[Team API] POST: Provisioning team member for owner ${userId}`);

        // Validate required fields
        if (!firstName || !lastName) {
            return NextResponse.json({ error: 'First name and last name are required' }, { status: 400 });
        }
        if (!email || !email.includes('@')) {
            return NextResponse.json({ error: 'Valid email is required' }, { status: 400 });
        }
        if (!password || password.length < 8) {
            return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 });
        }

        // Check subscription tier
        const { data: profile } = await supabase
            .from('user_profiles')
            .select('subscription_tier, max_seats, email, full_name, business_name')
            .eq('id', userId)
            .single();

        if (!profile) {
            return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
        }

        // Only growth and scale tiers can add team members
        if (!['growth', 'scale'].includes(profile.subscription_tier)) {
            console.log(`[Team API] Rejected: tier ${profile.subscription_tier} cannot add members`);
            return NextResponse.json({
                error: 'Team members require Growth or Scale subscription'
            }, { status: 403 });
        }

        // Cannot add yourself
        if (email.toLowerCase() === profile.email?.toLowerCase()) {
            return NextResponse.json({ error: 'Cannot add yourself as a team member' }, { status: 400 });
        }

        // Check seat count
        const { data: existingSeats } = await supabase
            .from('organization_seats')
            .select('id, status')
            .eq('owner_user_id', userId)
            .in('status', ['pending', 'active']);

        const activeCount = existingSeats?.length || 0;
        const maxSeats = profile.max_seats || 1;

        if (activeCount >= maxSeats) {
            console.log(`[Team API] Seat limit reached: ${activeCount}/${maxSeats}`);
            return NextResponse.json({
                error: `You have reached your limit of ${maxSeats} team members`
            }, { status: 403 });
        }

        // Check if email already exists in team
        const { data: existing } = await supabase
            .from('organization_seats')
            .select('id, status')
            .eq('owner_user_id', userId)
            .eq('seat_email', email.toLowerCase())
            .single();

        if (existing && existing.status === 'active') {
            return NextResponse.json({ error: 'This user is already on your team' }, { status: 400 });
        }

        console.log(`[Team API] Creating Clerk user: ${email}`);

        // Step 1: Create user in Clerk
        let clerkUser;
        try {
            clerkUser = await clerkClient.users.createUser({
                firstName,
                lastName,
                emailAddress: [email.toLowerCase()],
                password,
                skipPasswordChecks: false,
                skipPasswordRequirement: false
            });
            console.log(`[Team API] Clerk user created: ${clerkUser.id}`);
        } catch (clerkError) {
            console.error('[Team API] Clerk error:', clerkError);

            // Handle common Clerk errors
            if (clerkError.errors?.[0]?.code === 'form_identifier_exists') {
                return NextResponse.json({
                    error: 'A user with this email already exists'
                }, { status: 400 });
            }
            if (clerkError.errors?.[0]?.code === 'form_password_pwned') {
                return NextResponse.json({
                    error: 'Password is too common, please choose a stronger password'
                }, { status: 400 });
            }

            return NextResponse.json({
                error: clerkError.errors?.[0]?.message || 'Failed to create user account'
            }, { status: 500 });
        }

        // Step 2: Create user profile in database with team_member role
        console.log(`[Team API] Creating user profile with role=team_member`);
        const { error: profileError } = await supabase
            .from('user_profiles')
            .insert({
                id: clerkUser.id,
                email: email.toLowerCase(),
                full_name: `${firstName} ${lastName}`,
                role: 'team_member',
                role_owner_id: userId,
                subscription_tier: 'starter', // Team members don't have their own tier
                max_seats: 0 // Team members cannot add their own team
            });

        if (profileError) {
            console.error('[Team API] Profile creation error:', profileError);
            // Try to clean up Clerk user
            try {
                await clerkClient.users.deleteUser(clerkUser.id);
            } catch (e) {
                console.error('[Team API] Failed to cleanup Clerk user:', e);
            }
            return NextResponse.json({ error: 'Failed to create user profile' }, { status: 500 });
        }

        // Step 3: Create seat record
        console.log(`[Team API] Creating organization seat`);
        const { data: seat, error: seatError } = await supabase
            .from('organization_seats')
            .insert({
                owner_user_id: userId,
                seat_user_id: clerkUser.id,
                seat_email: email.toLowerCase(),
                status: 'active',
                accepted_at: new Date().toISOString()
            })
            .select()
            .single();

        if (seatError) {
            console.error('[Team API] Seat creation error:', seatError);
            return NextResponse.json({ error: 'Failed to create team seat' }, { status: 500 });
        }

        console.log(`[Team API] Team member provisioned successfully: ${clerkUser.id}`);

        return NextResponse.json({
            success: true,
            message: 'Team member added successfully',
            member: {
                id: clerkUser.id,
                email: email.toLowerCase(),
                name: `${firstName} ${lastName}`,
                status: 'active'
            }
        });
    } catch (error) {
        console.error('[Team API] POST error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

/**
 * DELETE /api/team/invite
 * Remove a team member (revoke access)
 */
export async function DELETE(request) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const seatId = searchParams.get('id');

        if (!seatId) {
            return NextResponse.json({ error: 'Seat ID required' }, { status: 400 });
        }

        console.log(`[Team API] DELETE: Revoking seat ${seatId} for owner ${userId}`);

        // Get the seat to find the user
        const { data: seat } = await supabase
            .from('organization_seats')
            .select('seat_user_id, status')
            .eq('id', seatId)
            .eq('owner_user_id', userId)
            .single();

        // Revoke the seat
        const { error } = await supabase
            .from('organization_seats')
            .update({ status: 'revoked' })
            .eq('id', seatId)
            .eq('owner_user_id', userId);

        if (error) {
            console.error('[Team API] Error revoking seat:', error);
            return NextResponse.json({ error: 'Failed to revoke team member' }, { status: 500 });
        }

        // Decrement owner's seat count only if this seat was active
        if (seat?.status === 'active') {
            await supabase
                .from('user_profiles')
                .update({ current_seat_count: supabase.raw('GREATEST(current_seat_count - 1, 0)') })
                .eq('id', userId);
        }

        // Remove team member profile and access
        if (seat?.seat_user_id) {
            await supabase
                .from('user_profiles')
                .delete()
                .eq('id', seat.seat_user_id);

            try {
                await clerkClient.users.deleteUser(seat.seat_user_id);
            } catch (clerkError) {
                console.error('[Team API] Failed to delete Clerk user:', clerkError);
            }
        }

        console.log(`[Team API] Seat revoked successfully`);

        return NextResponse.json({ success: true, message: 'Team member removed' });
    } catch (error) {
        console.error('[Team API] DELETE error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
