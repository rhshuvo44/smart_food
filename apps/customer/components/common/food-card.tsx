import { TouchableOpacity, View, Text, Image, StyleSheet } from 'react-native';
import { colors, spacing, borderRadius, shadows, typography } from '../../constants';
import type { IMenuItem } from '../../types';

interface FoodCardProps {
  item: IMenuItem;
  onPress: () => void;
  onAdd?: () => void;
}

export function FoodCard({ item, onPress, onAdd }: FoodCardProps) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.9}>
      {item.imageUrl ? (
        <Image source={{ uri: item.imageUrl }} style={styles.image} />
      ) : (
        <View style={[styles.image, styles.placeholderImage]}>
          <Text style={styles.placeholderIcon}>🍽</Text>
        </View>
      )}
      <View style={styles.body}>
        <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
        <Text style={styles.description} numberOfLines={2}>{item.description}</Text>
        <View style={styles.bottomRow}>
          <Text style={styles.price}>${item.price.toFixed(2)}</Text>
          {onAdd && (
            <TouchableOpacity style={styles.addButton} onPress={onAdd} activeOpacity={0.8}>
              <Text style={styles.addIcon}>+</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
    padding: spacing.sm,
    ...shadows.sm,
  },
  image: { width: 80, height: 80, borderRadius: borderRadius.md, backgroundColor: colors.surfaceVariant },
  placeholderImage: { alignItems: 'center', justifyContent: 'center' },
  placeholderIcon: { fontSize: 32 },
  body: { flex: 1, marginLeft: spacing.md, justifyContent: 'center' },
  name: { ...typography.body, fontWeight: '600' },
  description: { ...typography.bodySmall, color: colors.textSecondary, marginTop: 2 },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  price: { ...typography.price, color: colors.primary },
  addButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addIcon: { fontSize: 18, color: colors.white, fontWeight: '600' },
});
