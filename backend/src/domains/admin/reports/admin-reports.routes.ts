import { Router } from 'express';
import {
  usersReport,
  ordersReport,
  revenueReport,
  restaurantsReport,
} from './admin-reports.controller.js';
import { asyncHandler } from '../../../shared/async-handler.js';
import { authMiddleware, requireRole } from '../../../middleware/auth.middleware.js';
import { rateLimitMiddleware } from '../../../middleware/rate-limit.middleware.js';
import { UserRole } from '@smartfood/shared';

const adminRateLimit = rateLimitMiddleware({ windowMs: 15 * 60 * 1000, maxRequests: 200 });
const router = Router();

router.get(
  '/admin/reports/users',
  authMiddleware,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  adminRateLimit,
  asyncHandler(usersReport),
);
router.get(
  '/admin/reports/orders',
  authMiddleware,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  adminRateLimit,
  asyncHandler(ordersReport),
);
router.get(
  '/admin/reports/revenue',
  authMiddleware,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  adminRateLimit,
  asyncHandler(revenueReport),
);
router.get(
  '/admin/reports/restaurants',
  authMiddleware,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  adminRateLimit,
  asyncHandler(restaurantsReport),
);

export { router as adminReportsRoutes };
