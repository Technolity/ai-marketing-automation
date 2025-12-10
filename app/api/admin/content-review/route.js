import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import { verifyAdmin, getSupabaseClient } from '@/lib/adminAuth';

const supabase = getSupabaseClient();

/**
 * GET /api/admin/content-review - List generated content for review
 */
export async function GET(req) {
    try {
        const { userId } = auth();
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const isAdmin = await verifyAdmin(userId);
        if (!isAdmin) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
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

        // Get user info
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
        const { userId } = auth();
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const isAdmin = await verifyAdmin(userId);
        if (!isAdmin) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
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
