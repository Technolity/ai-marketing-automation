/**
 * POST to Instagram
 * Creates and publishes a post with image and caption
 */

import { auth } from '@clerk/nextjs/server';
import { supabase as supabaseAdmin } from '@/lib/supabaseServiceRole';
import { decryptToken } from '@/lib/social/encryption';
import { createInstagramMediaContainer, publishInstagramMedia } from '@/lib/social/metaClient';

export async function POST(req) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { caption, imageUrl, daily_post_id } = await req.json();

    if (!caption || !imageUrl) {
      return Response.json(
        { error: 'Missing caption or imageUrl' },
        { status: 400 }
      );
    }

    // Get Instagram token from database
    const { data: tokenData, error: tokenError } = await supabaseAdmin
      .from('social_auth_tokens')
      .select('*')
      .eq('user_id', userId)
      .eq('platform', 'instagram')
      .single();

    if (tokenError || !tokenData) {
      return Response.json(
        { error: 'Instagram account not connected', code: 'instagram_not_connected' },
        { status: 401 }
      );
    }

    const accessToken = decryptToken(tokenData.access_token);
    const igUserId = tokenData.account_id;

    // Truncate caption to Instagram 2200 char limit
    const truncatedCaption = caption.length > 2200
      ? caption.substring(0, 2197) + '...'
      : caption;

    // Step 1: Create media container
    const containerId = await createInstagramMediaContainer(igUserId, {
      imageUrl,
      caption: truncatedCaption,
      accessToken
    });

    // Step 2: Publish media
    const postId = await publishInstagramMedia(igUserId, {
      containerId,
      accessToken
    });

    // Mark daily post as posted if provided
    if (daily_post_id) {
      await supabaseAdmin
        .from('daily_posts')
        .update({ status: 'posted', posted_at: new Date() })
        .eq('id', daily_post_id);
    }

    return Response.json({
      success: true,
      post_id: postId,
      platform: 'instagram',
      username: tokenData.account_username
    });
  } catch (error) {
    console.error('Instagram posting error:', error);

    // Check for specific errors
    if (error.message.includes('401') || error.message.includes('Unauthorized')) {
      return Response.json(
        { error: 'Instagram token expired or invalid', code: 'instagram_expired' },
        { status: 401 }
      );
    }

    if (error.message.includes('429')) {
      return Response.json(
        { error: 'Instagram rate limit exceeded', code: 'instagram_rate_limited' },
        { status: 429 }
      );
    }

    // Check for Instagram quota exceeded (50 posts per 24 hours)
    if (error.message.includes('quota')) {
      return Response.json(
        { error: 'Instagram daily posting quota exceeded (50 posts/24h)', code: 'instagram_quota' },
        { status: 429 }
      );
    }

    return Response.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';
