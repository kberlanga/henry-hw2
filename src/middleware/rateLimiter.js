/**
 * Rate Limiting Middleware
 * Prevents brute force attacks and API abuse
 * Follows Single Responsibility Principle: Only handles rate limiting
 */

const config = require('../config/env.config');
const logger = require('../utils/logger');
const { RateLimitError } = require('../utils/errors');

/**
 * In-memory store for rate limiting
 * In production, use Redis for distributed rate limiting
 */
class RateLimitStore {
  constructor() {
    this.store = new Map();
    this.cleanupInterval = setInterval(() => this.cleanup(), 60000); // Cleanup every minute
  }

  /**
   * Get current count for a key
   */
  get(key) {
    const record = this.store.get(key);
    if (!record) return { count: 0, resetTime: Date.now() };

    // Reset if window expired
    if (Date.now() > record.resetTime) {
      this.store.delete(key);
      return { count: 0, resetTime: Date.now() };
    }

    return record;
  }

  /**
   * Increment counter for a key
   */
  increment(key, windowMs) {
    const record = this.get(key);
    const resetTime = record.count === 0 ? Date.now() + windowMs : record.resetTime;

    this.store.set(key, {
      count: record.count + 1,
      resetTime
    });

    return { count: record.count + 1, resetTime };
  }

  /**
   * Cleanup expired entries
   */
  cleanup() {
    const now = Date.now();
    for (const [key, record] of this.store.entries()) {
      if (now > record.resetTime) {
        this.store.delete(key);
      }
    }
  }

  /**
   * Clear all entries
   */
  clear() {
    this.store.clear();
  }
}

const store = new RateLimitStore();

/**
 * Create rate limiter middleware
 */
const createRateLimiter = (options = {}) => {
  const {
    windowMs = config.rateLimit.windowMs,
    maxRequests = config.rateLimit.maxRequests,
    message = 'Too many requests, please try again later',
    keyGenerator = (req) => req.ip
  } = options;

  return (req, res, next) => {
    try {
      const key = keyGenerator(req);
      const { count, resetTime } = store.increment(key, windowMs);

      // Set rate limit headers
      res.setHeader('X-RateLimit-Limit', maxRequests);
      res.setHeader('X-RateLimit-Remaining', Math.max(0, maxRequests - count));
      res.setHeader('X-RateLimit-Reset', Math.ceil(resetTime / 1000));

      if (count > maxRequests) {
        logger.logSecurityEvent('Rate limit exceeded', {
          ip: req.ip,
          path: req.path,
          count
        });

        throw new RateLimitError(message);
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Strict rate limiter for authentication endpoints
 */
const authRateLimiter = createRateLimiter({
  windowMs: config.rateLimit.authWindowMs,
  maxRequests: config.rateLimit.authMaxRequests,
  message: 'Too many login attempts, please try again later',
  keyGenerator: (req) => {
    // Rate limit by IP and username combination for auth endpoints
    const username = req.body?.username || 'unknown';
    return `auth:${req.ip}:${username}`;
  }
});

/**
 * General API rate limiter
 */
const apiRateLimiter = createRateLimiter({
  windowMs: config.rateLimit.windowMs,
  maxRequests: config.rateLimit.maxRequests
});

module.exports = {
  createRateLimiter,
  authRateLimiter,
  apiRateLimiter,
  store // Export for testing
};

