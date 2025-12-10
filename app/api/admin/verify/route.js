import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import { verifyAdmin, getSupabaseClient } from '@/lib/adminAuth';

const supabase = getSupabaseClient();

/**
 * GET /api/admin/verify - Verify admin status (Clerk)
 */
export async function GET(req) {
    try {
        const { userId } = auth();

        if (!userId) {
            return NextResponse.json({ isAdmin: false, error: 'Unauthorized' }, { status: 401 });
        }

        // Verify against DB
        const isAdmin = await verifyAdmin(userId);

        if (!isAdmin) {
            return NextResponse.json({ isAdmin: false, error: 'Not an admin' }, { status: 403 });
        }

        // Get user profile details
        const { data: profile } = await supabase
            .from('user_profiles')
            .select('email, full_name, subscription_tier')
            .eq('id', userId)
            .single();

        return NextResponse.json({
            isAdmin: true,
            user: {
                id: userId,
                email: profile?.email,
                fullName: profile?.full_name,
                tier: profile?.subscription_tier
            }
        });

    } catch (error) {
        console.error('Admin verify error:', error);
        return NextResponse.json({ isAdmin: false, error: error.message }, { status: 500 });
    }
}
