/**
 * Express Application Configuration
 * Configures Express app with middleware and routes
 * Follows Single Responsibility Principle: Only configures the app
 */

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const config = require('./config/env.config');
const logger = require('./utils/logger');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');
const { apiRateLimiter } = require('./middleware/rateLimiter');
const authRoutes = require('./routes/auth.routes');

/**
 * Create and configure Express application
 */
const createApp = () => {
  const app = express();

  // Security middleware
  app.use(helmet()); // Set security headers
  app.use(cors(config.cors)); // Enable CORS

  // Body parsing middleware
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Request logging middleware
  app.use((req, res, next) => {
    logger.logRequest(req);
    next();
  });

  // Apply rate limiting to all routes
  app.use(apiRateLimiter);

  // API Routes
  app.use(`/api/${config.server.apiVersion}/auth`, authRoutes);

  // Root endpoint
  app.get('/', (req, res) => {
    res.json({
      success: true,
      message: 'CloudTech Auth Service API',
      version: config.server.apiVersion,
      endpoints: {
        login: `/api/${config.server.apiVersion}/auth/login`,
        register: `/api/${config.server.apiVersion}/auth/register`,
        verify: `/api/${config.server.apiVersion}/auth/verify`,
        health: `/api/${config.server.apiVersion}/auth/health`
      }
    });
  });

  // Health check endpoint
  app.get('/health', (req, res) => {
    res.json({
      success: true,
      message: 'Service is healthy',
      timestamp: new Date().toISOString()
    });
  });

  // 404 handler (must be after all routes)
  app.use(notFoundHandler);

  // Global error handler (must be last)
  app.use(errorHandler);

  return app;
};

module.exports = createApp;

