/**
 * Input Validators
 * Centralized validation logic
 * Follows Single Responsibility Principle: Only handles validation
 */

const { ValidationError } = require('./errors');

/**
 * Validate username format
 */
const validateUsername = (username) => {
  const errors = [];

  if (!username) {
    errors.push('Username is required');
  } else if (typeof username !== 'string') {
    errors.push('Username must be a string');
  } else if (username.length < 3) {
    errors.push('Username must be at least 3 characters long');
  } else if (username.length > 50) {
    errors.push('Username must not exceed 50 characters');
  } else if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
    errors.push('Username can only contain letters, numbers, hyphens, and underscores');
  }

  return errors;
};

/**
 * Validate password strength
 */
const validatePassword = (password) => {
  const errors = [];

  if (!password) {
    errors.push('Password is required');
  } else if (typeof password !== 'string') {
    errors.push('Password must be a string');
  } else if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  } else if (password.length > 128) {
    errors.push('Password must not exceed 128 characters');
  } else {
    // Check password complexity
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    if (!hasUpperCase) {
      errors.push('Password must contain at least one uppercase letter');
    }
    if (!hasLowerCase) {
      errors.push('Password must contain at least one lowercase letter');
    }
    if (!hasNumbers) {
      errors.push('Password must contain at least one number');
    }
    if (!hasSpecialChar) {
      errors.push('Password must contain at least one special character');
    }
  }

  return errors;
};

/**
 * Validate email format
 */
const validateEmail = (email) => {
  const errors = [];
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!email) {
    errors.push('Email is required');
  } else if (typeof email !== 'string') {
    errors.push('Email must be a string');
  } else if (!emailRegex.test(email)) {
    errors.push('Invalid email format');
  } else if (email.length > 255) {
    errors.push('Email must not exceed 255 characters');
  }

  return errors;
};

/**
 * Sanitize string input to prevent injection
 */
const sanitizeString = (str) => {
  if (typeof str !== 'string') return str;

  // Remove null bytes and trim
  return str.replace(/\0/g, '').trim();
};

/**
 * Validate login credentials
 */
const validateLoginCredentials = (username, password) => {
  const errors = [];

  // Validate username
  const usernameErrors = validateUsername(username);
  errors.push(...usernameErrors);

  // Basic password validation (not complexity for login)
  if (!password) {
    errors.push('Password is required');
  } else if (typeof password !== 'string') {
    errors.push('Password must be a string');
  }

  if (errors.length > 0) {
    throw new ValidationError('Validation failed', errors);
  }

  return {
    username: sanitizeString(username),
    password: sanitizeString(password)
  };
};

/**
 * Validate registration data
 */
const validateRegistrationData = (username, password, email) => {
  const errors = [];

  // Validate all fields
  errors.push(...validateUsername(username));
  errors.push(...validatePassword(password));

  if (email) {
    errors.push(...validateEmail(email));
  }

  if (errors.length > 0) {
    throw new ValidationError('Validation failed', errors);
  }

  return {
    username: sanitizeString(username),
    password: sanitizeString(password),
    email: email ? sanitizeString(email) : undefined
  };
};

module.exports = {
  validateUsername,
  validatePassword,
  validateEmail,
  sanitizeString,
  validateLoginCredentials,
  validateRegistrationData
};

