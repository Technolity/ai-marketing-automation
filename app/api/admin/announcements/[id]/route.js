/**
 * Admin Announcements [id] API
 * PUT    - Update an announcement (toggle active, edit text)
 * DELETE - Remove an announcement
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

export async function PUT(req, { params }) {
    const { userId } = auth();
    if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    if (!(await isAdmin(userId))) {
        return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    try {
        const { id } = params;
        const body = await req.json();

        // Build update object from allowed fields
        const updates = {};
        if (body.title !== undefined) updates.title = body.title;
        if (body.message !== undefined) updates.message = body.message;
        if (body.type !== undefined) {
            const validTypes = ['info', 'success', 'warning', 'discount'];
            if (!validTypes.includes(body.type)) {
                return Response.json({ error: `Invalid type` }, { status: 400 });
            }
            updates.type = body.type;
        }
        if (body.is_active !== undefined) updates.is_active = body.is_active;

        if (Object.keys(updates).length === 0) {
            return Response.json({ error: 'No fields to update' }, { status: 400 });
        }

        const { data, error } = await supabaseAdmin
            .from('announcements')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error('[Admin Announcements] PUT error:', error);
            return Response.json({ error: error.message }, { status: 500 });
        }

        console.log('[Admin Announcements] Updated announcement:', id);
        return Response.json({ announcement: data });
    } catch (err) {
        console.error('[Admin Announcements] PUT exception:', err);
        return Response.json({ error: 'Invalid request body' }, { status: 400 });
    }
}

export async function DELETE(req, { params }) {
    const { userId } = auth();
    if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    if (!(await isAdmin(userId))) {
        return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = params;

    const { error } = await supabaseAdmin
        .from('announcements')
        .delete()
        .eq('id', id);

    if (error) {
        console.error('[Admin Announcements] DELETE error:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }

    console.log('[Admin Announcements] Deleted announcement:', id);
    return Response.json({ success: true });
}
