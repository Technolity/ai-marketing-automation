import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import { supabase as supabaseAdmin } from '@/lib/supabaseServiceRole';

/**
 * GET /api/os/approvals
 * Fetch approved phases for business-core and funnel-assets
 */
export async function GET(req) {
    try {
        const { userId } = auth();
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const sessionId = searchParams.get('session_id');

        // Fetch approvals from database
        const { data, error } = await supabaseAdmin
            .from('phase_approvals')
            .select('*')
            .eq('user_id', userId)
            .eq('session_id', sessionId || 'current')
            .single();

        if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
            console.error('[Approvals API] Error fetching:', error);
            return NextResponse.json({ error: 'Database error' }, { status: 500 });
        }

        return NextResponse.json({
            businessCoreApprovals: data?.business_core_approvals || [],
            funnelAssetsApprovals: data?.funnel_assets_approvals || [],
            funnelApproved: data?.funnel_approved || false
        });

    } catch (error) {
        console.error('[Approvals API] GET error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

/**
 * POST /api/os/approvals
 * Save approved phases
 */
export async function POST(req) {
    try {
        const { userId } = auth();
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { sessionId, businessCoreApprovals, funnelAssetsApprovals, funnelApproved } = body;

        // Upsert approvals
        const { error } = await supabaseAdmin
            .from('phase_approvals')
            .upsert({
                user_id: userId,
                session_id: sessionId || 'current',
                business_core_approvals: businessCoreApprovals || [],
                funnel_assets_approvals: funnelAssetsApprovals || [],
                funnel_approved: funnelApproved || false,
                updated_at: new Date().toISOString()
            }, {
                onConflict: 'user_id,session_id'
            });

        if (error) {
            console.error('[Approvals API] Error saving:', error);
            return NextResponse.json({ error: 'Failed to save approvals' }, { status: 500 });
        }

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('[Approvals API] POST error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

