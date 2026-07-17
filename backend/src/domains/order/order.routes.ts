import { Router } from 'express';
import { listOrders, getById, updateStatus, getStatusCounts } from './order.controller.js';
import { asyncHandler } from '../../shared/async-handler.js';
import { authMiddleware, requireRole } from '../../middleware/auth.middleware.js';
import { UserRole } from '@smartfood/shared';

const router = Router();

// Specific routes must come before parameterized routes
router.get('/orders/status-counts/:restaurantId', authMiddleware, asyncHandler(getStatusCounts));

router.get('/orders', authMiddleware, asyncHandler(listOrders));
router.get('/orders/:id', authMiddleware, asyncHandler(getById));
router.patch(
  '/orders/:id/status',
  authMiddleware,
  requireRole(UserRole.RESTAURANT_OWNER),
  asyncHandler(updateStatus),
);

export { router as orderRoutes };
