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
 * GET /api/admin/content-review - List generated content for review
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
        const status = searchParams.get('status') || ''; // 'approved', 'pending'

        const offset = (page - 1) * limit;

        let query = supabase
            .from('slide_results')
            .select('*', { count: 'exact' });

        if (status === 'approved') {
            query = query.eq('approved', true);
        } else if (status === 'pending') {
            query = query.eq('approved', false);
        }

        query = query
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);

        const { data: results, error, count } = await query;

        if (error) throw error;

        // Get user info for each result
        const userIds = [...new Set(results?.map(r => r.user_id) || [])];
        const { data: profiles } = await supabase
            .from('user_profiles')
            .select('id, email, full_name')
            .in('id', userIds);

        const profileMap = (profiles || []).reduce((acc, p) => {
            acc[p.id] = p;
            return acc;
        }, {});

        // Transform results
        const content = (results || []).map(result => {
            const user = profileMap[result.user_id] || {};
            return {
                id: result.id,
                userId: result.user_id,
                userName: user.full_name || user.email || 'Unknown',
                userEmail: user.email,
                aiOutput: result.ai_output,
                approved: result.approved,
                slideId: result.slide_id,
                createdAt: result.created_at
            };
        });

        return NextResponse.json({
            content,
            pagination: {
                page,
                limit,
                total: count || 0,
                totalPages: Math.ceil((count || 0) / limit)
            }
        });

    } catch (error) {
        console.error('Admin content-review GET error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

/**
 * PUT /api/admin/content-review - Update content (approve/edit)
 */
export async function PUT(req) {
    try {
        const token = req.headers.get('authorization')?.replace('Bearer ', '');
        const admin = await verifyAdmin(token);

        if (!admin) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { id, approved, aiOutput } = body;

        if (!id) {
            return NextResponse.json({ error: 'ID required' }, { status: 400 });
        }

        const updates = {};
        if (approved !== undefined) updates.approved = approved;
        if (aiOutput !== undefined) updates.ai_output = aiOutput;

        const { data, error } = await supabase
            .from('slide_results')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json({ content: data });

    } catch (error) {
        console.error('Admin content-review PUT error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
