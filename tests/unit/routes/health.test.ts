import request from 'supertest';
import express from 'express';
import { createHealthRoutes } from '../../../src/routes/health';

describe('Health Routes', () => {
  let app: express.Application;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/health', createHealthRoutes());
  });

  describe('GET /health', () => {
    it('should return basic health check', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('healthy');
      expect(response.body.data.timestamp).toBeDefined();
      expect(response.body.data.uptime).toBeDefined();
      expect(response.body.data.version).toBe('1.0.0');
      expect(response.body.data.environment).toBeDefined();
      expect(response.body.data.services).toBeDefined();
      expect(response.body.data.services.database).toBe('connected');
      expect(response.body.data.services.jwt).toBe('valid');
      expect(response.body.data.services.rateLimit).toBe('active');
    });

    it('should include performance metrics', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
    });

    it('should handle multiple requests', async () => {
      // First request
      const response1 = await request(app)
        .get('/health')
        .expect(200);

      // Second request
      const response2 = await request(app)
        .get('/health')
        .expect(200);

      expect(response1.body.success).toBe(true);
      expect(response2.body.success).toBe(true);
    });
  });

  describe('GET /health/detailed', () => {
    it('should return detailed health check', async () => {
      const response = await request(app)
        .get('/health/detailed')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('healthy');
      expect(response.body.data.timestamp).toBeDefined();
      expect(response.body.data.uptime).toBeDefined();
      expect(response.body.data.version).toBe('1.0.0');
      expect(response.body.data.environment).toBeDefined();
      expect(response.body.data.services).toBeDefined();
    });

    it('should include memory usage information', async () => {
      const response = await request(app)
        .get('/health/detailed')
        .expect(200);

      expect(response.body.data.memory).toBeDefined();
      expect(response.body.data.memory.rss).toBeDefined();
      expect(response.body.data.memory.heapTotal).toBeDefined();
      expect(response.body.data.memory.heapUsed).toBeDefined();
      expect(response.body.data.memory.external).toBeDefined();
      expect(typeof response.body.data.memory.rss).toBe('string');
      expect(response.body.data.memory.rss).toContain('MB');
    });

    it('should include CPU usage information', async () => {
      const response = await request(app)
        .get('/health/detailed')
        .expect(200);

      expect(response.body.data.cpu).toBeDefined();
      expect(response.body.data.cpu.usage).toBeDefined();
    });
  });

  describe('GET /health/ready', () => {
    it('should return ready status when service is ready', async () => {
      const response = await request(app)
        .get('/health/ready')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.status).toBe('ready');
      expect(response.body.timestamp).toBeDefined();
    });
  });

  describe('GET /health/live', () => {
    it('should return liveness check', async () => {
      const response = await request(app)
        .get('/health/live')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.status).toBe('alive');
      expect(response.body.timestamp).toBeDefined();
      expect(response.body.uptime).toBeDefined();
    });

    it('should return uptime information', async () => {
      const response = await request(app)
        .get('/health/live')
        .expect(200);

      expect(typeof response.body.uptime).toBe('number');
      expect(response.body.uptime).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Environment handling', () => {
    it('should return environment information', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.environment).toBeDefined();
    });

    it('should handle production environment', async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.environment).toBe('production');

      // Restore original environment
      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('Error handling', () => {
    it('should handle missing routes gracefully', async () => {
      const response = await request(app)
        .get('/health/nonexistent')
        .expect(404);
    });
  });
});
