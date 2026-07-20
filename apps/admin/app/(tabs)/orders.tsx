import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Header } from '../../components/common/header';
import { StatusBadge } from '../../components/common/status-badge';
import { LoadingScreen } from '../../components/common/loading-screen';
import { EmptyState } from '../../components/common/empty-state';
import { colors, spacing, shadows, borderRadius } from '../../constants';
import api from '../../services/api';
import type { IOrder, IApiResponse } from '../../types';

export default function OrdersScreen() {
  const { data: orders, isLoading } = useQuery({
    queryKey: ['admin-orders'],
    queryFn: async () => {
      const { data } = await api.get<IApiResponse<{ orders: IOrder[] }>>('/admin/orders');
      return data.data?.orders ?? [];
    },
  });

  if (isLoading) return <LoadingScreen message="Loading orders..." />;

  return (
    <View style={styles.container}>
      <Header title="Orders" subtitle="Manage all orders" />
      <FlatList
        data={orders}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.card} onPress={() => router.push('/(tabs)/order-detail')} activeOpacity={0.9}>
            <View style={styles.topRow}>
              <Text style={styles.orderId}>#{item.id.slice(-6)}</Text>
              <StatusBadge status={item.status} />
            </View>
            <Text style={styles.total}>${item.total.toFixed(2)}</Text>
            <Text style={styles.date}>{new Date(item.createdAt).toLocaleDateString()}</Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={<EmptyState title="No orders" icon="📋" />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  list: { padding: spacing.md },
  card: { backgroundColor: colors.white, borderRadius: borderRadius.md, padding: spacing.md, marginBottom: spacing.sm, ...shadows.sm },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  orderId: { fontSize: 15, fontWeight: '600', color: colors.text },
  total: { fontSize: 18, fontWeight: '700', color: colors.text, marginTop: spacing.xs },
  date: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
});
