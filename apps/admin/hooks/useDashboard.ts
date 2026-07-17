import { useQuery } from '@tanstack/react-query';
import api from '../services/api';

export interface AdminDashboardStats {
  totalUsers: number;
  totalRestaurants: number;
  totalMenuItems: number;
  totalOrders: number;
  activeOrders: number;
  totalRevenue: number;
}

export interface AdminDashboardTodayStats {
  newUsers: number;
  newRestaurants: number;
  newOrders: number;
  todayRevenue: number;
}

export interface AdminDashboardRecentOrder {
  _id: string;
  customerId?: { firstName: string; lastName: string };
  status: string;
  total: number;
  createdAt: string;
}

export interface AdminDashboardTopRestaurant {
  restaurantId: string;
  name: string;
  totalOrders: number;
  revenue: number;
}

export interface AdminDashboard {
  stats: AdminDashboardStats;
  todayStats: AdminDashboardTodayStats;
  recentOrders: AdminDashboardRecentOrder[];
  orderStatusCounts: Record<string, number>;
  topRestaurants: AdminDashboardTopRestaurant[];
}

interface DashboardResponse {
  success: boolean;
  data: {
    dashboard: AdminDashboard;
  };
}

export function useDashboard() {
  return useQuery<AdminDashboard>({
    queryKey: ['admin', 'dashboard'],
    queryFn: async () => {
      const response = await api.get<DashboardResponse>('/admin/dashboard');
      return response.data.data.dashboard;
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    retry: 2,
  });
}
