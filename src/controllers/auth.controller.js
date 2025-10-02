/**
 * Authentication Controller
 * Handles HTTP requests and responses for authentication
 * Follows Single Responsibility Principle: Only handles request/response logic
 */

const authService = require('../services/auth.service');
const logger = require('../utils/logger');
const { asyncHandler } = require('../middleware/errorHandler');

class AuthController {
  /**
   * Handle login request
   * POST /api/v1/auth/login
   */
  login = asyncHandler(async (req, res) => {
    const { username, password } = req.body;

    logger.info('Login attempt', { username, ip: req.ip });

    const result = await authService.login(username, password);

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: result
    });
  });

  /**
   * Handle registration request
   * POST /api/v1/auth/register
   */
  register = asyncHandler(async (req, res) => {
    const { username, password, email } = req.body;

    logger.info('Registration attempt', { username, ip: req.ip });

    const result = await authService.register(username, password, email);

    res.status(201).json({
      success: true,
      message: 'Registration successful',
      data: result
    });
  });

  /**
   * Handle token verification request
   * GET /api/v1/auth/verify
   */
  verify = asyncHandler(async (req, res) => {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No token provided'
      });
    }

    const result = await authService.verifyUser(token);

    res.status(200).json({
      success: true,
      message: 'Token is valid',
      data: result
    });
  });

  /**
   * Handle logout request (client-side token removal)
   * POST /api/v1/auth/logout
   */
  logout = asyncHandler(async (req, res) => {
    // With JWT, logout is typically handled client-side
    // This endpoint is for logging purposes
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (token) {
      try {
        const decoded = authService.verifyToken(token);
        logger.info('User logged out', { username: decoded.username });
      } catch (error) {
        // Token might be invalid, that's okay
      }
    }

    res.status(200).json({
      success: true,
      message: 'Logout successful'
    });
  });

  /**
   * Health check endpoint
   * GET /api/v1/auth/health
   */
  health = asyncHandler(async (req, res) => {
    res.status(200).json({
      success: true,
      message: 'Auth service is healthy',
      timestamp: new Date().toISOString()
    });
  });
}

// Export singleton instance
module.exports = new AuthController();

