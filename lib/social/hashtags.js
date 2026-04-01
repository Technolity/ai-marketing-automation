/**
 * Hashtag Generation — powered by Claude
 *
 * Generates platform-optimised hashtags and builds final caption strings
 * with platform-specific formatting rules.
 */

import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic();

// Simple in-process cache (cleared on cold start — acceptable for a SaaS)
const _cache = new Map();

const PLATFORM_RULES = {
  twitter:   { count: '1–2',   reason: 'Twitter users dislike hashtag spam' },
  instagram: { count: '15–20', reason: 'Instagram algorithm rewards hashtag density' },
  facebook:  { count: '3–5',   reason: 'moderate usage works best on Facebook' },
};

/**
 * Generates hashtags for a specific platform using Claude.
 * Results are cached by (platform + description) to avoid redundant API calls.
 *
 * @param {string} imageDescription - Short description / caption snippet (first ~200 chars)
 * @param {'twitter'|'instagram'|'facebook'} platform
 * @returns {Promise<string>} Space-separated hashtags, e.g. "#marketing #growth"
 */
export async function generateHashtags(imageDescription, platform) {
  const cacheKey = `${platform}:${imageDescription.slice(0, 150)}`;
  if (_cache.has(cacheKey)) return _cache.get(cacheKey);

  const rule = PLATFORM_RULES[platform] || PLATFORM_RULES.facebook;

  try {
    const msg = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 120,
      messages: [{
        role: 'user',
        content:
          `Generate hashtags for a ${platform} marketing post about: "${imageDescription}"\n` +
          `Use exactly ${rule.count} hashtags because ${rule.reason}.\n` +
          `Return ONLY the hashtags separated by spaces (e.g. #marketing #growth). No explanation.`,
      }],
    });

    const hashtags = msg.content[0]?.text?.trim() || '';
    _cache.set(cacheKey, hashtags);
    return hashtags;
  } catch {
    // Graceful fallback — don't break posting if Claude is unavailable
    const fallbacks = {
      twitter:   '#marketing #business',
      instagram: '#marketing #business #success #motivation #entrepreneur #growth #digitalmarketing #branding #socialmedia #contentcreator',
      facebook:  '#marketing #business #growth',
    };
    return fallbacks[platform] || '#marketing';
  }
}

/**
 * Generates hashtags for multiple platforms in parallel.
 * @param {string} imageDescription
 * @param {string[]} platforms
 * @returns {Promise<Record<string, string>>} { twitter: "...", instagram: "...", ... }
 */
export async function generateHashtagsForPlatforms(imageDescription, platforms) {
  const entries = await Promise.all(
    platforms.map(async p => [p, await generateHashtags(imageDescription, p)])
  );
  return Object.fromEntries(entries);
}

/**
 * Appends hashtags to a caption with platform-specific formatting.
 *
 * Twitter  → hashtags on same line, truncated to 280 chars total
 * Instagram → hashtags on a new paragraph after caption
 * Facebook  → hashtags on a new line after caption
 *
 * @param {string} caption
 * @param {string} hashtags  - Space-separated hashtag string
 * @param {'twitter'|'instagram'|'facebook'} platform
 * @returns {string}
 */
export function buildCaptionWithHashtags(caption, hashtags, platform) {
  if (!hashtags?.trim()) return caption;
  const trimmedCaption = caption.trim();

  switch (platform) {
    case 'twitter': {
      const combined = `${trimmedCaption} ${hashtags}`;
      if (combined.length <= 280) return combined;
      // Truncate caption to fit hashtags within 280 chars
      const maxCaptionLen = 280 - hashtags.length - 4; // 4 = " …" + space
      return `${trimmedCaption.slice(0, maxCaptionLen).trim()}… ${hashtags}`;
    }
    case 'instagram':
      return `${trimmedCaption}\n\n${hashtags}`;
    case 'facebook':
    default:
      return `${trimmedCaption}\n\n${hashtags}`;
  }
}

/** Platform character limits */
export const PLATFORM_LIMITS = {
  twitter:   280,
  instagram: 2200,
  facebook:  63206,
};
