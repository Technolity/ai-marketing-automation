import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } }
);

// Cache for admin verification (expires after 5 minutes)
const adminVerifyCache = new Map();
const VERIFY_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Helper to verify admin (optimized with caching)
async function verifyAdmin(token) {
    if (!token) return null;

    // Check cache first
    const cached = adminVerifyCache.get(token);
    if (cached && Date.now() - cached.timestamp < VERIFY_CACHE_DURATION) {
        return cached.user;
    }

    try {
        const { data: { user }, error } = await supabase.auth.getUser(token);
        if (error || !user) return null;

        const { data: profile } = await supabase
            .from('user_profiles')
            .select('is_admin')
            .eq('id', user.id)
            .maybeSingle();

        const isAdmin = profile?.is_admin ? user : null;

        // Cache the result
        if (isAdmin) {
            adminVerifyCache.set(token, {
                user: isAdmin,
                timestamp: Date.now()
            });
        }

        return isAdmin;
    } catch (error) {
        console.error('Admin verification error:', error);
        return null;
    }
}

/**
 * GET /api/admin/users - List all users with pagination
 */
export async function GET(req) {
    try {
        const token = req.headers.get('authorization')?.replace('Bearer ', '');
        const admin = await verifyAdmin(token);

        if (!admin) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '10');
        const search = searchParams.get('search') || '';
        const tier = searchParams.get('tier') || '';

        const offset = (page - 1) * limit;

        // Build query
        let query = supabase
            .from('user_profiles')
            .select('*', { count: 'exact' });

        // Apply filters
        if (search) {
            query = query.or(`email.ilike.%${search}%,full_name.ilike.%${search}%`);
        }
        if (tier) {
            query = query.eq('subscription_tier', tier);
        }

        // Apply pagination
        query = query
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);

        const { data: users, error, count } = await query;

        if (error) throw error;

        // Get total counts by tier (optimized with parallel queries)
        const [totalCount, basicCount, premiumCount, enterpriseCount] = await Promise.all([
            supabase.from('user_profiles').select('id', { count: 'exact', head: true }),
            supabase.from('user_profiles').select('id', { count: 'exact', head: true }).eq('subscription_tier', 'basic'),
            supabase.from('user_profiles').select('id', { count: 'exact', head: true }).eq('subscription_tier', 'premium'),
            supabase.from('user_profiles').select('id', { count: 'exact', head: true }).eq('subscription_tier', 'enterprise')
        ]);

        const tierStats = {
            total: totalCount.count || 0,
            basic: basicCount.count || 0,
            premium: premiumCount.count || 0,
            enterprise: enterpriseCount.count || 0,
        };

        return NextResponse.json({
            users: users || [],
            pagination: {
                page,
                limit,
                total: count || 0,
                totalPages: Math.ceil((count || 0) / limit)
            },
            tierStats
        });

    } catch (error) {
        console.error('Admin users API error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

/**
 * PUT /api/admin/users - Update user profile (tier, status)
 */
export async function PUT(req) {
    try {
        const token = req.headers.get('authorization')?.replace('Bearer ', '');
        const admin = await verifyAdmin(token);

        if (!admin) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { userId, updates } = await req.json();

        if (!userId) {
            return NextResponse.json({ error: 'User ID required' }, { status: 400 });
        }

        // Only allow updating specific fields
        const allowedFields = ['subscription_tier', 'tier_expires_at', 'full_name'];
        const safeUpdates = {};

        for (const field of allowedFields) {
            if (updates[field] !== undefined) {
                safeUpdates[field] = updates[field];
            }
        }

        const { data, error } = await supabase
            .from('user_profiles')
            .update(safeUpdates)
            .eq('id', userId)
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json({ user: data });

    } catch (error) {
        console.error('Admin update user error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
