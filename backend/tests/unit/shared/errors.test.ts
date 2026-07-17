import {
  AppError,
  ValidationError,
  AuthError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
  RateLimitError,
} from '../../../src/shared/errors.js';

describe('AppError', () => {
  it('creates a basic AppError with correct properties', () => {
    const error = new AppError('Test error', 400, 'TEST_ERROR', { key: 'value' });

    expect(error).toBeInstanceOf(Error);
    expect(error.message).toBe('Test error');
    expect(error.statusCode).toBe(400);
    expect(error.code).toBe('TEST_ERROR');
    expect(error.details).toEqual({ key: 'value' });
    expect(error.name).toBe('AppError');
  });

  it('captures stack trace', () => {
    const error = new AppError('Test', 500, 'ERR');
    expect(error.stack).toBeDefined();
  });
});

describe('ValidationError', () => {
  it('creates with default message and status 400', () => {
    const error = new ValidationError();
    expect(error.message).toBe('Validation failed');
    expect(error.statusCode).toBe(400);
    expect(error.code).toBe('VALIDATION_ERROR');
  });

  it('accepts custom message and details', () => {
    const error = new ValidationError('Invalid email', { field: 'email' });
    expect(error.message).toBe('Invalid email');
    expect(error.details).toEqual({ field: 'email' });
  });
});

describe('AuthError', () => {
  it('creates with status 401', () => {
    const error = new AuthError();
    expect(error.statusCode).toBe(401);
    expect(error.code).toBe('AUTH_ERROR');
  });
});

describe('ForbiddenError', () => {
  it('creates with status 403', () => {
    const error = new ForbiddenError();
    expect(error.statusCode).toBe(403);
    expect(error.code).toBe('FORBIDDEN');
  });
});

describe('NotFoundError', () => {
  it('creates with status 404', () => {
    const error = new NotFoundError();
    expect(error.statusCode).toBe(404);
    expect(error.code).toBe('NOT_FOUND');
  });
});

describe('ConflictError', () => {
  it('creates with status 409', () => {
    const error = new ConflictError();
    expect(error.statusCode).toBe(409);
    expect(error.code).toBe('CONFLICT');
  });
});

describe('RateLimitError', () => {
  it('creates with status 429', () => {
    const error = new RateLimitError();
    expect(error.statusCode).toBe(429);
    expect(error.code).toBe('RATE_LIMIT_EXCEEDED');
  });
});
