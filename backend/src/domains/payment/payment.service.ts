import mongoose from 'mongoose';
import Stripe from 'stripe';
import { Payment, User } from '../../models/index.js';
import { NotFoundError, ValidationError } from '../../shared/errors.js';
import { EventBus } from '../../shared/event-bus.js';
import { logger } from '../../config/logger.js';
import { env } from '../../config/env.js';
import { PaymentStatus } from '@smartfood/shared';

const stripe = env.STRIPE_SECRET_KEY
  ? new Stripe(env.STRIPE_SECRET_KEY, { apiVersion: '2025-04-30' as Stripe.LatestApiVersion })
  : null;

const eventBus = EventBus.getInstance();

async function resolveUserId(publicId: string): Promise<mongoose.Types.ObjectId> {
  const user = await User.findOne({ publicId });
  if (!user) {
    throw new NotFoundError('User not found');
  }
  return user._id as mongoose.Types.ObjectId;
}

export async function createPaymentIntent(
  orderId: string,
  customerPublicId: string,
  amount: number,
  currency: string = 'USD',
) {
  if (!stripe) {
    throw new ValidationError('Stripe is not configured');
  }

  if (!mongoose.Types.ObjectId.isValid(orderId)) {
    throw new NotFoundError('Invalid order ID');
  }

  const customerId = await resolveUserId(customerPublicId);

  const existingPayment = await Payment.findOne({ orderId });
  if (existingPayment) {
    if (existingPayment.stripePaymentIntentId) {
      return existingPayment;
    }
    await Payment.deleteOne({ _id: existingPayment._id });
  }

  const amountInCents = Math.round(amount * 100);

  const paymentIntent = await stripe.paymentIntents.create({
    amount: amountInCents,
    currency: currency.toLowerCase(),
    metadata: { orderId, customerId: customerId.toString() },
    automatic_payment_methods: { enabled: true },
  });

  const payment = await Payment.create({
    orderId: new mongoose.Types.ObjectId(orderId),
    customerId,
    amount,
    currency: currency.toUpperCase(),
    status: PaymentStatus.PENDING,
    stripePaymentIntentId: paymentIntent.id,
    stripeClientSecret: paymentIntent.client_secret,
    gateway: 'stripe',
  });

  logger.info(
    { paymentId: payment._id, orderId, intentId: paymentIntent.id },
    'Payment intent created',
  );

  return payment;
}

export async function confirmPayment(paymentId: string) {
  if (!mongoose.Types.ObjectId.isValid(paymentId)) {
    throw new NotFoundError('Invalid payment ID');
  }

  const payment = await Payment.findById(paymentId);
  if (!payment) {
    throw new NotFoundError('Payment not found');
  }

  if (payment.status !== PaymentStatus.PENDING) {
    throw new ValidationError(`Payment is already ${payment.status}`);
  }

  payment.status = PaymentStatus.PROCESSING;
  await payment.save();

  return payment;
}

export async function refundPayment(paymentId: string, amount?: number, reason?: string) {
  if (!stripe) {
    throw new ValidationError('Stripe is not configured');
  }

  if (!mongoose.Types.ObjectId.isValid(paymentId)) {
    throw new NotFoundError('Invalid payment ID');
  }

  const payment = await Payment.findById(paymentId);
  if (!payment) {
    throw new NotFoundError('Payment not found');
  }

  if (payment.status !== PaymentStatus.COMPLETED) {
    throw new ValidationError('Can only refund completed payments');
  }

  if (!payment.stripePaymentIntentId) {
    throw new ValidationError('No Stripe payment intent to refund');
  }

  const refundAmount = amount ? Math.round(amount * 100) : undefined;

  const refund = await stripe.refunds.create({
    payment_intent: payment.stripePaymentIntentId,
    amount: refundAmount,
    reason: reason === 'duplicate' ? 'duplicate' : undefined,
    metadata: { paymentId: payment._id.toString() },
  });

  const isFullRefund = !amount || amount >= payment.amount;
  payment.status = isFullRefund ? PaymentStatus.REFUNDED : PaymentStatus.PARTIALLY_REFUNDED;
  payment.refundAmount = amount ? amount : payment.amount;
  payment.refundReason = reason;
  await payment.save();

  eventBus.publish({
    id: refund.id,
    type: 'payment.refunded',
    aggregateId: payment._id.toString(),
    aggregateType: 'payment',
    timestamp: new Date(),
    correlationId: '',
    data: {
      paymentId: payment._id.toString(),
      orderId: payment.orderId.toString(),
      refundAmount: amount || payment.amount,
      reason: reason || '',
    },
  });

  logger.info(
    { paymentId, refundId: refund.id, amount: amount || payment.amount },
    'Payment refunded',
  );

  return payment;
}

export async function getPaymentByOrder(orderId: string) {
  if (!mongoose.Types.ObjectId.isValid(orderId)) {
    throw new NotFoundError('Invalid order ID');
  }

  const payment = await Payment.findOne({ orderId });
  if (!payment) {
    throw new NotFoundError('Payment not found for this order');
  }

  return payment;
}

export async function handleStripeWebhook(event: Stripe.Event) {
  switch (event.type) {
    case 'payment_intent.succeeded': {
      const intent = event.data.object as Stripe.PaymentIntent;
      const payment = await Payment.findOne({ stripePaymentIntentId: intent.id });
      if (!payment) {
        logger.warn({ intentId: intent.id }, 'Payment not found for successful intent');
        return;
      }

      payment.status = PaymentStatus.COMPLETED;
      payment.paymentMethod =
        typeof intent.payment_method === 'string' ? intent.payment_method : undefined;
      await payment.save();

      eventBus.publish({
        id: intent.id,
        type: 'payment.completed',
        aggregateId: payment._id.toString(),
        aggregateType: 'payment',
        timestamp: new Date(),
        correlationId: '',
        data: {
          paymentId: payment._id.toString(),
          orderId: payment.orderId.toString(),
          amount: payment.amount,
          currency: payment.currency,
        },
      });

      logger.info({ paymentId: payment._id, intentId: intent.id }, 'Payment completed via webhook');
      break;
    }

    case 'payment_intent.payment_failed': {
      const intent = event.data.object as Stripe.PaymentIntent;
      const payment = await Payment.findOne({ stripePaymentIntentId: intent.id });
      if (!payment) {
        logger.warn({ intentId: intent.id }, 'Payment not found for failed intent');
        return;
      }

      payment.status = PaymentStatus.FAILED;
      payment.failureReason = intent.last_payment_error?.message || 'Payment failed';
      await payment.save();

      eventBus.publish({
        id: intent.id,
        type: 'payment.failed',
        aggregateId: payment._id.toString(),
        aggregateType: 'payment',
        timestamp: new Date(),
        correlationId: '',
        data: {
          paymentId: payment._id.toString(),
          orderId: payment.orderId.toString(),
          failureReason: payment.failureReason,
        },
      });

      logger.info(
        { paymentId: payment._id, intentId: intent.id, reason: payment.failureReason },
        'Payment failed via webhook',
      );
      break;
    }

    default:
      logger.debug({ eventType: event.type }, 'Unhandled Stripe webhook event');
  }
}

export async function handlePaymentCompleted(paymentId: string): Promise<void> {
  const payment = await Payment.findById(paymentId);
  if (!payment) {
    throw new NotFoundError('Payment not found');
  }

  const { Order } = await import('../../models/index.js');
  await Order.findByIdAndUpdate(payment.orderId, {
    paymentId: payment._id,
    status: 'confirmed',
  });
}

export function getStripePublishableKey(): string {
  return env.STRIPE_PUBLISHABLE_KEY;
}
