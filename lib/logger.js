/**
 * Centralized Logging Utility for TedOS
 *
 * Provides structured logging with levels, timestamps, context, and performance tracking
 * Supports integration with external monitoring services (Sentry, LogRocket, etc.)
 */

// Log levels
export const LogLevel = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
  CRITICAL: 4,
};

// Current log level (set via environment variable)
const CURRENT_LOG_LEVEL = process.env.LOG_LEVEL
  ? LogLevel[process.env.LOG_LEVEL.toUpperCase()]
  : LogLevel.INFO;

// Enable colors in development
const COLORS = {
  DEBUG: '\x1b[36m',    // Cyan
  INFO: '\x1b[32m',     // Green
  WARN: '\x1b[33m',     // Yellow
  ERROR: '\x1b[31m',    // Red
  CRITICAL: '\x1b[35m', // Magenta
  RESET: '\x1b[0m',
};

/**
 * Format timestamp in ISO 8601 format
 */
function getTimestamp() {
  return new Date().toISOString();
}

/**
 * Format log message with context
 */
function formatMessage(level, message, context = {}, performance = null) {
  const timestamp = getTimestamp();
  const levelName = Object.keys(LogLevel).find(key => LogLevel[key] === level);

  const logObject = {
    timestamp,
    level: levelName,
    message,
    ...context,
  };

  if (performance) {
    logObject.performance = performance;
  }

  // Add environment info
  logObject.env = process.env.NODE_ENV;

  return logObject;
}

/**
 * Pretty print log for console (development)
 */
function prettyPrint(level, message, context = {}, performance = null) {
  const levelName = Object.keys(LogLevel).find(key => LogLevel[key] === level);
  const color = COLORS[levelName] || COLORS.RESET;
  const timestamp = new Date().toLocaleTimeString();

  let output = `${color}[${timestamp}] [${levelName}]${COLORS.RESET} ${message}`;

  if (Object.keys(context).length > 0) {
    output += `\n  Context: ${JSON.stringify(context, null, 2)}`;
  }

  if (performance) {
    output += `\n  Performance: ${JSON.stringify(performance, null, 2)}`;
  }

  return output;
}

/**
 * Send log to external service (production)
 */
function sendToExternalService(logObject) {
  // TODO: Integrate with Sentry, LogRocket, or other monitoring service
  // Example:
  // if (process.env.SENTRY_DSN) {
  //   Sentry.captureMessage(logObject.message, {
  //     level: logObject.level.toLowerCase(),
  //     extra: logObject,
  //   });
  // }
}

/**
 * Core logging function
 */
function log(level, message, context = {}, performance = null) {
  // Skip if below current log level
  if (level < CURRENT_LOG_LEVEL) {
    return;
  }

  const logObject = formatMessage(level, message, context, performance);

  // Console output
  if (process.env.NODE_ENV === 'development') {
    console.log(prettyPrint(level, message, context, performance));
  } else {
    // Production: JSON structured logs
    console.log(JSON.stringify(logObject));
  }

  // Send critical errors to external service
  if (level >= LogLevel.ERROR && process.env.NODE_ENV === 'production') {
    sendToExternalService(logObject);
  }
}

/**
 * Logger class with helper methods
 */
export class Logger {
  constructor(component) {
    this.component = component;
  }

  /**
   * Debug level - detailed information for debugging
   */
  debug(message, context = {}) {
    log(LogLevel.DEBUG, message, { component: this.component, ...context });
  }

  /**
   * Info level - general informational messages
   */
  info(message, context = {}) {
    log(LogLevel.INFO, message, { component: this.component, ...context });
  }

  /**
   * Warn level - warning messages that don't stop execution
   */
  warn(message, context = {}) {
    log(LogLevel.WARN, message, { component: this.component, ...context });
  }

  /**
   * Error level - error conditions
   */
  error(message, error = null, context = {}) {
    const errorContext = {
      component: this.component,
      ...context,
    };

    if (error instanceof Error) {
      errorContext.error = {
        name: error.name,
        message: error.message,
        stack: error.stack,
      };
    } else if (error) {
      errorContext.error = error;
    }

    log(LogLevel.ERROR, message, errorContext);
  }

  /**
   * Critical level - critical errors that need immediate attention
   */
  critical(message, error = null, context = {}) {
    const errorContext = {
      component: this.component,
      ...context,
    };

    if (error instanceof Error) {
      errorContext.error = {
        name: error.name,
        message: error.message,
        stack: error.stack,
      };
    } else if (error) {
      errorContext.error = error;
    }

    log(LogLevel.CRITICAL, message, errorContext);
  }

  /**
   * Log API request
   */
  apiRequest(method, path, context = {}) {
    this.info(`API Request: ${method} ${path}`, {
      method,
      path,
      ...context,
    });
  }

  /**
   * Log API response
   */
  apiResponse(method, path, statusCode, duration, context = {}) {
    this.info(`API Response: ${method} ${path}`, {
      method,
      path,
      statusCode,
      ...context,
    }, {
      duration: `${duration}ms`,
    });
  }

  /**
   * Log API error
   */
  apiError(method, path, statusCode, error, context = {}) {
    this.error(`API Error: ${method} ${path}`, error, {
      method,
      path,
      statusCode,
      ...context,
    });
  }

  /**
   * Log database query
   */
  dbQuery(query, duration = null, context = {}) {
    const performance = duration ? { queryTime: `${duration}ms` } : null;
    this.debug(`DB Query: ${query}`, context, performance);
  }

  /**
   * Log database error
   */
  dbError(query, error, context = {}) {
    this.error(`DB Error: ${query}`, error, context);
  }

  /**
   * Log user action
   */
  userAction(userId, action, context = {}) {
    this.info(`User Action: ${action}`, {
      userId,
      action,
      ...context,
    });
  }

  /**
   * Log security event
   */
  securityEvent(event, severity = 'medium', context = {}) {
    const level = severity === 'critical' ? LogLevel.CRITICAL :
                  severity === 'high' ? LogLevel.ERROR :
                  severity === 'medium' ? LogLevel.WARN :
                  LogLevel.INFO;

    log(level, `Security Event: ${event}`, {
      component: this.component,
      eventType: 'security',
      severity,
      ...context,
    });
  }

  /**
   * Log performance metric
   */
  performance(metric, value, context = {}) {
    this.info(`Performance: ${metric}`, context, {
      [metric]: value,
    });
  }
}

/**
 * Create a logger instance for a specific component
 */
export function createLogger(componentName) {
  return new Logger(componentName);
}

/**
 * Performance tracking decorator
 */
export function trackPerformance(logger, operationName) {
  return async function(target, propertyKey, descriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function(...args) {
      const startTime = performance.now();

      try {
        const result = await originalMethod.apply(this, args);
        const duration = performance.now() - startTime;

        logger.performance(operationName, `${duration.toFixed(2)}ms`);

        return result;
      } catch (error) {
        const duration = performance.now() - startTime;
        logger.error(`${operationName} failed after ${duration.toFixed(2)}ms`, error);
        throw error;
      }
    };

    return descriptor;
  };
}

/**
 * Measure function execution time
 */
export async function measureTime(logger, operationName, fn) {
  const startTime = performance.now();

  try {
    const result = await fn();
    const duration = performance.now() - startTime;

    logger.performance(operationName, `${duration.toFixed(2)}ms`);

    return result;
  } catch (error) {
    const duration = performance.now() - startTime;
    logger.error(`${operationName} failed after ${duration.toFixed(2)}ms`, error);
    throw error;
  }
}

/**
 * Log rate limit event
 */
export function logRateLimit(logger, identifier, tier, success, remaining) {
  if (!success) {
    logger.securityEvent('Rate limit exceeded', 'medium', {
      identifier,
      tier,
      remaining: 0,
    });
  } else if (remaining < 5) {
    logger.warn('Rate limit warning', {
      identifier,
      tier,
      remaining,
    });
  }
}

// Export default logger for quick access
export default {
  createLogger,
  LogLevel,
  Logger,
  measureTime,
  trackPerformance,
  logRateLimit,
};
