/**
 * X API v2 Client
 * Handles OAuth 2.0 and posting to X (Twitter)
 */

import crypto from 'crypto';

const X_OAUTH_AUTHORIZE_URL = 'https://x.com/i/oauth2/authorize';
const X_OAUTH_TOKEN_URL = 'https://api.x.com/2/oauth2/token';
const X_API_BASE = 'https://api.x.com/2';
const X_UPLOAD_URL = 'https://upload.twitter.com/1.1/media/upload.json';

/**
 * Generate X OAuth authorization URL
 * PKCE flow for user-initiated authorization
 */
export function generateXAuthorizationUrl({ clientId, redirectUri, state }) {
  const codeVerifier = crypto.randomBytes(32).toString('hex');

  // Create SHA256 hash of code verifier
  const hash = crypto.createHash('sha256').update(codeVerifier).digest();
  const codeChallenge = hash.toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: 'tweet.write tweet.read offline.access',
    state,
    code_challenge: codeChallenge,
    code_challenge_method: 'S256'
  });

  return {
    url: `${X_OAUTH_AUTHORIZE_URL}?${params.toString()}`,
    codeVerifier
  };
}

/**
 * Exchange X authorization code for access token
 */
export async function exchangeXCode({ code, clientId, clientSecret, redirectUri, codeVerifier }) {
  const params = new URLSearchParams({
    code,
    grant_type: 'authorization_code',
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: redirectUri,
    code_verifier: codeVerifier
  });

  const res = await fetch(X_OAUTH_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: params.toString()
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`X token exchange failed: ${res.status} ${errorText}`);
  }

  const data = await res.json();
  // data: { access_token, token_type, expires_in, refresh_token, scope }

  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresIn: data.expires_in, // typically 7200 seconds (2 hours)
    scope: data.scope
  };
}

/**
 * Refresh X access token using refresh token
 */
export async function refreshXToken({ refreshToken, clientId, clientSecret }) {
  const params = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
    client_id: clientId,
    client_secret: clientSecret
  });

  const res = await fetch(X_OAUTH_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: params.toString()
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`X token refresh failed: ${res.status} ${errorText}`);
  }

  const data = await res.json();
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresIn: data.expires_in
  };
}

/**
 * Get authenticated user info from X
 */
export async function getXUserInfo(accessToken) {
  const res = await fetch(`${X_API_BASE}/users/me`, {
    headers: {
      'Authorization': `Bearer ${accessToken}`
    }
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Failed to get X user info: ${res.status} ${errorText}`);
  }

  const data = await res.json();
  // data.data: { id, name, username }
  return data.data;
}

/**
 * Upload media to X (returns media_id)
 * X requires uploading to the Upload API first, not Graph API
 */
export async function uploadXMedia(accessToken, imageBuffer, mediaType = 'image/jpeg') {
  const formData = new FormData();
  const blob = new Blob([imageBuffer], { type: mediaType });
  formData.append('media_data', blob);

  const res = await fetch(X_UPLOAD_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`
    },
    body: formData
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`X media upload failed: ${res.status} ${errorText}`);
  }

  const data = await res.json();
  // data: { media_id, media_key, size, expires_after_secs, image: { image_type, w, h } }
  return data.media_id;
}

/**
 * Post a tweet with text and optional media
 */
export async function postXTweet(accessToken, { text, mediaIds = [] }) {
  const body = {
    text
  };

  if (mediaIds.length > 0) {
    body.media = {
      media_ids: mediaIds
    };
  }

  const res = await fetch(`${X_API_BASE}/tweets`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`X tweet posting failed: ${res.status} ${errorText}`);
  }

  const data = await res.json();
  // data.data: { id, text, edit_history_tweet_ids }
  return data.data;
}
