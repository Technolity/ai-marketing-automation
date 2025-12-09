import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    }
);

// Cache for admin verification (expires after 3 minutes)
const verifyCache = new Map();
const CACHE_DURATION = 3 * 60 * 1000; // 3 minutes

/**
 * Verify if user is an admin (optimized with caching)
 * GET /api/admin/verify
 */
export async function GET(req) {
    try {
        const token = req.headers.get('authorization')?.replace('Bearer ', '');

        if (!token) {
            return NextResponse.json({ isAdmin: false, error: 'No token provided' }, { status: 401 });
        }

        // Check cache first
        const cached = verifyCache.get(token);
        if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
            return NextResponse.json({
                ...cached.data,
                cached: true
            });
        }

        // Verify the token and get user
        const { data: { user }, error: authError } = await supabase.auth.getUser(token);

        if (authError || !user) {
            return NextResponse.json({ isAdmin: false, error: 'Invalid token' }, { status: 401 });
        }

        // Check admin status from user_profiles
        const { data: profile, error: profileError } = await supabase
            .from('user_profiles')
            .select('is_admin, subscription_tier, full_name')
            .eq('id', user.id)
            .maybeSingle();

        if (profileError || !profile) {
            return NextResponse.json({ isAdmin: false, error: 'Profile not found' }, { status: 404 });
        }

        const responseData = {
            isAdmin: profile.is_admin || false,
            user: {
                id: user.id,
                email: user.email,
                fullName: profile.full_name,
                tier: profile.subscription_tier
            }
        };

        // Cache successful admin verifications
        if (responseData.isAdmin) {
            verifyCache.set(token, {
                data: responseData,
                timestamp: Date.now()
            });
        }

        return NextResponse.json(responseData);

    } catch (error) {
        console.error('Admin verify error:', error);
        return NextResponse.json({ isAdmin: false, error: error.message }, { status: 500 });
    }
}
