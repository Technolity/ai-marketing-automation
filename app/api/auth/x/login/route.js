/**
 * X OAuth Login Endpoint
 * Redirects user to X authorization page
 */

import { auth } from '@clerk/nextjs/server';
import { resolveWorkspace } from '@/lib/workspaceHelper';
import { generateXAuthorizationUrl } from '@/lib/social/xClient';
import { generateOAuthState, createOAuthStateCookie } from '@/lib/social/oauthState';

export async function GET(req) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new Response('Unauthorized', { status: 401 });
    }

    const { workspaceId } = await resolveWorkspace(userId);
    if (!workspaceId) {
      return new Response('Could not resolve workspace', { status: 500 });
    }

    // Generate state for CSRF protection (includes userId so we don't need auth() in callback)
    const state = generateOAuthState(userId, workspaceId, 'x');
    const { url, codeVerifier } = generateXAuthorizationUrl({
      clientId: process.env.X_CLIENT_ID,
      redirectUri: process.env.X_REDIRECT_URI,
      state
    });

    // Store state in httpOnly cookie
    const stateCookie = createOAuthStateCookie(state);
    const secure = process.env.NODE_ENV === 'production' ? 'Secure; ' : '';
    const cookieString = `${stateCookie.name}=${stateCookie.value}; Path=/; HttpOnly; ${secure}SameSite=Lax; Max-Age=${stateCookie.options.maxAge}`;

    // Also store codeVerifier in a separate cookie (needed for token exchange)
    const codeVerifierCookie = `oauth_code_verifier=${codeVerifier}; Path=/; HttpOnly; ${secure}SameSite=Lax; Max-Age=${stateCookie.options.maxAge}`;

    const response = new Response(null, {
      status: 302,
      headers: {
        'Location': url,
        'Set-Cookie': [cookieString, codeVerifierCookie]
      }
    });

    return response;
  } catch (error) {
    console.error('X login error:', error);
    return new Response(`Error: ${error.message}`, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
