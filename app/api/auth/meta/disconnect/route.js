/**
 * Meta Disconnect Endpoint
 * Removes Meta OAuth tokens (Instagram & Facebook) from database
 */

import { auth } from '@clerk/nextjs/server';
import { supabase as supabaseAdmin } from '@/lib/supabaseServiceRole';
import { resolveWorkspace } from '@/lib/workspaceHelper';

export async function POST(req) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { workspaceId, error: workspaceError } = await resolveWorkspace(userId);
    if (workspaceError) {
      return Response.json({ error: workspaceError }, { status: 403 });
    }

    // Delete both Instagram and Facebook tokens
    const { error } = await supabaseAdmin
      .from('social_auth_tokens')
      .delete()
      .eq('user_id', workspaceId)
      .in('platform', ['instagram', 'facebook']);

    if (error) {
      console.error('Meta disconnect error:', error);
      throw error;
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error('Meta disconnect error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
