/**
 * Authentication Routes
 * Route definitions for authentication endpoints
 * Follows Single Responsibility Principle: Only defines routes
 */

const express = require('express');
const authController = require('../controllers/auth.controller');
const { authRateLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

/**
 * @route   POST /api/v1/auth/login
 * @desc    Authenticate user and return JWT token
 * @access  Public
 */
router.post('/login', authRateLimiter, authController.login);

/**
 * @route   POST /api/v1/auth/register
 * @desc    Register new user
 * @access  Public
 */
router.post('/register', authRateLimiter, authController.register);

/**
 * @route   GET /api/v1/auth/verify
 * @desc    Verify JWT token
 * @access  Public
 */
router.get('/verify', authController.verify);

/**
 * @route   POST /api/v1/auth/logout
 * @desc    Logout user (informational only)
 * @access  Public
 */
router.post('/logout', authController.logout);

/**
 * @route   GET /api/v1/auth/health
 * @desc    Health check endpoint
 * @access  Public
 */
router.get('/health', authController.health);

module.exports = router;

