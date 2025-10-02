/**
 * Auth Service - CloudTech Monitoring
 * Main entry point for the authentication service
 * Refactored following SOLID principles and best practices
 *
 * Architecture:
 * - config/: Configuration management
 * - middleware/: Request processing (error handling, rate limiting)
 * - models/: Data models (User)
 * - services/: Business logic (authentication)
 * - controllers/: Request handlers
 * - routes/: Route definitions
 * - utils/: Shared utilities (logger, validators, errors)
 */

const mongoose = require('mongoose');
const createApp = require('./app');
const config = require('./config/env.config');
const logger = require('./utils/logger');

/**
 * Connect to MongoDB database
 */
const connectDatabase = async () => {
  try {
    await mongoose.connect(config.database.uri, config.database.options);
    logger.info('Database connected successfully', {
      host: mongoose.connection.host,
      name: mongoose.connection.name
    });
  } catch (error) {
    logger.error('Database connection failed', {
      error: error.message,
      stack: error.stack
    });
    throw error;
  }
};

/**
 * Graceful shutdown handler
 */
const gracefulShutdown = async (signal) => {
  logger.info(`${signal} received. Starting graceful shutdown...`);

  try {
    // Close database connection
    await mongoose.connection.close();
    logger.info('Database connection closed');

    // Close server
    if (global.server) {
      global.server.close(() => {
        logger.info('Server closed');
        process.exit(0);
      });
    } else {
      process.exit(0);
    }
  } catch (error) {
    logger.error('Error during shutdown', { error: error.message });
    process.exit(1);
  }
};

/**
 * Start the server
 */
const startServer = async () => {
  try {
    // Connect to database
    await connectDatabase();

    // Create Express app
    const app = createApp();

    // Start listening
    const server = app.listen(config.server.port, () => {
      logger.info('Auth service started successfully', {
        port: config.server.port,
        environment: config.server.env,
        apiVersion: config.server.apiVersion
      });

      logger.info('Available endpoints:', {
        root: `http://localhost:${config.server.port}/`,
        health: `http://localhost:${config.server.port}/health`,
        login: `http://localhost:${config.server.port}/api/${config.server.apiVersion}/auth/login`,
        register: `http://localhost:${config.server.port}/api/${config.server.apiVersion}/auth/register`
      });
    });

    // Handle server errors
    server.on('error', (error) => {
      if (error.code === 'EADDRINUSE') {
        logger.error(`Port ${config.server.port} is already in use`);
      } else {
        logger.error('Server error', { error: error.message });
      }
      process.exit(1);
    });

    // Graceful shutdown handlers
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    // Store server reference for graceful shutdown
    global.server = server;

    return app;
  } catch (error) {
    logger.error('Failed to start server', {
      error: error.message,
      stack: error.stack
    });
    process.exit(1);
  }
};

// Start server if this file is run directly
if (require.main === module) {
  startServer();
}

// Export app for testing
module.exports = { startServer, createApp };
