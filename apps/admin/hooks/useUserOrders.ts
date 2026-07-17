import { useQuery } from '@tanstack/react-query';
import api from '../services/api';

export interface UserOrderItem {
  _id: string;
  total?: number;
  status?: string;
  createdAt: string;
}

interface UserOrdersResponse {
  success: boolean;
  data: {
    orders: UserOrderItem[];
  };
}

export function useUserOrders(userId: string | undefined) {
  return useQuery<UserOrderItem[]>({
    queryKey: ['admin', 'user', userId, 'orders'],
    queryFn: async () => {
      const response = await api.get<UserOrdersResponse>(`/admin/users/${userId}/orders`);
      return response.data.data.orders;
    },
    enabled: !!userId,
    staleTime: 30 * 1000,
    retry: 2,
  });
}
