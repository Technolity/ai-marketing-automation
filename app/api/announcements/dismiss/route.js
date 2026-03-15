/**
 * Dismiss Announcement API
 * POST - Record that the current user has dismissed an announcement
 */

import { auth } from '@clerk/nextjs';
import { supabase as supabaseAdmin } from '@/lib/supabaseServiceRole';

export const dynamic = 'force-dynamic';

export async function POST(req) {
    const { userId } = auth();
    if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const { announcementId } = await req.json();

        if (!announcementId) {
            return Response.json({ error: 'announcementId is required' }, { status: 400 });
        }

        // Upsert to handle duplicate dismissals gracefully
        const { error } = await supabaseAdmin
            .from('user_announcement_dismissals')
            .upsert(
                {
                    user_id: userId,
                    announcement_id: announcementId,
                    dismissed_at: new Date().toISOString()
                },
                { onConflict: 'user_id,announcement_id' }
            );

        if (error) {
            console.error('[Announcements] Dismiss error:', error);
            return Response.json({ error: error.message }, { status: 500 });
        }

        console.log(`[Announcements] User ${userId} dismissed announcement ${announcementId}`);
        return Response.json({ success: true });
    } catch (err) {
        console.error('[Announcements] Dismiss exception:', err);
        return Response.json({ error: 'Invalid request body' }, { status: 400 });
    }
}
