/**
 * GET /api/social/accounts
 *
 * Returns the workspace's connected Buffer profiles and connection status.
 */

import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabase as supabaseAdmin } from '@/lib/supabaseServiceRole';
import { resolveWorkspace } from '@/lib/workspaceHelper';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { workspaceId, error: wsError } = await resolveWorkspace(userId);
    if (wsError) return NextResponse.json({ error: wsError }, { status: 403 });

    const [profilesResult, tokenResult] = await Promise.all([
      supabaseAdmin
        .from('buffer_profiles')
        .select('id, service, display_name, avatar_url, connected_at')
        .eq('user_id', workspaceId)
        .order('service'),

      supabaseAdmin
        .from('user_profiles')
        .select('buffer_connected_at')
        .eq('id', workspaceId)
        .maybeSingle(),
    ]);

    return NextResponse.json({
      profiles:     profilesResult.data || [],
      connected:    !!(tokenResult.data?.buffer_connected_at),
      connected_at: tokenResult.data?.buffer_connected_at || null,
    });
  } catch (err) {
    console.error('[Social Accounts]', err);
    return NextResponse.json({ error: 'Failed to load accounts.' }, { status: 500 });
  }
}
