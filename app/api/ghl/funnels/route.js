import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import { supabase } from '@/lib/supabaseServiceRole';

/**
 * GET /api/ghl/funnels
 * List all funnels for the current user
 * 
 * Query params:
 *   status?: 'active' | 'paused' | 'archived' | 'all'
 *   limit?: number (default: 50)
 */
export async function GET(req) {
    try {
        const { userId } = auth();
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const status = searchParams.get('status') || 'all';
        const limit = parseInt(searchParams.get('limit') || '50', 10);

        // Build query
        let query = supabase
            .from('ghl_funnels')
            .select('*')
            .eq('user_id', userId)
            .order('launched_at', { ascending: false })
            .limit(limit);

        // Filter by status if specified
        if (status !== 'all') {
            query = query.eq('status', status);
        }

        const { data: funnels, error } = await query;

        if (error) {
            console.error('[Funnels List] Database error:', error);
            return NextResponse.json({
                error: 'Failed to fetch funnels',
                details: error.message
            }, { status: 500 });
        }

        // Calculate summary stats
        const stats = {
            total: funnels.length,
            active: funnels.filter(f => f.status === 'active').length,
            paused: funnels.filter(f => f.status === 'paused').length,
            archived: funnels.filter(f => f.status === 'archived').length
        };

        return NextResponse.json({
            success: true,
            funnels: funnels.map(f => ({
                id: f.id,
                funnel_name: f.funnel_name,
                funnel_type: f.funnel_type,
                funnel_url: f.funnel_url,
                status: f.status,
                launched_at: f.launched_at
            })),
            stats
        });

    } catch (error) {
        console.error('[Funnels List] Error:', error);
        return NextResponse.json({
            error: 'Internal server error',
            details: error.message
        }, { status: 500 });
    }
}

