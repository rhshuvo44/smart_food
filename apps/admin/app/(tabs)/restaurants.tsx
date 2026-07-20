import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { Header } from '../../components/common/header';
import { StatusBadge } from '../../components/common/status-badge';
import { LoadingScreen } from '../../components/common/loading-screen';
import { EmptyState } from '../../components/common/empty-state';
import { colors, spacing, shadows, borderRadius } from '../../constants';
import api from '../../services/api';
import type { IRestaurant, IApiResponse } from '../../types';

export default function RestaurantsScreen() {
  const { data: restaurants, isLoading } = useQuery({
    queryKey: ['admin-restaurants'],
    queryFn: async () => {
      const { data } = await api.get<IApiResponse<{ restaurants: IRestaurant[] }>>('/admin/restaurants');
      return data.data?.restaurants ?? [];
    },
  });

  if (isLoading) return <LoadingScreen message="Loading restaurants..." />;

  return (
    <View style={styles.container}>
      <Header title="Restaurants" subtitle="Manage partner restaurants" />
      <FlatList
        data={restaurants}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.card} activeOpacity={0.9}>
            <View style={styles.topRow}>
              <Text style={styles.name}>{item.name}</Text>
              <StatusBadge status={item.isActive ? 'active' : 'inactive'} size="sm" />
            </View>
            <Text style={styles.cuisine}>{item.cuisine.join(', ')}</Text>
            <View style={styles.bottomRow}>
              <Text style={styles.rating}>★ {item.rating.toFixed(1)}</Text>
              <Text style={styles.orders}>📍 {item.deliveryRadius} km</Text>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={<EmptyState title="No restaurants" icon="🏪" />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  list: { padding: spacing.md },
  card: { backgroundColor: colors.white, borderRadius: borderRadius.md, padding: spacing.md, marginBottom: spacing.sm, ...shadows.sm },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  name: { fontSize: 16, fontWeight: '600', color: colors.text, flex: 1, marginRight: spacing.sm },
  cuisine: { fontSize: 13, color: colors.textSecondary, marginTop: 4 },
  bottomRow: { flexDirection: 'row', marginTop: spacing.sm, gap: spacing.md },
  rating: { fontSize: 13, fontWeight: '600', color: colors.warning },
  orders: { fontSize: 13, color: colors.textSecondary },
});
