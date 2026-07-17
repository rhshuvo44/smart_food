import type { IDomainEvent } from './base-event.js';

export interface IMenuUpdatedEvent extends IDomainEvent<'menu.updated'> {
  aggregateType: 'menu';
  data: {
    restaurantId: string;
    menuItemId: string;
    action: 'created' | 'updated' | 'deleted';
  };
}

export interface IRestaurantStatusEvent extends IDomainEvent<'restaurant.status'> {
  aggregateType: 'restaurant';
  data: {
    restaurantId: string;
    isActive: boolean;
    isApproved: boolean;
  };
}

export type RestaurantEvent = IMenuUpdatedEvent | IRestaurantStatusEvent;
