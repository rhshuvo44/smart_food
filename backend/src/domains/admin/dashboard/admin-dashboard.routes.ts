import { Router } from 'express';
import { getDashboard } from './admin-dashboard.controller.js';
import { asyncHandler } from '../../../shared/async-handler.js';
import { authMiddleware, requireRole } from '../../../middleware/auth.middleware.js';
import { rateLimitMiddleware } from '../../../middleware/rate-limit.middleware.js';
import { UserRole } from '@smartfood/shared';

const adminRateLimit = rateLimitMiddleware({ windowMs: 15 * 60 * 1000, maxRequests: 200 });
const router = Router();

router.get(
  '/admin/dashboard',
  authMiddleware,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  adminRateLimit,
  asyncHandler(getDashboard),
);

export { router as adminDashboardRoutes };
