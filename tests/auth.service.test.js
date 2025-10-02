/**
 * Authentication Service Tests
 * Unit tests for authentication service business logic
 */

const jwt = require('jsonwebtoken');
const { AuthenticationError, ValidationError } = require('../src/utils/errors');

// Mock dependencies
jest.mock('jsonwebtoken');
jest.mock('../src/models/User.model');
jest.mock('../src/utils/logger');
jest.mock('../src/utils/validators');

const User = require('../src/models/User.model');
const logger = require('../src/utils/logger');
const validators = require('../src/utils/validators');

// Import service after mocks
const authService = require('../src/services/auth.service');

describe('Auth Service Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('generateToken', () => {
    it('should generate JWT token with user data', () => {
      const mockUser = {
        _id: '123456',
        username: 'testuser'
      };
      const mockToken = 'mock.jwt.token';

      jwt.sign.mockReturnValue(mockToken);

      const token = authService.generateToken(mockUser);

      expect(token).toBe(mockToken);
      expect(jwt.sign).toHaveBeenCalledWith(
        expect.objectContaining({
          sub: mockUser._id,
          username: mockUser.username
        }),
        expect.any(String),
        expect.objectContaining({
          expiresIn: expect.any(String),
          issuer: expect.any(String)
        })
      );
    });

    it('should include user ID in token payload', () => {
      const mockUser = {
        _id: 'user-id-123',
        username: 'testuser'
      };

      jwt.sign.mockReturnValue('token');
      authService.generateToken(mockUser);

      const payload = jwt.sign.mock.calls[0][0];
      expect(payload.sub).toBe('user-id-123');
    });

    it('should include username in token payload', () => {
      const mockUser = {
        _id: '123',
        username: 'john_doe'
      };

      jwt.sign.mockReturnValue('token');
      authService.generateToken(mockUser);

      const payload = jwt.sign.mock.calls[0][0];
      expect(payload.username).toBe('john_doe');
    });
  });

  describe('verifyToken', () => {
    it('should verify valid token', () => {
      const mockDecoded = {
        sub: '123',
        username: 'testuser'
      };

      jwt.verify.mockReturnValue(mockDecoded);

      const result = authService.verifyToken('valid.jwt.token');

      expect(result).toEqual(mockDecoded);
      expect(jwt.verify).toHaveBeenCalled();
    });

    it('should throw AuthenticationError for invalid token', () => {
      jwt.verify.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      expect(() => {
        authService.verifyToken('invalid.token');
      }).toThrow(AuthenticationError);
    });

    it('should throw AuthenticationError for expired token', () => {
      jwt.verify.mockImplementation(() => {
        const error = new Error('Token expired');
        error.name = 'TokenExpiredError';
        throw error;
      });

      expect(() => {
        authService.verifyToken('expired.token');
      }).toThrow(AuthenticationError);
    });

    it('should log verification failures', () => {
      jwt.verify.mockImplementation(() => {
        throw new Error('Verification failed');
      });

      try {
        authService.verifyToken('bad.token');
      } catch (error) {
        // Expected
      }

      expect(logger.warn).toHaveBeenCalled();
    });
  });

  describe('login', () => {
    const mockUsername = 'testuser';
    const mockPassword = 'Test123!@#';

    beforeEach(() => {
      validators.validateLoginCredentials.mockReturnValue({
        username: mockUsername,
        password: mockPassword
      });
    });

    it('should successfully login with valid credentials', async () => {
      const mockUser = {
        _id: '123',
        username: mockUsername,
        email: 'test@example.com',
        isActive: true,
        isLocked: false,
        comparePassword: jest.fn().mockResolvedValue(true),
        resetLoginAttempts: jest.fn().mockResolvedValue(true),
        lastLogin: new Date()
      };

      User.findByUsername = jest.fn().mockResolvedValue(mockUser);
      jwt.sign.mockReturnValue('mock.token');

      const result = await authService.login(mockUsername, mockPassword);

      expect(result).toHaveProperty('token');
      expect(result).toHaveProperty('user');
      expect(result.user.username).toBe(mockUsername);
      expect(mockUser.comparePassword).toHaveBeenCalledWith(mockPassword);
      expect(mockUser.resetLoginAttempts).toHaveBeenCalled();
    });

    it('should throw AuthenticationError for non-existent user', async () => {
      User.findByUsername = jest.fn().mockResolvedValue(null);

      await expect(
        authService.login(mockUsername, mockPassword)
      ).rejects.toThrow(AuthenticationError);

      expect(logger.logSecurityEvent).toHaveBeenCalled();
    });

    it('should throw AuthenticationError for locked account', async () => {
      const mockUser = {
        isLocked: true,
        lockUntil: Date.now() + 60000
      };

      User.findByUsername = jest.fn().mockResolvedValue(mockUser);

      await expect(
        authService.login(mockUsername, mockPassword)
      ).rejects.toThrow(AuthenticationError);
    });

    it('should throw AuthenticationError for inactive account', async () => {
      const mockUser = {
        isActive: false,
        isLocked: false
      };

      User.findByUsername = jest.fn().mockResolvedValue(mockUser);

      await expect(
        authService.login(mockUsername, mockPassword)
      ).rejects.toThrow(AuthenticationError);
    });

    it('should throw AuthenticationError for wrong password', async () => {
      const mockUser = {
        isActive: true,
        isLocked: false,
        comparePassword: jest.fn().mockResolvedValue(false),
        incrementLoginAttempts: jest.fn().mockResolvedValue(true),
        failedLoginAttempts: 0
      };

      User.findByUsername = jest.fn().mockResolvedValue(mockUser);

      await expect(
        authService.login(mockUsername, mockPassword)
      ).rejects.toThrow(AuthenticationError);

      expect(mockUser.incrementLoginAttempts).toHaveBeenCalled();
    });

    it('should validate credentials before login', async () => {
      validators.validateLoginCredentials.mockImplementation(() => {
        throw new ValidationError('Invalid credentials');
      });

      await expect(
        authService.login(mockUsername, mockPassword)
      ).rejects.toThrow(ValidationError);
    });

    it('should log successful login', async () => {
      const mockUser = {
        _id: '123',
        username: mockUsername,
        email: 'test@example.com',
        isActive: true,
        isLocked: false,
        comparePassword: jest.fn().mockResolvedValue(true),
        resetLoginAttempts: jest.fn().mockResolvedValue(true),
        lastLogin: new Date()
      };

      User.findByUsername = jest.fn().mockResolvedValue(mockUser);
      jwt.sign.mockReturnValue('token');

      await authService.login(mockUsername, mockPassword);

      expect(logger.info).toHaveBeenCalledWith(
        expect.stringContaining('logged in'),
        expect.any(Object)
      );
    });

    it('should log security events for failed logins', async () => {
      const mockUser = {
        isActive: true,
        isLocked: false,
        comparePassword: jest.fn().mockResolvedValue(false),
        incrementLoginAttempts: jest.fn().mockResolvedValue(true),
        failedLoginAttempts: 0
      };

      User.findByUsername = jest.fn().mockResolvedValue(mockUser);

      try {
        await authService.login(mockUsername, mockPassword);
      } catch (error) {
        // Expected
      }

      expect(logger.logSecurityEvent).toHaveBeenCalledWith(
        expect.stringContaining('Failed login'),
        expect.any(Object)
      );
    });
  });

  describe('register', () => {
    const mockUsername = 'newuser';
    const mockPassword = 'NewPass123!@#';
    const mockEmail = 'new@example.com';

    beforeEach(() => {
      validators.validateRegistrationData.mockReturnValue({
        username: mockUsername,
        password: mockPassword,
        email: mockEmail
      });
    });

    it('should successfully register new user', async () => {
      User.findOne = jest.fn().mockResolvedValue(null);

      const mockUser = {
        _id: '123',
        username: mockUsername,
        email: mockEmail,
        save: jest.fn().mockResolvedValue(true)
      };

      User.mockImplementation(() => mockUser);
      jwt.sign.mockReturnValue('mock.token');

      const result = await authService.register(mockUsername, mockPassword, mockEmail);

      expect(result).toHaveProperty('token');
      expect(result).toHaveProperty('user');
      expect(result.user.username).toBe(mockUsername);
      expect(mockUser.save).toHaveBeenCalled();
    });

    it('should throw ValidationError if username exists', async () => {
      const existingUser = {
        username: mockUsername
      };

      User.findOne = jest.fn().mockResolvedValue(existingUser);

      await expect(
        authService.register(mockUsername, mockPassword, mockEmail)
      ).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError if email exists', async () => {
      const existingUser = {
        email: mockEmail
      };

      User.findOne = jest.fn().mockResolvedValue(existingUser);

      await expect(
        authService.register(mockUsername, mockPassword, mockEmail)
      ).rejects.toThrow(ValidationError);
    });

    it('should validate registration data', async () => {
      validators.validateRegistrationData.mockImplementation(() => {
        throw new ValidationError('Invalid data');
      });

      await expect(
        authService.register(mockUsername, mockPassword, mockEmail)
      ).rejects.toThrow(ValidationError);
    });

    it('should log successful registration', async () => {
      User.findOne = jest.fn().mockResolvedValue(null);

      const mockUser = {
        _id: '123',
        username: mockUsername,
        email: mockEmail,
        save: jest.fn().mockResolvedValue(true)
      };

      User.mockImplementation(() => mockUser);
      jwt.sign.mockReturnValue('token');

      await authService.register(mockUsername, mockPassword, mockEmail);

      expect(logger.info).toHaveBeenCalledWith(
        expect.stringContaining('registered'),
        expect.any(Object)
      );
    });

    it('should handle registration without email', async () => {
      User.findOne = jest.fn().mockResolvedValue(null);

      const mockUser = {
        _id: '123',
        username: mockUsername,
        save: jest.fn().mockResolvedValue(true)
      };

      User.mockImplementation(() => mockUser);
      jwt.sign.mockReturnValue('token');

      validators.validateRegistrationData.mockReturnValue({
        username: mockUsername,
        password: mockPassword,
        email: undefined
      });

      const result = await authService.register(mockUsername, mockPassword);

      expect(result).toHaveProperty('user');
      expect(mockUser.save).toHaveBeenCalled();
    });
  });

  describe('verifyUser', () => {
    it('should verify valid token and return user data', async () => {
      const mockDecoded = {
        sub: '123',
        username: 'testuser'
      };

      const mockUser = {
        _id: '123',
        username: 'testuser',
        email: 'test@example.com',
        isActive: true
      };

      jwt.verify.mockReturnValue(mockDecoded);
      User.findById = jest.fn().mockResolvedValue(mockUser);

      const result = await authService.verifyUser('valid.token');

      expect(result).toEqual({
        id: mockUser._id,
        username: mockUser.username,
        email: mockUser.email
      });
    });

    it('should throw AuthenticationError if user not found', async () => {
      const mockDecoded = {
        sub: '123'
      };

      jwt.verify.mockReturnValue(mockDecoded);
      User.findById = jest.fn().mockResolvedValue(null);

      await expect(
        authService.verifyUser('token')
      ).rejects.toThrow(AuthenticationError);
    });

    it('should throw AuthenticationError if user is inactive', async () => {
      const mockDecoded = {
        sub: '123'
      };

      const mockUser = {
        _id: '123',
        isActive: false
      };

      jwt.verify.mockReturnValue(mockDecoded);
      User.findById = jest.fn().mockResolvedValue(mockUser);

      await expect(
        authService.verifyUser('token')
      ).rejects.toThrow(AuthenticationError);
    });

    it('should throw AuthenticationError for invalid token', async () => {
      jwt.verify.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      await expect(
        authService.verifyUser('invalid.token')
      ).rejects.toThrow(AuthenticationError);
    });
  });

  describe('Error Handling', () => {
    it('should handle database errors gracefully', async () => {
      validators.validateLoginCredentials.mockReturnValue({
        username: 'test',
        password: 'pass'
      });

      User.findByUsername = jest.fn().mockRejectedValue(
        new Error('Database error')
      );

      await expect(
        authService.login('test', 'pass')
      ).rejects.toThrow(AuthenticationError);

      expect(logger.error).toHaveBeenCalled();
    });

    it('should handle JWT signing errors', async () => {
      User.findOne = jest.fn().mockResolvedValue(null);

      const mockUser = {
        _id: '123',
        username: 'test',
        save: jest.fn().mockResolvedValue(true)
      };

      User.mockImplementation(() => mockUser);
      jwt.sign.mockImplementation(() => {
        throw new Error('JWT error');
      });

      validators.validateRegistrationData.mockReturnValue({
        username: 'test',
        password: 'pass'
      });

      await expect(
        authService.register('test', 'pass')
      ).rejects.toThrow();
    });
  });
});

