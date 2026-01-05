/**
 * Environment Variable Validation
 *
 * Validates required environment variables on startup to fail fast
 * if configuration is missing.
 */

const requiredEnvVars = [
  // Supabase
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',

  // Clerk Authentication
  'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY',
  'CLERK_SECRET_KEY',
  'CLERK_WEBHOOK_SECRET',

  // Application
  'NEXT_PUBLIC_APP_URL',
];

const optionalButRecommended = [
  // AI Providers (at least one required)
  'OPENAI_API_KEY',
  'ANTHROPIC_API_KEY',
  'GEMINI_API_KEY',

  // GoHighLevel
  'GHL_API_KEY',
  'GHL_LOCATION_ID',

  // Cloudinary
  'CLOUDINARY_CLOUD_NAME',
  'CLOUDINARY_API_KEY',
  'CLOUDINARY_API_SECRET',

  // Rate Limiting (recommended for production)
  'UPSTASH_REDIS_REST_URL',
  'UPSTASH_REDIS_REST_TOKEN',
];

/**
 * Validate environment variables
 * @param {boolean} strict - If true, throw error on missing vars. If false, just warn.
 */
export function validateEnv(strict = false) {
  const missing = [];
  const warnings = [];

  // Check required variables
  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      missing.push(envVar);
    }
  }

  // Check AI provider (at least one required)
  const hasAIProvider =
    process.env.OPENAI_API_KEY ||
    process.env.ANTHROPIC_API_KEY ||
    process.env.GEMINI_API_KEY;

  if (!hasAIProvider) {
    missing.push('At least one AI provider key (OPENAI_API_KEY, ANTHROPIC_API_KEY, or GEMINI_API_KEY)');
  }

  // Check optional but recommended
  for (const envVar of optionalButRecommended) {
    if (!process.env[envVar]) {
      warnings.push(envVar);
    }
  }

  // Report missing required variables
  if (missing.length > 0) {
    const message = `Missing required environment variables:\n${missing.map(v => `  - ${v}`).join('\n')}`;

    if (strict) {
      throw new Error(message);
    } else {
      console.error('❌', message);
    }
  }

  // Report optional warnings
  if (warnings.length > 0 && process.env.NODE_ENV === 'production') {
    console.warn('⚠️  Missing recommended environment variables for production:');
    warnings.forEach(v => console.warn(`  - ${v}`));
  }

  // Validate URLs
  if (process.env.NEXT_PUBLIC_SUPABASE_URL && !isValidUrl(process.env.NEXT_PUBLIC_SUPABASE_URL)) {
    console.error('❌ Invalid NEXT_PUBLIC_SUPABASE_URL format');
  }

  if (process.env.NEXT_PUBLIC_APP_URL && !isValidUrl(process.env.NEXT_PUBLIC_APP_URL)) {
    console.error('❌ Invalid NEXT_PUBLIC_APP_URL format');
  }

  // Security checks
  if (process.env.NODE_ENV === 'production') {
    if (process.env.NEXT_PUBLIC_DEV_MODE === 'true') {
      console.error('❌ CRITICAL: NEXT_PUBLIC_DEV_MODE is enabled in production! This bypasses authentication.');
    }

    if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
      console.warn('⚠️  No Redis configured. Using in-memory rate limiting (not recommended for production).');
    }
  }

  return {
    valid: missing.length === 0,
    missing,
    warnings,
  };
}

function isValidUrl(string) {
  try {
    new URL(string);
    return true;
  } catch (_) {
    return false;
  }
}

// Auto-validate on import (non-strict)
if (typeof window === 'undefined') {
  // Only run on server side
  validateEnv(false);
}
