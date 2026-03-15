/**
 * User Announcements API
 * GET - Fetch the most recent active announcement that the user has NOT dismissed
 */

import { auth } from '@clerk/nextjs';
import { supabase as supabaseAdmin } from '@/lib/supabaseServiceRole';

export const dynamic = 'force-dynamic';

export async function GET(req) {
    const { userId } = auth();
    if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        // Get all announcement IDs the user has already dismissed
        const { data: dismissals } = await supabaseAdmin
            .from('user_announcement_dismissals')
            .select('announcement_id')
            .eq('user_id', userId);

        const dismissedIds = (dismissals || []).map(d => d.announcement_id);

        // Query for the most recent active announcement not yet dismissed
        let query = supabaseAdmin
            .from('announcements')
            .select('id, title, message, type, created_at')
            .eq('is_active', true)
            .order('created_at', { ascending: false })
            .limit(1);

        if (dismissedIds.length > 0) {
            query = query.not('id', 'in', `(${dismissedIds.join(',')})`);
        }

        const { data, error } = await query;

        if (error) {
            console.error('[Announcements] GET error:', error);
            return Response.json({ error: error.message }, { status: 500 });
        }

        return Response.json({ announcement: data?.[0] || null });
    } catch (err) {
        console.error('[Announcements] GET exception:', err);
        return Response.json({ error: 'Internal server error' }, { status: 500 });
    }
}
