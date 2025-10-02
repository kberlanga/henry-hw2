/**
 * Validator Tests
 * Unit tests for validation utilities
 */

const {
  validateUsername,
  validatePassword,
  validateEmail,
  sanitizeString,
  validateLoginCredentials,
  validateRegistrationData
} = require('../src/utils/validators');

const { ValidationError } = require('../src/utils/errors');

describe('Validator Tests', () => {
  describe('validateUsername', () => {
    it('should accept valid username', () => {
      const errors = validateUsername('testuser123');
      expect(errors).toHaveLength(0);
    });

    it('should reject username that is too short', () => {
      const errors = validateUsername('ab');
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0]).toContain('at least 3 characters');
    });

    it('should reject username that is too long', () => {
      const errors = validateUsername('a'.repeat(51));
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0]).toContain('not exceed 50 characters');
    });

    it('should reject username with special characters', () => {
      const errors = validateUsername('test@user');
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0]).toContain('letters, numbers, hyphens, and underscores');
    });

    it('should reject empty username', () => {
      const errors = validateUsername('');
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0]).toContain('required');
    });
  });

  describe('validatePassword', () => {
    it('should accept strong password', () => {
      const errors = validatePassword('SecurePass123!@#');
      expect(errors).toHaveLength(0);
    });

    it('should reject password without uppercase', () => {
      const errors = validatePassword('lowercase123!@#');
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some(e => e.includes('uppercase'))).toBe(true);
    });

    it('should reject password without lowercase', () => {
      const errors = validatePassword('UPPERCASE123!@#');
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some(e => e.includes('lowercase'))).toBe(true);
    });

    it('should reject password without numbers', () => {
      const errors = validatePassword('SecurePass!@#');
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some(e => e.includes('number'))).toBe(true);
    });

    it('should reject password without special characters', () => {
      const errors = validatePassword('SecurePass123');
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some(e => e.includes('special character'))).toBe(true);
    });

    it('should reject password that is too short', () => {
      const errors = validatePassword('Short1!');
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some(e => e.includes('at least 8 characters'))).toBe(true);
    });

    it('should reject empty password', () => {
      const errors = validatePassword('');
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0]).toContain('required');
    });
  });

  describe('validateEmail', () => {
    it('should accept valid email', () => {
      const errors = validateEmail('test@example.com');
      expect(errors).toHaveLength(0);
    });

    it('should reject invalid email format', () => {
      const errors = validateEmail('invalid-email');
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0]).toContain('Invalid email format');
    });

    it('should reject email without domain', () => {
      const errors = validateEmail('test@');
      expect(errors.length).toBeGreaterThan(0);
    });

    it('should reject email without @', () => {
      const errors = validateEmail('testexample.com');
      expect(errors.length).toBeGreaterThan(0);
    });
  });

  describe('sanitizeString', () => {
    it('should remove null bytes', () => {
      const result = sanitizeString('test\0string');
      expect(result).toBe('teststring');
    });

    it('should trim whitespace', () => {
      const result = sanitizeString('  test  ');
      expect(result).toBe('test');
    });

    it('should handle non-string input', () => {
      expect(sanitizeString(123)).toBe(123);
      expect(sanitizeString(null)).toBe(null);
      expect(sanitizeString(undefined)).toBe(undefined);
    });
  });

  describe('validateLoginCredentials', () => {
    it('should accept valid credentials', () => {
      const result = validateLoginCredentials('testuser', 'anypassword');
      expect(result).toHaveProperty('username', 'testuser');
      expect(result).toHaveProperty('password', 'anypassword');
    });

    it('should sanitize input', () => {
      const result = validateLoginCredentials('  testuser123  ', '  password  ');
      expect(result.username).toBe('testuser123');
      expect(result.password).toBe('password');
    });

    it('should throw ValidationError for invalid username', () => {
      expect(() => {
        validateLoginCredentials('ab', 'password');
      }).toThrow(ValidationError);
    });

    it('should throw ValidationError for missing password', () => {
      expect(() => {
        validateLoginCredentials('testuser', '');
      }).toThrow(ValidationError);
    });
  });

  describe('validateRegistrationData', () => {
    it('should accept valid registration data', () => {
      const result = validateRegistrationData(
        'testuser',
        'SecurePass123!@#',
        'test@example.com'
      );
      expect(result).toHaveProperty('username', 'testuser');
      expect(result).toHaveProperty('password', 'SecurePass123!@#');
      expect(result).toHaveProperty('email', 'test@example.com');
    });

    it('should accept registration without email', () => {
      const result = validateRegistrationData('testuser', 'SecurePass123!@#');
      expect(result).toHaveProperty('username', 'testuser');
      expect(result).toHaveProperty('password', 'SecurePass123!@#');
      expect(result.email).toBeUndefined();
    });

    it('should throw ValidationError for weak password', () => {
      expect(() => {
        validateRegistrationData('testuser', 'weak', 'test@example.com');
      }).toThrow(ValidationError);
    });

    it('should throw ValidationError for invalid email', () => {
      expect(() => {
        validateRegistrationData('testuser', 'SecurePass123!@#', 'invalid-email');
      }).toThrow(ValidationError);
    });
  });
});

