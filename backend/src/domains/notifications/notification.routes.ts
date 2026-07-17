import { Router } from 'express';
import { asyncHandler } from '../../shared/async-handler.js';
import { authMiddleware } from '../../middleware/auth.middleware.js';
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
  getPreferences,
  updatePreferences,
  getUnreadCount,
  sendTestNotification,
  stopNotifications,
} from './notification.controller.js';

const router = Router();

// Notification preferences
router.get('/notifications/preferences', authMiddleware, asyncHandler(getPreferences));
router.patch('/notifications/preferences', authMiddleware, asyncHandler(updatePreferences));

// Unread count
router.get('/notifications/unread-count', authMiddleware, asyncHandler(getUnreadCount));

// Main notification listing
router.get('/notifications', authMiddleware, asyncHandler(getNotifications));

// Specific routes before parameterized routes
router.patch('/notifications/read-all', authMiddleware, asyncHandler(markAllAsRead));

// Test and emergency routes
router.post('/notifications/test', authMiddleware, asyncHandler(sendTestNotification));
router.post('/notifications/stop-all', authMiddleware, asyncHandler(stopNotifications));

// Parameterized routes
router.patch('/notifications/:id/read', authMiddleware, asyncHandler(markAsRead));

export { router as notificationRoutes };
