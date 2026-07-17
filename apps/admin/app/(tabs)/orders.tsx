import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  TextInput,
  StyleSheet,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { useState, useCallback, useEffect } from 'react';
import { colors, spacing, borderRadius } from '../../constants';
import api from '../../services/api';

const ALL_STATUSES = [
  'all',
  'pending',
  'confirmed',
  'preparing',
  'ready',
  'out_for_delivery',
  'delivered',
  'cancelled',
] as const;

const STATUS_COLORS: Record<string, string> = {
  pending: colors.warning,
  confirmed: colors.primary,
  preparing: colors.primary,
  ready: colors.success,
  out_for_delivery: '#17A2B8',
  delivered: colors.success,
  cancelled: colors.error,
};

interface OrderItem {
  _id: string;
  customerId?: { firstName: string; lastName: string; email: string };
  restaurantId?: { name: string };
  status: string;
  total: number;
  items: Array<{ name: string; quantity: number }>;
  createdAt: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export default function OrdersScreen() {
  const [activeStatus, setActiveStatus] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchOrders = useCallback(
    async (isRefresh = false, page = 1) => {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      try {
        const params: Record<string, string> = { page: page.toString(), limit: '20' };
        if (activeStatus !== 'all') params.status = activeStatus;
        if (search.trim()) params.search = search.trim();

        const response = await api.get<{
          success: boolean;
          data: { orders: OrderItem[]; pagination: Pagination };
        }>('/admin/orders', { params });
        setOrders(response.data.data.orders);
      } catch (err) {
        console.error('Failed to fetch orders:', err);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [activeStatus, search],
  );

  useEffect(() => {
    fetchOrders();
  }, [activeStatus, search]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Orders</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Search by ID..."
          placeholderTextColor="#999"
          value={search}
          onChangeText={setSearch}
          onSubmitEditing={() => fetchOrders()}
        />
      </View>

      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.statusRow}
        data={ALL_STATUSES}
        keyExtractor={(s) => s}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.statusChip, activeStatus === item && styles.statusChipActive]}
            onPress={() => {
              setActiveStatus(item);
            }}
          >
            <Text
              style={[styles.statusChipText, activeStatus === item && styles.statusChipTextActive]}
            >
              {item === 'all' ? 'All' : item.replace(/_/g, ' ')}
            </Text>
          </TouchableOpacity>
        )}
      />

      <FlatList
        data={orders}
        keyExtractor={(item) => item._id}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => fetchOrders(true)}
            colors={[colors.primary]}
          />
        }
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.orderCard}
            onPress={() =>
              router.push({ pathname: '/(tabs)/order-detail', params: { orderId: item._id } })
            }
          >
            <View style={styles.orderHeader}>
              <Text style={styles.orderId}>{item._id.slice(-8).toUpperCase()}</Text>
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
                  {item.status.replace(/_/g, ' ')}
                </Text>
              </View>
            </View>
            <View style={styles.orderBody}>
              <Text style={styles.customerName}>
                {item.customerId
                  ? `${item.customerId.firstName} ${item.customerId.lastName}`
                  : 'Unknown'}
              </Text>
              <Text style={styles.orderTotal}>${item.total.toFixed(2)}</Text>
            </View>
            <Text style={styles.orderItems}>
              {item.items
                ?.slice(0, 3)
                .map((i) => i.name)
                .join(', ')}
              {item.items?.length > 3 ? ` +${item.items.length - 3} more` : ''}
            </Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No orders found</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.md,
  },
  title: { fontSize: 24, fontWeight: '700', color: '#FFFFFF', marginBottom: spacing.sm },
  searchInput: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: borderRadius.md,
    padding: Platform.OS === 'ios' ? 12 : 8,
    fontSize: 14,
    color: '#FFFFFF',
  },
  statusRow: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, gap: spacing.sm },
  statusChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: borderRadius.full,
    backgroundColor: '#F0F0F0',
  },
  statusChipActive: { backgroundColor: colors.primary },
  statusChipText: { fontSize: 12, fontWeight: '600', color: colors.textSecondary },
  statusChipTextActive: { color: '#FFFFFF' },
  list: { padding: spacing.md },
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
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  orderId: { fontSize: 14, fontWeight: '700', color: colors.text },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: borderRadius.full },
  statusText: { fontSize: 11, fontWeight: '600', textTransform: 'capitalize' },
  orderBody: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  customerName: { fontSize: 13, color: colors.textSecondary },
  orderTotal: { fontSize: 15, fontWeight: '700', color: colors.text },
  orderItems: { fontSize: 12, color: colors.textSecondary },
  emptyContainer: { alignItems: 'center', paddingVertical: 60 },
  emptyText: { fontSize: 16, color: colors.textSecondary },
});
