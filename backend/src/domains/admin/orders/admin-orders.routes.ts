import { Router } from 'express';
import { listAllOrders, getOrder } from './admin-orders.controller.js';
import { asyncHandler } from '../../../shared/async-handler.js';
import { authMiddleware, requireRole } from '../../../middleware/auth.middleware.js';
import { rateLimitMiddleware } from '../../../middleware/rate-limit.middleware.js';

const adminRateLimit = rateLimitMiddleware({ windowMs: 15 * 60 * 1000, maxRequests: 200 });
import { UserRole } from '@smartfood/shared';

const router = Router();

router.get(
  '/admin/orders',
  authMiddleware,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  adminRateLimit,
  asyncHandler(listAllOrders),
);
router.get(
  '/admin/orders/:id',
  authMiddleware,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  adminRateLimit,
  asyncHandler(getOrder),
);

export { router as adminOrdersRoutes };
