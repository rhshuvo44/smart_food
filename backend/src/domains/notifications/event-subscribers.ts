import type mongoose from 'mongoose';
import { EventBus } from '../../shared/event-bus.js';
import { logger } from '../../config/logger.js';
import { Order } from '../../models/order.model.js';
import {
  sendOrderConfirmation,
  sendOrderStatusUpdate,
  sendOrderCancellation,
  sendOrderCompletion,
} from './notification.service.js';
import type {
  IOrderCreatedEvent,
  IOrderStatusChangedEvent,
  IOrderCancelledEvent,
  IOrderCompletedEvent,
} from '@smartfood/shared';

const eventBus = EventBus.getInstance();

/**
 * Register all notification event subscribers.
 * Called once at server startup.
 */
export function registerNotificationSubscribers(): void {
  eventBus.subscribe<IOrderCreatedEvent>('order.created', async (event) => {
    logger.info(
      { orderId: event.aggregateId, customerId: event.data.customerId },
      'Order created event received — sending confirmation notification',
    );
    await handleOrderCreated(event);
  });

  eventBus.subscribe<IOrderStatusChangedEvent>('order.status_changed', async (event) => {
    logger.info(
      { orderId: event.data.orderId, newStatus: event.data.newStatus },
      'Order status changed event received — sending status update notification',
    );
    await handleOrderStatusChanged(event);
  });

  eventBus.subscribe<IOrderCancelledEvent>('order.cancelled', async (event) => {
    logger.info(
      { orderId: event.data.orderId, reason: event.data.reason },
      'Order cancelled event received — sending cancellation notification',
    );
    await handleOrderCancelled(event);
  });

  eventBus.subscribe<IOrderCompletedEvent>('order.completed', async (event) => {
    logger.info(
      { orderId: event.data.orderId },
      'Order completed event received — sending completion notification',
    );
    await handleOrderCompleted(event);
  });

  logger.info('Notification event subscribers registered');
}

/**
 * Handle order.created event.
 * Fire-and-forget notification sending — never block the event bus.
 */
async function handleOrderCreated(event: IOrderCreatedEvent): Promise<void> {
  try {
    const order = await Order.findById(event.aggregateId)
      .populate('customerId')
      .populate('restaurantId', 'name');

    if (!order) {
      logger.error({ orderId: event.aggregateId }, 'Order not found for notification');
      return;
    }

    const user = order.customerId as unknown as mongoose.Document & {
      _id: mongoose.Types.ObjectId;
      firstName: string;
      lastName: string;
      email: string;
      phone?: string;
    };

    if (!user || !user._id) {
      logger.error({ orderId: event.aggregateId }, 'Customer not found for order notification');
      return;
    }

    // Fire-and-forget — do not await
    sendOrderConfirmation(order, user as any).catch((error) => {
      logger.error(
        { error, orderId: event.aggregateId },
        'Failed to send order confirmation notification',
      );
    });
  } catch (error) {
    logger.error({ error, orderId: event.aggregateId }, 'Error in handleOrderCreated');
  }
}

/**
 * Handle order.status_changed event.
 */
async function handleOrderStatusChanged(event: IOrderStatusChangedEvent): Promise<void> {
  try {
    const order = await Order.findById(event.data.orderId).populate('customerId');

    if (!order) {
      logger.error({ orderId: event.data.orderId }, 'Order not found for status notification');
      return;
    }

    const user = order.customerId as unknown as mongoose.Document & {
      _id: mongoose.Types.ObjectId;
      firstName: string;
      lastName: string;
      email: string;
      phone?: string;
    };

    if (!user || !user._id) {
      logger.error({ orderId: event.data.orderId }, 'Customer not found for status notification');
      return;
    }

    sendOrderStatusUpdate(
      order,
      user as any,
      event.data.previousStatus,
      event.data.newStatus,
    ).catch((error) => {
      logger.error(
        { error, orderId: event.data.orderId },
        'Failed to send order status notification',
      );
    });
  } catch (error) {
    logger.error({ error, orderId: event.data.orderId }, 'Error in handleOrderStatusChanged');
  }
}

/**
 * Handle order.cancelled event.
 */
async function handleOrderCancelled(event: IOrderCancelledEvent): Promise<void> {
  try {
    const order = await Order.findById(event.data.orderId).populate('customerId');

    if (!order) {
      logger.error(
        { orderId: event.data.orderId },
        'Order not found for cancellation notification',
      );
      return;
    }

    const user = order.customerId as unknown as mongoose.Document & {
      _id: mongoose.Types.ObjectId;
      firstName: string;
      lastName: string;
      email: string;
      phone?: string;
    };

    if (!user || !user._id) {
      logger.error(
        { orderId: event.data.orderId },
        'Customer not found for cancellation notification',
      );
      return;
    }

    sendOrderCancellation(order, user as any, event.data.reason).catch((error) => {
      logger.error(
        { error, orderId: event.data.orderId },
        'Failed to send cancellation notification',
      );
    });
  } catch (error) {
    logger.error({ error, orderId: event.data.orderId }, 'Error in handleOrderCancelled');
  }
}

/**
 * Handle order.completed event.
 */
async function handleOrderCompleted(event: IOrderCompletedEvent): Promise<void> {
  try {
    const order = await Order.findById(event.data.orderId).populate('customerId');

    if (!order) {
      logger.error({ orderId: event.data.orderId }, 'Order not found for completion notification');
      return;
    }

    const user = order.customerId as unknown as mongoose.Document & {
      _id: mongoose.Types.ObjectId;
      firstName: string;
      lastName: string;
      email: string;
      phone?: string;
    };

    if (!user || !user._id) {
      logger.error(
        { orderId: event.data.orderId },
        'Customer not found for completion notification',
      );
      return;
    }

    sendOrderCompletion(order, user as any).catch((error) => {
      logger.error(
        { error, orderId: event.data.orderId },
        'Failed to send completion notification',
      );
    });
  } catch (error) {
    logger.error({ error, orderId: event.data.orderId }, 'Error in handleOrderCompleted');
  }
}
