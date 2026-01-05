import { NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs';
import { createClient } from '@supabase/supabase-js';


export const dynamic = 'force-dynamic';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } }
);

/**
 * GET /api/debug/user - Debug endpoint to check user data
 */
export async function GET(req) {
    try {
        const { userId } = auth();
        const user = await currentUser();

        if (!userId) {
            return NextResponse.json({ error: 'Not logged in', userId: null });
        }

        // Check database for this user
        const { data: profile, error } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('id', userId)
            .single();

        return NextResponse.json({
            clerkUserId: userId,
            clerkEmail: user?.emailAddresses?.[0]?.emailAddress,
            clerkName: `${user?.firstName || ''} ${user?.lastName || ''}`.trim(),
            databaseProfile: profile,
            databaseError: error?.message,
            isAdminInDb: profile?.is_admin || false
        });

    } catch (error) {
        console.error('Debug error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

