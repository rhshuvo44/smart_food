import type { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { logger } from '../config/logger.js';
import { AppError } from '../shared/errors.js';

interface MongoServerError extends Error {
  code: number;
  keyValue: Record<string, unknown>;
}

function isMongoServerError(err: Error): err is MongoServerError {
  return (err as MongoServerError).code !== undefined;
}

function getCorrelationId(req: Request): string | undefined {
  return (req as unknown as Record<string, string | undefined>).correlationId;
}

/**
 * Global error handling middleware.
 * Handles various error types and returns consistent API responses.
 */
export function errorHandler(err: Error, req: Request, res: Response, _next: NextFunction): void {
  // Default to 500 internal server error
  let statusCode = 500;
  let message = 'Internal server error';
  let code = 'INTERNAL_ERROR';
  let details: Record<string, unknown> | undefined;

  // Handle AppError (used by domain services and static factories)
  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
    code = err.code;
    details = err.details;
  }

  // Handle Mongoose Validation errors
  else if (err instanceof mongoose.Error.ValidationError) {
    statusCode = 400;
    message = 'Validation error';
    code = 'VALIDATION_ERROR';
    const fieldErrors: Record<string, string> = {};
    for (const field of Object.keys(err.errors)) {
      fieldErrors[field] = err.errors[field].message;
    }
    details = { fields: fieldErrors };
  } else if (err instanceof mongoose.Error.CastError) {
    statusCode = 400;
    message = `Invalid value for ${err.path}`;
    code = 'INVALID_ID';
  }

  // Handle Mongoose duplicate key error
  else if (isMongoServerError(err) && err.code === 11000) {
    statusCode = 409;
    message = 'Duplicate field value';
    code = 'DUPLICATE_KEY';
    details = { fields: err.keyValue };
  }

  // Handle JWT errors
  else if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token';
    code = 'INVALID_TOKEN';
  }

  // Handle JWT expired error
  else if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired';
    code = 'TOKEN_EXPIRED';
  }

  const correlationId = getCorrelationId(req);

  // Log the error
  if (statusCode >= 500) {
    logger.error(err.message, { err, correlationId });
  } else {
    logger.warn(err.message, { err, correlationId });
  }

  // Send consistent error response
  const errorResponse: Record<string, unknown> = {
    success: false,
    error: {
      code,
      message,
      ...(details && { details }),
    },
  };

  if (correlationId) {
    errorResponse.correlationId = correlationId;
  }

  res.status(statusCode).json(errorResponse);
}

export default errorHandler;
