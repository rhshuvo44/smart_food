import { EventBus } from '../../shared/event-bus.js';
import { logger } from '../../config/logger.js';
import { Order } from '../../models/index.js';
import type {
  IPaymentCompletedEvent,
  IPaymentFailedEvent,
  IPaymentRefundedEvent,
} from '@smartfood/shared';

const eventBus = EventBus.getInstance();

export function registerPaymentSubscribers(): void {
  eventBus.subscribe<IPaymentCompletedEvent>('payment.completed', async (event) => {
    logger.info(
      { paymentId: event.data.paymentId, orderId: event.data.orderId },
      'Payment completed — updating order',
    );

    try {
      await Order.findByIdAndUpdate(event.data.orderId, {
        paymentId: event.data.paymentId,
        status: 'confirmed',
      });
    } catch (error) {
      logger.error(
        { error, orderId: event.data.orderId },
        'Failed to update order on payment completion',
      );
    }
  });

  eventBus.subscribe<IPaymentFailedEvent>('payment.failed', async (event) => {
    logger.warn({ paymentId: event.data.paymentId, orderId: event.data.orderId }, 'Payment failed');

    try {
      await Order.findByIdAndUpdate(event.data.orderId, {
        status: 'cancelled',
      });
    } catch (error) {
      logger.error(
        { error, orderId: event.data.orderId },
        'Failed to update order on payment failure',
      );
    }
  });

  eventBus.subscribe<IPaymentRefundedEvent>('payment.refunded', async (event) => {
    logger.info(
      { paymentId: event.data.paymentId, orderId: event.data.orderId },
      'Payment refunded',
    );

    try {
      await Order.findByIdAndUpdate(event.data.orderId, {
        status: 'cancelled',
      });
    } catch (error) {
      logger.error(
        { error, orderId: event.data.orderId },
        'Failed to update order on payment refund',
      );
    }
  });

  logger.info('Payment event subscribers registered');
}
