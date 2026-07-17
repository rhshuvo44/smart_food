import { Router } from 'express';
import {
  listAllUsers,
  getUser,
  updateUserProfile,
  listUserOrders,
} from './admin-users.controller.js';
import { asyncHandler } from '../../../shared/async-handler.js';
import { authMiddleware, requireRole } from '../../../middleware/auth.middleware.js';
import { rateLimitMiddleware } from '../../../middleware/rate-limit.middleware.js';

const adminRateLimit = rateLimitMiddleware({ windowMs: 15 * 60 * 1000, maxRequests: 200 });
import { UserRole } from '@smartfood/shared';

const router = Router();

router.get(
  '/admin/users',
  authMiddleware,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  adminRateLimit,
  asyncHandler(listAllUsers),
);
router.get(
  '/admin/users/:id',
  authMiddleware,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  adminRateLimit,
  asyncHandler(getUser),
);
router.get(
  '/admin/users/:id/orders',
  authMiddleware,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  adminRateLimit,
  asyncHandler(listUserOrders),
);
router.patch(
  '/admin/users/:id',
  authMiddleware,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  adminRateLimit,
  asyncHandler(updateUserProfile),
);

export { router as adminUsersRoutes };
