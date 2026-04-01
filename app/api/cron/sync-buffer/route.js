/**
 * Cron: Sync Buffer Analytics
 * GET /api/cron/sync-buffer
 *
 * Runs every 4 hours (configured in vercel.json).
 * For every user with a connected Buffer account, fetches updated metrics
 * from the Buffer API for all published social posts and stores them in
 * social_post_metrics.
 *
 * Protected by Authorization: Bearer {CRON_SECRET} header.
 *
 * Behaviour on errors:
 *  - 401 from Buffer (token expired): skip user, clear their token so the UI
 *    prompts reconnection on next post attempt.
 *  - Any other Buffer error on an individual post: increment sync_error_count,
 *    log, continue — never let one bad post break the whole sync.
 *  - If sync_error_count exceeds 5: stop attempting that post to avoid noise.
 */

import { NextResponse } from 'next/server';
import { supabase as supabaseAdmin } from '@/lib/supabaseServiceRole';
import { decryptToken } from '@/lib/social/encryption';
import { getBufferPost, extractMetrics } from '@/lib/social/bufferClient';

export const dynamic = 'force-dynamic';

const MAX_SYNC_ERRORS = 5;

export async function GET(req) {
  // Verify cron secret (Vercel sends Authorization: Bearer {CRON_SECRET})
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const startedAt  = new Date().toISOString();
  let totalSynced  = 0;
  let totalSkipped = 0;
  let totalErrors  = 0;

  console.log(`[Sync Buffer] Starting at ${startedAt}`);

  try {
    // ── Get all users with an active Buffer token ────────────────────────────
    const { data: users, error: usersErr } = await supabaseAdmin
      .from('user_profiles')
      .select('id, buffer_access_token')
      .not('buffer_access_token', 'is', null);

    if (usersErr) throw usersErr;
    console.log(`[Sync Buffer] Processing ${users?.length ?? 0} connected users`);

    for (const user of users ?? []) {
      let accessToken;
      try {
        accessToken = decryptToken(user.buffer_access_token);
      } catch {
        console.warn(`[Sync Buffer] Could not decrypt token for user ${user.id} — skipping`);
        totalSkipped++;
        continue;
      }

      // ── Get all published posts with a Buffer ID for this user ─────────────
      const { data: posts } = await supabaseAdmin
        .from('social_posts')
        .select('id, buffer_id, social_post_metrics(sync_error_count)')
        .eq('user_id', user.id)
        .eq('post_status', 'published')
        .not('buffer_id', 'is', null);

      for (const post of posts ?? []) {
        // Skip posts that have hit the error ceiling
        const errorCount = post.social_post_metrics?.sync_error_count ?? 0;
        if (errorCount >= MAX_SYNC_ERRORS) {
          totalSkipped++;
          continue;
        }

        try {
          const bufferUpdate = await getBufferPost(post.buffer_id, accessToken);
          const { likes, comments, shares, views, reaches, linkClicks, engagementRate, ctr } =
            extractMetrics(bufferUpdate);

          await supabaseAdmin
            .from('social_post_metrics')
            .upsert(
              {
                social_post_id:     post.id,
                likes, comments, shares, views, reaches,
                link_clicks:        linkClicks,
                engagement_rate:    engagementRate,
                ctr,
                last_synced_at:     new Date().toISOString(),
                sync_error_count:   0,
                sync_error_message: null,
              },
              { onConflict: 'social_post_id' }
            );

          totalSynced++;
        } catch (postErr) {
          totalErrors++;
          console.error(`[Sync Buffer] Failed post ${post.id}:`, postErr.message);

          // If Buffer says token is expired, clear it for this user and stop
          if (postErr.status === 401) {
            await supabaseAdmin
              .from('user_profiles')
              .update({ buffer_access_token: null, buffer_connected_at: null })
              .eq('id', user.id);
            console.warn(`[Sync Buffer] Token expired for user ${user.id} — cleared`);
            break; // Stop processing posts for this user
          }

          // Increment error count so persistently-failing posts get skipped eventually
          await supabaseAdmin
            .from('social_post_metrics')
            .upsert(
              {
                social_post_id:     post.id,
                sync_error_count:   errorCount + 1,
                sync_error_message: postErr.message,
                last_synced_at:     new Date().toISOString(),
              },
              { onConflict: 'social_post_id' }
            );
        }
      }
    }

    const summary = { synced: totalSynced, skipped: totalSkipped, errors: totalErrors, startedAt };
    console.log(`[Sync Buffer] Complete:`, summary);
    return NextResponse.json(summary);

  } catch (err) {
    console.error('[Sync Buffer] Fatal error:', err);
    return NextResponse.json({ error: 'Sync job failed.' }, { status: 500 });
  }
}
