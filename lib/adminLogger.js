/**
 * Admin Logger Utility
 * Comprehensive logging system for admin operations with structured logging
 */

const LOG_LEVELS = {
  DEBUG: 'DEBUG',
  INFO: 'INFO',
  WARN: 'WARN',
  ERROR: 'ERROR',
  CRITICAL: 'CRITICAL'
};

const LOG_CATEGORIES = {
  USER_MANAGEMENT: 'USER_MANAGEMENT',
  FUNNEL_MANAGEMENT: 'FUNNEL_MANAGEMENT',
  API_OPERATION: 'API_OPERATION',
  DATABASE: 'DATABASE',
  AUTHENTICATION: 'AUTHENTICATION',
  GHL_INTEGRATION: 'GHL_INTEGRATION',
  SYSTEM: 'SYSTEM'
};

class AdminLogger {
  constructor() {
    this.isProduction = process.env.NODE_ENV === 'production';
    this.enabledCategories = this.parseEnabledCategories();
    this.logToConsole = process.env.ADMIN_LOG_CONSOLE !== 'false';
  }

  parseEnabledCategories() {
    const envCategories = process.env.ADMIN_LOG_CATEGORIES;
    if (!envCategories) return Object.values(LOG_CATEGORIES);
    return envCategories.split(',').map(c => c.trim().toUpperCase());
  }

  shouldLog(level, category) {
    if (!this.enabledCategories.includes(category)) return false;
    if (this.isProduction && level === LOG_LEVELS.DEBUG) return false;
    return true;
  }

  formatLogEntry(level, category, message, metadata = {}) {
    return {
      timestamp: new Date().toISOString(),
      level,
      category,
      message,
      metadata: {
        ...metadata,
        environment: process.env.NODE_ENV || 'development',
        nodeVersion: process.version
      }
    };
  }

  log(level, category, message, metadata = {}) {
    if (!this.shouldLog(level, category)) return;

    const logEntry = this.formatLogEntry(level, category, message, metadata);

    // Console output with colors
    if (this.logToConsole) {
      const colors = {
        DEBUG: '\x1b[36m',    // Cyan
        INFO: '\x1b[32m',     // Green
        WARN: '\x1b[33m',     // Yellow
        ERROR: '\x1b[31m',    // Red
        CRITICAL: '\x1b[35m'  // Magenta
      };
      const reset = '\x1b[0m';
      const color = colors[level] || '';

      console.log(
        `${color}[${logEntry.timestamp}] [${level}] [${category}]${reset} ${message}`,
        Object.keys(metadata).length > 0 ? metadata : ''
      );
    }

    // TODO: In production, send to external logging service (e.g., Sentry, LogRocket)
    if (this.isProduction && (level === LOG_LEVELS.ERROR || level === LOG_LEVELS.CRITICAL)) {
      this.sendToExternalService(logEntry);
    }
  }

  // Convenience methods
  debug(category, message, metadata) {
    this.log(LOG_LEVELS.DEBUG, category, message, metadata);
  }

  info(category, message, metadata) {
    this.log(LOG_LEVELS.INFO, category, message, metadata);
  }

  warn(category, message, metadata) {
    this.log(LOG_LEVELS.WARN, category, message, metadata);
  }

  error(category, message, metadata) {
    this.log(LOG_LEVELS.ERROR, category, message, metadata);
  }

  critical(category, message, metadata) {
    this.log(LOG_LEVELS.CRITICAL, category, message, metadata);
  }

  // Special method for API route logging
  logApiRequest(method, path, metadata = {}) {
    this.info(LOG_CATEGORIES.API_OPERATION, `API Request: ${method} ${path}`, {
      method,
      path,
      ...metadata
    });
  }

  logApiResponse(method, path, statusCode, duration, metadata = {}) {
    const level = statusCode >= 500 ? LOG_LEVELS.ERROR :
                  statusCode >= 400 ? LOG_LEVELS.WARN :
                  LOG_LEVELS.INFO;

    this.log(level, LOG_CATEGORIES.API_OPERATION,
      `API Response: ${method} ${path} - ${statusCode}`, {
      method,
      path,
      statusCode,
      duration: `${duration}ms`,
      ...metadata
    });
  }

  // Special method for database operations
  logDatabaseOperation(operation, table, metadata = {}) {
    this.debug(LOG_CATEGORIES.DATABASE, `DB Operation: ${operation} on ${table}`, {
      operation,
      table,
      ...metadata
    });
  }

  // Special method for user actions
  logUserAction(adminUserId, action, targetUserId, changes = {}) {
    this.info(LOG_CATEGORIES.USER_MANAGEMENT,
      `Admin action: ${action} by ${adminUserId} on ${targetUserId}`, {
      adminUserId,
      action,
      targetUserId,
      changes,
      timestamp: new Date().toISOString()
    });
  }

  // Special method for funnel operations
  logFunnelOperation(action, funnelId, userId, metadata = {}) {
    this.info(LOG_CATEGORIES.FUNNEL_MANAGEMENT,
      `Funnel ${action}: ${funnelId} for user ${userId}`, {
      action,
      funnelId,
      userId,
      ...metadata
    });
  }

  // Error wrapper with automatic logging
  async wrapAsync(fn, context, category = LOG_CATEGORIES.SYSTEM) {
    const startTime = Date.now();
    try {
      this.debug(category, `Starting: ${context}`);
      const result = await fn();
      const duration = Date.now() - startTime;
      this.debug(category, `Completed: ${context}`, { duration: `${duration}ms` });
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      this.error(category, `Failed: ${context}`, {
        error: error.message,
        stack: error.stack,
        duration: `${duration}ms`
      });
      throw error;
    }
  }

  // Placeholder for external service integration
  sendToExternalService(logEntry) {
    // TODO: Integrate with Sentry, LogRocket, or custom logging service
    // Example:
    // if (typeof Sentry !== 'undefined') {
    //   Sentry.captureMessage(logEntry.message, {
    //     level: logEntry.level.toLowerCase(),
    //     extra: logEntry.metadata
    //   });
    // }
  }

  // Create a child logger with preset metadata
  child(metadata) {
    const childLogger = Object.create(this);
    childLogger.defaultMetadata = { ...this.defaultMetadata, ...metadata };
    childLogger.log = (level, category, message, additionalMetadata = {}) => {
      return this.log(level, category, message, {
        ...childLogger.defaultMetadata,
        ...additionalMetadata
      });
    };
    return childLogger;
  }
}

// Singleton instance
const adminLogger = new AdminLogger();

// Export both the class and instance
export { adminLogger, AdminLogger, LOG_LEVELS, LOG_CATEGORIES };
export default adminLogger;
