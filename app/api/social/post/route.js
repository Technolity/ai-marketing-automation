/**
 * POST /api/social/post
 *
 * Creates and publishes (or schedules) a social media post via Buffer.
 *
 * Body:
 *   image_url       string   - Public image URL
 *   caption         string   - Post caption
 *   platforms       string[] - ["twitter","instagram","facebook"]
 *   daily_post_id   string?  - UUID of linked daily_posts row
 *   schedule_for    string?  - ISO datetime to schedule, omit to post immediately
 *   hashtags        object?  - Pre-generated { twitter:"...", instagram:"..." } (optional override)
 *
 * Returns: { post: SocialPost, hashtags: object }
 */

import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabase as supabaseAdmin } from '@/lib/supabaseServiceRole';
import { resolveWorkspace } from '@/lib/workspaceHelper';
import { decryptToken } from '@/lib/social/encryption';
import { createBufferPost } from '@/lib/social/bufferClient';
import {
  generateHashtagsForPlatforms,
  buildCaptionWithHashtags,
  PLATFORM_LIMITS,
} from '@/lib/social/hashtags';

export const dynamic = 'force-dynamic';

const VALID_PLATFORMS = ['twitter', 'instagram', 'facebook'];

export async function POST(req) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { workspaceId, error: wsError } = await resolveWorkspace(userId);
    if (wsError) return NextResponse.json({ error: wsError }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    const { image_url, caption, platforms, daily_post_id, schedule_for, hashtags: providedHashtags } = body;

    // ── Validate inputs ───────────────────────────────────────────────────────
    if (!image_url || !caption) {
      return NextResponse.json({ error: 'image_url and caption are required.' }, { status: 400 });
    }

    if (!platforms?.length) {
      return NextResponse.json({ error: 'Select at least one platform.' }, { status: 400 });
    }

    const invalidPlatforms = platforms.filter(p => !VALID_PLATFORMS.includes(p));
    if (invalidPlatforms.length) {
      return NextResponse.json({ error: `Invalid platforms: ${invalidPlatforms.join(', ')}.` }, { status: 400 });
    }

    // Warn (but don't block) if caption exceeds Twitter limit — truncation happens below
    const twitterCaption = caption.slice(0, PLATFORM_LIMITS.twitter);
    void twitterCaption; // used later

    // ── Retrieve encrypted Buffer token ───────────────────────────────────────
    const { data: userProfile } = await supabaseAdmin
      .from('user_profiles')
      .select('buffer_access_token')
      .eq('id', workspaceId)
      .maybeSingle();

    if (!userProfile?.buffer_access_token) {
      return NextResponse.json(
        { error: 'Buffer not connected. Connect your social accounts first.', code: 'buffer_not_connected' },
        { status: 401 }
      );
    }

    const accessToken = decryptToken(userProfile.buffer_access_token);

    // ── Duplicate detection (same image posted in the last 5 minutes) ─────────
    const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    const { data: recentPost } = await supabaseAdmin
      .from('social_posts')
      .select('id')
      .eq('user_id', workspaceId)
      .eq('image_url', image_url)
      .gte('created_at', fiveMinAgo)
      .limit(1)
      .maybeSingle();

    if (recentPost) {
      return NextResponse.json(
        { error: 'This image was posted very recently. Please wait a few minutes before trying again.' },
        { status: 409 }
      );
    }

    // ── Get Buffer profile IDs for selected platforms ─────────────────────────
    const { data: bufferProfiles } = await supabaseAdmin
      .from('buffer_profiles')
      .select('buffer_id, service')
      .eq('user_id', workspaceId)
      .in('service', platforms);

    if (!bufferProfiles?.length) {
      return NextResponse.json(
        {
          error: 'No connected accounts found for the selected platforms. Connect your accounts first.',
          code: 'no_profiles',
        },
        { status: 400 }
      );
    }

    // ── Generate hashtags (use provided ones or generate fresh) ───────────────
    const hashtags =
      providedHashtags && Object.keys(providedHashtags).length
        ? providedHashtags
        : await generateHashtagsForPlatforms(caption.slice(0, 300), platforms);

    // ── Persist social_post record (pending) ──────────────────────────────────
    const { data: socialPost, error: insertErr } = await supabaseAdmin
      .from('social_posts')
      .insert({
        user_id:            workspaceId,
        daily_post_id:      daily_post_id || null,
        image_url,
        caption,
        platforms,
        hashtags,
        buffer_profile_ids: bufferProfiles.map(p => p.buffer_id),
        post_status:        'pending',
        scheduled_for:      schedule_for || null,
      })
      .select()
      .single();

    if (insertErr) throw insertErr;

    // ── Build caption for Buffer (use Instagram hashtags for richest result;
    //    Buffer distributes to each network with the same text) ─────────────────
    const primaryPlatform = platforms.includes('instagram') ? 'instagram' : platforms[0];
    const captionForBuffer = buildCaptionWithHashtags(
      caption,
      hashtags[primaryPlatform] || '',
      primaryPlatform
    );

    // ── Post to Buffer ────────────────────────────────────────────────────────
    try {
      const profileIds  = bufferProfiles.map(p => p.buffer_id);
      const bufferResult = await createBufferPost({
        accessToken,
        profileIds,
        text:       captionForBuffer,
        mediaUrl:   image_url,
        scheduleAt: schedule_for || null,
      });

      // Buffer may return { id } or { updates: [{ id }] }
      const bufferId   = bufferResult.id || bufferResult.updates?.[0]?.id || null;
      const publishedAt = schedule_for ? null : new Date().toISOString();
      const newStatus   = schedule_for ? 'scheduled' : 'published';

      // Update post status and Buffer ID
      const { data: updatedPost } = await supabaseAdmin
        .from('social_posts')
        .update({ buffer_id: bufferId, post_status: newStatus, published_at: publishedAt })
        .eq('id', socialPost.id)
        .select()
        .single();

      // Create initial metrics row
      await supabaseAdmin
        .from('social_post_metrics')
        .insert({ social_post_id: socialPost.id })
        .select()
        .maybeSingle();

      // Mark linked daily_post as "posted"
      if (daily_post_id) {
        await supabaseAdmin
          .from('daily_posts')
          .update({ status: 'posted' })
          .eq('id', daily_post_id)
          .eq('user_id', workspaceId);
      }

      console.log(`[Social Post] Published: post=${socialPost.id} buffer=${bufferId} platforms=${platforms.join(',')}`);

      return NextResponse.json({ post: updatedPost || socialPost, hashtags });

    } catch (bufferErr) {
      console.error('[Social Post] Buffer error:', bufferErr.message, bufferErr.status);

      // If token expired, clear it so the UI prompts reconnection
      if (bufferErr.status === 401) {
        await supabaseAdmin
          .from('user_profiles')
          .update({ buffer_access_token: null, buffer_connected_at: null })
          .eq('id', workspaceId);

        return NextResponse.json(
          { error: 'Your Buffer session has expired. Please reconnect your account.', code: 'buffer_expired' },
          { status: 401 }
        );
      }

      // Mark post as failed
      await supabaseAdmin
        .from('social_posts')
        .update({ post_status: 'failed', post_error: bufferErr.message })
        .eq('id', socialPost.id);

      if (bufferErr.status === 429) {
        return NextResponse.json(
          { error: 'Buffer rate limit reached. Please wait a few minutes and try again.', code: 'rate_limited' },
          { status: 429 }
        );
      }

      return NextResponse.json(
        { error: bufferErr.message || 'Failed to post to social media.', code: 'buffer_error' },
        { status: 502 }
      );
    }

  } catch (err) {
    console.error('[Social Post]', err);
    return NextResponse.json({ error: 'Failed to create post.' }, { status: 500 });
  }
}
