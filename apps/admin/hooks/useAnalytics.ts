import { useQuery } from '@tanstack/react-query';
import api from '../services/api';

export interface RevenueData {
  period: number;
  totalRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
  revenueByDay: Array<{ _id: string; revenue: number; orderCount: number }>;
}

export interface OrderAnalyticsData {
  period: number;
  statusDistribution: Array<{ _id: string; count: number }>;
  ordersByDay: Array<{ _id: string; count: number }>;
}

export interface UserAnalyticsData {
  totalUsers: number;
  newUsers: number;
  registrationsByDay: Array<{ _id: string; count: number }>;
  roleDistribution: Array<{ _id: string; count: number }>;
}

export type AnalyticsPeriod = '7d' | '30d' | '90d';

export function useRevenueAnalytics(period: AnalyticsPeriod = '30d') {
  return useQuery<RevenueData>({
    queryKey: ['admin', 'analytics', 'revenue', period],
    queryFn: async () => {
      const response = await api.get<{ success: boolean; data: RevenueData }>(
        `/admin/analytics/revenue?period=${period}`,
      );
      return response.data.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
  });
}

export function useOrderAnalytics(period: AnalyticsPeriod = '30d') {
  return useQuery<OrderAnalyticsData>({
    queryKey: ['admin', 'analytics', 'orders', period],
    queryFn: async () => {
      const response = await api.get<{ success: boolean; data: OrderAnalyticsData }>(
        `/admin/analytics/orders?period=${period}`,
      );
      return response.data.data;
    },
    staleTime: 5 * 60 * 1000,
    retry: 2,
  });
}

export function useUserAnalytics(period: AnalyticsPeriod = '30d') {
  return useQuery<UserAnalyticsData>({
    queryKey: ['admin', 'analytics', 'users', period],
    queryFn: async () => {
      const response = await api.get<{ success: boolean; data: UserAnalyticsData }>(
        `/admin/analytics/users?period=${period}`,
      );
      return response.data.data;
    },
    staleTime: 5 * 60 * 1000,
    retry: 2,
  });
}
