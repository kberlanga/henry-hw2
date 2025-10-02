/**
 * Custom Error Classes Tests
 * Unit tests for error classes
 */

const {
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  RateLimitError,
  InternalError
} = require('../src/utils/errors');

describe('Error Classes Tests', () => {
  describe('AppError', () => {
    it('should create error with message and status code', () => {
      const error = new AppError('Test error', 400);
      expect(error.message).toBe('Test error');
      expect(error.statusCode).toBe(400);
      expect(error.isOperational).toBe(true);
    });

    it('should default to status 500', () => {
      const error = new AppError('Test error');
      expect(error.statusCode).toBe(500);
    });

    it('should set isOperational flag', () => {
      const error = new AppError('Test error', 400, false);
      expect(error.isOperational).toBe(false);
    });

    it('should have proper name', () => {
      const error = new AppError('Test error');
      expect(error.name).toBe('AppError');
    });

    it('should be instance of Error', () => {
      const error = new AppError('Test error');
      expect(error).toBeInstanceOf(Error);
    });

    it('should capture stack trace', () => {
      const error = new AppError('Test error');
      expect(error.stack).toBeDefined();
      expect(typeof error.stack).toBe('string');
    });
  });

  describe('ValidationError', () => {
    it('should create validation error with 400 status', () => {
      const error = new ValidationError('Validation failed');
      expect(error.statusCode).toBe(400);
      expect(error.message).toBe('Validation failed');
    });

    it('should store validation errors array', () => {
      const errors = ['Field required', 'Invalid format'];
      const error = new ValidationError('Validation failed', errors);
      expect(error.errors).toEqual(errors);
    });

    it('should default to empty errors array', () => {
      const error = new ValidationError('Validation failed');
      expect(error.errors).toEqual([]);
    });

    it('should extend AppError', () => {
      const error = new ValidationError('Test');
      expect(error).toBeInstanceOf(AppError);
    });

    it('should have correct name', () => {
      const error = new ValidationError('Test');
      expect(error.name).toBe('ValidationError');
    });
  });

  describe('AuthenticationError', () => {
    it('should create authentication error with 401 status', () => {
      const error = new AuthenticationError('Not authenticated');
      expect(error.statusCode).toBe(401);
      expect(error.message).toBe('Not authenticated');
    });

    it('should have default message', () => {
      const error = new AuthenticationError();
      expect(error.message).toBe('Authentication failed');
    });

    it('should extend AppError', () => {
      const error = new AuthenticationError();
      expect(error).toBeInstanceOf(AppError);
    });

    it('should have correct name', () => {
      const error = new AuthenticationError();
      expect(error.name).toBe('AuthenticationError');
    });
  });

  describe('AuthorizationError', () => {
    it('should create authorization error with 403 status', () => {
      const error = new AuthorizationError('Forbidden');
      expect(error.statusCode).toBe(403);
      expect(error.message).toBe('Forbidden');
    });

    it('should have default message', () => {
      const error = new AuthorizationError();
      expect(error.message).toBe('Access denied');
    });

    it('should extend AppError', () => {
      const error = new AuthorizationError();
      expect(error).toBeInstanceOf(AppError);
    });

    it('should have correct name', () => {
      const error = new AuthorizationError();
      expect(error.name).toBe('AuthorizationError');
    });
  });

  describe('NotFoundError', () => {
    it('should create not found error with 404 status', () => {
      const error = new NotFoundError('User not found');
      expect(error.statusCode).toBe(404);
      expect(error.message).toBe('User not found');
    });

    it('should have default message', () => {
      const error = new NotFoundError();
      expect(error.message).toBe('Resource not found');
    });

    it('should extend AppError', () => {
      const error = new NotFoundError();
      expect(error).toBeInstanceOf(AppError);
    });

    it('should have correct name', () => {
      const error = new NotFoundError();
      expect(error.name).toBe('NotFoundError');
    });
  });

  describe('RateLimitError', () => {
    it('should create rate limit error with 429 status', () => {
      const error = new RateLimitError('Too many requests');
      expect(error.statusCode).toBe(429);
      expect(error.message).toBe('Too many requests');
    });

    it('should have default message', () => {
      const error = new RateLimitError();
      expect(error.message).toBe('Too many requests');
    });

    it('should extend AppError', () => {
      const error = new RateLimitError();
      expect(error).toBeInstanceOf(AppError);
    });

    it('should have correct name', () => {
      const error = new RateLimitError();
      expect(error.name).toBe('RateLimitError');
    });
  });

  describe('InternalError', () => {
    it('should create internal error with 500 status', () => {
      const error = new InternalError('Server error');
      expect(error.statusCode).toBe(500);
      expect(error.message).toBe('Server error');
    });

    it('should have default message', () => {
      const error = new InternalError();
      expect(error.message).toBe('Internal server error');
    });

    it('should set isOperational to false', () => {
      const error = new InternalError();
      expect(error.isOperational).toBe(false);
    });

    it('should extend AppError', () => {
      const error = new InternalError();
      expect(error).toBeInstanceOf(AppError);
    });

    it('should have correct name', () => {
      const error = new InternalError();
      expect(error.name).toBe('InternalError');
    });
  });

  describe('Error Hierarchy', () => {
    it('all custom errors should extend AppError', () => {
      const errors = [
        new ValidationError('Test'),
        new AuthenticationError('Test'),
        new AuthorizationError('Test'),
        new NotFoundError('Test'),
        new RateLimitError('Test'),
        new InternalError('Test')
      ];

      errors.forEach(error => {
        expect(error).toBeInstanceOf(AppError);
        expect(error).toBeInstanceOf(Error);
      });
    });

    it('all custom errors should have unique status codes', () => {
      const statusCodes = [
        new ValidationError().statusCode,
        new AuthenticationError().statusCode,
        new AuthorizationError().statusCode,
        new NotFoundError().statusCode,
        new RateLimitError().statusCode,
        new InternalError().statusCode
      ];

      const uniqueStatusCodes = new Set(statusCodes);
      expect(uniqueStatusCodes.size).toBe(6);
    });
  });
});

