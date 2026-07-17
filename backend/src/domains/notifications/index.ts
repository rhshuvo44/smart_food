// Models
export { Notification } from './notification.model.js';
export type {
  INotificationDocument,
  NotificationType,
  NotificationChannel,
  NotificationStatus,
} from './notification.model.js';

export { NotificationPreference } from './notification-preference.model.js';
export type {
  INotificationPreferenceDocument,
  IChannelPreferences,
  ITypePreferences,
} from './notification-preference.model.js';

export { NotificationTemplate } from './notification-template.model.js';
export type { INotificationTemplateDocument } from './notification-template.model.js';

// Services
export {
  sendPush,
  sendPushToMultiple,
  checkPushReceipts,
  resetPushRateLimiter,
} from './push.service.js';
export type { PushResult } from './push.service.js';

export {
  sendEmail,
  sendEmailWithTemplate,
  resetEmailRateLimiter,
  resetEmailClient,
} from './email.service.js';
export type { EmailResult } from './email.service.js';

export { sendSMS, resetSmsRateLimiter, resetTwilioClient } from './sms.service.js';
export type { SmsResult } from './sms.service.js';

export { sendInApp } from './in-app.service.js';
export type { InAppResult } from './in-app.service.js';

export {
  sendNotification,
  sendOrderConfirmation,
  sendOrderStatusUpdate,
  sendOrderCancellation,
  sendOrderCompletion,
} from './notification.service.js';
export type { SendNotificationResult, SendNotificationOptions } from './notification.service.js';

export { templateService } from './template.service.js';

// Event Subscribers
export { registerNotificationSubscribers } from './event-subscribers.js';

// Routes
export { notificationRoutes } from './notification.routes.js';

// Seeds
export { seedNotificationTemplates } from './seeds/notification-templates.seed.js';
