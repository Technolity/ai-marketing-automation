/**
 * Rate Limiting Utility
 *
 * Provides request rate limiting to prevent abuse and DoS attacks.
 * Uses in-memory storage by default, can be upgraded to Redis for production.
 */

import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// In-memory fallback for development/testing
class MemoryStore {
  constructor() {
    this.hits = new Map();
  }

  async limit(identifier, { rate, interval }) {
    const now = Date.now();
    const key = `${identifier}:${Math.floor(now / interval)}`;

    const current = this.hits.get(key) || 0;

    // Clean up old entries
    for (const [k, v] of this.hits.entries()) {
      const keyTime = parseInt(k.split(':')[1]) * interval;
      if (now - keyTime > interval * 2) {
        this.hits.delete(k);
      }
    }

    if (current >= rate) {
      return {
        success: false,
        limit: rate,
        remaining: 0,
        reset: Math.floor((Math.floor(now / interval) + 1) * interval / 1000),
        pending: Promise.resolve()
      };
    }

    this.hits.set(key, current + 1);

    return {
      success: true,
      limit: rate,
      remaining: rate - current - 1,
      reset: Math.floor((Math.floor(now / interval) + 1) * interval / 1000),
      pending: Promise.resolve()
    };
  }
}

// Initialize rate limiter based on environment
let rateLimiter;

if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
  // Production: Use Upstash Redis
  const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  });

  rateLimiter = {
    // Strict limit for sensitive operations (10 req/min)
    strict: new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(10, '1 m'),
      analytics: true,
      prefix: '@ratelimit/strict',
    }),

    // Standard limit for API routes (60 req/min)
    standard: new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(60, '1 m'),
      analytics: true,
      prefix: '@ratelimit/standard',
    }),

    // Generous limit for read operations (120 req/min)
    generous: new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(120, '1 m'),
      analytics: true,
      prefix: '@ratelimit/generous',
    }),
  };
} else {
  // Development/Fallback: Use in-memory storage
  console.warn('⚠️  Using in-memory rate limiting. Configure UPSTASH_REDIS_REST_URL for production.');

  const memoryStore = new MemoryStore();

  rateLimiter = {
    strict: {
      limit: (id) => memoryStore.limit(id, { rate: 10, interval: 60000 })
    },
    standard: {
      limit: (id) => memoryStore.limit(id, { rate: 60, interval: 60000 })
    },
    generous: {
      limit: (id) => memoryStore.limit(id, { rate: 120, interval: 60000 })
    },
  };
}

/**
 * Get IP address from request
 */
export function getIP(request) {
  const xff = request.headers.get('x-forwarded-for');
  return xff ? xff.split(',')[0].trim() :
         request.headers.get('x-real-ip') ||
         'unknown';
}

/**
 * Rate limit middleware
 * @param {Request} request - Next.js request object
 * @param {string} identifier - Unique identifier (userId or IP)
 * @param {string} tier - Rate limit tier: 'strict', 'standard', or 'generous'
 */
export async function checkRateLimit(request, identifier, tier = 'standard') {
  const limiter = rateLimiter[tier];

  if (!limiter) {
    console.error(`Invalid rate limit tier: ${tier}`);
    return { success: true };
  }

  try {
    const result = await limiter.limit(identifier);
    return result;
  } catch (error) {
    console.error('Rate limit check failed:', error);
    // Fail open to prevent blocking legitimate users if rate limiter fails
    return { success: true };
  }
}

/**
 * Create rate limit response headers
 */
export function getRateLimitHeaders(result) {
  return {
    'X-RateLimit-Limit': result.limit?.toString() || '60',
    'X-RateLimit-Remaining': result.remaining?.toString() || '0',
    'X-RateLimit-Reset': result.reset?.toString() || '0',
  };
}

/**
 * Helper to create rate limit exceeded response
 */
export function createRateLimitResponse() {
  return new Response(
    JSON.stringify({
      error: 'Too many requests',
      message: 'Rate limit exceeded. Please try again later.'
    }),
    {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'Retry-After': '60',
      }
    }
  );
}

export default rateLimiter;
