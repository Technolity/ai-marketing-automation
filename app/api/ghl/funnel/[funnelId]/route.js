import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import { supabase } from '@/lib/supabaseServiceRole';

/**
 * GET /api/ghl/funnel/[funnelId]
 * Fetch funnel details by ID
 */
export async function GET(req, { params }) {
    try {
        const { userId } = auth();
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { funnelId } = params;

        if (!funnelId) {
            return NextResponse.json({ error: 'Funnel ID required' }, { status: 400 });
        }

        // Fetch funnel by ID
        const { data: funnel, error } = await supabase
            .from('ghl_funnels')
            .select('*')
            .eq('id', funnelId)
            .eq('user_id', userId)
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                return NextResponse.json({ error: 'Funnel not found' }, { status: 404 });
            }
            console.error('[Funnel Fetch] Database error:', error);
            return NextResponse.json({
                error: 'Failed to fetch funnel',
                details: error.message
            }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            funnel: {
                id: funnel.id,
                funnel_name: funnel.funnel_name,
                funnel_type: funnel.funnel_type,
                funnel_url: funnel.funnel_url,
                ghl_funnel_id: funnel.ghl_funnel_id,
                ghl_location_id: funnel.ghl_location_id,
                status: funnel.status,
                metadata: funnel.metadata,
                launched_at: funnel.launched_at,
                created_at: funnel.created_at
            }
        });

    } catch (error) {
        console.error('[Funnel Fetch] Error:', error);
        return NextResponse.json({
            error: 'Internal server error',
            details: error.message
        }, { status: 500 });
    }
}

/**
 * PATCH /api/ghl/funnel/[funnelId]
 * Update funnel details
 */
export async function PATCH(req, { params }) {
    try {
        const { userId } = auth();
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { funnelId } = params;
        const body = await req.json();

        // Only allow certain fields to be updated
        const allowedFields = ['funnel_name', 'funnel_url', 'status', 'metadata'];
        const updates = {};
        
        for (const field of allowedFields) {
            if (body[field] !== undefined) {
                updates[field] = body[field];
            }
        }

        if (Object.keys(updates).length === 0) {
            return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
        }

        const { data: funnel, error } = await supabase
            .from('ghl_funnels')
            .update(updates)
            .eq('id', funnelId)
            .eq('user_id', userId)
            .select()
            .single();

        if (error) {
            console.error('[Funnel Update] Database error:', error);
            return NextResponse.json({
                error: 'Failed to update funnel',
                details: error.message
            }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            funnel
        });

    } catch (error) {
        console.error('[Funnel Update] Error:', error);
        return NextResponse.json({
            error: 'Internal server error',
            details: error.message
        }, { status: 500 });
    }
}

