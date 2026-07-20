import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { Header } from '../../components/common/header';
import { StatCard } from '../../components/common/stat-card';
import { SectionHeader } from '../../components/common/section-header';
import { LoadingScreen } from '../../components/common/loading-screen';
import { ErrorScreen } from '../../components/common/error-screen';
import { colors, spacing, shadows, borderRadius } from '../../constants';
import api from '../../services/api';
import type { IApiResponse } from '../../types';

interface DashboardData {
  totalOrders: number;
  totalRevenue: number;
  activeRestaurants: number;
  totalUsers: number;
  pendingOrders: number;
  recentOrders: { id: string; customerName: string; total: number; status: string; createdAt: string }[];
}

export default function DashboardScreen() {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['admin-dashboard'],
    queryFn: async () => {
      const { data } = await api.get<IApiResponse<DashboardData>>('/admin/dashboard');
      return data.data;
    },
  });

  if (isLoading) return <LoadingScreen message="Loading dashboard..." />;
  if (isError) return <ErrorScreen title="Could not load dashboard" onRetry={refetch} />;

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Header title="Dashboard" subtitle="Platform overview" />

      <View style={styles.statsGrid}>
        <StatCard title="Total Orders" value={data?.totalOrders ?? 0} icon="📋" color={colors.primary} />
        <StatCard title="Revenue" value={`$${data?.totalRevenue?.toLocaleString() ?? 0}`} icon="💰" color={colors.success} />
        <StatCard title="Restaurants" value={data?.activeRestaurants ?? 0} icon="🏪" color={colors.secondary} />
        <StatCard title="Users" value={data?.totalUsers ?? 0} icon="👥" color={colors.info} />
      </View>

      <View style={styles.pendingBanner}>
        <Text style={styles.pendingIcon}>⏳</Text>
        <Text style={styles.pendingText}>{data?.pendingOrders ?? 0} pending orders</Text>
      </View>

      <SectionHeader title="Recent Orders" />
      {data?.recentOrders?.map((order) => (
        <View key={order.id} style={styles.orderRow}>
          <View style={styles.orderLeft}>
            <Text style={styles.orderCustomer}>{order.customerName}</Text>
            <Text style={styles.orderId}>#{order.id.slice(-6)}</Text>
          </View>
          <View style={styles.orderRight}>
            <Text style={styles.orderTotal}>${order.total.toFixed(2)}</Text>
            <Text style={styles.orderStatus}>{order.status.replace(/_/g, ' ')}</Text>
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  statsGrid: { padding: spacing.md, gap: spacing.sm },
  pendingBanner: {
    flexDirection: 'row', alignItems: 'center', marginHorizontal: spacing.md,
    padding: spacing.md, backgroundColor: colors.warningLight, borderRadius: borderRadius.md, borderWidth: 1, borderColor: colors.warning + '40',
  },
  pendingIcon: { fontSize: 24, marginRight: spacing.md },
  pendingText: { fontSize: 15, fontWeight: '600', color: colors.text },
  orderRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginHorizontal: spacing.md, paddingVertical: spacing.sm, paddingHorizontal: spacing.md,
    backgroundColor: colors.white, borderRadius: borderRadius.md, marginBottom: spacing.xs, ...shadows.sm,
  },
  orderLeft: { flex: 1 },
  orderCustomer: { fontSize: 14, fontWeight: '600', color: colors.text },
  orderId: { fontSize: 12, color: colors.textSecondary },
  orderRight: { alignItems: 'flex-end' },
  orderTotal: { fontSize: 14, fontWeight: '700', color: colors.text },
  orderStatus: { fontSize: 11, color: colors.textSecondary, textTransform: 'capitalize' },
});
