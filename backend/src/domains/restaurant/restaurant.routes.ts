import { Router } from 'express';
import {
  getMyRestaurant,
  getById,
  update,
  getStats,
  updateHours,
} from './restaurant.controller.js';
import { asyncHandler } from '../../shared/async-handler.js';
import { authMiddleware, requireRole } from '../../middleware/auth.middleware.js';
import { UserRole } from '@smartfood/shared';

const router = Router();

router.get('/restaurants/me', authMiddleware, asyncHandler(getMyRestaurant));
router.get('/restaurants/:id', authMiddleware, asyncHandler(getById));
router.put(
  '/restaurants/:id',
  authMiddleware,
  requireRole(UserRole.RESTAURANT_OWNER),
  asyncHandler(update),
);
router.put(
  '/restaurants/:id/hours',
  authMiddleware,
  requireRole(UserRole.RESTAURANT_OWNER),
  asyncHandler(updateHours),
);
router.get(
  '/restaurants/:id/stats',
  authMiddleware,
  requireRole(UserRole.RESTAURANT_OWNER),
  asyncHandler(getStats),
);

export { router as restaurantRoutes };
