import { Request, Response, NextFunction } from 'express';
import { performanceMonitor, performanceMiddleware, errorTrackingMiddleware } from '../../../src/middleware/performance';

describe('Performance Middleware', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockReq = {
      method: 'GET',
      path: '/test',
      headers: {}
    };
    mockRes = {
      statusCode: 200,
      send: jest.fn()
    };
    mockNext = jest.fn();
    
    // Reset metrics
    performanceMonitor.resetMetrics();
  });

  describe('performanceMonitor', () => {
    it('should track request metrics', async () => {
      const requestId = 'test-request';
      mockReq['requestId'] = requestId;
      
      performanceMonitor.startRequest(mockReq as Request);
      
      // Add a small delay to ensure timing is captured
      await new Promise(resolve => setTimeout(resolve, 10));
      
      performanceMonitor.endRequest(mockReq as Request, mockRes as Response);
      
      const metrics = performanceMonitor.getMetrics();
      expect(metrics.requestCount).toBe(1);
      expect(metrics.averageResponseTime).toBeGreaterThanOrEqual(0);
    });

    it('should track slowest requests', async () => {
      const requestId = 'slow-request';
      mockReq['requestId'] = requestId;
      
      performanceMonitor.startRequest(mockReq as Request);
      
      // Simulate slow request
      await new Promise(resolve => setTimeout(resolve, 100));
      
      performanceMonitor.endRequest(mockReq as Request, mockRes as Response);
      
      const metrics = performanceMonitor.getMetrics();
      expect(metrics.slowestRequests).toHaveLength(1);
      expect(metrics.slowestRequests[0].path).toBe('/test');
      expect(metrics.slowestRequests[0].method).toBe('GET');
    });

    it('should track errors', () => {
      performanceMonitor.recordError();
      performanceMonitor.recordError();
      
      const metrics = performanceMonitor.getMetrics();
      expect(metrics.totalErrors).toBe(2);
      expect(metrics.errorRate).toBe(Infinity); // 2 errors / 0 requests = Infinity
    });

    it('should calculate error rate correctly', () => {
      // Simulate some requests
      for (let i = 0; i < 10; i++) {
        const requestId = `request-${i}`;
        mockReq['requestId'] = requestId;
        performanceMonitor.startRequest(mockReq as Request);
        performanceMonitor.endRequest(mockReq as Request, mockRes as Response);
      }
      
      // Add some errors
      for (let i = 0; i < 2; i++) {
        performanceMonitor.recordError();
      }
      
      const metrics = performanceMonitor.getMetrics();
      expect(metrics.errorRate).toBe(0.2); // 2 errors / 10 requests = 0.2
    });

    it('should limit slowest requests to 10', () => {
      // Create 15 slow requests
      for (let i = 0; i < 15; i++) {
        const requestId = `slow-request-${i}`;
        const mockRequest = {
          ...mockReq,
          requestId,
          path: `/test-${i}`
        };
        
        performanceMonitor.startRequest(mockRequest as Request);
        performanceMonitor.endRequest(mockRequest as Request, mockRes as Response);
      }
      
      const metrics = performanceMonitor.getMetrics();
      expect(metrics.slowestRequests).toHaveLength(10);
    });
  });

  describe('performanceMiddleware', () => {
    it('should add request timing', () => {
      performanceMiddleware(mockReq as Request, mockRes as Response, mockNext);
      
      expect(mockReq['requestId']).toBeDefined();
      expect(mockNext).toHaveBeenCalled();
    });

    it('should track response time on send', () => {
      const originalSend = mockRes.send;
      performanceMiddleware(mockReq as Request, mockRes as Response, mockNext);
      
      if (mockRes.send) {
        mockRes.send('test response');
        expect(mockRes.send).not.toBe(originalSend);
        expect(originalSend).toHaveBeenCalledWith('test response');
      }
    });
  });

  describe('errorTrackingMiddleware', () => {
    it('should track 4xx errors', () => {
      mockRes.statusCode = 400;
      errorTrackingMiddleware(mockReq as Request, mockRes as Response, mockNext);
      
      if (mockRes.send) {
        mockRes.send('error response');
      }
      
      const metrics = performanceMonitor.getMetrics();
      expect(metrics.totalErrors).toBe(1);
    });

    it('should track 5xx errors', () => {
      mockRes.statusCode = 500;
      errorTrackingMiddleware(mockReq as Request, mockRes as Response, mockNext);
      
      if (mockRes.send) {
        mockRes.send('server error');
      }
      
      const metrics = performanceMonitor.getMetrics();
      expect(metrics.totalErrors).toBe(1);
    });

    it('should not track 2xx responses as errors', () => {
      mockRes.statusCode = 200;
      errorTrackingMiddleware(mockReq as Request, mockRes as Response, mockNext);
      
      if (mockRes.send) {
        mockRes.send('success response');
      }
      
      const metrics = performanceMonitor.getMetrics();
      expect(metrics.totalErrors).toBe(0);
    });

    it('should not track 3xx responses as errors', () => {
      mockRes.statusCode = 302;
      errorTrackingMiddleware(mockReq as Request, mockRes as Response, mockNext);
      
      if (mockRes.send) {
        mockRes.send('redirect response');
      }
      
      const metrics = performanceMonitor.getMetrics();
      expect(metrics.totalErrors).toBe(0);
    });
  });
});
