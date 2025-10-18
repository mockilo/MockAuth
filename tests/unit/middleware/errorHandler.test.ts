import { Request, Response, NextFunction } from 'express';
import { errorHandler } from '../../../src/middleware/errorHandler';

describe('Error Handler Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockRequest = {};
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    mockNext = jest.fn();
  });

  it('should handle generic errors', () => {
    const error = new Error('Something went wrong');

    errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);

    expect(mockResponse.status).toHaveBeenCalledWith(500);
    expect(mockResponse.json).toHaveBeenCalledWith({
      success: false,
      error: 'Something went wrong',
      code: 'INTERNAL_ERROR',
      timestamp: expect.any(String)
    });
  });

  it('should handle validation errors', () => {
    const error = new Error('Validation failed');
    error.name = 'ValidationError';

    errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);

    expect(mockResponse.status).toHaveBeenCalledWith(400);
    expect(mockResponse.json).toHaveBeenCalledWith({
      success: false,
      error: 'Validation failed',
      code: 'INTERNAL_ERROR',
      timestamp: expect.any(String)
    });
  });

  it('should handle authentication errors', () => {
    const error = new Error('Invalid token');
    error.name = 'UnauthorizedError';

    errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);

    expect(mockResponse.status).toHaveBeenCalledWith(401);
    expect(mockResponse.json).toHaveBeenCalledWith({
      success: false,
      error: 'Invalid token',
      code: 'INTERNAL_ERROR',
      timestamp: expect.any(String)
    });
  });

  it('should handle not found errors', () => {
    const error = new Error('Resource not found');
    error.name = 'NotFoundError';

    errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);

    expect(mockResponse.status).toHaveBeenCalledWith(404);
    expect(mockResponse.json).toHaveBeenCalledWith({
      success: false,
      error: 'Resource not found',
      code: 'INTERNAL_ERROR',
      timestamp: expect.any(String)
    });
  });

  it('should handle rate limit errors', () => {
    const error = new Error('Too many requests');
    error.name = 'TooManyRequestsError';

    errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);

    expect(mockResponse.status).toHaveBeenCalledWith(429);
    expect(mockResponse.json).toHaveBeenCalledWith({
      success: false,
      error: 'Too many requests',
      code: 'INTERNAL_ERROR',
      timestamp: expect.any(String)
    });
  });

  it('should handle database connection errors', () => {
    const error = new Error('Database connection failed');
    error.name = 'DatabaseError';

    errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);

    expect(mockResponse.status).toHaveBeenCalledWith(500);
    expect(mockResponse.json).toHaveBeenCalledWith({
      success: false,
      error: 'Database connection failed',
      code: 'INTERNAL_ERROR',
      timestamp: expect.any(String)
    });
  });

  it('should handle errors without stack trace in production', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';

    const error = new Error('Production error');

    errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);

    expect(mockResponse.status).toHaveBeenCalledWith(500);
    expect(mockResponse.json).toHaveBeenCalledWith({
      success: false,
      error: 'Production error',
      code: 'INTERNAL_ERROR',
      timestamp: expect.any(String)
    });

    process.env.NODE_ENV = originalEnv;
  });

  it('should include stack trace in development', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';

    const error = new Error('Development error');

    errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);

    expect(mockResponse.status).toHaveBeenCalledWith(500);
    expect(mockResponse.json).toHaveBeenCalledWith({
      success: false,
      error: 'Development error',
      code: 'INTERNAL_ERROR',
      timestamp: expect.any(String)
    });

    process.env.NODE_ENV = originalEnv;
  });
});
