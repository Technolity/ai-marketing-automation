/**
 * POST /api/social/refresh-metrics
 *
 * Manually triggers a Buffer analytics sync for a single social post.
 * Used by the "Refresh" button in the analytics dashboard.
 *
 * Body: { post_id: string }
 * Returns: { metrics: SocialPostMetrics }
 */

import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabase as supabaseAdmin } from '@/lib/supabaseServiceRole';
import { resolveWorkspace } from '@/lib/workspaceHelper';
import { decryptToken } from '@/lib/social/encryption';
import { getBufferPost, extractMetrics } from '@/lib/social/bufferClient';

export const dynamic = 'force-dynamic';

export async function POST(req) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { workspaceId, error: wsError } = await resolveWorkspace(userId);
    if (wsError) return NextResponse.json({ error: wsError }, { status: 403 });

    const { post_id } = await req.json().catch(() => ({}));
    if (!post_id) return NextResponse.json({ error: 'post_id is required.' }, { status: 400 });

    // Fetch post and verify ownership
    const { data: post } = await supabaseAdmin
      .from('social_posts')
      .select('id, buffer_id, user_id')
      .eq('id', post_id)
      .eq('user_id', workspaceId)
      .maybeSingle();

    if (!post) return NextResponse.json({ error: 'Post not found.' }, { status: 404 });
    if (!post.buffer_id) return NextResponse.json({ error: 'Post has no Buffer ID — metrics unavailable.' }, { status: 400 });

    // Get Buffer token
    const { data: profile } = await supabaseAdmin
      .from('user_profiles')
      .select('buffer_access_token')
      .eq('id', workspaceId)
      .maybeSingle();

    if (!profile?.buffer_access_token) {
      return NextResponse.json(
        { error: 'Buffer not connected.', code: 'buffer_not_connected' },
        { status: 401 }
      );
    }

    const accessToken  = decryptToken(profile.buffer_access_token);
    const bufferUpdate = await getBufferPost(post.buffer_id, accessToken);
    const { likes, comments, shares, views, reaches, linkClicks, engagementRate, ctr } = extractMetrics(bufferUpdate);

    const { data: metrics, error: upsertErr } = await supabaseAdmin
      .from('social_post_metrics')
      .upsert(
        {
          social_post_id:  post.id,
          likes, comments, shares, views, reaches,
          link_clicks:     linkClicks,
          engagement_rate: engagementRate,
          ctr,
          last_synced_at:  new Date().toISOString(),
          sync_error_count: 0,
          sync_error_message: null,
        },
        { onConflict: 'social_post_id' }
      )
      .select()
      .single();

    if (upsertErr) throw upsertErr;

    return NextResponse.json({ metrics });
  } catch (err) {
    console.error('[Refresh Metrics]', err);
    if (err.status === 401) {
      return NextResponse.json(
        { error: 'Buffer session expired. Reconnect your account.', code: 'buffer_expired' },
        { status: 401 }
      );
    }
    return NextResponse.json({ error: 'Failed to refresh metrics.' }, { status: 500 });
  }
}
