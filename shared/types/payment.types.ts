import type { PaymentStatus } from '../constants/payment-status.js';

export interface IPayment {
  id: string;
  orderId: string;
  customerId: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  stripePaymentIntentId?: string;
  stripeClientSecret?: string;
  paymentMethod?: string;
  refundAmount?: number;
  refundReason?: string;
  failureReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IPaymentIntent {
  amount: number;
  currency: string;
  orderId: string;
  customerId: string;
  paymentMethodId?: string;
}
