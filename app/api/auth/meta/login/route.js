/**
 * Meta OAuth Login Endpoint
 * Redirects user to Facebook authorization page
 */

import { auth } from '@clerk/nextjs/server';
import { resolveWorkspace } from '@/lib/workspaceHelper';
import { generateMetaAuthorizationUrl } from '@/lib/social/metaClient';
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
    const state = generateOAuthState(userId, workspaceId, 'meta');
    const url = generateMetaAuthorizationUrl({
      appId: process.env.META_APP_ID,
      redirectUri: process.env.META_REDIRECT_URI,
      state
    });

    // Store state in httpOnly cookie
    const stateCookie = createOAuthStateCookie(state);
    const secure = process.env.NODE_ENV === 'production' ? 'Secure; ' : '';
    const cookieString = `${stateCookie.name}=${stateCookie.value}; Path=/; HttpOnly; ${secure}SameSite=Lax; Max-Age=${stateCookie.options.maxAge}`;

    const response = new Response(null, {
      status: 302,
      headers: {
        'Location': url,
        'Set-Cookie': cookieString
      }
    });

    return response;
  } catch (error) {
    console.error('Meta login error:', error);
    return new Response(`Error: ${error.message}`, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
