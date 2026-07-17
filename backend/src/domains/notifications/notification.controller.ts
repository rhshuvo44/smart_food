import type { Request, Response } from 'express';
import { Notification } from './notification.model.js';
import { NotificationPreference } from './notification-preference.model.js';
import { sendNotification } from './notification.service.js';
import { User } from '../../models/index.js';
import { NotFoundError } from '../../shared/errors.js';
import { logger } from '../../config/logger.js';

/**
 * GET /notifications
 * Get the authenticated user's in-app notifications (paginated, sorted by createdAt desc).
 */
export async function getNotifications(req: Request, res: Response): Promise<void> {
  const { page = '1', limit = '20', type, status } = req.query;
  const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit as string, 10) || 20));
  const skip = (pageNum - 1) * limitNum;

  const filter: Record<string, unknown> = {
    userId: req.userId,
    channel: 'in_app',
  };

  if (type) filter.type = type;
  if (status) filter.status = status;

  const [notifications, total] = await Promise.all([
    Notification.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limitNum).lean(),
    Notification.countDocuments(filter),
  ]);

  res.status(200).json({
    success: true,
    data: {
      notifications,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    },
    correlationId: req.correlationId,
  });
}

/**
 * PATCH /notifications/:id/read
 * Mark a single notification as read.
 */
export async function markAsRead(req: Request, res: Response): Promise<void> {
  const { id } = req.params;

  const notification = await Notification.findOneAndUpdate(
    { _id: id, userId: req.userId },
    { status: 'opened', readAt: new Date() },
    { new: true },
  );

  if (!notification) {
    throw new NotFoundError('Notification not found');
  }

  res.status(200).json({
    success: true,
    data: { notification },
    correlationId: req.correlationId,
  });
}

/**
 * PATCH /notifications/read-all
 * Mark all of the user's in-app notifications as read.
 */
export async function markAllAsRead(req: Request, res: Response): Promise<void> {
  const result = await Notification.updateMany(
    { userId: req.userId, channel: 'in_app', readAt: null },
    { status: 'opened', readAt: new Date() },
  );

  res.status(200).json({
    success: true,
    data: { modifiedCount: result.modifiedCount },
    correlationId: req.correlationId,
  });
}

/**
 * GET /notifications/preferences
 * Get the current user's notification preferences.
 */
export async function getPreferences(req: Request, res: Response): Promise<void> {
  let prefs = await NotificationPreference.findOne({ userId: req.userId });

  if (!prefs) {
    prefs = await NotificationPreference.create({ userId: req.userId });
  }

  res.status(200).json({
    success: true,
    data: { preferences: prefs },
    correlationId: req.correlationId,
  });
}

/**
 * PATCH /notifications/preferences
 * Update the current user's notification preferences.
 */
export async function updatePreferences(req: Request, res: Response): Promise<void> {
  const { channels, types, quietHoursStart, quietHoursEnd, timezone } = req.body;

  const updateData: Record<string, unknown> = {};
  if (channels !== undefined) updateData.channels = channels;
  if (types !== undefined) updateData.types = types;
  if (quietHoursStart !== undefined) updateData.quietHoursStart = quietHoursStart;
  if (quietHoursEnd !== undefined) updateData.quietHoursEnd = quietHoursEnd;
  if (timezone !== undefined) updateData.timezone = timezone;

  const prefs = await NotificationPreference.findOneAndUpdate(
    { userId: req.userId },
    { $set: updateData },
    { new: true, upsert: true, runValidators: true },
  );

  res.status(200).json({
    success: true,
    data: { preferences: prefs },
    correlationId: req.correlationId,
  });
}

/**
 * GET /notifications/unread-count
 * Get the count of unread in-app notifications.
 */
export async function getUnreadCount(req: Request, res: Response): Promise<void> {
  const count = await Notification.countDocuments({
    userId: req.userId,
    channel: 'in_app',
    readAt: null,
  });

  res.status(200).json({
    success: true,
    data: { unreadCount: count },
    correlationId: req.correlationId,
  });
}

/**
 * POST /notifications/test
 * Send a test notification to the current user (for development/testing).
 */
export async function sendTestNotification(req: Request, res: Response): Promise<void> {
  const { type = 'order_confirmation', channel } = req.body;

  // Get the user
  const user = await User.findById(req.userId);
  if (!user) {
    throw new NotFoundError('User not found');
  }

  // Send notification as fire-and-forget
  const channels = channel ? [channel] : undefined;
  sendNotification(
    String(user._id),
    type,
    {
      firstName: user.firstName,
      orderId: 'TEST-12345',
      restaurantName: 'Test Restaurant',
      total: '25.99',
      itemCount: 3,
      estimatedTime: '30 minutes',
      deliveryAddress: '123 Test St, Test City',
      reason: 'Test cancellation',
      previousStatus: 'confirmed',
      newStatus: 'preparing',
      email: user.email,
      phone: user.phone,
    },
    { channels, force: true },
  )
    .then((result) => {
      logger.info({ userId: user._id, type, result }, 'Test notification sent');
    })
    .catch((error) => {
      logger.error({ error, userId: user._id }, 'Test notification failed');
    });

  res.status(202).json({
    success: true,
    message: 'Test notification queued for delivery',
    correlationId: req.correlationId,
  });
}

/**
 * POST /notifications/stop-all
 * Emergency stop — disables all notification channels for the user.
 */
export async function stopNotifications(req: Request, res: Response): Promise<void> {
  const prefs = await NotificationPreference.findOneAndUpdate(
    { userId: req.userId },
    {
      $set: {
        'channels.push': false,
        'channels.email': false,
        'channels.sms': false,
        'channels.in_app': false,
      },
    },
    { new: true, upsert: true },
  );

  logger.warn({ userId: req.userId }, 'All notifications stopped by user');

  res.status(200).json({
    success: true,
    data: { preferences: prefs },
    message: 'All notifications have been disabled',
    correlationId: req.correlationId,
  });
}
