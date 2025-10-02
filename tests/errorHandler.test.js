/**
 * Error Handler Middleware Tests
 * Unit tests for error handling middleware
 */

const {
  errorHandler,
  notFoundHandler,
  asyncHandler
} = require('../src/middleware/errorHandler');
const { AppError, ValidationError } = require('../src/utils/errors');

describe('Error Handler Middleware Tests', () => {
  let mockReq;
  let mockRes;
  let mockNext;

  beforeEach(() => {
    mockReq = {
      path: '/api/test',
      method: 'GET',
      originalUrl: '/api/test?query=1'
    };

    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };

    mockNext = jest.fn();
  });

  describe('errorHandler', () => {
    it('should handle AppError with correct status', () => {
      const error = new AppError('Test error', 400);
      errorHandler(error, mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.objectContaining({
            message: 'Test error',
            statusCode: 400
          })
        })
      );
    });

    it('should handle ValidationError with details', () => {
      const errors = ['Field required', 'Invalid format'];
      const error = new ValidationError('Validation failed', errors);
      errorHandler(error, mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.objectContaining({
            message: 'Validation failed',
            details: errors
          })
        })
      );
    });

    it('should default to 500 for unknown errors', () => {
      const error = new Error('Unknown error');
      errorHandler(error, mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(500);
    });

    it('should not include stack trace in production', () => {
      process.env.NODE_ENV = 'production';
      const error = new Error('Test error');
      errorHandler(error, mockReq, mockRes, mockNext);

      const jsonCall = mockRes.json.mock.calls[0][0];
      expect(jsonCall.error.stack).toBeUndefined();
    });

    it('should handle errors without message', () => {
      const error = new Error();
      errorHandler(error, mockReq, mockRes, mockNext);

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.objectContaining({
            message: 'An unexpected error occurred'
          })
        })
      );
    });
  });

  describe('notFoundHandler', () => {
    it('should create 404 error and pass to next', () => {
      notFoundHandler(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalled();
      const error = mockNext.mock.calls[0][0];
      expect(error).toBeInstanceOf(AppError);
      expect(error.statusCode).toBe(404);
      expect(error.message).toContain('/api/test?query=1');
    });

    it('should include original URL in error message', () => {
      mockReq.originalUrl = '/api/users/123';
      notFoundHandler(mockReq, mockRes, mockNext);

      const error = mockNext.mock.calls[0][0];
      expect(error.message).toContain('/api/users/123');
    });
  });

  describe('asyncHandler', () => {
    it('should handle successful async function', async () => {
      const asyncFn = jest.fn().mockResolvedValue('success');
      const handler = asyncHandler(asyncFn);

      await handler(mockReq, mockRes, mockNext);

      expect(asyncFn).toHaveBeenCalledWith(mockReq, mockRes, mockNext);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should catch async errors and pass to next', async () => {
      const error = new Error('Async error');
      const asyncFn = jest.fn().mockRejectedValue(error);
      const handler = asyncHandler(asyncFn);

      await handler(mockReq, mockRes, mockNext);

      expect(asyncFn).toHaveBeenCalledWith(mockReq, mockRes, mockNext);
      expect(mockNext).toHaveBeenCalledWith(error);
    });

    it('should handle AppError correctly', async () => {
      const error = new AppError('Test error', 400);
      const asyncFn = jest.fn().mockRejectedValue(error);
      const handler = asyncHandler(asyncFn);

      await handler(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });

    it('should work with sync functions that return promises', async () => {
      const asyncFn = jest.fn(() => Promise.resolve('success'));
      const handler = asyncHandler(asyncFn);

      await handler(mockReq, mockRes, mockNext);

      expect(asyncFn).toHaveBeenCalled();
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('formatErrorResponse', () => {
    it('should format basic error response', () => {
      const error = new AppError('Test error', 400);
      errorHandler(error, mockReq, mockRes, mockNext);

      const response = mockRes.json.mock.calls[0][0];
      expect(response).toHaveProperty('success', false);
      expect(response).toHaveProperty('error');
      expect(response.error).toHaveProperty('message');
      expect(response.error).toHaveProperty('statusCode');
    });

    it('should include validation errors in response', () => {
      const errors = ['Error 1', 'Error 2'];
      const error = new ValidationError('Validation failed', errors);
      errorHandler(error, mockReq, mockRes, mockNext);

      const response = mockRes.json.mock.calls[0][0];
      expect(response.error).toHaveProperty('details', errors);
    });
  });
});

