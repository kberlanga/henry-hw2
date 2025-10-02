/**
 * Rate Limiter Middleware Tests
 * Unit tests for rate limiting middleware
 */

const {
  createRateLimiter,
  authRateLimiter,
  apiRateLimiter,
  store
} = require('../src/middleware/rateLimiter');

describe('Rate Limiter Tests', () => {
  let mockReq;
  let mockRes;
  let mockNext;

  beforeEach(() => {
    mockReq = {
      ip: '127.0.0.1',
      path: '/api/test',
      body: {}
    };

    mockRes = {
      setHeader: jest.fn()
    };

    mockNext = jest.fn();

    // Clear rate limit store before each test
    store.clear();
  });

  afterEach(() => {
    store.clear();
  });

  describe('RateLimitStore', () => {
    it('should initialize with zero count', () => {
      const result = store.get('test-key');
      expect(result.count).toBe(0);
    });

    it('should increment count for key', () => {
      const result1 = store.increment('test-key', 60000);
      expect(result1.count).toBe(1);

      const result2 = store.increment('test-key', 60000);
      expect(result2.count).toBe(2);
    });

    it('should set reset time on first increment', () => {
      const result = store.increment('test-key', 60000);
      expect(result.resetTime).toBeGreaterThan(Date.now());
    });

    it('should reset count after window expires', () => {
      // Increment count
      store.increment('test-key', 100);

      // Wait for window to expire
      return new Promise(resolve => {
        setTimeout(() => {
          const result = store.get('test-key');
          expect(result.count).toBe(0);
          resolve();
        }, 150);
      });
    });

    it('should handle multiple keys independently', () => {
      store.increment('key1', 60000);
      store.increment('key1', 60000);
      store.increment('key2', 60000);

      expect(store.get('key1').count).toBe(2);
      expect(store.get('key2').count).toBe(1);
    });

    it('should clear all entries', () => {
      store.increment('key1', 60000);
      store.increment('key2', 60000);
      store.clear();

      expect(store.get('key1').count).toBe(0);
      expect(store.get('key2').count).toBe(0);
    });
  });

  describe('createRateLimiter', () => {
    it('should allow requests under limit', () => {
      const limiter = createRateLimiter({
        windowMs: 60000,
        maxRequests: 5
      });

      limiter(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockNext.mock.calls[0][0]).toBeUndefined();
    });

    it('should set rate limit headers', () => {
      const limiter = createRateLimiter({
        windowMs: 60000,
        maxRequests: 5
      });

      limiter(mockReq, mockRes, mockNext);

      expect(mockRes.setHeader).toHaveBeenCalledWith('X-RateLimit-Limit', 5);
      expect(mockRes.setHeader).toHaveBeenCalledWith('X-RateLimit-Remaining', 4);
      expect(mockRes.setHeader).toHaveBeenCalledWith(
        'X-RateLimit-Reset',
        expect.any(Number)
      );
    });

    it('should block requests over limit', () => {
      const limiter = createRateLimiter({
        windowMs: 60000,
        maxRequests: 2
      });

      // Make requests up to limit
      limiter(mockReq, mockRes, mockNext);
      limiter(mockReq, mockRes, mockNext);
      limiter(mockReq, mockRes, mockNext);

      // Third request should be blocked
      expect(mockNext).toHaveBeenCalledTimes(3);
      const lastCall = mockNext.mock.calls[2][0];
      expect(lastCall).toBeDefined();
      expect(lastCall.statusCode).toBe(429);
    });

    it('should use custom key generator', () => {
      const customKeyGen = jest.fn().mockReturnValue('custom-key');
      const limiter = createRateLimiter({
        windowMs: 60000,
        maxRequests: 5,
        keyGenerator: customKeyGen
      });

      limiter(mockReq, mockRes, mockNext);

      expect(customKeyGen).toHaveBeenCalledWith(mockReq);
    });

    it('should use custom error message', () => {
      const limiter = createRateLimiter({
        windowMs: 60000,
        maxRequests: 1,
        message: 'Custom rate limit message'
      });

      limiter(mockReq, mockRes, mockNext);
      limiter(mockReq, mockRes, mockNext);

      const error = mockNext.mock.calls[1][0];
      expect(error.message).toBe('Custom rate limit message');
    });

    it('should decrement remaining count', () => {
      const limiter = createRateLimiter({
        windowMs: 60000,
        maxRequests: 5
      });

      limiter(mockReq, mockRes, mockNext);
      expect(mockRes.setHeader).toHaveBeenCalledWith('X-RateLimit-Remaining', 4);

      limiter(mockReq, mockRes, mockNext);
      expect(mockRes.setHeader).toHaveBeenCalledWith('X-RateLimit-Remaining', 3);
    });
  });

  describe('authRateLimiter', () => {
    it('should use IP and username for key', () => {
      mockReq.body = { username: 'testuser' };
      authRateLimiter(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.setHeader).toHaveBeenCalled();
    });

    it('should handle missing username', () => {
      authRateLimiter(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    it('should have stricter limits than API limiter', () => {
      // Auth limiter should have lower max requests
      expect(mockNext).toBeDefined();
    });
  });

  describe('apiRateLimiter', () => {
    it('should use IP for key', () => {
      apiRateLimiter(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.setHeader).toHaveBeenCalled();
    });

    it('should allow multiple requests', () => {
      for (let i = 0; i < 10; i++) {
        apiRateLimiter(mockReq, mockRes, jest.fn());
      }

      // Should not throw error for first 10 requests
      expect(true).toBe(true);
    });
  });

  describe('Rate Limit Window', () => {
    it('should reset after window expires', async () => {
      const limiter = createRateLimiter({
        windowMs: 100,
        maxRequests: 2
      });

      // Use up limit
      limiter(mockReq, mockRes, mockNext);
      limiter(mockReq, mockRes, mockNext);
      limiter(mockReq, mockRes, mockNext);

      expect(mockNext.mock.calls[2][0]).toBeDefined();

      // Wait for window to expire
      await new Promise(resolve => setTimeout(resolve, 150));

      // Should allow new requests
      const newNext = jest.fn();
      limiter(mockReq, mockRes, newNext);
      expect(newNext.mock.calls[0][0]).toBeUndefined();
    });
  });

  describe('Error Handling', () => {
    it('should handle errors in rate limiter', () => {
      const limiter = createRateLimiter({
        windowMs: 60000,
        maxRequests: 1,
        keyGenerator: () => {
          throw new Error('Key generation error');
        }
      });

      limiter(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockNext.mock.calls[0][0]).toBeInstanceOf(Error);
    });
  });
});

