import { Notification, type NotificationType } from './notification.model.js';
import { logger } from '../../config/logger.js';

export interface InAppResult {
  success: boolean;
  notificationId?: string;
  error?: string;
}

/**
 * Send an in-app notification by creating a document in the database.
 * These are fetched by the client via the notifications API.
 */
export async function sendInApp(
  userId: string,
  type: NotificationType,
  title: string,
  body: string,
  data?: Record<string, unknown>,
): Promise<InAppResult> {
  try {
    const notification = await Notification.create({
      userId,
      type,
      channel: 'in_app',
      title,
      body,
      data: data || {},
      status: 'sent',
      deliveredAt: new Date(),
    });

    logger.info({ notificationId: notification._id, userId, type }, 'In-app notification created');

    return {
      success: true,
      notificationId: String(notification._id),
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error({ error: errorMessage, userId, type }, 'Failed to create in-app notification');
    return { success: false, error: errorMessage };
  }
}
