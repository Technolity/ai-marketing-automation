import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import { supabase } from '@/lib/supabaseServiceRole';

/**
 * POST /api/ghl/funnel/save
 * Save funnel details after GHL push
 * 
 * Body: {
 *   funnel_name: string,
 *   funnel_type: string,
 *   funnel_url: string,
 *   session_id?: string (UUID),
 *   ghl_funnel_id?: string,
 *   ghl_location_id?: string,
 *   metadata?: object
 * }
 */
export async function POST(req) {
    try {
        const { userId } = auth();
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const {
            funnel_name,
            funnel_type,
            funnel_url,
            session_id,
            ghl_funnel_id,
            ghl_location_id,
            metadata = {}
        } = body;

        // Validate required fields
        if (!funnel_name || !funnel_type || !funnel_url) {
            return NextResponse.json({
                error: 'Missing required fields: funnel_name, funnel_type, funnel_url'
            }, { status: 400 });
        }

        // Insert funnel record
        const { data: funnel, error } = await supabase
            .from('ghl_funnels')
            .insert({
                user_id: userId,
                session_id: session_id || null,
                funnel_name,
                funnel_type,
                funnel_url,
                ghl_funnel_id: ghl_funnel_id || null,
                ghl_location_id: ghl_location_id || null,
                metadata,
                status: 'active',
                launched_at: new Date().toISOString()
            })
            .select()
            .single();

        if (error) {
            console.error('[Funnel Save] Database error:', error);
            return NextResponse.json({
                error: 'Failed to save funnel',
                details: error.message
            }, { status: 500 });
        }

        console.log('[Funnel Save] Successfully saved funnel:', funnel.id);

        return NextResponse.json({
            success: true,
            funnel: {
                id: funnel.id,
                funnel_name: funnel.funnel_name,
                funnel_type: funnel.funnel_type,
                funnel_url: funnel.funnel_url,
                status: funnel.status,
                launched_at: funnel.launched_at
            }
        });

    } catch (error) {
        console.error('[Funnel Save] Error:', error);
        return NextResponse.json({
            error: 'Internal server error',
            details: error.message
        }, { status: 500 });
    }
}

