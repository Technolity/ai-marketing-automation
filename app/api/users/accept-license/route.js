import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import { supabase } from '@/lib/supabaseServiceRole';

export const dynamic = 'force-dynamic';

/**
 * POST /api/users/accept-license
 * 
 * Records that the user has accepted the TedOS EULA.
 * Uses upsert to handle both new and existing users.
 */
export async function POST(request) {
    try {
        const { userId } = auth();

        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        console.log('[AcceptLicense] Recording license acceptance for user:', userId);

        const timestamp = new Date().toISOString();

        // First, check if user profile exists
        const { data: existingProfile, error: fetchError } = await supabase
            .from('user_profiles')
            .select('id')
            .eq('id', userId)
            .single();

        // Ignore "no rows" error - that's expected for new users
        if (fetchError && fetchError.code !== 'PGRST116') {
            console.error('[AcceptLicense] Error checking profile:', fetchError);
        }

        let result;

        if (existingProfile) {
            // User exists - update
            console.log('[AcceptLicense] Updating existing user profile');
            result = await supabase
                .from('user_profiles')
                .update({
                    license_accepted_at: timestamp,
                    updated_at: timestamp
                })
                .eq('id', userId)
                .select('license_accepted_at')
                .single();
        } else {
            // User doesn't exist - create new profile
            console.log('[AcceptLicense] Creating new user profile with license acceptance');
            result = await supabase
                .from('user_profiles')
                .insert({
                    id: userId,
                    license_accepted_at: timestamp,
                    created_at: timestamp,
                    updated_at: timestamp
                })
                .select('license_accepted_at')
                .single();
        }

        if (result.error) {
            console.error('[AcceptLicense] Database error:', result.error);

            // Check if it's a missing column error
            if (result.error.message?.includes('license_accepted_at')) {
                return NextResponse.json({
                    error: 'Database migration required',
                    details: 'Run: ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS license_accepted_at TIMESTAMPTZ DEFAULT NULL;'
                }, { status: 500 });
            }

            return NextResponse.json({
                error: 'Failed to record license acceptance',
                details: result.error.message
            }, { status: 500 });
        }

        console.log('[AcceptLicense] License accepted at:', result.data?.license_accepted_at);

        return NextResponse.json({
            success: true,
            message: 'License agreement accepted',
            acceptedAt: result.data?.license_accepted_at
        });

    } catch (error) {
        console.error('[AcceptLicense] Error:', error);
        return NextResponse.json({
            error: 'Internal server error',
            details: error.message
        }, { status: 500 });
    }
}

/**
 * GET /api/users/accept-license
 * 
 * Check if the current user has accepted the license.
 */
export async function GET(request) {
    try {
        const { userId } = auth();

        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { data, error } = await supabase
            .from('user_profiles')
            .select('license_accepted_at')
            .eq('id', userId)
            .single();

        // If no profile exists, license is not accepted
        if (error && error.code === 'PGRST116') {
            return NextResponse.json({
                licenseAccepted: false,
                acceptedAt: null
            });
        }

        if (error) {
            console.error('[AcceptLicense] Database error:', error);
            return NextResponse.json({
                error: 'Failed to check license status',
                details: error.message
            }, { status: 500 });
        }

        return NextResponse.json({
            licenseAccepted: !!data?.license_accepted_at,
            acceptedAt: data?.license_accepted_at || null
        });

    } catch (error) {
        console.error('[AcceptLicense] Error:', error);
        return NextResponse.json({
            error: 'Internal server error',
            details: error.message
        }, { status: 500 });
    }
}
