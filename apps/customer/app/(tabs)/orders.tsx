import { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import api from '../../services/api';
import { Loading } from '../../components/common/loading';
import { EmptyState } from '../../components/common/empty-state';
import { colors, spacing, typography, shadows } from '../../constants';

interface Order {
  id: string;
  status: string;
  total: number;
  createdAt: string;
  restaurantName?: string;
}

const statusConfig: Record<string, { icon: string; color: string; bg: string }> = {
  pending: { icon: '⏳', color: '#FFC107', bg: '#FFF8E1' },
  confirmed: { icon: '✅', color: '#28A745', bg: '#E8F5E9' },
  preparing: { icon: '👨‍🍳', color: '#FF6B35', bg: '#FFF3ED' },
  ready: { icon: '📦', color: '#17A2B8', bg: '#E3F7FA' },
  out_for_delivery: { icon: '🚚', color: '#004E89', bg: '#E8F0FE' },
  delivered: { icon: '🎉', color: '#28A745', bg: '#E8F5E9' },
  cancelled: { icon: '❌', color: '#DC3545', bg: '#FFEBEE' },
};

const statusLabel = (s: string) =>
  s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

export default function OrdersScreen() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'active' | 'past'>('active');

  const fetchOrders = useCallback(async () => {
    try {
      const response = await api.get('/orders');
      if (response.data.success) {
        setOrders(response.data.data.orders || []);
      }
    } catch {
      setOrders([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  if (isLoading) return <Loading message="Loading orders..." />;

  const isActive = (status: string) =>
    ['pending', 'confirmed', 'preparing', 'ready', 'out_for_delivery'].includes(status);

  const filtered = orders.filter((o) =>
    activeTab === 'active' ? isActive(o.status) : !isActive(o.status)
  );

  return (
    <View style={styles.container}>
      <View style={styles.headerArea}>
        <Text style={styles.headerTitle}>My Orders</Text>
      </View>

      <View style={styles.tabRow}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'active' && styles.tabActive]}
          onPress={() => setActiveTab('active')}
        >
          <Text style={[styles.tabText, activeTab === 'active' && styles.tabTextActive]}>Active</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'past' && styles.tabActive]}
          onPress={() => setActiveTab('past')}
        >
          <Text style={[styles.tabText, activeTab === 'past' && styles.tabTextActive]}>Past</Text>
        </TouchableOpacity>
      </View>

      {filtered.length === 0 ? (
        <EmptyState
          title={activeTab === 'active' ? 'No Active Orders' : 'No Past Orders'}
          subtitle={activeTab === 'active' ? 'Place an order to see it here' : 'Your order history will appear here'}
          icon={activeTab === 'active' ? '🍽' : '📋'}
        />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => {
            const config = statusConfig[item.status] || { icon: '📋', color: colors.textSecondary, bg: colors.surface };
            return (
              <TouchableOpacity
                style={styles.orderCard}
                onPress={() => {
                  if (item.status === 'out_for_delivery') {
                    router.push(`/order-tracking/${item.id}`);
                  }
                }}
                activeOpacity={0.9}
              >
                <View style={styles.orderHeader}>
                  <View style={[styles.statusIcon, { backgroundColor: config.bg }]}>
                    <Text style={styles.statusEmoji}>{config.icon}</Text>
                  </View>
                  <View style={styles.orderInfo}>
                    <Text style={styles.restaurantName}>{item.restaurantName || `Order #${item.id.slice(-6)}`}</Text>
                    <Text style={[styles.orderStatus, { color: config.color }]}>{statusLabel(item.status)}</Text>
                  </View>
                  <View style={styles.orderRight}>
                    <Text style={styles.orderTotal}>${item.total.toFixed(2)}</Text>
                    <Text style={styles.orderDate}>
                      {new Date(item.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </Text>
                  </View>
                </View>
                {isActive(item.status) && (
                  <View style={[styles.trackingBadge, { backgroundColor: config.bg }]}>
                    <Text style={[styles.trackingBadgeText, { color: config.color }]}>
                      {item.status === 'out_for_delivery' ? '📍 Tap to track delivery' : '⏳ Order in progress'}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  headerArea: { paddingHorizontal: spacing.md, paddingTop: spacing.md, paddingBottom: spacing.sm },
  headerTitle: { ...typography.h2 },
  tabRow: {
    flexDirection: 'row',
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: spacing.md,
    padding: 3,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    borderRadius: spacing.sm,
  },
  tabActive: { backgroundColor: colors.white, ...shadows.sm },
  tabText: { fontSize: 14, fontWeight: '500', color: colors.textSecondary },
  tabTextActive: { color: colors.primary, fontWeight: '600' },
  listContent: { paddingHorizontal: spacing.md, paddingBottom: spacing.xxl },
  orderCard: {
    backgroundColor: colors.white,
    borderRadius: spacing.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.sm,
  },
  orderHeader: { flexDirection: 'row', alignItems: 'center' },
  statusIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  statusEmoji: { fontSize: 20 },
  orderInfo: { flex: 1, marginLeft: spacing.md },
  restaurantName: { fontSize: 15, fontWeight: '600', color: colors.text },
  orderStatus: { fontSize: 12, fontWeight: '500', marginTop: 2 },
  orderRight: { alignItems: 'flex-end' },
  orderTotal: { fontSize: 16, fontWeight: '700', color: colors.text },
  orderDate: { fontSize: 11, color: colors.textTertiary, marginTop: 2 },
  trackingBadge: { marginTop: spacing.sm, padding: spacing.sm, borderRadius: spacing.sm },
  trackingBadgeText: { fontSize: 13, fontWeight: '500' },
});
