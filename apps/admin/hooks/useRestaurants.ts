import { useQuery } from '@tanstack/react-query';
import api from '../services/api';

export interface RestaurantListItem {
  _id: string;
  name: string;
  email: string;
  phone: string;
  cuisine: string[];
  rating: number;
  isActive: boolean;
  isApproved: boolean;
  createdAt: string;
}

interface RestaurantsResponse {
  success: boolean;
  data: {
    restaurants: RestaurantListItem[];
  };
}

export function useRestaurants(search: string = '', filter: string = '') {
  return useQuery<RestaurantListItem[]>({
    queryKey: ['admin', 'restaurants', { search, filter }],
    queryFn: async () => {
      const params: Record<string, string> = {};
      if (search.trim()) params.search = search.trim();
      if (filter) params.isApproved = filter;

      const response = await api.get<RestaurantsResponse>('/admin/restaurants', { params });
      return response.data.data.restaurants;
    },
    staleTime: 30 * 1000,
    retry: 2,
  });
}
