import { useQuery } from '@tanstack/react-query';
import api from '../services/api';

export interface OrderListItem {
  _id: string;
  customerId?: { firstName: string; lastName: string; email: string };
  restaurantId?: { name: string };
  status: string;
  total: number;
  items: Array<{ name: string; quantity: number }>;
  createdAt: string;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface OrdersResponse {
  success: boolean;
  data: {
    orders: OrderListItem[];
    pagination: PaginationMeta;
  };
}

export function useOrders(status: string = 'all', search: string = '', page: number = 1) {
  return useQuery<OrderListItem[]>({
    queryKey: ['admin', 'orders', { status, search, page }],
    queryFn: async () => {
      const params: Record<string, string> = { page: page.toString(), limit: '20' };
      if (status !== 'all') params.status = status;
      if (search.trim()) params.search = search.trim();

      const response = await api.get<OrdersResponse>('/admin/orders', { params });
      return response.data.data.orders;
    },
    staleTime: 30 * 1000, // 30 seconds
    retry: 2,
  });
}
