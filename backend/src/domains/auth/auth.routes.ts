import { Router } from 'express';
import {
  register,
  login,
  refresh,
  me,
  forgotPassword,
  resetPassword,
  logout,
} from './auth.controller.js';
import { asyncHandler } from '../../shared/async-handler.js';
import { validate } from '../../middleware/validation.middleware.js';
import {
  loginSchema,
  registerSchema,
  refreshTokenSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from '@smartfood/shared';
import { authMiddleware } from '../../middleware/auth.middleware.js';
import { rateLimitMiddleware } from '../../middleware/rate-limit.middleware.js';

const router = Router();

const authRateLimit = rateLimitMiddleware({ windowMs: 15 * 60 * 1000, maxRequests: 10 });

router.post('/auth/register', authRateLimit, validate(registerSchema), asyncHandler(register));
router.post('/auth/login', authRateLimit, validate(loginSchema), asyncHandler(login));
router.post('/auth/refresh', authRateLimit, validate(refreshTokenSchema), asyncHandler(refresh));
router.post(
  '/auth/forgot-password',
  authRateLimit,
  validate(forgotPasswordSchema),
  asyncHandler(forgotPassword),
);
router.post(
  '/auth/reset-password',
  authRateLimit,
  validate(resetPasswordSchema),
  asyncHandler(resetPassword),
);
router.post('/auth/logout', authMiddleware, asyncHandler(logout));
router.get('/auth/me', authMiddleware, asyncHandler(me));

export { router as authRoutes };
