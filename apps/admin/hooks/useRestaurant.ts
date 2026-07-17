import { useQuery } from '@tanstack/react-query';
import api from '../services/api';

export interface RestaurantDetailAddress {
  street?: string;
  city?: string;
  state?: string;
  zipCode?: string;
}

export interface RestaurantDetail {
  _id: string;
  name: string;
  email: string;
  phone: string;
  description?: string;
  cuisine?: string[];
  rating?: number;
  isActive: boolean;
  isApproved: boolean;
  deliveryFee?: number;
  minimumOrder?: number;
  deliveryRadius?: number;
  address?: RestaurantDetailAddress;
  createdAt?: string;
}

interface RestaurantResponse {
  success: boolean;
  data: {
    restaurant: RestaurantDetail;
  };
}

export function useRestaurant(restaurantId: string | undefined) {
  return useQuery<RestaurantDetail>({
    queryKey: ['admin', 'restaurant', restaurantId],
    queryFn: async () => {
      const response = await api.get<RestaurantResponse>(`/admin/restaurants/${restaurantId}`);
      return response.data.data.restaurant;
    },
    enabled: !!restaurantId,
    staleTime: 30 * 1000,
    retry: 2,
  });
}
