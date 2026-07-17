import { Router } from 'express';
import { getDashboard } from './dashboard.controller.js';
import { asyncHandler } from '../../shared/async-handler.js';
import { authMiddleware, requireRole } from '../../middleware/auth.middleware.js';
import { UserRole } from '@smartfood/shared';

const router = Router();

router.get(
  '/dashboard/restaurant/:restaurantId',
  authMiddleware,
  requireRole(UserRole.RESTAURANT_OWNER),
  asyncHandler(getDashboard),
);

export { router as dashboardRoutes };
