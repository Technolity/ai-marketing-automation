/**
 * API Security Helpers
 *
 * Provides reusable security utilities for API routes
 */

import { NextResponse } from 'next/server';
import { checkRateLimit, getIP, getRateLimitHeaders, createRateLimitResponse } from './rateLimit';
import { auth } from '@clerk/nextjs';

/**
 * Secure API handler wrapper
 * Adds authentication, rate limiting, and error handling
 *
 * @param {Function} handler - Async function to handle the request
 * @param {Object} options - Configuration options
 * @param {boolean} options.requireAuth - Require authentication (default: true)
 * @param {boolean} options.requireAdmin - Require admin privileges (default: false)
 * @param {string} options.rateLimit - Rate limit tier: 'strict', 'standard', 'generous' (default: 'standard')
 * @param {Array<string>} options.allowedMethods - Allowed HTTP methods (default: all)
 */
export function secureApiRoute(handler, options = {}) {
  const {
    requireAuth = true,
    requireAdmin = false,
    rateLimit = 'standard',
    allowedMethods = null,
  } = options;

  return async (request, context) => {
    try {
      // 1. Method validation
      if (allowedMethods && !allowedMethods.includes(request.method)) {
        return NextResponse.json(
          { error: `Method ${request.method} not allowed` },
          { status: 405, headers: { 'Allow': allowedMethods.join(', ') } }
        );
      }

      // 2. Authentication
      let userId = null;
      let isAdmin = false;

      if (requireAuth || requireAdmin) {
        const authResult = auth();
        userId = authResult.userId;

        if (!userId) {
          return NextResponse.json(
            { error: 'Unauthorized', message: 'Authentication required' },
            { status: 401 }
          );
        }

        // Check admin if required
        if (requireAdmin) {
          const { verifyAdmin } = await import('../adminAuth');
          isAdmin = await verifyAdmin(userId);

          if (!isAdmin) {
            return NextResponse.json(
              { error: 'Forbidden', message: 'Admin privileges required' },
              { status: 403 }
            );
          }
        }
      }

      // 3. Rate limiting
      const identifier = userId || getIP(request);
      const rateLimitResult = await checkRateLimit(request, identifier, rateLimit);

      if (!rateLimitResult.success) {
        return createRateLimitResponse();
      }

      // 4. Execute handler
      const response = await handler(request, { ...context, userId, isAdmin });

      // 5. Add rate limit headers to response
      if (response instanceof NextResponse) {
        const headers = getRateLimitHeaders(rateLimitResult);
        Object.entries(headers).forEach(([key, value]) => {
          response.headers.set(key, value);
        });
      }

      return response;

    } catch (error) {
      console.error('API Error:', error);

      // Don't expose internal errors in production
      const isDev = process.env.NODE_ENV === 'development';

      return NextResponse.json(
        {
          error: 'Internal server error',
          message: isDev ? error.message : 'An unexpected error occurred',
          ...(isDev && { stack: error.stack })
        },
        { status: 500 }
      );
    }
  };
}

/**
 * Validate request body against a schema
 *
 * @param {Request} request - Next.js request object
 * @param {Object} schema - Zod schema for validation
 * @returns {Promise<Object>} Parsed and validated data
 * @throws {Error} Validation error with details
 */
export async function validateRequestBody(request, schema) {
  try {
    const body = await request.json();
    return schema.parse(body);
  } catch (error) {
    if (error.name === 'ZodError') {
      throw new ValidationError('Invalid request body', error.errors);
    }
    throw error;
  }
}

/**
 * Custom validation error
 */
export class ValidationError extends Error {
  constructor(message, errors = []) {
    super(message);
    this.name = 'ValidationError';
    this.errors = errors;
    this.statusCode = 400;
  }
}

/**
 * Sanitize error message for client
 * Removes sensitive information from error messages
 */
export function sanitizeError(error) {
  // List of patterns that might contain sensitive info
  const sensitivePatterns = [
    /password/i,
    /token/i,
    /key/i,
    /secret/i,
    /credential/i,
    /ECONNREFUSED/,
    /ETIMEDOUT/,
  ];

  let message = error.message || 'An error occurred';

  // Check if error message contains sensitive info
  const containsSensitiveInfo = sensitivePatterns.some(pattern => pattern.test(message));

  if (containsSensitiveInfo || process.env.NODE_ENV === 'production') {
    return 'An error occurred while processing your request';
  }

  return message;
}

/**
 * Create standardized error response
 */
export function createErrorResponse(error, statusCode = 500) {
  const isDev = process.env.NODE_ENV === 'development';

  return NextResponse.json(
    {
      error: error.name || 'Error',
      message: sanitizeError(error),
      ...(isDev && { details: error.message, stack: error.stack }),
      ...(error instanceof ValidationError && { validationErrors: error.errors }),
    },
    { status: error.statusCode || statusCode }
  );
}

/**
 * Parse and validate query parameters
 */
export function getQueryParams(request, schema) {
  const { searchParams } = new URL(request.url);
  const params = Object.fromEntries(searchParams);

  try {
    return schema.parse(params);
  } catch (error) {
    throw new ValidationError('Invalid query parameters', error.errors);
  }
}

/**
 * Check if request is from same origin
 */
export function isSameOrigin(request) {
  const origin = request.headers.get('origin');
  const host = request.headers.get('host');

  if (!origin) return true; // Same-origin requests don't send Origin header

  const allowedOrigins = [
    process.env.NEXT_PUBLIC_APP_URL,
    `https://${host}`,
    `http://${host}`, // For local development
  ].filter(Boolean);

  return allowedOrigins.some(allowed => origin === allowed || origin.endsWith(allowed));
}
