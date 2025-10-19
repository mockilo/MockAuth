import request from 'supertest';
import { MockAuth } from '../../src/index';

describe('Authentication Integration Tests', () => {
  let auth: MockAuth;
  let server: any;

  beforeAll(async () => {
    auth = new MockAuth({
      port: 3002, // Use different port to avoid conflicts
      baseUrl: 'http://localhost:3002',
      jwtSecret: 'test-secret-key-for-integration-tests-32-chars-minimum',
      users: [
        {
          email: 'test@example.com',
          username: 'testuser',
          password: 'password123',
          roles: ['user'],
          permissions: ['read:profile']
        },
        {
          email: 'admin@example.com',
          username: 'admin',
          password: 'admin123',
          roles: ['admin'],
          permissions: ['read:users', 'write:users']
        }
      ]
    });

    await auth.start();
    server = auth['app'];
  });

  beforeEach(async () => {
    // Create a fresh user for login tests to avoid lockout issues
    if (auth) {
      const userService = auth.getUserService();
      try {
        // Create a fresh test user for login tests
        await userService.createUser({
          email: 'fresh@example.com',
          username: 'freshtest',
          password: 'password123',
          roles: ['user'],
          permissions: ['read:profile']
        });
      } catch (error) {
        // User might already exist, which is fine
      }
    }
  });

  afterAll(async () => {
    await auth.stop();
  });

  describe('POST /auth/login', () => {
    it('should login with valid credentials', async () => {
      const response = await request(server)
        .post('/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe('test@example.com');
      expect(response.body.data.token).toBeDefined();
      expect(response.body.data.refreshToken).toBeDefined();
    });

    it('should reject invalid credentials', async () => {
      const response = await request(server)
        .post('/auth/login')
        .send({
          email: 'test@example.com',
          password: 'wrongpassword'
        })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Invalid credentials');
    });

    it('should handle account lockout after multiple failed attempts', async () => {
      // Make multiple failed login attempts
      for (let i = 0; i < 6; i++) {
        await request(server)
          .post('/auth/login')
          .send({
            email: 'test@example.com',
            password: 'wrongpassword'
          });
      }

      // Next attempt should be locked
      const response = await request(server)
        .post('/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123'
        })
        .expect(423);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Account is locked');
    });
  });

  describe('POST /auth/register', () => {
    it('should register a new user', async () => {
      const response = await request(server)
        .post('/auth/register')
        .send({
          email: 'newuser@example.com',
          username: 'newuser',
          password: 'newpassword123'
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe('newuser@example.com');
      expect(response.body.data.token).toBeDefined();
    });

    it('should reject duplicate email registration', async () => {
      const response = await request(server)
        .post('/auth/register')
        .send({
          email: 'test@example.com',
          username: 'anotheruser',
          password: 'password123'
        })
        .expect(409);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('already exists');
    });
  });

  describe('GET /auth/me', () => {
    let authToken: string;

    beforeAll(async () => {
      const loginResponse = await request(server)
        .post('/auth/login')
        .send({
          email: 'fresh@example.com',
          password: 'password123'
        });
      
      if (loginResponse.body.success && loginResponse.body.data) {
        authToken = loginResponse.body.data.token;
      } else {
        throw new Error(`Login failed: ${loginResponse.body.error || 'Unknown error'}`);
      }
    });

    it('should return user info with valid token', async () => {
      const response = await request(server)
        .get('/auth/me')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.email).toBe('fresh@example.com');
      expect(response.body.data.password).toBeUndefined();
    });

    it('should reject request without token', async () => {
      const response = await request(server)
        .get('/auth/me')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('No token provided');
    });

    it('should reject request with invalid token', async () => {
      const response = await request(server)
        .get('/auth/me')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Invalid token');
    });
  });

  describe('POST /auth/refresh', () => {
    let refreshToken: string;

    beforeAll(async () => {
      const loginResponse = await request(server)
        .post('/auth/login')
        .send({
          email: 'fresh@example.com',
          password: 'password123'
        });
      
      if (loginResponse.body.success && loginResponse.body.data) {
        refreshToken = loginResponse.body.data.refreshToken;
      } else {
        throw new Error(`Login failed: ${loginResponse.body.error || 'Unknown error'}`);
      }
    });

    it('should refresh token with valid refresh token', async () => {
      const response = await request(server)
        .post('/auth/refresh')
        .send({
          refreshToken
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.token).toBeDefined();
      expect(response.body.data.expiresIn).toBeDefined();
    });

    it('should reject invalid refresh token', async () => {
      const response = await request(server)
        .post('/auth/refresh')
        .send({
          refreshToken: 'invalid-refresh-token'
        })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Invalid refresh token');
    });
  });

  describe('POST /auth/logout', () => {
    let authToken: string;

    beforeAll(async () => {
      const loginResponse = await request(server)
        .post('/auth/login')
        .send({
          email: 'fresh@example.com',
          password: 'password123'
        });
      
      if (loginResponse.body.success && loginResponse.body.data) {
        authToken = loginResponse.body.data.token;
      } else {
        throw new Error(`Login failed: ${loginResponse.body.error || 'Unknown error'}`);
      }
    });

    it('should logout successfully', async () => {
      const response = await request(server)
        .post('/auth/logout')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('Logged out');
    });
  });

  afterAll(async () => {
    if (auth) {
      await auth.stop();
    }
  });
});
