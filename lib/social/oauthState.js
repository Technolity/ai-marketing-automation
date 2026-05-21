/**
 * OAuth State Management
 * Generates and validates CSRF protection state tokens
 * Format: {randomHex}.{workspaceId}.{platform}
 */

import crypto from 'crypto';

/**
 * Generate OAuth state with CSRF protection
 * Format: randomHex.userId.workspaceId.platform
 */
export function generateOAuthState(userId, workspaceId, platform) {
  const randomHex = crypto.randomBytes(16).toString('hex');
  return `${randomHex}.${userId}.${workspaceId}.${platform}`;
}

/**
 * Parse OAuth state and validate format
 */
export function parseOAuthState(state) {
  const parts = state.split('.');
  if (parts.length !== 4) {
    throw new Error('Invalid OAuth state format');
  }

  const [randomHex, userId, workspaceId, platform] = parts;
  if (!randomHex || !userId || !workspaceId || !platform) {
    throw new Error('Invalid OAuth state: missing parts');
  }

  return { randomHex, userId, workspaceId, platform };
}

/**
 * Create OAuth state cookie
 */
export function createOAuthStateCookie(state) {
  return {
    name: 'oauth_state',
    value: state,
    options: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 60 // 30 minutes
    }
  };
}

/**
 * Extract state from request cookies
 * Reads 'oauth_state' cookie
 */
export function extractOAuthStateFromCookie(cookieHeader) {
  if (!cookieHeader) return null;

  const cookies = cookieHeader.split(';').map(c => c.trim());
  for (const cookie of cookies) {
    const [name, value] = cookie.split('=');
    if (name === 'oauth_state') {
      return decodeURIComponent(value);
    }
  }

  return null;
}
