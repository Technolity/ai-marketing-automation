import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import { verifyAdmin, getSupabaseClient } from '@/lib/adminAuth';

const supabase = getSupabaseClient();

/**
 * DELETE /api/admin/businesses/[id] - Delete a session
 */
export async function DELETE(req, { params }) {
    try {
        const { userId } = auth();
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const isAdmin = await verifyAdmin(userId);
        if (!isAdmin) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const { id } = params;

        // Delete the session (soft delete)
        const { error } = await supabase
            .from('saved_sessions')
            .update({ is_deleted: true, updated_at: new Date().toISOString() })
            .eq('id', id);

        if (error) throw error;

        return NextResponse.json({ success: true, message: 'Session deleted successfully' });

    } catch (error) {
        console.error('Delete session error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
