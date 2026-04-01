/**
 * POST to X (Twitter)
 * Posts a tweet with caption and image
 */

import { auth } from '@clerk/nextjs/server';
import { supabase as supabaseAdmin } from '@/lib/supabaseServiceRole';
import { decryptToken, encryptToken } from '@/lib/social/encryption';
import { postXTweet, uploadXMedia, refreshXToken } from '@/lib/social/xClient';

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

    // Get X token from database
    const { data: tokenData, error: tokenError } = await supabaseAdmin
      .from('social_auth_tokens')
      .select('*')
      .eq('user_id', userId)
      .eq('platform', 'x')
      .single();

    if (tokenError || !tokenData) {
      return Response.json(
        { error: 'X account not connected', code: 'x_not_connected' },
        { status: 401 }
      );
    }

    let accessToken = decryptToken(tokenData.access_token);

    // Check if token is about to expire (within 5 minutes) and refresh if needed
    if (tokenData.token_expires_at) {
      const expiresAt = new Date(tokenData.token_expires_at);
      const now = new Date();
      const fiveMinutesFromNow = new Date(now.getTime() + 5 * 60 * 1000);

      if (expiresAt < fiveMinutesFromNow) {
        try {
          const refreshToken = decryptToken(tokenData.refresh_token);
          const { accessToken: newAccessToken, expiresIn } = await refreshXToken({
            refreshToken,
            clientId: process.env.X_CLIENT_ID,
            clientSecret: process.env.X_CLIENT_SECRET
          });

          // Update token in database
          const encryptedToken = encryptToken(newAccessToken);
          await supabaseAdmin
            .from('social_auth_tokens')
            .update({
              access_token: encryptedToken,
              token_expires_at: new Date(Date.now() + expiresIn * 1000)
            })
            .eq('user_id', userId)
            .eq('platform', 'x');

          accessToken = newAccessToken;
        } catch (refreshError) {
          console.error('X token refresh failed:', refreshError);
          // Continue with old token, might still work
        }
      }
    }

    // Download and upload image to X
    let mediaIds = [];
    try {
      const imageRes = await fetch(imageUrl);
      if (!imageRes.ok) throw new Error('Failed to fetch image');

      const imageBuffer = await imageRes.arrayBuffer();
      const mediaId = await uploadXMedia(accessToken, imageBuffer);
      mediaIds = [mediaId];
    } catch (uploadError) {
      console.error('X image upload error:', uploadError);
      // Proceed without media if upload fails
    }

    // Truncate caption to Twitter 280 char limit
    const truncatedCaption = caption.length > 280
      ? caption.substring(0, 277) + '...'
      : caption;

    // Post tweet
    const tweetResult = await postXTweet(accessToken, {
      text: truncatedCaption,
      mediaIds
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
      post_id: tweetResult.id,
      platform: 'x',
      username: tokenData.account_username
    });
  } catch (error) {
    console.error('X posting error:', error);

    // Check for specific X API errors
    if (error.message.includes('401')) {
      return Response.json(
        { error: 'X token expired or invalid', code: 'x_expired' },
        { status: 401 }
      );
    }

    if (error.message.includes('429')) {
      return Response.json(
        { error: 'X rate limit exceeded', code: 'x_rate_limited' },
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
