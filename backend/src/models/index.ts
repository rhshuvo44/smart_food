export { User } from './user.model.js';
export type { IUserDocument } from './user.model.js';

export { Restaurant } from './restaurant.model.js';
export type { IRestaurantDocument, IBusinessHoursDocument } from './restaurant.model.js';

export { MenuItem } from './menu-item.model.js';
export type { IMenuItemDocument } from './menu-item.model.js';

export { Order } from './order.model.js';
export type { IOrderDocument, IOrderItemDocument } from './order.model.js';

export { Payment } from './payment.model.js';
export type { IPaymentDocument } from './payment.model.js';

export { Delivery } from './delivery.model.js';
export type { IDeliveryDocument } from './delivery.model.js';

export { DeliveryZone } from './delivery-zone.model.js';
export type { IDeliveryZoneDocument } from './delivery-zone.model.js';

export { UserAddress } from './user-address.model.js';
export type { IUserAddressDocument } from './user-address.model.js';

export { Notification } from '../domains/notifications/notification.model.js';
export type {
  INotificationDocument,
  NotificationType,
  NotificationChannel,
  NotificationStatus,
} from '../domains/notifications/notification.model.js';

export { NotificationPreference } from '../domains/notifications/notification-preference.model.js';
export type {
  INotificationPreferenceDocument,
  IChannelPreferences,
  ITypePreferences,
} from '../domains/notifications/notification-preference.model.js';

export { NotificationTemplate } from '../domains/notifications/notification-template.model.js';
export type { INotificationTemplateDocument } from '../domains/notifications/notification-template.model.js';

export { Conversation } from './conversation.model.js';
export type { IConversationDocument } from './conversation.model.js';

export { Message } from './message.model.js';
export type { IMessageDocument } from './message.model.js';
