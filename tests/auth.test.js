/**
 * Authentication Service Tests
 * Basic integration tests for the auth service API
 *
 * Note: These tests focus on API endpoints without database operations
 * For full integration tests with database, use a test database instance
 */

const request = require('supertest');
const createApp = require('../src/app');

describe('Auth Service Tests', () => {
  let app;

  beforeAll(() => {
    // Create app instance for testing (without database connection)
    app = createApp();
  });

  afterAll(() => {
    // Cleanup
  });

  describe('Health Check Endpoints', () => {
    it('should return 200 for root endpoint', async () => {
      const response = await request(app).get('/');
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should return 200 for health endpoint', async () => {
      const response = await request(app).get('/health');
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should return 200 for auth health endpoint', async () => {
      const response = await request(app).get('/api/v1/auth/health');
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('Authentication Endpoints', () => {
    describe('POST /api/v1/auth/register', () => {
      it('should reject registration with invalid username', async () => {
        const response = await request(app)
          .post('/api/v1/auth/register')
          .send({
            username: 'ab',
            password: 'Test123!@#',
            email: 'test@example.com'
          });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
      });

      it('should reject registration with weak password', async () => {
        const response = await request(app)
          .post('/api/v1/auth/register')
          .send({
            username: 'testuser',
            password: 'weak',
            email: 'test@example.com'
          });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
      });

      it('should reject registration with invalid email', async () => {
        const response = await request(app)
          .post('/api/v1/auth/register')
          .send({
            username: 'testuser',
            password: 'Test123!@#',
            email: 'invalid-email'
          });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
      });
    });

    describe('POST /api/v1/auth/login', () => {
      it('should reject login with missing credentials', async () => {
        const response = await request(app)
          .post('/api/v1/auth/login')
          .send({});

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
      });

      it('should reject login with invalid username format', async () => {
        const response = await request(app)
          .post('/api/v1/auth/login')
          .send({
            username: 'ab',
            password: 'anypassword'
          });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
      });
    });

    describe('GET /api/v1/auth/verify', () => {
      it('should reject verification without token', async () => {
        const response = await request(app).get('/api/v1/auth/verify');
        expect(response.status).toBe(401);
        expect(response.body.success).toBe(false);
      });

      it('should reject verification with invalid token', async () => {
        const response = await request(app)
          .get('/api/v1/auth/verify')
          .set('Authorization', 'Bearer invalid-token');

        expect(response.status).toBe(401);
        expect(response.body.success).toBe(false);
      });
    });
  });

  describe('Rate Limiting', () => {
    it('should include rate limit headers', async () => {
      const response = await request(app)
        .get('/api/v1/auth/health');

      // Check for rate limit headers
      expect(response.headers).toHaveProperty('x-ratelimit-limit');
      expect(response.headers).toHaveProperty('x-ratelimit-remaining');
      expect(response.headers).toHaveProperty('x-ratelimit-reset');
    }, 10000);
  });

  describe('Error Handling', () => {
    it('should return 404 for non-existent routes', async () => {
      const response = await request(app).get('/api/v1/nonexistent');
      expect(response.status).toBe(404);
    });

    it('should return proper error format', async () => {
      const response = await request(app).get('/api/v1/nonexistent');
      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toHaveProperty('message');
    });
  });
});

