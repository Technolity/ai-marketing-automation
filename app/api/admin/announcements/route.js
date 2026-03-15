/**
 * Admin Announcements API
 * GET  - List all announcements (admin only)
 * POST - Create a new announcement (admin only)
 */

import { auth } from '@clerk/nextjs';
import { supabase as supabaseAdmin } from '@/lib/supabaseServiceRole';

export const dynamic = 'force-dynamic';

async function isAdmin(userId) {
    const { data } = await supabaseAdmin
        .from('user_profiles')
        .select('is_admin')
        .eq('id', userId)
        .single();
    return data?.is_admin === true;
}

export async function GET(req) {
    const { userId } = auth();
    if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    if (!(await isAdmin(userId))) {
        return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { data, error } = await supabaseAdmin
        .from('announcements')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('[Admin Announcements] GET error:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json({ announcements: data });
}

export async function POST(req) {
    const { userId } = auth();
    if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    if (!(await isAdmin(userId))) {
        return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    try {
        const { title, message, type = 'info' } = await req.json();

        if (!title || !message) {
            return Response.json({ error: 'Title and message are required' }, { status: 400 });
        }

        const validTypes = ['info', 'success', 'warning', 'discount'];
        if (!validTypes.includes(type)) {
            return Response.json({ error: `Invalid type. Must be one of: ${validTypes.join(', ')}` }, { status: 400 });
        }

        const { data, error } = await supabaseAdmin
            .from('announcements')
            .insert({
                title,
                message,
                type,
                is_active: true,
                created_by: userId
            })
            .select()
            .single();

        if (error) {
            console.error('[Admin Announcements] POST error:', error);
            return Response.json({ error: error.message }, { status: 500 });
        }

        console.log('[Admin Announcements] Created announcement:', data.id);
        return Response.json({ announcement: data }, { status: 201 });
    } catch (err) {
        console.error('[Admin Announcements] POST exception:', err);
        return Response.json({ error: 'Invalid request body' }, { status: 400 });
    }
}
