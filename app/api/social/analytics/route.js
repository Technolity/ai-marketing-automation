/**
 * GET /api/social/analytics
 * Aggregated engagement metrics for the workspace's connected social accounts,
 * pulled from the Post for Me feeds endpoint (white-labeled).
 *
 * Returns workspace totals, a per-platform breakdown, and a normalized list of
 * recent posts with their lifetime metrics. Post for Me metric field names vary
 * by platform, so we read defensively across common aliases.
 *
 * Query params:
 *   limit  number  - max posts per account (default 25, cap 50)
 */

import { auth } from '@clerk/nextjs/server';
import { resolveWorkspace } from '@/lib/workspaceHelper';
import { supabase as supabaseAdmin } from '@/lib/supabaseServiceRole';
import { getConnectedAccounts, getAccountFeed } from '@/lib/social/postForMeClient';

const METRIC_KEYS = ['impressions', 'reach', 'likes', 'comments', 'shares', 'saves'];

function num(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

/**
 * Normalize a feed item's metrics into a stable shape regardless of which
 * field names a given platform returns.
 */
function normalizeMetrics(raw = {}) {
  const m = raw.metrics || raw.insights || raw || {};
  const impressions = num(m.impressions ?? m.views ?? m.video_views ?? m.plays);
  const reach       = num(m.reach ?? m.unique_impressions ?? impressions);
  const likes       = num(m.likes ?? m.like_count ?? m.favorites ?? m.reactions);
  const comments    = num(m.comments ?? m.comment_count ?? m.replies);
  const shares      = num(m.shares ?? m.share_count ?? m.retweets ?? m.reposts);
  const saves       = num(m.saves ?? m.saved ?? m.bookmarks);
  return { impressions, reach, likes, comments, shares, saves };
}

function emptyTotals() {
  return METRIC_KEYS.reduce((acc, k) => ((acc[k] = 0), acc), {});
}

function addInto(target, metrics) {
  for (const k of METRIC_KEYS) target[k] += metrics[k];
}

export async function GET(req) {
  try {
    const { userId } = await auth();
    if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { workspaceId, error: workspaceError } = await resolveWorkspace(userId);
    if (workspaceError) return Response.json({ error: workspaceError }, { status: 403 });

    const { searchParams } = new URL(req.url);
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '25', 10)));

    const accounts = await getConnectedAccounts(workspaceId);
    if (!accounts.length) {
      return Response.json({
        success: true,
        connectedCount: 0,
        totals: emptyTotals(),
        byPlatform: {},
        posts: [],
      });
    }

    // Map our published posts (pfm_post_id -> daily_post) for best-effort correlation.
    const { data: ourPosts } = await supabaseAdmin
      .from('daily_posts')
      .select('id, pfm_post_id, caption')
      .eq('user_id', workspaceId)
      .not('pfm_post_id', 'is', null);
    const byPfmId = new Map((ourPosts || []).map(p => [p.pfm_post_id, p]));

    const totals = emptyTotals();
    const byPlatform = {};
    const posts = [];

    // Fetch each account's feed independently; one failure shouldn't kill the rest.
    await Promise.all(
      accounts.map(async (account) => {
        try {
          const feed = await getAccountFeed(account.id, { metrics: true, limit });
          for (const item of feed) {
            const metrics = normalizeMetrics(item);
            addInto(totals, metrics);

            const platform = account.platform;
            if (!byPlatform[platform]) byPlatform[platform] = emptyTotals();
            addInto(byPlatform[platform], metrics);

            const socialPostId = item.social_post_id || item.post_id || item.external_id || null;
            posts.push({
              platform,
              username: account.username,
              feedItemId: item.id || null,
              dailyPostId: (socialPostId && byPfmId.get(socialPostId)?.id) || null,
              caption: item.caption || item.text || null,
              mediaUrl: item.media_url || item.thumbnail_url || null,
              url: item.permalink || item.url || null,
              postedAt: item.posted_at || item.created_at || null,
              metrics,
            });
          }
        } catch (err) {
          console.error(`[Social Analytics] feed failed for ${account.platform}:`, err.message);
        }
      })
    );

    // Most recent first when timestamps are available.
    posts.sort((a, b) => new Date(b.postedAt || 0) - new Date(a.postedAt || 0));

    const engagement =
      totals.likes + totals.comments + totals.shares + totals.saves;

    // Smart-link clicks from our own tracking — completes the reach → clicks funnel.
    let smartLinkClicks = 0;
    try {
      const { data: links } = await supabaseAdmin
        .from('smart_links')
        .select('clicks')
        .eq('user_id', workspaceId);
      smartLinkClicks = (links || []).reduce((s, l) => s + (l.clicks || 0), 0);
    } catch { /* non-fatal */ }

    return Response.json({
      success: true,
      connectedCount: accounts.length,
      totals: { ...totals, engagement },
      smartLinkClicks,
      byPlatform,
      posts,
    });
  } catch (error) {
    console.error('[Social Analytics] Error:', error.message, error.body);
    return Response.json({ error: error.message }, { status: error.status || 500 });
  }
}

export const dynamic = 'force-dynamic';
