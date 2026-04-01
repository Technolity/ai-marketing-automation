/**
 * Buffer API Client
 *
 * Thin wrapper around the Buffer v1 REST API.
 * All functions throw errors with a `.status` property on HTTP failures
 * so callers can distinguish 401 (token expired) from 429 (rate limit), etc.
 */

const BUFFER_BASE = 'https://api.bufferapp.com/1';

/** Structured error with HTTP status attached */
function bufferError(status, message) {
  const err = new Error(message);
  err.status = status;
  return err;
}

/**
 * Returns all social profiles connected to the Buffer account.
 * @param {string} accessToken
 * @returns {Promise<Array>} Array of Buffer profile objects
 */
export async function getBufferProfiles(accessToken) {
  const res = await fetch(`${BUFFER_BASE}/profiles.json?access_token=${encodeURIComponent(accessToken)}`);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw bufferError(res.status, body.error || `Buffer profiles fetch failed (${res.status})`);
  }
  return res.json();
}

/**
 * Creates and optionally publishes a post across multiple Buffer profiles.
 *
 * @param {object} options
 * @param {string}   options.accessToken
 * @param {string[]} options.profileIds   - Buffer profile IDs to post to
 * @param {string}   options.text         - Caption / copy
 * @param {string}   options.mediaUrl     - Public image URL
 * @param {string|null} options.scheduleAt - ISO date string for scheduling, null = post now
 * @returns {Promise<object>} Buffer API response
 */
export async function createBufferPost({ accessToken, profileIds, text, mediaUrl, scheduleAt }) {
  // Buffer v1 accepts form-encoded body
  const params = new URLSearchParams();
  params.append('access_token', accessToken);
  profileIds.forEach(id => params.append('profile_ids[]', id));
  params.append('text', text);
  params.append('media[link]', mediaUrl);
  params.append('media[photo]', mediaUrl);

  if (scheduleAt) {
    params.append('scheduled_at', new Date(scheduleAt).toISOString());
  } else {
    params.append('now', 'true');
  }

  const res = await fetch(`${BUFFER_BASE}/updates/create.json`, {
    method: 'POST',
    body: params,
  });

  const body = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw bufferError(res.status, body.message || body.error || `Buffer post failed (${res.status})`);
  }

  // Buffer returns { success, updates: [...] } or { success, id }
  return body;
}

/**
 * Fetches a single Buffer update (post) with its statistics.
 * @param {string} bufferId
 * @param {string} accessToken
 * @returns {Promise<object>} Buffer update object with `.statistics`
 */
export async function getBufferPost(bufferId, accessToken) {
  const res = await fetch(
    `${BUFFER_BASE}/updates/${encodeURIComponent(bufferId)}.json?access_token=${encodeURIComponent(accessToken)}`
  );
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw bufferError(res.status, body.error || `Buffer update fetch failed (${res.status})`);
  }
  return res.json();
}

/**
 * Extracts normalised metrics from a Buffer update response.
 * Returns safe defaults (0) for any missing fields.
 * @param {object} bufferUpdate - Raw response from getBufferPost()
 * @returns {{ likes, comments, shares, views, reaches, linkClicks, engagementRate, ctr }}
 */
export function extractMetrics(bufferUpdate) {
  const stats        = bufferUpdate?.statistics || {};
  const interactions = stats.interactions || {};
  const likes        = interactions.likes    || 0;
  const comments     = interactions.comments || 0;
  const shares       = interactions.shares   || 0;
  const views        = stats.impressions     || 0;
  const reaches      = stats.reach           || 0;
  const linkClicks   = stats.clicks          || 0;

  const engagementRate = views > 0 ? ((likes + comments + shares) / views) * 100 : 0;
  const ctr            = views > 0 ? (linkClicks / views) * 100 : 0;

  return { likes, comments, shares, views, reaches, linkClicks, engagementRate, ctr };
}
