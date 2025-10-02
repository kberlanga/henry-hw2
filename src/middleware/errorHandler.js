/**
 * Error Handling Middleware
 * Centralized error handling for the application
 * Follows Single Responsibility Principle: Only handles errors
 */

const logger = require('../utils/logger');
const { AppError } = require('../utils/errors');
const config = require('../config/env.config');

/**
 * Format error response
 */
const formatErrorResponse = (err, includeStack = false) => {
  const response = {
    success: false,
    error: {
      message: err.message || 'An unexpected error occurred',
      statusCode: err.statusCode || 500
    }
  };

  // Include validation errors if present
  if (err.errors && Array.isArray(err.errors)) {
    response.error.details = err.errors;
  }

  // Include stack trace in development
  if (includeStack && err.stack) {
    response.error.stack = err.stack;
  }

  return response;
};

/**
 * Global error handler middleware
 */
const errorHandler = (err, req, res, _next) => {
  // Default to 500 server error
  let statusCode = 500;
  let isOperational = false;

  // Check if it's an operational error
  if (err instanceof AppError) {
    statusCode = err.statusCode;
    isOperational = err.isOperational;
  }

  // Log error
  if (isOperational) {
    logger.warn('Operational error occurred', {
      error: err.message,
      statusCode,
      path: req.path,
      method: req.method
    });
  } else {
    logger.error('Unexpected error occurred', {
      error: err.message,
      stack: err.stack,
      path: req.path,
      method: req.method
    });
  }

  // Send error response
  const includeStack = config.server.env === 'development';
  res.status(statusCode).json(formatErrorResponse(err, includeStack));
};

/**
 * 404 Not Found handler
 */
const notFoundHandler = (req, res, next) => {
  const error = new AppError(`Route not found: ${req.originalUrl}`, 404);
  next(error);
};

/**
 * Async error wrapper
 * Wraps async route handlers to catch errors
 */
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

module.exports = {
  errorHandler,
  notFoundHandler,
  asyncHandler
};

