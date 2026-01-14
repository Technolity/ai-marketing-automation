import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import { supabase } from '@/lib/supabaseServiceRole';

export const dynamic = 'force-dynamic';

/**
 * POST /api/users/accept-license
 * 
 * Records that the user has accepted the TedOS EULA.
 * Updates user_profiles.license_accepted_at with current timestamp.
 */
export async function POST(request) {
    try {
        const { userId } = auth();

        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        console.log('[AcceptLicense] Recording license acceptance for user:', userId);

        // Update the user's license acceptance timestamp
        const { data, error } = await supabase
            .from('user_profiles')
            .update({
                license_accepted_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            })
            .eq('id', userId)
            .select('license_accepted_at')
            .single();

        if (error) {
            console.error('[AcceptLicense] Database error:', error);
            return NextResponse.json({
                error: 'Failed to record license acceptance',
                details: error.message
            }, { status: 500 });
        }

        console.log('[AcceptLicense] License accepted at:', data?.license_accepted_at);

        return NextResponse.json({
            success: true,
            message: 'License agreement accepted',
            acceptedAt: data?.license_accepted_at
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

        if (error && error.code !== 'PGRST116') {
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
