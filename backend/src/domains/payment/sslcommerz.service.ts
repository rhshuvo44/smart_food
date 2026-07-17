import mongoose from 'mongoose';
import axios from 'axios';
import { Payment, User } from '../../models/index.js';
import { NotFoundError, ValidationError } from '../../shared/errors.js';
import { EventBus } from '../../shared/event-bus.js';
import { logger } from '../../config/logger.js';
import { env } from '../../config/env.js';
import { PaymentStatus } from '@smartfood/shared';

const eventBus = EventBus.getInstance();

interface SslcommerzInitResponse {
  status: 'success' | 'fail';
  failedreason?: string;
  sessionkey?: string;
  GatewayPageURL?: string;
  TranId?: string;
}

interface SslcommerzValidationResponse {
  status: 'VALID' | 'VALIDATED' | 'FAILED';
  tran_id: string;
  amount: string;
  currency: string;
  error?: string;
}

async function resolveUserId(publicId: string): Promise<mongoose.Types.ObjectId> {
  const user = await User.findOne({ publicId });
  if (!user) {
    throw new NotFoundError('User not found');
  }
  return user._id as mongoose.Types.ObjectId;
}

export async function initPayment(
  orderId: string,
  customerPublicId: string,
  amount: number,
  customerName: string,
  customerEmail: string,
  customerPhone: string,
  currency: string = 'BDT',
) {
  if (!mongoose.Types.ObjectId.isValid(orderId)) {
    throw new NotFoundError('Invalid order ID');
  }

  const customerId = await resolveUserId(customerPublicId);

  const existingPayment = await Payment.findOne({ orderId });
  if (existingPayment) {
    if (existingPayment.sslcommerzSessionKey) {
      return { payment: existingPayment, gatewayPageURL: null };
    }
    await Payment.deleteOne({ _id: existingPayment._id });
  }

  const tranId = `SF${Date.now()}${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

  const postData = {
    store_id: env.SSLCOMMERZ_STORE_ID,
    store_passwd: env.SSLCOMMERZ_STORE_PASSWORD,
    total_amount: amount.toFixed(2),
    currency,
    tran_id: tranId,
    success_url: `${env.APP_BASE_URL}/api/v1/payments/sslcommerz/success`,
    fail_url: `${env.APP_BASE_URL}/api/v1/payments/sslcommerz/fail`,
    cancel_url: `${env.APP_BASE_URL}/api/v1/payments/sslcommerz/cancel`,
    ipn_url: `${env.APP_BASE_URL}/api/v1/payments/sslcommerz/ipn`,
    cus_name: customerName,
    cus_email: customerEmail,
    cus_phone: customerPhone,
    cus_add1: 'N/A',
    cus_city: 'N/A',
    cus_country: 'Bangladesh',
    shipping_method: 'NO',
    product_name: 'Food Order',
    product_category: 'Food',
    product_profile: 'general',
    value_a: orderId,
    value_b: customerId.toString(),
  };

  logger.info({ tranId, orderId, amount }, 'Initializing SSLCommerz payment');

  const response = await axios.post<SslcommerzInitResponse>(
    `${env.SSLCOMMERZ_BASE_URL}/gwprocess/v4/api.php`,
    new URLSearchParams(postData),
    {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      timeout: 30000,
    },
  );

  if (response.data.status !== 'success') {
    logger.error({ response: response.data }, 'SSLCommerz init failed');
    throw new ValidationError(
      response.data.failedreason || 'SSLCommerz payment initialization failed',
    );
  }

  const payment = await Payment.create({
    orderId: new mongoose.Types.ObjectId(orderId),
    customerId,
    amount,
    currency,
    status: PaymentStatus.PENDING,
    sslcommerzSessionKey: response.data.sessionkey,
    sslcommerzTranId: response.data.TranId || tranId,
    gateway: 'sslcommerz',
  });

  logger.info(
    { paymentId: payment._id, orderId, sessionKey: response.data.sessionkey },
    'SSLCommerz payment initialized',
  );

  return {
    payment,
    gatewayPageURL: response.data.GatewayPageURL,
  };
}

export async function handleSuccess(tranId: string, _orderId: string) {
  const payment = await Payment.findOne({ sslcommerzTranId: tranId });
  if (!payment) {
    throw new NotFoundError('Payment not found for this transaction');
  }

  const isValid = await validateTransaction(tranId, payment.amount);
  if (!isValid) {
    payment.status = PaymentStatus.FAILED;
    payment.failureReason = 'Transaction validation failed';
    await payment.save();
    throw new ValidationError('Transaction validation failed');
  }

  payment.status = PaymentStatus.COMPLETED;
  await payment.save();

  eventBus.publish({
    id: tranId,
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

  logger.info({ paymentId: payment._id, tranId }, 'SSLCommerz payment completed');
  return payment;
}

export async function handleFailure(tranId: string) {
  const payment = await Payment.findOne({ sslcommerzTranId: tranId });
  if (!payment) {
    throw new NotFoundError('Payment not found for this transaction');
  }

  payment.status = PaymentStatus.FAILED;
  payment.failureReason = 'Payment failed at SSLCommerz gateway';
  await payment.save();

  eventBus.publish({
    id: tranId,
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

  logger.info({ paymentId: payment._id, tranId }, 'SSLCommerz payment failed');
  return payment;
}

export async function handleCancel(tranId: string) {
  const payment = await Payment.findOne({ sslcommerzTranId: tranId });
  if (!payment) {
    throw new NotFoundError('Payment not found for this transaction');
  }

  payment.status = PaymentStatus.FAILED;
  payment.failureReason = 'Payment cancelled by user';
  await payment.save();

  logger.info({ paymentId: payment._id, tranId }, 'SSLCommerz payment cancelled');
  return payment;
}

export async function handleIPN(postData: Record<string, string>) {
  const tranId = postData.tran_id;
  const status = postData.status;

  if (!tranId) {
    throw new ValidationError('Missing transaction ID in IPN');
  }

  const payment = await Payment.findOne({ sslcommerzTranId: tranId });
  if (!payment) {
    logger.warn({ tranId }, 'IPN received for unknown transaction');
    return null;
  }

  if (status === 'VALID' || status === 'VALIDATED') {
    const isValid = await validateTransaction(tranId, payment.amount);
    if (isValid) {
      payment.status = PaymentStatus.COMPLETED;
      await payment.save();

      eventBus.publish({
        id: tranId,
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
    } else {
      payment.status = PaymentStatus.FAILED;
      payment.failureReason = 'IPN validation failed';
      await payment.save();
    }
  } else {
    payment.status = PaymentStatus.FAILED;
    payment.failureReason = postData.error || 'IPN reported failure';
    await payment.save();
  }

  return payment;
}

async function validateTransaction(tranId: string, expectedAmount: number): Promise<boolean> {
  try {
    const response = await axios.post<SslcommerzValidationResponse>(
      `${env.SSLCOMMERZ_BASE_URL}/validator/api/validationserverAPI.php`,
      new URLSearchParams({
        store_id: env.SSLCOMMERZ_STORE_ID,
        store_passwd: env.SSLCOMMERZ_STORE_PASSWORD,
        tran_id: tranId,
      }),
      {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        timeout: 15000,
      },
    );

    if (response.data.status !== 'VALID' && response.data.status !== 'VALIDATED') {
      logger.error({ response: response.data }, 'Transaction validation returned invalid');
      return false;
    }

    const validatedAmount = parseFloat(response.data.amount);
    if (Math.abs(validatedAmount - expectedAmount) > 0.01) {
      logger.error(
        { expected: expectedAmount, received: validatedAmount },
        'Amount mismatch in validation',
      );
      return false;
    }

    return true;
  } catch (error) {
    logger.error({ error, tranId }, 'Transaction validation request failed');
    return false;
  }
}
