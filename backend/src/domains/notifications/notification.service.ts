import { logger } from '../../config/logger.js';
import {
  Notification,
  type NotificationType,
  type NotificationChannel,
} from './notification.model.js';
import {
  NotificationPreference,
  type INotificationPreferenceDocument,
} from './notification-preference.model.js';
import { templateService } from './template.service.js';
import { sendPush } from './push.service.js';
import { sendEmailWithTemplate } from './email.service.js';
import { sendSMS } from './sms.service.js';
import { sendInApp } from './in-app.service.js';
import type { IUserDocument } from '../../models/user.model.js';
import type { IOrderDocument } from '../../models/order.model.js';

// Default fallback chain order
const FALLBACK_CHAIN: NotificationChannel[] = ['push', 'email', 'sms', 'in_app'];

export interface SendNotificationOptions {
  /** Override the channel order */
  channels?: NotificationChannel[];
  /** Force send even if user opted out of some channels */
  force?: boolean;
}

export interface SendNotificationResult {
  notificationId?: string;
  channelResults: Array<{
    channel: NotificationChannel;
    success: boolean;
    error?: string;
  }>;
}

/**
 * Get or create notification preferences for a user.
 */
async function getPreferences(userId: string): Promise<INotificationPreferenceDocument> {
  let prefs = await NotificationPreference.findOne({ userId });
  if (!prefs) {
    prefs = await NotificationPreference.create({ userId });
  }
  return prefs;
}

/**
 * Check if a channel is allowed based on user preferences.
 */
function isChannelAllowed(
  prefs: INotificationPreferenceDocument,
  channel: NotificationChannel,
  type: NotificationType,
): boolean {
  // Check channel preference
  if (!prefs.channels[channel]) {
    return false;
  }

  // Check type preference
  if (prefs.types[type] === false) {
    return false;
  }

  // Check quiet hours (only for push, email, sms — not in_app)
  if (channel !== 'in_app' && prefs.quietHoursStart && prefs.quietHoursEnd) {
    const now = new Date();
    const userTimeStr = now.toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      timeZone: prefs.timezone || 'UTC',
    });

    if (prefs.quietHoursStart < prefs.quietHoursEnd) {
      // Normal range: e.g., 22:00 - 08:00
      if (userTimeStr >= prefs.quietHoursStart && userTimeStr <= prefs.quietHoursEnd) {
        return false;
      }
    } else {
      // Overnight range: e.g., 22:00 - 06:00
      if (userTimeStr >= prefs.quietHoursStart || userTimeStr <= prefs.quietHoursEnd) {
        return false;
      }
    }
  }

  return true;
}

/**
 * Send a notification with fallback chain.
 * This is the main entry point for all notification sending.
 */
export async function sendNotification(
  userId: string,
  type: NotificationType,
  data: Record<string, unknown>,
  options: SendNotificationOptions = {},
): Promise<SendNotificationResult> {
  const channels = options.channels || FALLBACK_CHAIN;
  const channelResults: SendNotificationResult['channelResults'] = [];

  try {
    // Get or create preferences (unless force mode)
    let prefs: INotificationPreferenceDocument | null = null;
    if (!options.force) {
      prefs = await getPreferences(userId);
    }

    // Try each channel in order (fallback chain)
    for (const channel of channels) {
      // Check preferences
      if (prefs && !options.force && !isChannelAllowed(prefs, channel, type)) {
        logger.info({ userId, type, channel }, 'Channel skipped due to user preferences');
        continue;
      }

      // Get template for this channel
      const template = await templateService.getTemplate(type, channel);
      if (!template) {
        logger.warn({ type, channel }, 'No template found for notification type/channel');
        channelResults.push({ channel, success: false, error: 'Template not found' });
        continue;
      }

      // Render template with data
      const rendered = templateService.renderTemplate(template, data);

      let result: { success: boolean; error?: string; notificationId?: string };

      switch (channel) {
        case 'push': {
          const token = data.pushToken as string | undefined;
          if (!token) {
            logger.warn({ userId }, 'No push token available for push notification');
            result = { success: false, error: 'No push token' };
            break;
          }
          const pushResult = await sendPush(token, rendered.title, rendered.body, data);
          result = {
            success: pushResult.success,
            error: pushResult.error,
          };

          // Track in DB
          await Notification.create({
            userId,
            type,
            channel: 'push',
            title: rendered.title,
            body: rendered.body,
            data,
            status: pushResult.success ? 'sent' : 'failed',
            ...(pushResult.success
              ? { deliveredAt: new Date() }
              : { failedAt: new Date(), errorMessage: pushResult.error }),
            metadata: pushResult.ticketId ? { fcmMessageId: pushResult.ticketId } : undefined,
          });
          break;
        }

        case 'email': {
          const email = data.email as string | undefined;
          if (!email) {
            logger.warn({ userId }, 'No email address available');
            result = { success: false, error: 'No email address' };
            break;
          }

          // Pass firstName and other context for template rendering in title
          const emailResult = await sendEmailWithTemplate(email, type, {
            ...data,
            firstName: data.firstName,
          });
          result = {
            success: emailResult.success,
            error: emailResult.error,
          };
          await Notification.create({
            userId,
            type,
            channel: 'email',
            title: rendered.title,
            body: rendered.body,
            data,
            status: emailResult.success ? 'sent' : 'failed',
            ...(emailResult.success
              ? { deliveredAt: new Date() }
              : { failedAt: new Date(), errorMessage: emailResult.error }),
            metadata: emailResult.messageId
              ? { sendgridMessageId: emailResult.messageId }
              : undefined,
          });
          break;
        }

        case 'sms': {
          const phone = data.phone as string | undefined;
          if (!phone) {
            logger.warn({ userId }, 'No phone number available for SMS');
            result = { success: false, error: 'No phone number' };
            break;
          }
          const smsResult = await sendSMS(phone, rendered.body);
          result = {
            success: smsResult.success,
            error: smsResult.error,
          };
          await Notification.create({
            userId,
            type,
            channel: 'sms',
            title: rendered.title || type,
            body: rendered.body,
            data,
            status: smsResult.success ? 'sent' : 'failed',
            ...(smsResult.success
              ? { deliveredAt: new Date() }
              : { failedAt: new Date(), errorMessage: smsResult.error }),
            metadata: smsResult.sid ? { twilioSid: smsResult.sid } : undefined,
          });
          break;
        }

        case 'in_app': {
          const inAppResult = await sendInApp(userId, type, rendered.title, rendered.body, data);
          result = {
            success: inAppResult.success,
            notificationId: inAppResult.notificationId,
            error: inAppResult.error,
          };
          break;
        }

        default:
          result = { success: false, error: `Unknown channel: ${channel}` };
      }

      channelResults.push({ channel, success: result.success, error: result.error });

      // If this channel succeeded and we have a successful result, stop the fallback chain
      if (result.success) {
        break;
      }

      // If it failed and there are more channels, continue to fallback
      logger.warn(
        { userId, type, channel, error: result.error },
        'Notification channel failed, trying fallback',
      );
    }

    return { channelResults };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error({ error: errorMessage, userId, type }, 'sendNotification failed');
    return {
      channelResults: [
        ...channelResults,
        { channel: 'in_app', success: false, error: errorMessage },
      ],
    };
  }
}

/**
 * Send order confirmation notification.
 * Tries push first, then email, and always creates in-app.
 */
export async function sendOrderConfirmation(
  order: IOrderDocument,
  user: IUserDocument,
): Promise<SendNotificationResult> {
  const data: Record<string, unknown> = {
    orderId: String(order._id),
    firstName: user.firstName,
    restaurantName:
      order.restaurantId && typeof order.restaurantId === 'object'
        ? String((order.restaurantId as any).name || 'Restaurant')
        : 'Restaurant',
    total: (order.total / 100).toFixed(2),
    itemCount: order.items.length,
    estimatedTime: order.estimatedDeliveryTime
      ? order.estimatedDeliveryTime.toLocaleTimeString()
      : 'as soon as possible',
    deliveryAddress: order.deliveryAddress?.address?.formatted || 'your address',
    email: user.email,
    phone: user.phone,
  };

  return sendNotification(String(user._id), 'order_confirmation', data);
}

/**
 * Send order status update notification.
 */
export async function sendOrderStatusUpdate(
  order: IOrderDocument,
  user: IUserDocument,
  previousStatus: string,
  newStatus: string,
): Promise<SendNotificationResult> {
  const data: Record<string, unknown> = {
    orderId: String(order._id),
    firstName: user.firstName,
    previousStatus,
    newStatus,
    email: user.email,
    phone: user.phone,
  };

  return sendNotification(String(user._id), 'order_status', data);
}

/**
 * Send order cancellation notification.
 */
export async function sendOrderCancellation(
  order: IOrderDocument,
  user: IUserDocument,
  reason: string,
): Promise<SendNotificationResult> {
  const data: Record<string, unknown> = {
    orderId: String(order._id),
    firstName: user.firstName,
    restaurantName:
      order.restaurantId && typeof order.restaurantId === 'object'
        ? String((order.restaurantId as any).name || 'Restaurant')
        : 'Restaurant',
    reason,
    email: user.email,
    phone: user.phone,
  };

  return sendNotification(String(user._id), 'order_cancelled', data);
}

/**
 * Send order completion notification.
 */
export async function sendOrderCompletion(
  order: IOrderDocument,
  user: IUserDocument,
): Promise<SendNotificationResult> {
  const data: Record<string, unknown> = {
    orderId: String(order._id),
    firstName: user.firstName,
    restaurantName:
      order.restaurantId && typeof order.restaurantId === 'object'
        ? String((order.restaurantId as any).name || 'Restaurant')
        : 'Restaurant',
    total: (order.total / 100).toFixed(2),
    deliveredAt: new Date().toLocaleString(),
    email: user.email,
    phone: user.phone,
  };

  return sendNotification(String(user._id), 'order_completed', data);
}
