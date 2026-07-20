import { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Header } from '../../components/common/header';
import { FoodCard } from '../../components/common/food-card';
import { SectionHeader } from '../../components/common/section-header';
import { Loading } from '../../components/common/loading';
import { colors, spacing, typography, borderRadius, shadows } from '../../constants';
import { useCartStore } from '../../stores/cart.store';
import api from '../../services/api';
import type { IMenuItem, IRestaurant, IApiResponse } from '../../types';

export default function RestaurantDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [selectedCategory, setSelectedCategory] = useState('');
  const { addItem, items, restaurantId } = useCartStore();

  const { data: restaurant, isLoading: loadingRestaurant } = useQuery({
    queryKey: ['restaurant', id],
    queryFn: async () => {
      const { data } = await api.get<IApiResponse<{ restaurant: IRestaurant }>>(`/restaurants/${id}`);
      return data.data?.restaurant;
    },
    enabled: !!id,
  });

  const { data: menuItems = [], isLoading: loadingMenu } = useQuery({
    queryKey: ['restaurant-menu', id],
    queryFn: async () => {
      const { data } = await api.get<IApiResponse<{ items: IMenuItem[] }>>(`/restaurants/${id}/menu`);
      return data.data?.items ?? [];
    },
    enabled: !!id,
  });

  const categories = [...new Set(menuItems.map((item) => item.category))];
  const currentCategory = selectedCategory || categories[0] || '';
  const filteredItems = menuItems.filter((item) => item.category === currentCategory);

  const handleAddToCart = (item: IMenuItem) => {
    if (restaurantId && restaurantId !== item.restaurantId) {
      Alert.alert(
        'Clear Cart?',
        'Adding items from a different restaurant will clear your current cart.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Clear & Add', onPress: () => addItem(item, id!, restaurant?.name ?? '') },
        ]
      );
      return;
    }
    addItem(item, id!, restaurant?.name ?? '');
  };

  const cartCount = items.reduce((sum, i) => sum + i.quantity, 0);

  if (loadingRestaurant) return <Loading message="Loading restaurant..." />;

  return (
    <View style={styles.container}>
      <Header showBack />

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.coverContainer}>
          <View style={styles.coverPlaceholder}>
            <Text style={styles.coverEmoji}>🍽</Text>
          </View>
        </View>

        <View style={styles.infoSection}>
          <View style={styles.nameRow}>
            <Text style={styles.name}>{restaurant?.name ?? 'Restaurant'}</Text>
            <View style={styles.ratingBadge}>
              <Text style={styles.ratingStar}>★</Text>
              <Text style={styles.ratingText}>{restaurant?.rating.toFixed(1) ?? '-'}</Text>
            </View>
          </View>
          <Text style={styles.cuisine}>{restaurant?.cuisine.join(' • ') ?? ''}</Text>
          <View style={styles.metaRow}>
            <View style={styles.metaChip}>
              <Text style={styles.metaText}>🚚 {restaurant?.deliveryFee ? `$${restaurant.deliveryFee.toFixed(0)}` : 'Free'} delivery</Text>
            </View>
            <View style={styles.metaChip}>
              <Text style={styles.metaText}>📏 {restaurant?.deliveryRadius ?? 0} km</Text>
            </View>
          </View>
        </View>

        {categories.length > 0 && (
          <View style={styles.categoriesRow}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {categories.map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[styles.categoryTab, currentCategory === cat && styles.categoryTabActive]}
                  onPress={() => setSelectedCategory(cat)}
                >
                  <Text style={[styles.categoryTabText, currentCategory === cat && styles.categoryTabTextActive]}>
                    {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        <View style={styles.menuSection}>
          <SectionHeader title={currentCategory || 'Menu'} />
          {loadingMenu ? (
            <Loading message="Loading menu..." />
          ) : (
            filteredItems.map((item) => (
              <FoodCard
                key={item.id}
                item={item}
                onPress={() => router.push(`/food/${item.id}`)}
                onAdd={() => handleAddToCart(item)}
              />
            ))
          )}
          {!loadingMenu && filteredItems.length === 0 && (
            <View style={styles.emptyMenu}>
              <Text style={styles.emptyMenuText}>No items in this category</Text>
            </View>
          )}
        </View>
      </ScrollView>

      {cartCount > 0 && (
        <TouchableOpacity
          style={styles.cartBar}
          onPress={() => router.push('/(tabs)/cart')}
          activeOpacity={0.9}
        >
          <View style={styles.cartBarLeft}>
            <Text style={styles.cartBarIcon}>🛒</Text>
            <Text style={styles.cartBarCount}>{cartCount} item{cartCount > 1 ? 's' : ''}</Text>
          </View>
          <Text style={styles.cartBarTotal}>
            View Cart →
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  coverContainer: { height: 220, backgroundColor: colors.surfaceVariant },
  coverPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  coverEmoji: { fontSize: 80 },
  infoSection: { padding: spacing.md, backgroundColor: colors.white },
  nameRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  name: { ...typography.h2, flex: 1 },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.successLight,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: spacing.sm,
  },
  ratingStar: { fontSize: 16, color: '#FFB800', marginRight: 3 },
  ratingText: { fontSize: 14, fontWeight: '700', color: colors.text },
  cuisine: { ...typography.bodySmall, color: colors.textSecondary, marginTop: 4 },
  metaRow: { flexDirection: 'row', marginTop: spacing.md, gap: spacing.sm },
  metaChip: {
    backgroundColor: colors.surfaceVariant,
    paddingHorizontal: spacing.sm,
    paddingVertical: 5,
    borderRadius: spacing.sm,
  },
  metaText: { fontSize: 12, color: colors.textSecondary, fontWeight: '500' },
  categoriesRow: {
    backgroundColor: colors.white,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  categoryTab: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginRight: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surface,
  },
  categoryTabActive: { backgroundColor: colors.primary },
  categoryTabText: { fontSize: 14, fontWeight: '500', color: colors.textSecondary },
  categoryTabTextActive: { color: colors.white },
  menuSection: { paddingHorizontal: spacing.md, paddingTop: spacing.sm },
  cartBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.primary,
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
    padding: spacing.md,
    borderRadius: spacing.md,
    ...shadows.md,
  },
  cartBarLeft: { flexDirection: 'row', alignItems: 'center' },
  cartBarIcon: { fontSize: 20, marginRight: spacing.sm },
  cartBarCount: { color: colors.white, fontWeight: '600', fontSize: 16 },
  cartBarTotal: { color: colors.white, fontWeight: '700', fontSize: 16 },
  emptyMenu: { alignItems: 'center', paddingVertical: spacing.xl },
  emptyMenuText: { fontSize: 14, color: colors.textSecondary },
});
