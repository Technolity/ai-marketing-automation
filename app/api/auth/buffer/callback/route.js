/**
 * GET /api/auth/buffer/callback
 *
 * Handles the Buffer OAuth callback:
 *  1. Verifies CSRF state against the cookie
 *  2. Exchanges the code for an access token
 *  3. Fetches the user's Buffer profiles (Twitter, Instagram, Facebook)
 *  4. Stores the encrypted token + profiles in Supabase
 *  5. Redirects back to the daily-leads page with ?connected=true
 */

import { NextResponse } from 'next/server';
import { supabase as supabaseAdmin } from '@/lib/supabaseServiceRole';
import { encryptToken } from '@/lib/social/encryption';
import { getBufferProfiles } from '@/lib/social/bufferClient';

export const dynamic = 'force-dynamic';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || '';
const REDIRECT_BASE = `${APP_URL}/dashboard/daily-leads`;

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const code  = searchParams.get('code');
  const state = searchParams.get('state');

  // ── 1. Verify CSRF state ──────────────────────────────────────────────────
  const cookieHeader = req.headers.get('cookie') || '';
  const cookieMatch  = cookieHeader.match(/buffer_oauth_state=([^;]+)/);
  const savedState   = cookieMatch ? decodeURIComponent(cookieMatch[1]) : null;

  if (!savedState || savedState !== state) {
    console.warn('[Buffer Callback] State mismatch', { savedState, state });
    return NextResponse.redirect(`${REDIRECT_BASE}?error=invalid_state`);
  }

  // Extract workspaceId from state (format: "{randomHex}.{workspaceId}")
  const dotIdx     = state.indexOf('.');
  const workspaceId = dotIdx !== -1 ? state.slice(dotIdx + 1) : null;

  if (!workspaceId) {
    return NextResponse.redirect(`${REDIRECT_BASE}?error=invalid_state`);
  }

  if (!code) {
    return NextResponse.redirect(`${REDIRECT_BASE}?error=no_code`);
  }

  try {
    // ── 2. Exchange code for access token ─────────────────────────────────
    const tokenRes = await fetch('https://api.bufferapp.com/1/oauth2/token.json', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id:     process.env.BUFFER_CLIENT_ID,
        client_secret: process.env.BUFFER_CLIENT_SECRET,
        redirect_uri:  process.env.BUFFER_REDIRECT_URI,
        code,
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenRes.ok) {
      const body = await tokenRes.json().catch(() => ({}));
      console.error('[Buffer Callback] Token exchange failed', body);
      return NextResponse.redirect(`${REDIRECT_BASE}?error=token_exchange_failed`);
    }

    const { access_token } = await tokenRes.json();
    if (!access_token) {
      return NextResponse.redirect(`${REDIRECT_BASE}?error=no_access_token`);
    }

    // ── 3. Encrypt and store token ────────────────────────────────────────
    const encrypted = encryptToken(access_token);

    const { error: profileUpdateErr } = await supabaseAdmin
      .from('user_profiles')
      .update({
        buffer_access_token: encrypted,
        buffer_connected_at: new Date().toISOString(),
      })
      .eq('id', workspaceId);

    if (profileUpdateErr) {
      console.error('[Buffer Callback] Failed to store token', profileUpdateErr);
      return NextResponse.redirect(`${REDIRECT_BASE}?error=store_failed`);
    }

    // ── 4. Fetch and store Buffer profiles ────────────────────────────────
    try {
      const profiles = await getBufferProfiles(access_token);

      const SUPPORTED = ['twitter', 'instagram', 'facebook'];

      for (const profile of profiles) {
        const service = SUPPORTED.includes(profile.service) ? profile.service : null;
        if (!service) continue;

        await supabaseAdmin
          .from('buffer_profiles')
          .upsert(
            {
              user_id:      workspaceId,
              buffer_id:    profile.id,
              service,
              display_name: profile.formatted_username || profile.service_username || profile.id,
              avatar_url:   profile.avatar_https || null,
            },
            { onConflict: 'user_id,service' }
          );
      }
    } catch (profileErr) {
      // Non-fatal — token is stored, profiles can be re-fetched later
      console.warn('[Buffer Callback] Profile fetch failed (non-fatal):', profileErr.message);
    }

    // ── 5. Clear state cookie and redirect ────────────────────────────────
    const response = NextResponse.redirect(`${REDIRECT_BASE}?connected=true`);
    response.cookies.set('buffer_oauth_state', '', { maxAge: 0, path: '/' });
    return response;

  } catch (err) {
    console.error('[Buffer Callback] Unexpected error:', err);
    return NextResponse.redirect(`${REDIRECT_BASE}?error=connection_failed`);
  }
}
