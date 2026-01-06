/**
 * API Route Logging Middleware
 *
 * Automatically logs all API requests/responses with timing and context
 * Usage: Wrap API routes with this middleware
 */

import { createLogger, measureTime, logRateLimit } from '../logger';
import { checkRateLimit, getIP } from '../security/rateLimit';

/**
 * Wrap API route handler with logging and monitoring
 *
 * @param {Function} handler - The API route handler function
 * @param {Object} options - Configuration options
 * @param {string} options.componentName - Name of the component for logging
 * @param {string} options.rateLimitTier - Rate limit tier: 'strict', 'standard', 'generous'
 * @param {boolean} options.logBody - Whether to log request body (default: false for security)
 * @param {boolean} options.requireAuth - Whether route requires authentication
 */
export function withLogging(handler, options = {}) {
  const {
    componentName = 'API',
    rateLimitTier = null,
    logBody = false,
    requireAuth = false,
  } = options;

  const logger = createLogger(componentName);

  return async function(req, context) {
    const startTime = performance.now();
    const method = req.method;
    const url = new URL(req.url);
    const path = url.pathname;
    const ip = getIP(req);

    // Generate request ID for tracking
    const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Log incoming request
    logger.apiRequest(method, path, {
      requestId,
      ip,
      userAgent: req.headers.get('user-agent'),
      query: Object.fromEntries(url.searchParams),
      ...(logBody && { body: await req.clone().json().catch(() => null) }),
    });

    try {
      // Check rate limit if configured
      if (rateLimitTier) {
        const identifier = context?.userId || ip;
        const rateLimitResult = await checkRateLimit(req, identifier, rateLimitTier);

        logRateLimit(logger, identifier, rateLimitTier, rateLimitResult.success, rateLimitResult.remaining);

        if (!rateLimitResult.success) {
          const duration = performance.now() - startTime;
          logger.securityEvent('Rate limit triggered', 'medium', {
            requestId,
            ip,
            path,
            identifier,
          });

          logger.apiResponse(method, path, 429, duration, {
            requestId,
            rateLimitTriggered: true,
          });

          return new Response(
            JSON.stringify({
              error: 'Too many requests',
              message: 'Rate limit exceeded. Please try again later.',
              requestId,
            }),
            {
              status: 429,
              headers: {
                'Content-Type': 'application/json',
                'Retry-After': '60',
                'X-Request-ID': requestId,
              },
            }
          );
        }
      }

      // Execute the handler
      const response = await measureTime(
        logger,
        `${method} ${path}`,
        () => handler(req, context)
      );

      const duration = performance.now() - startTime;

      // Log successful response
      logger.apiResponse(method, path, response.status, duration, {
        requestId,
      });

      // Add request ID to response headers
      const headers = new Headers(response.headers);
      headers.set('X-Request-ID', requestId);

      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers,
      });

    } catch (error) {
      const duration = performance.now() - startTime;

      // Log error
      logger.apiError(method, path, 500, error, {
        requestId,
        ip,
      });

      // Return error response
      return new Response(
        JSON.stringify({
          error: 'Internal server error',
          message: process.env.NODE_ENV === 'development' ? error.message : 'An unexpected error occurred',
          requestId,
        }),
        {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            'X-Request-ID': requestId,
          },
        }
      );
    }
  };
}

/**
 * Example usage in an API route:
 *
 * import { withLogging } from '@/lib/middleware/loggingMiddleware';
 *
 * async function handler(req, context) {
 *   // Your API logic here
 *   return new Response(JSON.stringify({ success: true }), {
 *     status: 200,
 *     headers: { 'Content-Type': 'application/json' },
 *   });
 * }
 *
 * export const POST = withLogging(handler, {
 *   componentName: 'UserAPI',
 *   rateLimitTier: 'standard',
 *   requireAuth: true,
 * });
 */
