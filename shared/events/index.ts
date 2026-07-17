import type { IDomainEvent } from './base-event.js';
import type {
  OrderEvent,
  IOrderCreatedEvent,
  IOrderStatusChangedEvent,
  IOrderCancelledEvent,
  IOrderCompletedEvent,
} from './order.events.js';
import type {
  PaymentEvent,
  IPaymentCompletedEvent,
  IPaymentFailedEvent,
  IPaymentRefundedEvent,
} from './payment.events.js';
import type {
  RestaurantEvent,
  IMenuUpdatedEvent,
  IRestaurantStatusEvent,
} from './restaurant.events.js';
import type {
  DeliveryEvent,
  IDeliveryAssignedEvent,
  IDeliveryStatusChangedEvent,
  IDeliveryCompletedEvent,
} from './delivery.events.js';

export type {
  IDomainEvent,
  OrderEvent,
  IOrderCreatedEvent,
  IOrderStatusChangedEvent,
  IOrderCancelledEvent,
  IOrderCompletedEvent,
  PaymentEvent,
  IPaymentCompletedEvent,
  IPaymentFailedEvent,
  IPaymentRefundedEvent,
  RestaurantEvent,
  IMenuUpdatedEvent,
  IRestaurantStatusEvent,
  DeliveryEvent,
  IDeliveryAssignedEvent,
  IDeliveryStatusChangedEvent,
  IDeliveryCompletedEvent,
};

export type {
  IChatJoinPayload,
  IChatLeavePayload,
  IChatSendMessagePayload,
  IChatNewMessagePayload,
  IChatTypingPayload,
  IChatUserTypingPayload,
  IChatMarkReadPayload,
  IChatReadReceiptPayload,
} from './chat.events.js';
export { ChatSocketEvents } from './chat.events.js';

export type DomainEvent = OrderEvent | PaymentEvent | RestaurantEvent | DeliveryEvent;
