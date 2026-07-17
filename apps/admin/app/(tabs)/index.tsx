import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  StyleSheet,
  Platform,
  Dimensions,
} from 'react-native';
import { router } from 'expo-router';
import { useState, useCallback, useEffect } from 'react';
import { useAuthStore } from '../../stores/auth.store';
import { colors, spacing, borderRadius } from '../../constants';
import api from '../../services/api';
import MapView, { Marker } from 'react-native-maps';

interface AdminDashboard {
  stats: {
    totalUsers: number;
    totalRestaurants: number;
    totalMenuItems: number;
    totalOrders: number;
    activeOrders: number;
    totalRevenue: number;
  };
  todayStats: {
    newUsers: number;
    newRestaurants: number;
    newOrders: number;
    todayRevenue: number;
  };
  recentOrders: Array<{
    _id: string;
    customerId?: { firstName: string; lastName: string };
    status: string;
    total: number;
    createdAt: string;
  }>;
  orderStatusCounts: Record<string, number>;
  topRestaurants: Array<{
    restaurantId: string;
    name: string;
    totalOrders: number;
    revenue: number;
  }>;
}

const STATUS_COLORS: Record<string, string> = {
  pending: colors.warning,
  confirmed: colors.primary,
  preparing: colors.primary,
  ready: colors.success,
  completed: colors.textSecondary,
  delivered: colors.success,
  cancelled: colors.error,
};

export default function AdminDashboardScreen() {
  const user = useAuthStore((s) => s.user);
  const [data, setData] = useState<AdminDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDashboard = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const response = await api.get<{ success: boolean; data: { dashboard: AdminDashboard } }>(
        '/admin/dashboard',
      );
      setData(response.data.data.dashboard);
    } catch (err) {
      console.error('Failed to fetch dashboard:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, []);

  if (loading && !data) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.greeting}>Loading...</Text>
        </View>
      </View>
    );
  }

  if (!data) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.emptyIcon}>📊</Text>
        <Text style={styles.emptyTitle}>Admin Dashboard</Text>
        <Text style={styles.emptySubtitle}>Platform overview and management</Text>
      </View>
    );
  }

  const timeOfDay =
    new Date().getHours() < 12 ? 'Morning' : new Date().getHours() < 18 ? 'Afternoon' : 'Evening';
  const greetingName = user?.firstName || 'Admin';

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
            <Text style={styles.avatarText}>{greetingName.charAt(0).toUpperCase()}</Text>
          </View>
        </View>

        {/* Platform Stats Cards */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.statsRow}
        >
          <StatCard
            icon="👥"
            value={data.stats.totalUsers.toString()}
            label="Total Users"
            color={colors.primary}
          />
          <StatCard
            icon="🏪"
            value={data.stats.totalRestaurants.toString()}
            label="Restaurants"
            color={colors.secondary}
          />
          <StatCard
            icon="📋"
            value={data.stats.totalOrders.toString()}
            label="Total Orders"
            color={colors.primary}
          />
          <StatCard
            icon="💰"
            value={`$${data.stats.totalRevenue.toFixed(0)}`}
            label="Revenue"
            color={colors.success}
          />
          <StatCard
            icon="🔄"
            value={data.stats.activeOrders.toString()}
            label="Active Orders"
            color={colors.warning}
          />
        </ScrollView>

        {/* Today's Stats */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Today</Text>
          <View style={styles.todayRow}>
            <TodayBadge icon="👤" value={data.todayStats.newUsers.toString()} label="New Users" />
            <TodayBadge
              icon="🏪"
              value={data.todayStats.newRestaurants.toString()}
              label="New Restaurants"
            />
            <TodayBadge icon="📋" value={data.todayStats.newOrders.toString()} label="New Orders" />
            <TodayBadge
              icon="💰"
              value={`$${data.todayStats.todayRevenue.toFixed(0)}`}
              label="Revenue"
            />
          </View>
        </View>

        {/* Live Delivery Map Preview */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Live Deliveries</Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/reports')}>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.mapPreview}>
            <MapView
              style={styles.mapPreviewInner}
              region={{
                latitude: 23.8103,
                longitude: 90.4125,
                latitudeDelta: 0.1,
                longitudeDelta: 0.1,
              }}
              scrollEnabled={false}
              zoomEnabled={false}
            />
            <View style={styles.mapPreviewOverlay}>
              <Text style={styles.mapPreviewText}>{data.activeOrders} active deliveries</Text>
              <TouchableOpacity
                style={styles.mapPreviewBtn}
                onPress={() => router.push('/(tabs)/reports')}
              >
                <Text style={styles.mapPreviewBtnText}>View Full Map</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Recent Orders */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Orders</Text>
          {data.recentOrders.length === 0 ? (
            <Text style={styles.emptyText}>No recent orders</Text>
          ) : (
            data.recentOrders.map((order) => {
              const customerName = order.customerId
                ? `${order.customerId.firstName || ''} ${order.customerId.lastName || ''}`.trim()
                : 'Unknown';
              return (
                <TouchableOpacity key={order._id} style={styles.orderCard}>
                  <View style={styles.orderRow}>
                    <Text style={styles.orderId}>{order._id.slice(-8).toUpperCase()}</Text>
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
                    <Text style={styles.customerName}>{customerName}</Text>
                    <Text style={styles.orderTotal}>${order.total.toFixed(2)}</Text>
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </View>

        {/* Top Restaurants */}
        {data.topRestaurants.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Top Restaurants</Text>
            {data.topRestaurants.map((r, i) => (
              <View key={r.restaurantId} style={styles.restaurantRow}>
                <Text style={styles.rank}>#{i + 1}</Text>
                <View style={styles.restaurantInfo}>
                  <Text style={styles.restaurantNameText}>{r.name}</Text>
                  <Text style={styles.restaurantMeta}>{r.totalOrders} orders</Text>
                </View>
                <Text style={styles.restaurantRevenue}>${r.revenue.toFixed(2)}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionsRow}>
            <TouchableOpacity style={styles.actionBtn} onPress={() => router.push('/(tabs)/users')}>
              <Text style={styles.actionIcon}>👥</Text>
              <Text style={styles.actionLabel}>Users</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => router.push('/(tabs)/restaurants')}
            >
              <Text style={styles.actionIcon}>🏪</Text>
              <Text style={styles.actionLabel}>Restaurants</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => router.push('/(tabs)/analytics')}
            >
              <Text style={styles.actionIcon}>📈</Text>
              <Text style={styles.actionLabel}>Analytics</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => router.push('/(tabs)/delivery-zones')}
            >
              <Text style={styles.actionIcon}>📍</Text>
              <Text style={styles.actionLabel}>Zones</Text>
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

function TodayBadge({ icon, value, label }: { icon: string; value: string; label: string }) {
  return (
    <View style={styles.todayBadge}>
      <Text style={styles.todayIcon}>{icon}</Text>
      <Text style={styles.todayValue}>{value}</Text>
      <Text style={styles.todayLabel}>{label}</Text>
    </View>
  );
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
  emptySubtitle: { fontSize: 14, color: colors.textSecondary, textAlign: 'center' },
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
  todayRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  todayBadge: {
    backgroundColor: '#FFFFFF',
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    alignItems: 'center',
    minWidth: 72,
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
  todayIcon: { fontSize: 20 },
  todayValue: { fontSize: 18, fontWeight: '700', color: colors.text, marginTop: 2 },
  todayLabel: { fontSize: 10, color: colors.textSecondary, marginTop: 1 },
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
  emptyText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    paddingVertical: spacing.lg,
  },
  restaurantRow: {
    flexDirection: 'row',
    alignItems: 'center',
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
  rank: { fontSize: 16, fontWeight: '700', color: colors.textSecondary, width: 32 },
  restaurantInfo: { flex: 1 },
  restaurantNameText: { fontSize: 14, fontWeight: '600', color: colors.text },
  restaurantMeta: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  restaurantRevenue: { fontSize: 14, fontWeight: '700', color: colors.success },
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
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  seeAllText: { fontSize: 14, color: colors.primary, fontWeight: '600' },
  mapPreview: {
    height: 200,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    marginBottom: spacing.sm,
  },
  mapPreviewInner: { flex: 1, width: '100%' },
  mapPreviewOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  mapPreviewText: { color: '#FFFFFF', fontSize: 14, fontWeight: '600' },
  mapPreviewBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: borderRadius.md,
  },
  mapPreviewBtnText: { color: '#FFFFFF', fontSize: 12, fontWeight: '600' },
});
