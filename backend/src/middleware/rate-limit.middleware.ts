import rateLimit from 'express-rate-limit';
import type { RateLimitRequestHandler } from 'express-rate-limit';

interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
}

const defaultConfig: RateLimitConfig = {
  windowMs: 60 * 1000,
  maxRequests: 100,
};

export function rateLimitMiddleware(
  config: Partial<RateLimitConfig> = {},
): RateLimitRequestHandler {
  const { windowMs, maxRequests } = { ...defaultConfig, ...config };
  const effectiveMax = process.env.NODE_ENV === 'test' ? 10000 : maxRequests;

  return rateLimit({
    windowMs,
    max: effectiveMax,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      success: false,
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many requests',
      },
    },
  });
}
