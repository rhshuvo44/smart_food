import type { IDomainEvent } from './base-event.js';

export interface IDeliveryAssignedEvent extends IDomainEvent<'delivery.assigned'> {
  aggregateType: 'delivery';
  data: {
    orderId: string;
    driverId: string;
    estimatedArrival: Date;
  };
}

export interface IDeliveryStatusChangedEvent extends IDomainEvent<'delivery.status_changed'> {
  aggregateType: 'delivery';
  data: {
    orderId: string;
    status: string;
    location?: {
      lat: number;
      lng: number;
    };
  };
}

export interface IDeliveryCompletedEvent extends IDomainEvent<'delivery.completed'> {
  aggregateType: 'delivery';
  data: {
    orderId: string;
    deliveredAt: Date;
    signature?: string;
  };
}

export type DeliveryEvent =
  IDeliveryAssignedEvent | IDeliveryStatusChangedEvent | IDeliveryCompletedEvent;
