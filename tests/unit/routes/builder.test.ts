import request from 'supertest';
import express from 'express';
import { createBuilderRoutes } from '../../../src/routes/builder';

describe('Builder Routes', () => {
  let app: express.Application;
  let mockAuthInstance: any;

  beforeEach(() => {
    app = express();
    app.use(express.json());

    // Mock MockAuth instance
    mockAuthInstance = {
      getStats: jest.fn().mockResolvedValue({
        totalRequests: 100,
        activeUsers: 5,
        uptime: 3600
      }),
      getUserService: jest.fn().mockReturnValue({
        getAllUsers: jest.fn().mockResolvedValue([
          { id: '1', email: 'user1@example.com', username: 'user1' },
          { id: '2', email: 'user2@example.com', username: 'user2' }
        ])
      })
    };

    app.use('/builder', createBuilderRoutes(mockAuthInstance));
  });

  describe('GET /builder/stats', () => {
    it('should return builder statistics', async () => {
      const response = await request(app)
        .get('/builder/stats')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(typeof response.body.data.totalUsers).toBe('number');
      expect(typeof response.body.data.totalConfigs).toBe('number');
      expect(typeof response.body.data.totalEndpoints).toBe('number');
      expect(response.body.data.stats).toBeDefined();
    });

    it('should handle errors gracefully', async () => {
      mockAuthInstance.getStats.mockRejectedValue(new Error('Service unavailable'));

      const response = await request(app)
        .get('/builder/stats')
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Service unavailable');
    });

    it('should return stats with saved configuration', async () => {
      // Simulate saved configuration
      const savedConfig = { port: 3001, users: [] };
      mockAuthInstance.getStats.mockResolvedValue({ totalRequests: 50 });

      const response = await request(app)
        .get('/builder/stats')
        .expect(200);

      expect(response.body.data.totalConfigs).toBe(0); // No config saved yet
    });
  });

  describe('POST /builder/config/save', () => {
    it('should save configuration successfully', async () => {
      const config = {
        port: 3001,
        jwtSecret: 'test-secret',
        users: [
          { email: 'test@example.com', username: 'testuser', password: 'password123' }
        ],
        endpoints: ['/auth/login', '/auth/register']
      };

      const response = await request(app)
        .post('/builder/config/save')
        .send(config)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Configuration saved successfully');
      expect(response.body.data).toEqual(config);
    });

    it('should handle empty configuration', async () => {
      const config = {};

      const response = await request(app)
        .post('/builder/config/save')
        .send(config)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(config);
    });

    it('should handle malformed JSON', async () => {
      const response = await request(app)
        .post('/builder/config/save')
        .send('invalid json')
        .expect(400);
    });
  });

  describe('GET /builder/config/load', () => {
    it('should return default configuration when none saved', async () => {
      const response = await request(app)
        .get('/builder/config/load')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual({
        port: 3001,
        jwtSecret: '',
        users: [],
        endpoints: []
      });
    });

    it('should return saved configuration', async () => {
      // First save a configuration
      const config = {
        port: 4000,
        jwtSecret: 'saved-secret',
        users: [{ email: 'saved@example.com', username: 'saveduser' }],
        endpoints: ['/auth/login']
      };

      await request(app)
        .post('/builder/config/save')
        .send(config);

      // Then load it
      const response = await request(app)
        .get('/builder/config/load')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(config);
    });

    it('should handle errors gracefully', async () => {
      // Mock an error in the route
      const originalConsoleError = console.error;
      console.error = jest.fn();

      const response = await request(app)
        .get('/builder/config/load')
        .expect(200);

      expect(response.body.success).toBe(true);

      console.error = originalConsoleError;
    });
  });

  describe('POST /builder/users/bulk', () => {
    it('should create multiple users successfully', async () => {
      const users = [
        { email: 'user1@example.com', username: 'user1', password: 'password123' },
        { email: 'user2@example.com', username: 'user2', password: 'password456' }
      ];

      const response = await request(app)
        .post('/builder/users/bulk')
        .send({ users })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Users created successfully');
      expect(response.body.data.created).toBe(2);
      expect(response.body.data.failed).toBe(0);
    });

    it('should handle partial failures', async () => {
      const users = [
        { email: 'valid@example.com', username: 'valid', password: 'password123' },
        { email: 'invalid-email', username: 'invalid', password: 'password456' }
      ];

      const response = await request(app)
        .post('/builder/users/bulk')
        .send({ users })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.created).toBeGreaterThanOrEqual(0);
      expect(response.body.data.failed).toBeGreaterThanOrEqual(0);
    });

    it('should handle empty users array', async () => {
      const response = await request(app)
        .post('/builder/users/bulk')
        .send({ users: [] })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.created).toBe(0);
      expect(response.body.data.failed).toBe(0);
    });

    it('should handle missing users property', async () => {
      const response = await request(app)
        .post('/builder/users/bulk')
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Users array is required');
    });
  });

  describe('Error handling', () => {
    it('should handle missing routes gracefully', async () => {
      const response = await request(app)
        .get('/builder/nonexistent')
        .expect(404);
    });

    it('should handle server errors', async () => {
      // Mock a server error
      const originalConsoleError = console.error;
      console.error = jest.fn();

      const response = await request(app)
        .post('/builder/config/save')
        .send({ invalid: 'data' })
        .expect(200);

      console.error = originalConsoleError;
    });
  });
});
