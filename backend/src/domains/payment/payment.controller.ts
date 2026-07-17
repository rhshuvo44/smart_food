import type { Request, Response } from 'express';
import { env } from '../../config/env.js';
import {
  createPaymentIntent,
  confirmPayment,
  refundPayment,
  getPaymentByOrder,
  getStripePublishableKey,
} from './payment.service.js';
import {
  initPayment,
  handleSuccess,
  handleFailure,
  handleCancel,
  handleIPN,
} from './sslcommerz.service.js';

export async function createIntent(req: Request, res: Response): Promise<void> {
  const { orderId, amount, currency } = req.body;
  const customerId = req.userId!;

  const payment = await createPaymentIntent(orderId, customerId, amount, currency);

  res.status(201).json({
    success: true,
    data: {
      payment,
      publishableKey: getStripePublishableKey(),
    },
    correlationId: req.correlationId,
  });
}

export async function confirm(req: Request, res: Response): Promise<void> {
  const { id } = req.params;

  const payment = await confirmPayment(id);

  res.status(200).json({
    success: true,
    data: { payment },
    correlationId: req.correlationId,
  });
}

export async function refund(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const { amount, reason } = req.body;

  const payment = await refundPayment(id, amount, reason);

  res.status(200).json({
    success: true,
    data: { payment },
    correlationId: req.correlationId,
  });
}

export async function getByOrder(req: Request, res: Response): Promise<void> {
  const { orderId } = req.params;

  const payment = await getPaymentByOrder(orderId);

  res.status(200).json({
    success: true,
    data: { payment },
    correlationId: req.correlationId,
  });
}

export async function initSslcommerz(req: Request, res: Response): Promise<void> {
  const { orderId, amount, customerName, customerEmail, customerPhone, currency } = req.body;
  const customerId = req.userId!;

  const result = await initPayment(
    orderId,
    customerId,
    amount,
    customerName,
    customerEmail,
    customerPhone,
    currency,
  );

  const data: Record<string, unknown> = { payment: result.payment };
  if (result.gatewayPageURL) {
    data.gatewayPageURL = result.gatewayPageURL;
  }

  res.status(201).json({
    success: true,
    data,
    correlationId: req.correlationId,
  });
}

export async function sslcommerzSuccess(req: Request, res: Response): Promise<void> {
  const { tran_id, value_a: orderId } = req.body;

  await handleSuccess(tran_id, orderId);

  res.redirect(`${env.CORS_ORIGIN}/payment/success?orderId=${orderId}&tranId=${tran_id}`);
}

export async function sslcommerzFail(req: Request, res: Response): Promise<void> {
  const { tran_id } = req.body;

  await handleFailure(tran_id);

  res.redirect(`${env.CORS_ORIGIN}/payment/failed?tranId=${tran_id}`);
}

export async function sslcommerzCancel(req: Request, res: Response): Promise<void> {
  const { tran_id } = req.body;

  await handleCancel(tran_id);

  res.redirect(`${env.CORS_ORIGIN}/payment/cancelled?tranId=${tran_id}`);
}

export async function sslcommerzIPN(req: Request, res: Response): Promise<void> {
  await handleIPN(req.body);

  res.status(200).json({ received: true });
}
