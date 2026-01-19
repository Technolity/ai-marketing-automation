/**
 * Get push logs for a funnel
 */

import { auth } from '@clerk/nextjs';
import { supabase as supabaseAdmin } from '@/lib/supabaseServiceRole';

export const dynamic = 'force-dynamic';

export async function GET(req) {
    const { userId } = auth();
    if (!userId) {
        return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const funnelId = searchParams.get('funnel_id');

    if (!funnelId) {
        return Response.json({ error: 'funnel_id required' }, { status: 400 });
    }

    try {
        const { data: logs, error } = await supabaseAdmin
            .from('ghl_push_logs')
            .select('*')
            .eq('user_id', userId)
            .eq('funnel_id', funnelId)
            .order('created_at', { ascending: false })
            .limit(20);

        if (error) {
            console.error('[PushLogs] Error:', error);
            return Response.json({ error: 'Failed to fetch logs' }, { status: 500 });
        }

        return Response.json({ logs: logs || [] });
    } catch (error) {
        console.error('[PushLogs] Error:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
}
