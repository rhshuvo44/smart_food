import type { OrderStatus } from '../constants/order-status.js';
import type { IGeoPoint } from './common.types.js';

export interface IOrderItem {
  menuItemId: string;
  name: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  specialInstructions?: string;
}

export interface IOrder {
  id: string;
  customerId: string;
  restaurantId: string;
  items: IOrderItem[];
  subtotal: number;
  tax: number;
  deliveryFee: number;
  tip?: number;
  total: number;
  status: OrderStatus;
  deliveryAddress: IGeoPoint;
  paymentId?: string;
  driverId?: string;
  estimatedDeliveryTime?: Date;
  actualDeliveryTime?: Date;
  createdAt: Date;
  updatedAt: Date;
}
