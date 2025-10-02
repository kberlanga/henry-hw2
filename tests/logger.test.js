/**
 * Logger Utility Tests
 * Unit tests for the logging utility
 */

const Logger = require('../src/utils/logger');

describe('Logger Tests', () => {
  let consoleLogSpy;
  let consoleErrorSpy;
  let consoleWarnSpy;

  beforeEach(() => {
    // Spy on console methods
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
  });

  afterEach(() => {
    // Restore console methods
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
    consoleWarnSpy.mockRestore();
  });

  describe('formatMessage', () => {
    it('should format message with timestamp and level', () => {
      const message = Logger.formatMessage('INFO', 'Test message');
      expect(message).toContain('INFO');
      expect(message).toContain('Test message');
    });

    it('should include metadata in formatted message', () => {
      const message = Logger.formatMessage('ERROR', 'Test error', { userId: '123' });
      expect(message).toContain('userId');
      expect(message).toContain('123');
    });

    it('should handle empty metadata', () => {
      const message = Logger.formatMessage('INFO', 'Test message', {});
      expect(message).toContain('Test message');
    });
  });

  describe('error', () => {
    it('should log error messages', () => {
      Logger.error('Error occurred');
      expect(consoleErrorSpy).toHaveBeenCalled();
      const loggedMessage = consoleErrorSpy.mock.calls[0][0];
      expect(loggedMessage).toContain('ERROR');
      expect(loggedMessage).toContain('Error occurred');
    });

    it('should include metadata in error logs', () => {
      Logger.error('Error occurred', { code: 500 });
      expect(consoleErrorSpy).toHaveBeenCalled();
      const loggedMessage = consoleErrorSpy.mock.calls[0][0];
      expect(loggedMessage).toContain('code');
      expect(loggedMessage).toContain('500');
    });
  });

  describe('warn', () => {
    it('should log warning messages', () => {
      Logger.warn('Warning message');
      expect(consoleWarnSpy).toHaveBeenCalled();
      const loggedMessage = consoleWarnSpy.mock.calls[0][0];
      expect(loggedMessage).toContain('WARN');
      expect(loggedMessage).toContain('Warning message');
    });

    it('should include metadata in warning logs', () => {
      Logger.warn('Warning message', { action: 'test' });
      expect(consoleWarnSpy).toHaveBeenCalled();
      const loggedMessage = consoleWarnSpy.mock.calls[0][0];
      expect(loggedMessage).toContain('action');
    });
  });

  describe('info', () => {
    it('should log info messages', () => {
      Logger.info('Info message');
      expect(consoleLogSpy).toHaveBeenCalled();
      const loggedMessage = consoleLogSpy.mock.calls[0][0];
      expect(loggedMessage).toContain('INFO');
      expect(loggedMessage).toContain('Info message');
    });

    it('should include metadata in info logs', () => {
      Logger.info('Info message', { status: 'success' });
      expect(consoleLogSpy).toHaveBeenCalled();
      const loggedMessage = consoleLogSpy.mock.calls[0][0];
      expect(loggedMessage).toContain('status');
    });
  });

  describe('debug', () => {
    it('should log debug messages when level is DEBUG', () => {
      Logger.level = 'DEBUG';
      Logger.debug('Debug message');
      expect(consoleLogSpy).toHaveBeenCalled();
      const loggedMessage = consoleLogSpy.mock.calls[0][0];
      expect(loggedMessage).toContain('DEBUG');
      expect(loggedMessage).toContain('Debug message');
    });
  });

  describe('logRequest', () => {
    it('should log HTTP request details', () => {
      const mockReq = {
        method: 'GET',
        url: '/api/test',
        ip: '127.0.0.1',
        get: jest.fn().mockReturnValue('Mozilla/5.0')
      };

      Logger.logRequest(mockReq);
      expect(consoleLogSpy).toHaveBeenCalled();
      const loggedMessage = consoleLogSpy.mock.calls[0][0];
      expect(loggedMessage).toContain('GET');
      expect(loggedMessage).toContain('/api/test');
    });

    it('should include user agent in request logs', () => {
      const mockReq = {
        method: 'POST',
        url: '/api/login',
        ip: '192.168.1.1',
        get: jest.fn().mockReturnValue('Chrome/91.0')
      };

      Logger.logRequest(mockReq);
      expect(mockReq.get).toHaveBeenCalledWith('user-agent');
    });
  });

  describe('logSecurityEvent', () => {
    it('should log security events as warnings', () => {
      Logger.logSecurityEvent('Failed login attempt');
      expect(consoleWarnSpy).toHaveBeenCalled();
      const loggedMessage = consoleWarnSpy.mock.calls[0][0];
      expect(loggedMessage).toContain('Security Event');
      expect(loggedMessage).toContain('Failed login attempt');
    });

    it('should include event details', () => {
      Logger.logSecurityEvent('Suspicious activity', { ip: '10.0.0.1', attempts: 5 });
      expect(consoleWarnSpy).toHaveBeenCalled();
      const loggedMessage = consoleWarnSpy.mock.calls[0][0];
      expect(loggedMessage).toContain('ip');
      expect(loggedMessage).toContain('attempts');
    });
  });

  describe('shouldLog', () => {
    it('should return true for same level', () => {
      Logger.level = 'INFO';
      expect(Logger.shouldLog('INFO')).toBe(true);
    });

    it('should return true for higher priority level', () => {
      Logger.level = 'INFO';
      expect(Logger.shouldLog('ERROR')).toBe(true);
    });

    it('should return false for lower priority level', () => {
      Logger.level = 'ERROR';
      expect(Logger.shouldLog('DEBUG')).toBe(false);
    });
  });
});

