import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import { verifyAdmin, getSupabaseClient } from '@/lib/adminAuth';

const supabase = getSupabaseClient();

/**
 * GET /api/admin/businesses - List all businesses from saved sessions
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
        const search = searchParams.get('search') || '';

        const offset = (page - 1) * limit;

        // Get all saved sessions
        let query = supabase
            .from('saved_sessions')
            .select(`
                id,
                session_name,
                results_data,
                created_at,
                updated_at,
                user_id
            `, { count: 'exact' });

        if (search) {
            query = query.ilike('session_name', `%${search}%`);
        }

        query = query
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);

        const { data: sessions, error, count } = await query;

        if (error) throw error;

        // Get user profiles (by Clerk ID stored in user_id)
        const userIds = [...new Set(sessions?.map(s => s.user_id) || [])];
        const { data: profiles } = await supabase
            .from('user_profiles')
            .select('id, email, full_name')
            .in('id', userIds);

        const profileMap = (profiles || []).reduce((acc, p) => {
            acc[p.id] = p;
            return acc;
        }, {});

        // Transform sessions into business data
        const businesses = (sessions || []).map(session => {
            const answers = session.results_data?.answers || {};
            const owner = profileMap[session.user_id] || {};

            return {
                id: session.id,
                name: session.session_name || answers.businessName || 'Unnamed Business',
                industry: answers.topicArea || answers.industry || 'Not specified',
                owner: owner.full_name || owner.email || 'Unknown',
                ownerId: session.user_id,
                status: session.results_data?.completed_steps?.length >= 12 ? 'Complete' : 'In Progress',
                stepsCompleted: session.results_data?.completed_steps?.length || 0,
                createdAt: session.created_at,
                updatedAt: session.updated_at
            };
        });

        return NextResponse.json({
            businesses,
            pagination: {
                page,
                limit,
                total: count || 0,
                totalPages: Math.ceil((count || 0) / limit)
            }
        });

    } catch (error) {
        console.error('Admin businesses API error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
