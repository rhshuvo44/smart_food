import { useQuery } from '@tanstack/react-query';
import api from '../services/api';

export interface OrderDetailCustomer {
  _id?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
}

export interface OrderDetailRestaurant {
  _id?: string;
  name?: string;
  phone?: string;
}

export interface OrderDetailItem {
  name: string;
  quantity: number;
  unitPrice: number;
  totalPrice?: number;
  specialInstructions?: string;
}

export interface OrderDetail {
  _id: string;
  customerId?: OrderDetailCustomer;
  restaurantId?: OrderDetailRestaurant;
  items?: OrderDetailItem[];
  status: string;
  subtotal?: number;
  deliveryFee?: number;
  tax?: number;
  tip?: number;
  total?: number;
  createdAt?: string;
  updatedAt?: string;
}

interface OrderResponse {
  success: boolean;
  data: {
    order: OrderDetail;
  };
}

export function useOrder(orderId: string | undefined) {
  return useQuery<OrderDetail>({
    queryKey: ['admin', 'order', orderId],
    queryFn: async () => {
      const response = await api.get<OrderResponse>(`/admin/orders/${orderId}`);
      return response.data.data.order;
    },
    enabled: !!orderId,
    staleTime: 30 * 1000,
    retry: 2,
  });
}
