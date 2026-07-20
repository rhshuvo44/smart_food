import { TouchableOpacity, View, Text, Image, StyleSheet } from 'react-native';
import { colors, spacing, borderRadius, shadows, typography } from '../../constants';
import type { IRestaurant } from '../../types';

interface RestaurantCardProps {
  restaurant: IRestaurant;
  onPress: () => void;
}

export function RestaurantCard({ restaurant, onPress }: RestaurantCardProps) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.9}>
      <Image
        source={
          restaurant.imageUrl
            ? { uri: restaurant.imageUrl }
            : { uri: 'https://via.placeholder.com/300x150?text=Restaurant' }
        }
        style={styles.image}
      />
      <View style={styles.body}>
        <View style={styles.topRow}>
          <Text style={styles.name} numberOfLines={1}>
            {restaurant.name}
          </Text>
          <View style={styles.ratingBadge}>
            <Text style={styles.ratingIcon}>★</Text>
            <Text style={styles.ratingText}>{restaurant.rating.toFixed(1)}</Text>
          </View>
        </View>
        <Text style={styles.cuisine} numberOfLines={1}>
          {restaurant.cuisine.join(' • ')}
        </Text>
        <View style={styles.bottomRow}>
          <View style={styles.infoChip}>
            <Text style={styles.infoText}>⏱ {restaurant.deliveryFee > 0 ? `$${restaurant.deliveryFee.toFixed(0)}` : 'Free'} delivery</Text>
          </View>
          <Text style={styles.minOrder}>Min ${restaurant.minimumOrder.toFixed(0)}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
    overflow: 'hidden',
    ...shadows.md,
  },
  image: { width: '100%', height: 160, backgroundColor: colors.surfaceVariant },
  body: { padding: spacing.md },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  name: { ...typography.h4, flex: 1, marginRight: spacing.sm },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.successLight,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  ratingIcon: { fontSize: 14, color: '#FFB800', marginRight: 2 },
  ratingText: { fontSize: 13, fontWeight: '600', color: colors.text },
  cuisine: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginTop: 4,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  infoChip: {
    backgroundColor: colors.surfaceVariant,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: borderRadius.sm,
  },
  infoText: { fontSize: 12, color: colors.textSecondary, fontWeight: '500' },
  minOrder: { fontSize: 12, color: colors.textTertiary, marginLeft: spacing.sm },
});
