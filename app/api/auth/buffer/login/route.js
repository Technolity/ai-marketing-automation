/**
 * GET /api/auth/buffer/login
 *
 * Initiates the Buffer OAuth 2.0 flow.
 * Generates a random state token, stores it in an httpOnly cookie alongside
 * the Clerk userId, then redirects to Buffer's authorization page.
 */

import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { resolveWorkspace } from '@/lib/workspaceHelper';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

export async function GET(req) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/auth/login`);
    }

    const { workspaceId } = await resolveWorkspace(userId);

    if (
      !process.env.BUFFER_CLIENT_ID ||
      !process.env.BUFFER_CLIENT_SECRET ||
      !process.env.BUFFER_REDIRECT_URI
    ) {
      console.error('[Buffer Login] Missing BUFFER_CLIENT_ID / BUFFER_CLIENT_SECRET / BUFFER_REDIRECT_URI');
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/daily-leads?error=buffer_not_configured`
      );
    }

    // CSRF state: random hex + workspaceId separated by "."
    const state = `${crypto.randomBytes(16).toString('hex')}.${workspaceId}`;

    const params = new URLSearchParams({
      client_id:     process.env.BUFFER_CLIENT_ID,
      redirect_uri:  process.env.BUFFER_REDIRECT_URI,
      response_type: 'code',
      state,
    });

    const response = NextResponse.redirect(
      `https://bufferapp.com/oauth2/authorize?${params.toString()}`
    );

    // Store state in a short-lived httpOnly cookie (30 min)
    response.cookies.set('buffer_oauth_state', state, {
      httpOnly: true,
      secure:   process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge:   60 * 30,
      path:     '/',
    });

    return response;
  } catch (err) {
    console.error('[Buffer Login]', err);
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/daily-leads?error=login_failed`
    );
  }
}
