import { Router } from 'express';
import {
  listRestaurants,
  getRestaurant,
  toggleRestaurantStatus,
  approve,
} from './admin-restaurants.controller.js';
import { asyncHandler } from '../../../shared/async-handler.js';
import { authMiddleware, requireRole } from '../../../middleware/auth.middleware.js';
import { rateLimitMiddleware } from '../../../middleware/rate-limit.middleware.js';
import { UserRole } from '@smartfood/shared';

const adminRateLimit = rateLimitMiddleware({ windowMs: 15 * 60 * 1000, maxRequests: 200 });
const router = Router();

router.get(
  '/admin/restaurants',
  authMiddleware,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  adminRateLimit,
  asyncHandler(listRestaurants),
);
router.get(
  '/admin/restaurants/:id',
  authMiddleware,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  adminRateLimit,
  asyncHandler(getRestaurant),
);
router.patch(
  '/admin/restaurants/:id/status',
  authMiddleware,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  adminRateLimit,
  asyncHandler(toggleRestaurantStatus),
);
router.patch(
  '/admin/restaurants/:id/approve',
  authMiddleware,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  adminRateLimit,
  asyncHandler(approve),
);

export { router as adminRestaurantsRoutes };
