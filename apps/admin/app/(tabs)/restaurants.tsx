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

interface RestaurantItem {
  _id: string;
  name: string;
  email: string;
  phone: string;
  cuisine: string[];
  rating: number;
  isActive: boolean;
  isApproved: boolean;
  createdAt: string;
}

export default function RestaurantsScreen() {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('');
  const [restaurants, setRestaurants] = useState<RestaurantItem[]>([]);
  const [, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchRestaurants = useCallback(
    async (isRefresh = false) => {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      try {
        const params: Record<string, string> = {};
        if (search.trim()) params.search = search.trim();
        if (filter) params.isApproved = filter;

        const res = await api.get('/admin/restaurants', { params });
        setRestaurants(res.data.data.restaurants);
      } catch (err) {
        console.error('Failed to fetch restaurants:', err);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [search, filter],
  );

  useEffect(() => {
    fetchRestaurants();
  }, [search, filter]);

  const FILTERS = ['', 'true', 'false'];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Restaurants</Text>
        <TextInput
          style={styles.search}
          placeholder="Search name or email..."
          placeholderTextColor="#999"
          value={search}
          onChangeText={setSearch}
          onSubmitEditing={() => fetchRestaurants()}
        />
      </View>

      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterRow}
        data={FILTERS}
        keyExtractor={(f) => f || 'all'}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.filterChip, filter === item && styles.filterChipActive]}
            onPress={() => {
              setFilter(item);
            }}
          >
            <Text style={[styles.filterChipText, filter === item && styles.filterChipTextActive]}>
              {item === '' ? 'All' : item === 'true' ? 'Approved' : 'Pending'}
            </Text>
          </TouchableOpacity>
        )}
      />

      <FlatList
        data={restaurants}
        keyExtractor={(r) => r._id}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => fetchRestaurants(true)}
            colors={[colors.primary]}
          />
        }
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() =>
              router.push({
                pathname: '/(tabs)/restaurant-detail',
                params: { restaurantId: item._id },
              })
            }
          >
            <View style={styles.cardHeader}>
              <Text style={styles.cardName}>{item.name}</Text>
              <View style={styles.badges}>
                {!item.isApproved && (
                  <View style={[styles.badge, { backgroundColor: colors.warning + '20' }]}>
                    <Text style={[styles.badgeText, { color: colors.warning }]}>Pending</Text>
                  </View>
                )}
                {!item.isActive && (
                  <View style={[styles.badge, { backgroundColor: colors.error + '20' }]}>
                    <Text style={[styles.badgeText, { color: colors.error }]}>Inactive</Text>
                  </View>
                )}
              </View>
            </View>
            <Text style={styles.cuisine}>{item.cuisine?.join(', ') || 'No cuisines'}</Text>
            <View style={styles.cardFooter}>
              <Text style={styles.rating}>★ {item.rating?.toFixed(1) || 'N/A'}</Text>
              <Text style={styles.email}>{item.email}</Text>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No restaurants found</Text>
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
  search: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: borderRadius.md,
    padding: Platform.OS === 'ios' ? 12 : 8,
    fontSize: 14,
    color: '#FFFFFF',
  },
  filterRow: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, gap: spacing.sm },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: borderRadius.full,
    backgroundColor: '#F0F0F0',
  },
  filterChipActive: { backgroundColor: colors.secondary },
  filterChipText: { fontSize: 12, fontWeight: '600', color: colors.textSecondary },
  filterChipTextActive: { color: '#FFFFFF' },
  list: { padding: spacing.md },
  card: {
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
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  cardName: { fontSize: 16, fontWeight: '600', color: colors.text, flex: 1 },
  badges: { flexDirection: 'row', gap: 4 },
  badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: borderRadius.full },
  badgeText: { fontSize: 11, fontWeight: '600' },
  cuisine: { fontSize: 13, color: colors.textSecondary, marginBottom: 8 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  rating: { fontSize: 14, fontWeight: '600', color: colors.warning },
  email: { fontSize: 12, color: colors.textSecondary },
  empty: { alignItems: 'center', paddingVertical: 60 },
  emptyText: { fontSize: 16, color: colors.textSecondary },
});
