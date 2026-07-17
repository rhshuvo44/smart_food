import type { IDomainEvent } from './base-event.js';

export interface IPaymentCompletedEvent extends IDomainEvent<'payment.completed'> {
  aggregateType: 'payment';
  data: {
    paymentId: string;
    orderId: string;
    amount: number;
    currency: string;
  };
}

export interface IPaymentFailedEvent extends IDomainEvent<'payment.failed'> {
  aggregateType: 'payment';
  data: {
    paymentId: string;
    orderId: string;
    failureReason: string;
  };
}

export interface IPaymentRefundedEvent extends IDomainEvent<'payment.refunded'> {
  aggregateType: 'payment';
  data: {
    paymentId: string;
    orderId: string;
    refundAmount: number;
    reason: string;
  };
}

export type PaymentEvent = IPaymentCompletedEvent | IPaymentFailedEvent | IPaymentRefundedEvent;
