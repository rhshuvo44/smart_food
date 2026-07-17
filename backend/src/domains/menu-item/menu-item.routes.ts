import { Router } from 'express';
import {
  listMenuItems,
  listCategories,
  create,
  getById,
  update,
  remove,
  toggleAvail,
} from './menu-item.controller.js';
import { asyncHandler } from '../../shared/async-handler.js';
import { authMiddleware, requireRole } from '../../middleware/auth.middleware.js';
import { UserRole } from '@smartfood/shared';

const router = Router();

// Restaurant-scoped menu routes
router.get('/restaurants/:restaurantId/menu', authMiddleware, asyncHandler(listMenuItems));
router.get(
  '/restaurants/:restaurantId/menu/categories',
  authMiddleware,
  asyncHandler(listCategories),
);
router.post(
  '/restaurants/:restaurantId/menu',
  authMiddleware,
  requireRole(UserRole.RESTAURANT_OWNER),
  asyncHandler(create),
);

// Direct menu item routes
router.get('/menu-items/:id', authMiddleware, asyncHandler(getById));
router.put(
  '/menu-items/:id',
  authMiddleware,
  requireRole(UserRole.RESTAURANT_OWNER),
  asyncHandler(update),
);
router.delete(
  '/menu-items/:id',
  authMiddleware,
  requireRole(UserRole.RESTAURANT_OWNER),
  asyncHandler(remove),
);
router.patch(
  '/menu-items/:id/availability',
  authMiddleware,
  requireRole(UserRole.RESTAURANT_OWNER),
  asyncHandler(toggleAvail),
);

export { router as menuItemRoutes };
