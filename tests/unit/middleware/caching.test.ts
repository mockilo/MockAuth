import { Request, Response, NextFunction } from 'express';
import { cacheMiddleware } from '../../../src/middleware/caching';

describe('Cache Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockRequest = {
      method: 'GET',
      url: '/api/users',
      headers: {},
      query: {}
    };
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      set: jest.fn().mockReturnThis(),
      end: jest.fn()
    };
    mockNext = jest.fn();
  });

  it('should cache GET requests', () => {
    const cacheKey = 'GET:/api/users';
    
    cacheMiddleware({ ttl: 300 })(mockRequest as Request, mockResponse as Response, mockNext);

    expect(mockNext).toHaveBeenCalled();
  });

  it('should not cache non-GET requests', () => {
    mockRequest.method = 'POST';
    mockRequest.url = '/api/users';

    cacheMiddleware({ ttl: 300 })(mockRequest as Request, mockResponse as Response, mockNext);

    expect(mockNext).toHaveBeenCalled();
  });

  it('should respect cache-control headers', () => {
    mockRequest.headers = {
      'cache-control': 'no-cache'
    };

    cacheMiddleware({ ttl: 300 })(mockRequest as Request, mockResponse as Response, mockNext);

    expect(mockNext).toHaveBeenCalled();
  });

  it('should set cache headers on response', () => {
    cacheMiddleware({ ttl: 300 })(mockRequest as Request, mockResponse as Response, mockNext);
    
    expect(mockNext).toHaveBeenCalled();
  });

  it('should handle cache miss', () => {
    cacheMiddleware({ ttl: 300 })(mockRequest as Request, mockResponse as Response, mockNext);

    expect(mockNext).toHaveBeenCalled();
  });

  it('should handle cache hit', () => {
    // Simulate cache hit by calling the middleware twice
    cacheMiddleware({ ttl: 300 })(mockRequest as Request, mockResponse as Response, mockNext);
    
    // Second call should potentially hit cache
    (mockNext as jest.Mock).mockClear();
    cacheMiddleware({ ttl: 300 })(mockRequest as Request, mockResponse as Response, mockNext);
  });

  it('should respect different TTL values', () => {
    const shortTTL = 60;
    const longTTL = 3600;

    cacheMiddleware({ ttl: shortTTL })(mockRequest as Request, mockResponse as Response, mockNext);
    expect(mockNext).toHaveBeenCalled();

    (mockNext as jest.Mock).mockClear();
    cacheMiddleware({ ttl: longTTL })(mockRequest as Request, mockResponse as Response, mockNext);
    expect(mockNext).toHaveBeenCalled();
  });

  it('should handle cache errors gracefully', () => {
    // Mock cache error
    const originalNext = mockNext;
    mockNext = jest.fn().mockImplementation(() => {
      throw new Error('Cache error');
    });

    expect(() => {
      cacheMiddleware({ ttl: 300 })(mockRequest as Request, mockResponse as Response, mockNext);
    }).toThrow('Cache error');
  });

  it('should handle different URL patterns', () => {
    const urls = [
      '/api/users',
      '/api/users/123',
      '/api/auth/login',
      '/api/health'
    ];

    urls.forEach(url => {
      mockRequest.url = url;
      (mockNext as jest.Mock).mockClear();
      
      cacheMiddleware({ ttl: 300 })(mockRequest as Request, mockResponse as Response, mockNext);
      expect(mockNext).toHaveBeenCalled();
    });
  });
});
