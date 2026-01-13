import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import { supabase as supabaseAdmin } from '@/lib/supabaseServiceRole';


export const dynamic = 'force-dynamic';

/**
 * GET /api/user/profile
 * Get the current user's profile including tier and limits
 */
export async function GET(req) {
    try {
        const { userId } = auth();
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get or create profile - user_profiles uses 'id' as the Clerk user ID
        let { data: profile, error } = await supabaseAdmin
            .from('user_profiles')
            .select('*')
            .eq('id', userId)
            .single();

        if (error && error.code === 'PGRST116') {
            // Profile doesn't exist, create one with defaults
            const { data: newProfile, error: createError } = await supabaseAdmin
                .from('user_profiles')
                .insert({
                    id: userId,
                    email: `${userId}@placeholder.com`, // Will be updated when we have real email
                    subscription_tier: 'starter',
                    max_funnels: 1,
                    current_funnel_count: 0,
                    max_seats: 1,
                    current_seat_count: 0,
                    is_admin: false
                })
                .select()
                .single();

            if (createError) throw createError;
            profile = newProfile;
        } else if (error) {
            throw error;
        }

        return NextResponse.json({
            ...profile,
            success: true
        });

    } catch (error) {
        console.error('[API] Get profile error:', error);
        return NextResponse.json({ error: 'Failed to load profile' }, { status: 500 });
    }
}

/**
 * PATCH /api/user/profile
 * Update user profile fields
 */
export async function PATCH(req) {
    try {
        const { userId } = auth();
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const updates = await req.json();

        // Only allow certain fields to be updated by user
        const allowedFields = ['full_name', 'email'];
        const safeUpdates = {};

        for (const [key, value] of Object.entries(updates)) {
            if (allowedFields.includes(key)) {
                safeUpdates[key] = value;
            }
        }

        if (Object.keys(safeUpdates).length === 0) {
            return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
        }

        const { data: profile, error } = await supabaseAdmin
            .from('user_profiles')
            .update(safeUpdates)
            .eq('id', userId)
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json({ success: true, profile });

    } catch (error) {
        console.error('[API] Update profile error:', error);
        return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
    }
}

