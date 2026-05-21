/**
 * X OAuth Callback
 * Exchanges authorization code for access token and stores in database
 */

import { parseOAuthState, extractOAuthStateFromCookie } from '@/lib/social/oauthState';
import { exchangeXCode, getXUserInfo } from '@/lib/social/xClient';
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
          'Location': `/dashboard/daily-leads?error=x_auth_denied&message=${encodeURIComponent(errorDescription)}`
        }
      });
    }

    if (!code || !stateParam) {
      return new Response('Missing code or state', { status: 400 });
    }

    // Get cookie header
    const cookieHeader = req.headers.get('cookie');

    // Extract userId, workspaceId, and platform from state
    let userId, workspaceId;
    try {
      const storedState = extractOAuthStateFromCookie(cookieHeader);

      if (!storedState || storedState !== stateParam) {
        return new Response('State mismatch - possible CSRF attack', { status: 403 });
      }

      const parsed = parseOAuthState(stateParam);
      userId = parsed.userId;
      workspaceId = parsed.workspaceId;
      const platform = parsed.platform;

      if (platform !== 'x') {
        return new Response('Invalid state platform', { status: 403 });
      }
    } catch (stateError) {
      return new Response(`Invalid state format: ${stateError.message}`, { status: 400 });
    }

    // Extract code verifier from cookie
    const codeVerifier = extractCodeVerifierFromCookie(cookieHeader);
    if (!codeVerifier) {
      return new Response('Missing code verifier', { status: 400 });
    }

    // Exchange code for token
    const { accessToken, refreshToken, expiresIn } = await exchangeXCode({
      code,
      clientId: process.env.X_CLIENT_ID,
      clientSecret: process.env.X_CLIENT_SECRET,
      redirectUri: process.env.X_REDIRECT_URI,
      codeVerifier
    });

    // Get user info
    const xUserInfo = await getXUserInfo(accessToken);

    // Encrypt and store in database
    const encryptedToken = encryptToken(accessToken);
    const encryptedRefreshToken = refreshToken ? encryptToken(refreshToken) : null;
    const expiresAt = new Date(Date.now() + expiresIn * 1000);

    const { error } = await supabaseAdmin
      .from('social_auth_tokens')
      .upsert({
        user_id: workspaceId,
        platform: 'x',
        access_token: encryptedToken,
        refresh_token: encryptedRefreshToken,
        token_expires_at: expiresAt,
        account_id: xUserInfo.id,
        account_username: xUserInfo.username,
        connected_at: new Date()
      }, {
        onConflict: 'user_id,platform'
      });

    if (error) {
      console.error('Database upsert error:', error);
      throw error;
    }

    // Clear cookies and redirect with success
    const secure = process.env.NODE_ENV === 'production' ? 'Secure; ' : '';
    const response = new Response(null, {
      status: 302,
      headers: {
        'Location': `/dashboard/daily-leads?connected=x&username=${xUserInfo.username}`,
        'Set-Cookie': [
          `oauth_state=; Path=/; HttpOnly; ${secure}SameSite=Lax; Max-Age=0`,
          `oauth_code_verifier=; Path=/; HttpOnly; ${secure}SameSite=Lax; Max-Age=0`
        ]
      }
    });

    return response;
  } catch (error) {
    console.error('X callback error:', error);
    return new Response(null, {
      status: 302,
      headers: {
        'Location': `/dashboard/daily-leads?error=x_auth_failed&message=${encodeURIComponent(error.message)}`
      }
    });
  }
}

function extractCodeVerifierFromCookie(cookieHeader) {
  if (!cookieHeader) return null;

  const cookies = cookieHeader.split(';').map(c => c.trim());
  for (const cookie of cookies) {
    const [name, value] = cookie.split('=');
    if (name === 'oauth_code_verifier') {
      return decodeURIComponent(value);
    }
  }

  return null;
}

export const dynamic = 'force-dynamic';
