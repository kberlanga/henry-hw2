/* eslint-disable no-console */
/**
 * Logger Utility
 * Centralized logging with different levels
 * Follows Single Responsibility Principle: Only handles logging
 */

const config = require('../config/env.config');

const LOG_LEVELS = {
  ERROR: 'ERROR',
  WARN: 'WARN',
  INFO: 'INFO',
  DEBUG: 'DEBUG'
};

class Logger {
  constructor() {
    this.level = config.logging.level.toUpperCase();
    this.format = config.logging.format;
  }

  /**
   * Format log message based on configuration
   */
  formatMessage(level, message, meta = {}) {
    const timestamp = new Date().toISOString();
    const logData = {
      timestamp,
      level,
      message,
      ...meta
    };

    if (this.format === 'json') {
      return JSON.stringify(logData);
    }

    // Pretty format for development
    return `[${timestamp}] ${level}: ${message} ${
      Object.keys(meta).length > 0 ? JSON.stringify(meta) : ''
    }`;
  }

  /**
   * Check if log level should be logged
   */
  shouldLog(level) {
    const levels = Object.keys(LOG_LEVELS);
    const currentLevelIndex = levels.indexOf(this.level);
    const messageLevelIndex = levels.indexOf(level);
    return messageLevelIndex <= currentLevelIndex;
  }

  /**
   * Log error message
   */
  error(message, meta = {}) {
    if (this.shouldLog(LOG_LEVELS.ERROR)) {
      console.error(this.formatMessage(LOG_LEVELS.ERROR, message, meta));
    }
  }

  /**
   * Log warning message
   */
  warn(message, meta = {}) {
    if (this.shouldLog(LOG_LEVELS.WARN)) {
      console.warn(this.formatMessage(LOG_LEVELS.WARN, message, meta));
    }
  }

  /**
   * Log info message
   */
  info(message, meta = {}) {
    if (this.shouldLog(LOG_LEVELS.INFO)) {
      console.log(this.formatMessage(LOG_LEVELS.INFO, message, meta));
    }
  }

  /**
   * Log debug message
   */
  debug(message, meta = {}) {
    if (this.shouldLog(LOG_LEVELS.DEBUG)) {
      console.log(this.formatMessage(LOG_LEVELS.DEBUG, message, meta));
    }
  }

  /**
   * Log HTTP request
   */
  logRequest(req) {
    this.info('HTTP Request', {
      method: req.method,
      url: req.url,
      ip: req.ip,
      userAgent: req.get('user-agent')
    });
  }

  /**
   * Log security event
   */
  logSecurityEvent(event, details = {}) {
    this.warn('Security Event', {
      event,
      ...details
    });
  }
}

// Export singleton instance
module.exports = new Logger();

