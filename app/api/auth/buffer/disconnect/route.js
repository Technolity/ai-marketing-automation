/**
 * POST /api/auth/buffer/disconnect
 *
 * Revokes the user's Buffer connection:
 *  - Clears buffer_access_token and buffer_connected_at on user_profiles
 *  - Deletes all buffer_profiles rows for the workspace
 */

import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabase as supabaseAdmin } from '@/lib/supabaseServiceRole';
import { resolveWorkspace } from '@/lib/workspaceHelper';

export const dynamic = 'force-dynamic';

export async function POST(req) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { workspaceId, error: wsError } = await resolveWorkspace(userId);
    if (wsError) return NextResponse.json({ error: wsError }, { status: 403 });

    await Promise.all([
      supabaseAdmin
        .from('user_profiles')
        .update({ buffer_access_token: null, buffer_connected_at: null })
        .eq('id', workspaceId),

      supabaseAdmin
        .from('buffer_profiles')
        .delete()
        .eq('user_id', workspaceId),
    ]);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[Buffer Disconnect]', err);
    return NextResponse.json({ error: 'Failed to disconnect.' }, { status: 500 });
  }
}
