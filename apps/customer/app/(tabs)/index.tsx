import { View, Text, FlatList, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { SearchBar } from '../../components/common/search-bar';
import { CategoryPill } from '../../components/common/category-pill';
import { SectionHeader } from '../../components/common/section-header';
import { RestaurantCard } from '../../components/common/restaurant-card';
import { PromoBannerCarousel } from '../../components/common/promo-banner';
import { Loading } from '../../components/common/loading';
import { ErrorState } from '../../components/common/error-state';
import { colors, spacing, typography } from '../../constants';
import api from '../../services/api';
import type { IRestaurant, IApiResponse } from '../../types';

const CATEGORIES = [
  { label: 'All', icon: '🍽' },
  { label: 'Pizza', icon: '🍕' },
  { label: 'Burger', icon: '🍔' },
  { label: 'Sushi', icon: '🍣' },
  { label: 'Chinese', icon: '🥡' },
  { label: 'Indian', icon: '🍛' },
  { label: 'Mexican', icon: '🌮' },
  { label: 'Dessert', icon: '🍰' },
  { label: 'Drinks', icon: '🥤' },
];

export default function HomeScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  const { data: restaurantsData, isLoading, isError, refetch } = useQuery({
    queryKey: ['restaurants', selectedCategory],
    queryFn: async () => {
      const params: Record<string, string> = {};
      if (selectedCategory !== 'All') params.cuisine = selectedCategory;
      if (searchQuery) params.search = searchQuery;
      const { data } = await api.get<IApiResponse<{ restaurants: IRestaurant[] }>>('/restaurants', { params });
      return data.data?.restaurants ?? [];
    },
  });

  const restaurants = restaurantsData ?? [];

  return (
    <View style={styles.container}>
      <View style={styles.headerBar}>
        <View>
          <Text style={styles.greeting}>Deliver to</Text>
          <TouchableOpacity style={styles.locationRow}>
            <Text style={styles.locationIcon}>📍</Text>
            <Text style={styles.locationText}>Current Location</Text>
            <Text style={styles.chevron}>▼</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity style={styles.profileButton}>
          <Text style={styles.profileIcon}>👤</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={restaurants}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <View>
            <View style={styles.searchContainer}>
              <SearchBar
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Search restaurants or food..."
                onFocus={() => router.push('/search')}
              />
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.categoriesContainer}
              contentContainerStyle={styles.categoriesContent}
            >
              {CATEGORIES.map((cat) => (
                <CategoryPill
                  key={cat.label}
                  label={cat.label}
                  icon={cat.icon}
                  selected={selectedCategory === cat.label}
                  onPress={() => setSelectedCategory(cat.label)}
                />
              ))}
            </ScrollView>

            <View style={styles.bannerContainer}>
              <PromoBannerCarousel />
            </View>

            <SectionHeader
              title="Nearby Restaurants"
              actionLabel="See All"
              onAction={() => {}}
            />
          </View>
        }
        renderItem={({ item }) => (
          <RestaurantCard
            restaurant={item}
            onPress={() => router.push(`/restaurant/${item.id}`)}
          />
        )}
        ListEmptyComponent={
          isLoading ? (
            <Loading message="Finding restaurants near you..." />
          ) : isError ? (
            <ErrorState message="Could not load restaurants" onRetry={refetch} />
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>🔍</Text>
              <Text style={styles.emptyTitle}>No restaurants found</Text>
              <Text style={styles.emptySubtitle}>Try a different category</Text>
            </View>
          )
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  headerBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    backgroundColor: colors.white,
  },
  greeting: { ...typography.caption, color: colors.textSecondary },
  locationRow: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
  locationIcon: { fontSize: 14, marginRight: 4 },
  locationText: { ...typography.body, fontWeight: '600', flex: 1 },
  chevron: { fontSize: 10, color: colors.textSecondary, marginLeft: 4 },
  profileButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileIcon: { fontSize: 20 },
  searchContainer: { paddingHorizontal: spacing.md, marginTop: spacing.sm },
  categoriesContainer: { marginTop: spacing.md },
  categoriesContent: { paddingHorizontal: spacing.md },
  bannerContainer: { paddingHorizontal: spacing.md, marginTop: spacing.md },
  listContent: { paddingBottom: spacing.xxl },
  emptyState: { alignItems: 'center', paddingTop: spacing.xxl },
  emptyIcon: { fontSize: 48, marginBottom: spacing.md },
  emptyTitle: { ...typography.h4, color: colors.text },
  emptySubtitle: { ...typography.bodySmall, color: colors.textSecondary, marginTop: 4 },
});
