/**
 * Post for Me API Client
 * https://api.postforme.dev/docs
 */

const BASE_URL = 'https://api.postforme.dev';

function getHeaders() {
  return {
    'Authorization': `Bearer ${process.env.POSTFORME_API_KEY}`,
    'Content-Type': 'application/json',
  };
}

async function pfmFetch(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: { ...getHeaders(), ...(options.headers || {}) },
  });

  const text = await res.text();
  let data;
  try { data = JSON.parse(text); } catch { data = { error: text }; }

  if (!res.ok) {
    const message = data?.message || data?.error || `PostForMe API error: ${res.status}`;
    const err = new Error(message);
    err.status = res.status;
    err.body = data;
    throw err;
  }

  return data;
}

/**
 * Generate OAuth URL for a user to connect a social account
 * @param {string} platform - 'facebook' | 'instagram' | 'x' | 'tiktok' | 'linkedin' | etc.
 * @param {string} workspaceId - Your user's unique ID (stored as external_id)
 * @returns {{ url: string, platform: string }}
 */
export async function generateAuthUrl(platform, workspaceId) {
  return pfmFetch('/v1/social-accounts/auth-url', {
    method: 'POST',
    body: JSON.stringify({
      platform,
      external_id: workspaceId,
      permissions: ['posts', 'feeds'],
    }),
  });
}

/**
 * List all connected social accounts for a workspace
 * @param {string} workspaceId
 * @returns {Array} accounts
 */
export async function getConnectedAccounts(workspaceId) {
  const params = new URLSearchParams({ external_id: workspaceId, status: 'connected', limit: '50' });
  const data = await pfmFetch(`/v1/social-accounts?${params}`);
  return data.data || [];
}

/**
 * Disconnect a social account
 * @param {string} accountId - PostForMe spc_... ID
 */
export async function disconnectAccount(accountId) {
  return pfmFetch(`/v1/social-accounts/${accountId}/disconnect`, { method: 'POST' });
}

/**
 * Upload an image from a public URL to PostForMe CDN
 * Fetches the image then uploads to the signed S3 URL
 * @param {string} imageUrl - Publicly accessible image URL
 * @returns {string} media_url - PostForMe CDN URL to use in posts
 */
export async function uploadMediaFromUrl(imageUrl) {
  // Step 1: Get signed upload URL
  const { upload_url, media_url } = await pfmFetch('/v1/media/create-upload-url', {
    method: 'POST',
    body: JSON.stringify({}),
  });

  // Step 2: Fetch the image
  const imageRes = await fetch(imageUrl);
  if (!imageRes.ok) throw new Error(`Failed to fetch image: ${imageRes.status}`);
  const contentType = imageRes.headers.get('content-type') || 'image/jpeg';
  const imageBuffer = await imageRes.arrayBuffer();

  // Step 3: PUT to signed S3 URL (no auth header needed)
  const uploadRes = await fetch(upload_url, {
    method: 'PUT',
    headers: { 'Content-Type': contentType },
    body: imageBuffer,
  });
  if (!uploadRes.ok) throw new Error(`Failed to upload to PostForMe: ${uploadRes.status}`);

  return media_url;
}

/**
 * Create a post to one or more platforms
 * @param {Object} params
 * @param {string[]} params.accountIds - PostForMe spc_... IDs
 * @param {string} params.caption - Post caption/text
 * @param {string} [params.mediaUrl] - Image URL (PostForMe CDN or public URL)
 * @param {Object} [params.platformConfigs] - Per-platform overrides
 * @param {string} [params.externalId] - Your DB post ID
 */
export async function createPost({ accountIds, caption, mediaUrl, platformConfigs = {}, externalId }) {
  const body = {
    caption,
    scheduled_at: null,
    social_accounts: accountIds,
    ...(externalId && { external_id: externalId }),
    ...(mediaUrl && { media: [{ url: mediaUrl }] }),
    ...(Object.keys(platformConfigs).length > 0 && { platform_configurations: platformConfigs }),
  };

  return pfmFetch('/v1/social-posts', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

/**
 * Get post results (published URLs, errors per platform)
 * @param {string} postId - PostForMe post ID
 */
export async function getPostResults(postId) {
  const params = new URLSearchParams({ post_id: postId });
  const data = await pfmFetch(`/v1/social-post-results?${params}`);
  return data.data || [];
}
