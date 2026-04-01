/**
 * Meta OAuth Callback
 * Exchanges authorization code for access token and stores in database
 * Handles both Instagram and Facebook connections
 */

import { parseOAuthState, extractOAuthStateFromCookie } from '@/lib/social/oauthState';
import { exchangeMetaCode, getInstagramBusinessAccount } from '@/lib/social/metaClient';
import { encryptToken } from '@/lib/social/encryption';
import { supabase as supabaseAdmin } from '@/lib/supabaseServiceRole';

export async function GET(req) {
  try {

    // Extract query params
    const { searchParams } = new URL(req.url);
    const code = searchParams.get('code');
    const stateParam = searchParams.get('state');
    const errorParam = searchParams.get('error');

    if (errorParam) {
      const errorDescription = searchParams.get('error_description') || errorParam;
      return new Response(null, {
        status: 302,
        headers: {
          'Location': `/dashboard/daily-leads?error=meta_auth_denied&message=${encodeURIComponent(errorDescription)}`
        }
      });
    }

    if (!code || !stateParam) {
      return new Response('Missing code or state', { status: 400 });
    }

    // Extract userId, workspaceId, and platform from state
    let userId, workspaceId;
    try {
      const cookieHeader = req.headers.get('cookie');
      const storedState = extractOAuthStateFromCookie(cookieHeader);

      if (!storedState || storedState !== stateParam) {
        return new Response('State mismatch - possible CSRF attack', { status: 403 });
      }

      const parsed = parseOAuthState(stateParam);
      userId = parsed.userId;
      workspaceId = parsed.workspaceId;
      const platform = parsed.platform;

      if (platform !== 'meta') {
        return new Response('Invalid state platform', { status: 403 });
      }
    } catch (stateError) {
      return new Response(`Invalid state format: ${stateError.message}`, { status: 400 });
    }

    // Exchange code for token
    const { accessToken } = await exchangeMetaCode({
      code,
      appId: process.env.META_APP_ID,
      appSecret: process.env.META_APP_SECRET,
      redirectUri: process.env.META_REDIRECT_URI
    });

    // Get Instagram Business Account info
    const igAccount = await getInstagramBusinessAccount(accessToken);

    if (!igAccount) {
      return new Response(null, {
        status: 302,
        headers: {
          'Location': `/dashboard/daily-leads?error=meta_no_instagram&message=No Instagram Business account connected to your Facebook account`
        }
      });
    }

    // Encrypt and store access token for Instagram
    const encryptedToken = encryptToken(accessToken);

    // Store Instagram token
    const { error: igError } = await supabaseAdmin
      .from('social_auth_tokens')
      .upsert({
        user_id: userId,
        platform: 'instagram',
        access_token: encryptedToken,
        account_id: igAccount.accountId,
        account_username: igAccount.pageName,
        connected_at: new Date()
      }, {
        onConflict: 'user_id,platform'
      });

    if (igError) {
      console.error('Instagram token store error:', igError);
      throw igError;
    }

    // Also store for Facebook (same token works for both)
    const { error: fbError } = await supabaseAdmin
      .from('social_auth_tokens')
      .upsert({
        user_id: userId,
        platform: 'facebook',
        access_token: encryptedToken,
        account_id: igAccount.pageId,
        account_username: igAccount.pageName,
        connected_at: new Date()
      }, {
        onConflict: 'user_id,platform'
      });

    if (fbError) {
      console.error('Facebook token store error:', fbError);
      throw fbError;
    }

    // Clear cookies and redirect with success
    const response = new Response(null, {
      status: 302,
      headers: {
        'Location': `/dashboard/daily-leads?connected=meta&account=${igAccount.pageName}`,
        'Set-Cookie': 'oauth_state=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0'
      }
    });

    return response;
  } catch (error) {
    console.error('Meta callback error:', error);
    return new Response(null, {
      status: 302,
      headers: {
        'Location': `/dashboard/daily-leads?error=meta_auth_failed&message=${encodeURIComponent(error.message)}`
      }
    });
  }
}

export const dynamic = 'force-dynamic';
