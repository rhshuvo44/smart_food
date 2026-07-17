import { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import api from '../../services/api';
import { Loading } from '../../components/common/loading';
import { EmptyState } from '../../components/common/empty-state';

interface Order {
  id: string;
  status: string;
  total: number;
  createdAt: string;
  restaurantName?: string;
}

const statusIcons: Record<string, string> = {
  pending: '⏳',
  confirmed: '✅',
  preparing: '👨‍🍳',
  ready: '📦',
  out_for_delivery: '🚚',
  delivered: '🎉',
  cancelled: '❌',
};

export default function OrdersScreen() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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

  if (orders.length === 0) {
    return (
      <EmptyState title="No Orders Yet" subtitle="Your order history will appear here." icon="📋" />
    );
  }

  const isActiveOrder = (status: string) =>
    ['pending', 'confirmed', 'preparing', 'ready', 'out_for_delivery'].includes(status);

  return (
    <View style={styles.container}>
      <FlatList
        data={orders}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.orderCard}
            onPress={() => {
              if (item.status === 'out_for_delivery') {
                router.push(`/order-tracking/${item.id}`);
              } else {
                router.push({ pathname: '/(tabs)/orders', params: { orderId: item.id } });
              }
            }}
          >
            <View style={styles.orderHeader}>
              <Text style={styles.orderIcon}>{statusIcons[item.status] || '📋'}</Text>
              <View style={styles.orderInfo}>
                <Text style={styles.orderId}>Order #{item.id.slice(-6)}</Text>
                <Text style={styles.orderStatus}>
                  {item.status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                </Text>
              </View>
              <Text style={styles.orderTotal}>${item.total.toFixed(2)}</Text>
            </View>
            {isActiveOrder(item.status) && (
              <View style={styles.trackingBadge}>
                <Text style={styles.trackingBadgeText}>
                  {item.status === 'out_for_delivery'
                    ? '📍 Tap to track delivery'
                    : '⏳ Order in progress'}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  listContent: { padding: 16 },
  orderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#DEE2E6',
  },
  orderHeader: { flexDirection: 'row', alignItems: 'center' },
  orderIcon: { fontSize: 24, marginRight: 12 },
  orderInfo: { flex: 1 },
  orderId: { fontSize: 14, fontWeight: '700', color: '#1A1A2E' },
  orderStatus: { fontSize: 12, color: '#6C757D', marginTop: 2, textTransform: 'capitalize' },
  orderTotal: { fontSize: 16, fontWeight: '700', color: '#1A1A2E' },
  trackingBadge: {
    marginTop: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#FFF3ED',
    borderRadius: 8,
  },
  trackingBadgeText: { fontSize: 13, color: '#FF6B35', fontWeight: '500' },
});
