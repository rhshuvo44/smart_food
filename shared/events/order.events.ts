import type { IDomainEvent } from './base-event.js';
import type { IOrder } from '../types/order.types.js';

export interface IOrderCreatedEvent extends IDomainEvent<'order.created'> {
  aggregateType: 'order';
  data: {
    order: IOrder;
    customerId: string;
    restaurantId: string;
  };
}

export interface IOrderStatusChangedEvent extends IDomainEvent<'order.status_changed'> {
  aggregateType: 'order';
  data: {
    orderId: string;
    previousStatus: string;
    newStatus: string;
  };
}

export interface IOrderCancelledEvent extends IDomainEvent<'order.cancelled'> {
  aggregateType: 'order';
  data: {
    orderId: string;
    reason: string;
    cancelledBy: string;
  };
}

export interface IOrderCompletedEvent extends IDomainEvent<'order.completed'> {
  aggregateType: 'order';
  data: {
    orderId: string;
    total: number;
    completedAt: Date;
  };
}

export type OrderEvent =
  IOrderCreatedEvent | IOrderStatusChangedEvent | IOrderCancelledEvent | IOrderCompletedEvent;
