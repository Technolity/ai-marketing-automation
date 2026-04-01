/**
 * POST to Facebook Page
 * Posts to a Facebook Page with caption and image link
 */

import { auth } from '@clerk/nextjs/server';
import { supabase as supabaseAdmin } from '@/lib/supabaseServiceRole';
import { decryptToken } from '@/lib/social/encryption';
import { postFacebookPage } from '@/lib/social/metaClient';

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

    // Get Facebook token from database
    const { data: tokenData, error: tokenError } = await supabaseAdmin
      .from('social_auth_tokens')
      .select('*')
      .eq('user_id', userId)
      .eq('platform', 'facebook')
      .single();

    if (tokenError || !tokenData) {
      return Response.json(
        { error: 'Facebook account not connected', code: 'facebook_not_connected' },
        { status: 401 }
      );
    }

    const accessToken = decryptToken(tokenData.access_token);
    const pageId = tokenData.account_id;

    // Truncate caption to Facebook 63206 char limit (essentially unlimited for practical purposes)
    const truncatedCaption = caption.length > 63206
      ? caption.substring(0, 63203) + '...'
      : caption;

    // Post to Facebook Page
    const postId = await postFacebookPage(pageId, {
      message: truncatedCaption,
      link: imageUrl,
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
      platform: 'facebook',
      username: tokenData.account_username
    });
  } catch (error) {
    console.error('Facebook posting error:', error);

    // Check for specific errors
    if (error.message.includes('401') || error.message.includes('Unauthorized')) {
      return Response.json(
        { error: 'Facebook token expired or invalid', code: 'facebook_expired' },
        { status: 401 }
      );
    }

    if (error.message.includes('429')) {
      return Response.json(
        { error: 'Facebook rate limit exceeded', code: 'facebook_rate_limited' },
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
