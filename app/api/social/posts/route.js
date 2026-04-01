/**
 * GET /api/social/posts
 *
 * Returns the workspace's social posts with metrics, paginated and filterable.
 *
 * Query params:
 *   page       int     default 1
 *   limit      int     default 20, max 50
 *   platform   string  "twitter" | "instagram" | "facebook" (filter)
 *   start_date string  ISO date (filter published_at >=)
 *   end_date   string  ISO date (filter published_at <=)
 *   status     string  filter by post_status
 */

import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabase as supabaseAdmin } from '@/lib/supabaseServiceRole';
import { resolveWorkspace } from '@/lib/workspaceHelper';

export const dynamic = 'force-dynamic';

const POST_SELECT = `
  id, image_url, caption, platforms, hashtags, buffer_id,
  post_status, post_error, published_at, scheduled_for, created_at, daily_post_id,
  social_post_metrics (
    likes, comments, shares, views, reaches, link_clicks,
    engagement_rate, ctr, last_synced_at, sync_error_count
  )
`;

export async function GET(req) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { workspaceId, error: wsError } = await resolveWorkspace(userId);
    if (wsError) return NextResponse.json({ error: wsError }, { status: 403 });

    const { searchParams } = new URL(req.url);
    const page       = Math.max(1, parseInt(searchParams.get('page')  || '1', 10));
    const limit      = Math.min(50, parseInt(searchParams.get('limit') || '20', 10));
    const offset     = (page - 1) * limit;
    const platform   = searchParams.get('platform');
    const startDate  = searchParams.get('start_date');
    const endDate    = searchParams.get('end_date');
    const statusFilter = searchParams.get('status');

    // ── Paginated posts query ──────────────────────────────────────────────
    let query = supabaseAdmin
      .from('social_posts')
      .select(POST_SELECT, { count: 'exact' })
      .eq('user_id', workspaceId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (platform) query = query.contains('platforms', [platform]);
    if (startDate) query = query.gte('published_at', startDate);
    if (endDate)   query = query.lte('published_at', endDate);
    if (statusFilter) query = query.eq('post_status', statusFilter);

    const { data: posts, error: postsErr, count } = await query;
    if (postsErr) throw postsErr;

    // ── Aggregate metrics (all published posts, not just this page) ────────
    const { data: allPublished } = await supabaseAdmin
      .from('social_posts')
      .select('social_post_metrics(likes, views, link_clicks, engagement_rate)')
      .eq('user_id', workspaceId)
      .eq('post_status', 'published');

    const totalLikes   = allPublished?.reduce((s, p) => s + (p.social_post_metrics?.likes       || 0), 0) ?? 0;
    const totalViews   = allPublished?.reduce((s, p) => s + (p.social_post_metrics?.views       || 0), 0) ?? 0;
    const totalClicks  = allPublished?.reduce((s, p) => s + (p.social_post_metrics?.link_clicks || 0), 0) ?? 0;
    const avgEngagement = allPublished?.length
      ? allPublished.reduce((s, p) => s + (p.social_post_metrics?.engagement_rate || 0), 0) / allPublished.length
      : 0;

    return NextResponse.json({
      posts: posts ?? [],
      pagination: {
        page,
        limit,
        total:   count ?? 0,
        hasMore: offset + limit < (count ?? 0),
      },
      aggregates: {
        totalPublished:  allPublished?.length ?? 0,
        totalLikes,
        totalViews,
        totalClicks,
        avgEngagement:   Math.round(avgEngagement * 100) / 100,
      },
    });
  } catch (err) {
    console.error('[Social Posts GET]', err);
    return NextResponse.json({ error: 'Failed to load posts.' }, { status: 500 });
  }
}
