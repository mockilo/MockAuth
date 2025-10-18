import { Request, Response, NextFunction } from 'express';
import { ErrorResponse } from '../types';

export function errorHandler(
  error: any,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  console.error('Error:', error);

  const errorResponse: ErrorResponse = {
    success: false,
    error: error.message || 'Internal server error',
    code: error.code || 'INTERNAL_ERROR',
    timestamp: new Date().toISOString(),
  };

  // Add details for validation errors
  if (error.details) {
    errorResponse.details = error.details;
  }

  // Set appropriate status code
  let statusCode = 500;

  if (error.name === 'ValidationError') {
    statusCode = 400;
  } else if (error.name === 'UnauthorizedError') {
    statusCode = 401;
  } else if (error.name === 'ForbiddenError') {
    statusCode = 403;
  } else if (error.name === 'NotFoundError') {
    statusCode = 404;
  } else if (error.name === 'ConflictError') {
    statusCode = 409;
  } else if (error.name === 'TooManyRequestsError') {
    statusCode = 429;
  }

  res.status(statusCode).json(errorResponse);
}
