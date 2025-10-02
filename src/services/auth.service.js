/**
 * Authentication Service
 * Business logic for authentication operations
 * Follows Single Responsibility Principle: Only handles authentication logic
 */

const jwt = require('jsonwebtoken');
const User = require('../models/User.model');
const config = require('../config/env.config');
const logger = require('../utils/logger');
const { AuthenticationError, ValidationError } = require('../utils/errors');
const { validateLoginCredentials, validateRegistrationData } = require('../utils/validators');

class AuthService {
  /**
   * Generate JWT token
   */
  generateToken(user) {
    const payload = {
      sub: user._id,
      username: user.username,
      iat: Date.now()
    };

    return jwt.sign(payload, config.jwt.secret, {
      expiresIn: config.jwt.expiresIn,
      issuer: config.jwt.issuer
    });
  }

  /**
   * Verify JWT token
   */
  verifyToken(token) {
    try {
      return jwt.verify(token, config.jwt.secret, {
        issuer: config.jwt.issuer
      });
    } catch (error) {
      logger.warn('Token verification failed', { error: error.message });
      throw new AuthenticationError('Invalid or expired token');
    }
  }

  /**
   * Authenticate user with username and password
   */
  async login(username, password) {
    try {
      // Validate input
      const sanitized = validateLoginCredentials(username, password);

      // Find user by username
      const user = await User.findByUsername(sanitized.username);

      if (!user) {
        logger.logSecurityEvent('Login attempt with non-existent user', {
          username: sanitized.username
        });
        throw new AuthenticationError('Invalid credentials');
      }

      // Check if account is locked
      if (user.isLocked) {
        const lockTimeRemaining = Math.ceil((user.lockUntil - Date.now()) / 1000 / 60);
        logger.logSecurityEvent('Login attempt on locked account', {
          username: sanitized.username,
          lockTimeRemaining
        });
        throw new AuthenticationError(
          `Account is locked. Please try again in ${lockTimeRemaining} minutes`
        );
      }

      // Check if account is active
      if (!user.isActive) {
        logger.logSecurityEvent('Login attempt on inactive account', {
          username: sanitized.username
        });
        throw new AuthenticationError('Account is inactive');
      }

      // Verify password
      const isPasswordValid = await user.comparePassword(sanitized.password);

      if (!isPasswordValid) {
        // Increment failed login attempts
        await user.incrementLoginAttempts();

        logger.logSecurityEvent('Failed login attempt', {
          username: sanitized.username,
          attempts: user.failedLoginAttempts + 1
        });

        throw new AuthenticationError('Invalid credentials');
      }

      // Reset failed login attempts on successful login
      await user.resetLoginAttempts();

      // Generate token
      const token = this.generateToken(user);

      logger.info('User logged in successfully', {
        userId: user._id,
        username: user.username
      });

      return {
        token,
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          lastLogin: user.lastLogin
        }
      };
    } catch (error) {
      // Re-throw known errors
      if (error instanceof ValidationError || error instanceof AuthenticationError) {
        throw error;
      }

      // Log unexpected errors
      logger.error('Login error', { error: error.message, stack: error.stack });
      throw new AuthenticationError('Authentication failed');
    }
  }

  /**
   * Register new user
   */
  async register(username, password, email) {
    try {
      // Validate input
      const sanitized = validateRegistrationData(username, password, email);

      // Check if user already exists
      const existingUser = await User.findOne({
        $or: [
          { username: sanitized.username },
          ...(sanitized.email ? [{ email: sanitized.email }] : [])
        ]
      });

      if (existingUser) {
        if (existingUser.username === sanitized.username) {
          throw new ValidationError('Username already exists');
        }
        if (existingUser.email === sanitized.email) {
          throw new ValidationError('Email already exists');
        }
      }

      // Create new user
      const user = new User({
        username: sanitized.username,
        password: sanitized.password,
        email: sanitized.email
      });

      await user.save();

      // Generate token
      const token = this.generateToken(user);

      logger.info('User registered successfully', {
        userId: user._id,
        username: user.username
      });

      return {
        token,
        user: {
          id: user._id,
          username: user.username,
          email: user.email
        }
      };
    } catch (error) {
      // Re-throw known errors
      if (error instanceof ValidationError) {
        throw error;
      }

      // Handle mongoose validation errors
      if (error.name === 'ValidationError') {
        const errors = Object.values(error.errors).map(err => err.message);
        throw new ValidationError('Validation failed', errors);
      }

      // Handle duplicate key errors
      if (error.code === 11000) {
        const field = Object.keys(error.keyPattern)[0];
        throw new ValidationError(`${field} already exists`);
      }

      // Log unexpected errors
      logger.error('Registration error', { error: error.message, stack: error.stack });
      throw new ValidationError('Registration failed');
    }
  }

  /**
   * Verify user token and get user data
   */
  async verifyUser(token) {
    try {
      const decoded = this.verifyToken(token);

      const user = await User.findById(decoded.sub);

      if (!user || !user.isActive) {
        throw new AuthenticationError('User not found or inactive');
      }

      return {
        id: user._id,
        username: user.username,
        email: user.email
      };
    } catch (error) {
      if (error instanceof AuthenticationError) {
        throw error;
      }
      logger.error('Token verification error', { error: error.message });
      throw new AuthenticationError('Invalid token');
    }
  }
}

// Export singleton instance
module.exports = new AuthService();

