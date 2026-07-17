import { Router } from 'express';
import { revenueAnalytics, orderAnalytics, userAnalytics } from './admin-analytics.controller.js';
import { asyncHandler } from '../../../shared/async-handler.js';
import { authMiddleware, requireRole } from '../../../middleware/auth.middleware.js';
import { rateLimitMiddleware } from '../../../middleware/rate-limit.middleware.js';
import { UserRole } from '@smartfood/shared';

const adminRateLimit = rateLimitMiddleware({ windowMs: 15 * 60 * 1000, maxRequests: 200 });
const router = Router();

router.get(
  '/admin/analytics/revenue',
  authMiddleware,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  adminRateLimit,
  asyncHandler(revenueAnalytics),
);
router.get(
  '/admin/analytics/orders',
  authMiddleware,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  adminRateLimit,
  asyncHandler(orderAnalytics),
);
router.get(
  '/admin/analytics/users',
  authMiddleware,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  adminRateLimit,
  asyncHandler(userAnalytics),
);

export { router as adminAnalyticsRoutes };
