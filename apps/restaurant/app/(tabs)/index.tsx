import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  StyleSheet,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { useState, useCallback } from 'react';
import { useAuthStore } from '../../stores/auth.store';
import { Loading } from '../../components/common/loading';
import { ErrorState } from '../../components/common/error-state';
import { colors, spacing, borderRadius } from '../../constants';
import api from '../../services/api';

interface DashboardData {
  restaurantName: string;
  stats: {
    totalOrders: number;
    activeOrders: number;
    todayRevenue: number;
    menuItems: number;
  };
  recentOrders: Array<{
    id: string;
    customerName: string;
    status: string;
    total: number;
    createdAt: string;
  }>;
}

const MOCK_DASHBOARD: DashboardData = {
  restaurantName: 'My Restaurant',
  stats: {
    totalOrders: 156,
    activeOrders: 12,
    todayRevenue: 2845.5,
    menuItems: 48,
  },
  recentOrders: [
    {
      id: 'ORD-001',
      customerName: 'John Doe',
      status: 'pending',
      total: 34.5,
      createdAt: new Date(Date.now() - 5 * 60000).toISOString(),
    },
    {
      id: 'ORD-002',
      customerName: 'Jane Smith',
      status: 'preparing',
      total: 52.0,
      createdAt: new Date(Date.now() - 15 * 60000).toISOString(),
    },
    {
      id: 'ORD-003',
      customerName: 'Bob Johnson',
      status: 'ready',
      total: 28.75,
      createdAt: new Date(Date.now() - 30 * 60000).toISOString(),
    },
    {
      id: 'ORD-004',
      customerName: 'Alice Williams',
      status: 'completed',
      total: 67.2,
      createdAt: new Date(Date.now() - 60 * 60000).toISOString(),
    },
    {
      id: 'ORD-005',
      customerName: 'Charlie Brown',
      status: 'cancelled',
      total: 15.0,
      createdAt: new Date(Date.now() - 120 * 60000).toISOString(),
    },
  ],
};

const STATUS_COLORS: Record<string, string> = {
  pending: colors.warning,
  confirmed: colors.primary,
  preparing: colors.primary,
  ready: colors.success,
  completed: colors.textSecondary,
  delivered: colors.success,
  cancelled: colors.error,
};

export default function DashboardScreen() {
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboard = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const response = await api.get<{ success: boolean; data: DashboardData }>(
        '/dashboard/restaurant/me',
      );
      setData(response.data.data);
    } catch {
      // Fallback to mock data for development
      setData(MOCK_DASHBOARD);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useState(() => {
    fetchDashboard();
  });

  if (!isAuthenticated) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.emptyIcon}>🔒</Text>
        <Text style={styles.emptyTitle}>Sign In Required</Text>
        <Text style={styles.emptySubtitle}>Please sign in to view your dashboard.</Text>
        <TouchableOpacity style={styles.signInBtn} onPress={() => router.push('/(auth)/login')}>
          <Text style={styles.signInBtnText}>Sign In</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (loading && !data) {
    return <Loading message="Loading dashboard..." />;
  }

  if (error && !data) {
    return <ErrorState message={error} onRetry={() => fetchDashboard()} />;
  }

  if (!data) return null;

  const timeOfDay =
    new Date().getHours() < 12 ? 'Morning' : new Date().getHours() < 18 ? 'Afternoon' : 'Evening';
  const greetingName = user?.firstName || data.restaurantName || 'Chef';

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => fetchDashboard(true)}
            colors={[colors.primary]}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Good {timeOfDay},</Text>
            <Text style={styles.restaurantName}>{greetingName}</Text>
          </View>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>{data.restaurantName.charAt(0).toUpperCase()}</Text>
          </View>
        </View>

        {/* Stats Cards */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.statsRow}
        >
          <StatCard
            icon="📋"
            value={data.stats.totalOrders.toString()}
            label="Total Orders"
            color={colors.primary}
          />
          <StatCard
            icon="🔄"
            value={data.stats.activeOrders.toString()}
            label="Active Orders"
            color={colors.warning}
          />
          <StatCard
            icon="💰"
            value={`$${data.stats.todayRevenue.toFixed(2)}`}
            label="Today's Revenue"
            color={colors.success}
          />
          <StatCard
            icon="🍽️"
            value={data.stats.menuItems.toString()}
            label="Menu Items"
            color={colors.secondary}
          />
        </ScrollView>

        {/* Recent Orders */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Orders</Text>
          {data.recentOrders.length === 0 ? (
            <Text style={styles.emptyText}>No orders yet</Text>
          ) : (
            data.recentOrders.map((order) => (
              <TouchableOpacity
                key={order.id}
                style={styles.orderCard}
                onPress={() =>
                  router.push({ pathname: '/(tabs)/order-detail', params: { orderId: order.id } })
                }
              >
                <View style={styles.orderRow}>
                  <Text style={styles.orderId}>{order.id}</Text>
                  <View
                    style={[
                      styles.statusBadge,
                      {
                        backgroundColor:
                          (STATUS_COLORS[order.status] || colors.textSecondary) + '20',
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusText,
                        { color: STATUS_COLORS[order.status] || colors.textSecondary },
                      ]}
                    >
                      {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                    </Text>
                  </View>
                </View>
                <View style={styles.orderRow}>
                  <Text style={styles.customerName}>{order.customerName}</Text>
                  <Text style={styles.orderTotal}>${order.total.toFixed(2)}</Text>
                </View>
                <Text style={styles.orderTime}>{timeAgo(order.createdAt)}</Text>
              </TouchableOpacity>
            ))
          )}
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionsRow}>
            <TouchableOpacity style={styles.actionBtn} onPress={() => router.push('/(tabs)/menu')}>
              <Text style={styles.actionIcon}>🍽️</Text>
              <Text style={styles.actionLabel}>View Menu</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => router.push('/(tabs)/orders')}
            >
              <Text style={styles.actionIcon}>📋</Text>
              <Text style={styles.actionLabel}>Manage Orders</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => router.push('/(tabs)/delivery-zones')}
            >
              <Text style={styles.actionIcon}>📍</Text>
              <Text style={styles.actionLabel}>Delivery Zones</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

function StatCard({
  icon,
  value,
  label,
  color,
}: {
  icon: string;
  value: string;
  label: string;
  color: string;
}) {
  return (
    <View style={[styles.statCard, { borderLeftColor: color }]}>
      <Text style={styles.statIcon}>{icon}</Text>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMs = now - then;
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scrollContent: { paddingBottom: spacing.xl },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
    padding: spacing.lg,
  },
  emptyIcon: { fontSize: 48, marginBottom: spacing.md },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: colors.text, marginBottom: spacing.xs },
  emptySubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  signInBtn: {
    backgroundColor: colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: borderRadius.md,
  },
  signInBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.lg,
    backgroundColor: colors.primary,
  },
  greeting: { fontSize: 14, color: '#FFFFFF', opacity: 0.8 },
  restaurantName: { fontSize: 24, fontWeight: '700', color: '#FFFFFF', marginTop: 2 },
  avatarCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: { fontSize: 20, fontWeight: '700', color: '#FFFFFF' },
  statsRow: { paddingHorizontal: spacing.md, paddingVertical: spacing.md, gap: spacing.sm },
  statCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    width: 150,
    borderLeftWidth: 4,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
      },
      android: { elevation: 3 },
    }),
  },
  statIcon: { fontSize: 24, marginBottom: spacing.xs },
  statValue: { fontSize: 22, fontWeight: '700' },
  statLabel: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  section: { paddingHorizontal: spacing.lg, marginTop: spacing.lg },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: spacing.md },
  orderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
      },
      android: { elevation: 2 },
    }),
  },
  orderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  orderId: { fontSize: 14, fontWeight: '600', color: colors.text },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: borderRadius.full },
  statusText: { fontSize: 11, fontWeight: '600' },
  customerName: { fontSize: 13, color: colors.textSecondary },
  orderTotal: { fontSize: 14, fontWeight: '600', color: colors.text },
  orderTime: { fontSize: 11, color: colors.textSecondary, marginTop: 4 },
  emptyText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    paddingVertical: spacing.lg,
  },
  actionsRow: { flexDirection: 'row', gap: spacing.md },
  actionBtn: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
      },
      android: { elevation: 3 },
    }),
  },
  actionIcon: { fontSize: 32, marginBottom: spacing.sm },
  actionLabel: { fontSize: 14, fontWeight: '600', color: colors.text },
});
