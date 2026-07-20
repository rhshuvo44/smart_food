import { useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { SearchBar } from '../components/common/search-bar';
import { SectionHeader } from '../components/common/section-header';
import { RestaurantCard } from '../components/common/restaurant-card';
import { Loading } from '../components/common/loading';
import { colors, spacing, typography, borderRadius } from '../constants';
import api from '../services/api';
import type { IRestaurant, IApiResponse } from '../types';

const RECENT_SEARCHES = ['Pizza', 'Burger', 'Sushi', 'Chinese'];

export default function SearchScreen() {
  const [query, setQuery] = useState('');

  const { data: results = [], isLoading } = useQuery({
    queryKey: ['search-restaurants', query],
    queryFn: async () => {
      if (!query.trim()) return [];
      const { data } = await api.get<IApiResponse<{ restaurants: IRestaurant[] }>>('/restaurants', {
        params: { search: query },
      });
      return data.data?.restaurants ?? [];
    },
    enabled: query.length > 0,
  });

  const showResults = query.length > 0;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <View style={styles.searchContainer}>
          <SearchBar
            value={query}
            onChangeText={setQuery}
            placeholder="Search restaurants or food..."
            autoFocus
          />
        </View>
      </View>

      {showResults ? (
        <FlatList
          data={results}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <RestaurantCard
              restaurant={item}
              onPress={() => router.push(`/restaurant/${item.id}`)}
            />
          )}
          ListEmptyComponent={
            isLoading ? (
              <Loading message="Searching..." />
            ) : (
              <View style={styles.emptyState}>
                <Text style={styles.emptyIcon}>🔍</Text>
                <Text style={styles.emptyTitle}>No results found</Text>
                <Text style={styles.emptySubtitle}>Try searching for something else</Text>
              </View>
            )
          }
        />
      ) : (
        <View style={styles.suggestionsContainer}>
          <View style={styles.section}>
            <SectionHeader title="Recent Searches" />
            <View style={styles.chipRow}>
              {RECENT_SEARCHES.map((s) => (
                <TouchableOpacity key={s} style={styles.chip} onPress={() => setQuery(s)}>
                  <Text style={styles.chipIcon}>🕐</Text>
                  <Text style={styles.chipText}>{s}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  backIcon: { fontSize: 20, color: colors.text },
  searchContainer: { flex: 1 },
  suggestionsContainer: { paddingHorizontal: spacing.md },
  section: { marginBottom: spacing.md },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipIcon: { fontSize: 14, marginRight: 6 },
  chipText: { fontSize: 14, color: colors.text },
  popularRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  popularIcon: { fontSize: 16, marginRight: spacing.md },
  popularText: { fontSize: 15, color: colors.text },
  listContent: { padding: spacing.md },
  emptyState: { alignItems: 'center', paddingTop: spacing.xxl },
  emptyIcon: { fontSize: 48, marginBottom: spacing.md },
  emptyTitle: { ...typography.h4, color: colors.text },
  emptySubtitle: { ...typography.bodySmall, color: colors.textSecondary, marginTop: 4 },
});
