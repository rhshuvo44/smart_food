import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  StyleSheet,
  Platform,
  Alert,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { useState, useCallback } from 'react';
import { Loading } from '../../components/common/loading';
import { ErrorState } from '../../components/common/error-state';
import { EmptyState } from '../../components/common/empty-state';
import { colors, spacing, borderRadius } from '../../constants';
import api from '../../services/api';

const STATUS_TABS = ['All', 'Pending', 'Preparing', 'Ready', 'Completed', 'Cancelled'] as const;
type StatusTab = (typeof STATUS_TABS)[number];

interface OrderItem {
  id: string;
  customerName: string;
  itemCount: number;
  total: number;
  status: string;
  createdAt: string;
}

const STATUS_COLORS: Record<string, string> = {
  pending: '#FFC107',
  confirmed: colors.primary,
  preparing: '#004E89',
  ready: '#28A745',
  completed: '#6C757D',
  delivered: '#28A745',
  cancelled: '#DC3545',
};

const MOCK_ORDERS: OrderItem[] = [
  {
    id: 'ORD-001',
    customerName: 'John Doe',
    itemCount: 3,
    total: 34.5,
    status: 'pending',
    createdAt: new Date(Date.now() - 5 * 60000).toISOString(),
  },
  {
    id: 'ORD-002',
    customerName: 'Jane Smith',
    itemCount: 2,
    total: 52.0,
    status: 'preparing',
    createdAt: new Date(Date.now() - 15 * 60000).toISOString(),
  },
  {
    id: 'ORD-003',
    customerName: 'Bob Johnson',
    itemCount: 4,
    total: 28.75,
    status: 'ready',
    createdAt: new Date(Date.now() - 30 * 60000).toISOString(),
  },
  {
    id: 'ORD-004',
    customerName: 'Alice Williams',
    itemCount: 5,
    total: 67.2,
    status: 'completed',
    createdAt: new Date(Date.now() - 60 * 60000).toISOString(),
  },
  {
    id: 'ORD-005',
    customerName: 'Charlie Brown',
    itemCount: 1,
    total: 15.0,
    status: 'cancelled',
    createdAt: new Date(Date.now() - 120 * 60000).toISOString(),
  },
  {
    id: 'ORD-006',
    customerName: 'Diana Prince',
    itemCount: 2,
    total: 42.3,
    status: 'pending',
    createdAt: new Date(Date.now() - 180 * 60000).toISOString(),
  },
  {
    id: 'ORD-007',
    customerName: 'Evan Peters',
    itemCount: 3,
    total: 31.0,
    status: 'preparing',
    createdAt: new Date(Date.now() - 240 * 60000).toISOString(),
  },
  {
    id: 'ORD-008',
    customerName: 'Fiona Apple',
    itemCount: 1,
    total: 12.5,
    status: 'completed',
    createdAt: new Date(Date.now() - 300 * 60000).toISOString(),
  },
];

export default function OrdersScreen() {
  const [activeTab, setActiveTab] = useState<StatusTab>('All');
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchOrders = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const response = await api.get<{ success: boolean; data: OrderItem[] }>('/orders/restaurant');
      setOrders(response.data.data);
    } catch {
      setOrders(MOCK_ORDERS);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchOrders();
    }, [fetchOrders]),
  );

  const handleStatusUpdate = async (orderId: string, newStatus: string) => {
    try {
      await api.patch(`/orders/${orderId}/status`, { status: newStatus });
      setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o)));
    } catch {
      Alert.alert('Error', 'Failed to update order status.');
    }
  };

  const filteredOrders =
    activeTab === 'All' ? orders : orders.filter((o) => o.status === activeTab.toLowerCase());

  const renderItem = useCallback(
    ({ item }: { item: OrderItem }) => {
      const isExpanded = expandedId === item.id;
      return (
        <TouchableOpacity
          style={styles.orderCard}
          onPress={() => setExpandedId(isExpanded ? null : item.id)}
          activeOpacity={0.8}
        >
          <View style={styles.orderHeader}>
            <View style={styles.orderInfo}>
              <Text style={styles.orderId}>{item.id}</Text>
              <Text style={styles.customerName}>{item.customerName}</Text>
            </View>
            <View
              style={[
                styles.statusBadge,
                { backgroundColor: (STATUS_COLORS[item.status] || colors.textSecondary) + '20' },
              ]}
            >
              <Text
                style={[
                  styles.statusText,
                  { color: STATUS_COLORS[item.status] || colors.textSecondary },
                ]}
              >
                {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
              </Text>
            </View>
          </View>
          <View style={styles.orderMeta}>
            <Text style={styles.metaText}>{item.itemCount} items</Text>
            <Text style={styles.metaText}>${item.total.toFixed(2)}</Text>
            <Text style={styles.metaText}>{timeAgo(item.createdAt)}</Text>
          </View>
          {isExpanded && (
            <View style={styles.expandedContent}>
              <View style={styles.divider} />
              <Text style={styles.expandedTitle}>Order Details</Text>
              <TouchableOpacity
                style={styles.viewDetailBtn}
                onPress={() =>
                  router.push({ pathname: '/(tabs)/order-detail', params: { orderId: item.id } })
                }
              >
                <Text style={styles.viewDetailText}>View Full Details →</Text>
              </TouchableOpacity>
              <View style={styles.actionRow}>
                {item.status === 'pending' && (
                  <TouchableOpacity
                    style={[styles.actionBtn, { backgroundColor: colors.success }]}
                    onPress={() => handleStatusUpdate(item.id, 'preparing')}
                  >
                    <Text style={styles.actionBtnText}>Accept Order</Text>
                  </TouchableOpacity>
                )}
                {item.status === 'preparing' && (
                  <TouchableOpacity
                    style={[styles.actionBtn, { backgroundColor: colors.success }]}
                    onPress={() => handleStatusUpdate(item.id, 'ready')}
                  >
                    <Text style={styles.actionBtnText}>Mark as Ready</Text>
                  </TouchableOpacity>
                )}
                {item.status === 'ready' && (
                  <TouchableOpacity
                    style={[styles.actionBtn, { backgroundColor: colors.success }]}
                    onPress={() => handleStatusUpdate(item.id, 'completed')}
                  >
                    <Text style={styles.actionBtnText}>Mark as Completed</Text>
                  </TouchableOpacity>
                )}
                {!['completed', 'cancelled', 'delivered'].includes(item.status) && (
                  <TouchableOpacity
                    style={[styles.actionBtn, { backgroundColor: colors.error }]}
                    onPress={() => handleStatusUpdate(item.id, 'cancelled')}
                  >
                    <Text style={styles.actionBtnText}>Cancel Order</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          )}
        </TouchableOpacity>
      );
    },
    [expandedId],
  );

  if (loading && !refreshing) {
    return <Loading message="Loading orders..." />;
  }

  if (error && orders.length === 0) {
    return <ErrorState message={error} onRetry={() => fetchOrders()} />;
  }

  return (
    <View style={styles.container}>
      {/* Status Tabs */}
      <View style={styles.tabContainer}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={STATUS_TABS}
          keyExtractor={(item) => item}
          contentContainerStyle={styles.tabList}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.tab, activeTab === item && styles.activeTab]}
              onPress={() => setActiveTab(item)}
            >
              <Text style={[styles.tabText, activeTab === item && styles.activeTabText]}>
                {item}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {filteredOrders.length === 0 ? (
        <EmptyState
          title="No Orders"
          subtitle={`No ${activeTab.toLowerCase()} orders found.`}
          icon="📋"
        />
      ) : (
        <FlatList
          data={filteredOrders}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => fetchOrders(true)}
              colors={[colors.primary]}
            />
          }
          initialNumToRender={10}
          maxToRenderPerBatch={10}
          windowSize={5}
          removeClippedSubviews={Platform.OS === 'android'}
        />
      )}
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
  tabContainer: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tabList: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, gap: spacing.sm },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surface,
  },
  activeTab: { backgroundColor: colors.primary },
  tabText: { fontSize: 14, fontWeight: '500', color: colors.textSecondary },
  activeTabText: { color: '#FFFFFF', fontWeight: '600' },
  listContent: { padding: spacing.md, paddingBottom: spacing.xl },
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
  orderHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  orderInfo: { flex: 1 },
  orderId: { fontSize: 15, fontWeight: '700', color: colors.text },
  customerName: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: borderRadius.full },
  statusText: { fontSize: 12, fontWeight: '600' },
  orderMeta: { flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.sm },
  metaText: { fontSize: 12, color: colors.textSecondary },
  expandedContent: { marginTop: spacing.sm },
  divider: { height: 1, backgroundColor: colors.border, marginBottom: spacing.sm },
  expandedTitle: { fontSize: 14, fontWeight: '600', color: colors.text, marginBottom: spacing.sm },
  viewDetailBtn: { marginBottom: spacing.sm },
  viewDetailText: { fontSize: 14, color: colors.primary, fontWeight: '500' },
  actionRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xs },
  actionBtn: { flex: 1, paddingVertical: 10, borderRadius: borderRadius.md, alignItems: 'center' },
  actionBtnText: { color: '#FFFFFF', fontSize: 13, fontWeight: '600' },
});
