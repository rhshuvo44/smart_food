import { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Header } from '../../components/common/header';
import { QuantitySelector } from '../../components/common/quantity-selector';
import { Button } from '../../components/common/button';
import { Divider } from '../../components/common/divider';
import { colors, spacing, typography } from '../../constants';
import { useCartStore } from '../../stores/cart.store';

export default function FoodDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [quantity, setQuantity] = useState(1);
  const [selectedSize, setSelectedSize] = useState('Medium');
  const { addItem, restaurantId } = useCartStore();

  const item = {
    id: id!,
    restaurantId: '1',
    name: 'Margherita Pizza',
    description: 'Fresh mozzarella, basil, and our signature tomato sauce on a hand-tossed crust. Baked to perfection in our wood-fired oven.',
    price: 14.99,
    currency: 'USD',
    category: 'Pizza',
    imageUrl: '',
    isAvailable: true,
    preparationTime: 20,
    dietaryTags: ['Vegetarian'],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const sizes = ['Small', 'Medium', 'Large'];
  const extras = ['Extra Cheese +$2', 'Pepperoni +$3', 'Mushrooms +$1.5', 'Olives +$1'];
  const [selectedExtras, setSelectedExtras] = useState<string[]>([]);

  const totalPrice = (item.price + (selectedSize === 'Large' ? 4 : selectedSize === 'Small' ? -2 : 0)) * quantity;

  const toggleExtra = (extra: string) => {
    setSelectedExtras((prev) =>
      prev.includes(extra) ? prev.filter((e) => e !== extra) : [...prev, extra]
    );
  };

  const handleAddToCart = () => {
    if (restaurantId && restaurantId !== item.restaurantId) {
      Alert.alert('Clear Cart?', 'Adding from a different restaurant will clear your cart.', [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear & Add',
          onPress: () => {
            addItem(item, '1', 'Pizza Paradise');
            router.back();
          },
        },
      ]);
      return;
    }
    for (let i = 0; i < quantity; i++) {
      addItem(item, '1', 'Pizza Paradise');
    }
    router.back();
  };

  return (
    <View style={styles.container}>
      <Header showBack transparent />
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.imageContainer}>
          <View style={styles.imagePlaceholder}>
            <Text style={styles.foodEmoji}>🍕</Text>
          </View>
        </View>

        <View style={styles.content}>
          <Text style={styles.name}>{item.name}</Text>
          <View style={styles.priceRow}>
            <Text style={styles.price}>${totalPrice.toFixed(2)}</Text>
            <View style={styles.dietaryBadge}>
              <Text style={styles.dietaryText}>🌱 Vegetarian</Text>
            </View>
          </View>
          <Text style={styles.description}>{item.description}</Text>

          <Divider />

          <Text style={styles.sectionTitle}>Size</Text>
          <View style={styles.sizeRow}>
            {sizes.map((size) => (
              <TouchableOpacity
                key={size}
                style={[styles.sizeChip, selectedSize === size && styles.sizeChipActive]}
                onPress={() => setSelectedSize(size)}
              >
                <Text style={[styles.sizeText, selectedSize === size && styles.sizeTextActive]}>
                  {size}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Divider />

          <Text style={styles.sectionTitle}>Add Extras</Text>
          <View style={styles.extrasContainer}>
            {extras.map((extra) => (
              <TouchableOpacity
                key={extra}
                style={[styles.extraRow, selectedExtras.includes(extra) && styles.extraRowActive]}
                onPress={() => toggleExtra(extra)}
              >
                <View style={[styles.checkbox, selectedExtras.includes(extra) && styles.checkboxActive]}>
                  {selectedExtras.includes(extra) && <Text style={styles.checkMark}>✓</Text>}
                </View>
                <Text style={styles.extraLabel}>{extra}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Divider />

          <View style={styles.quantityRow}>
            <Text style={styles.sectionTitle}>Quantity</Text>
            <QuantitySelector quantity={quantity} onIncrease={() => setQuantity((q) => q + 1)} onDecrease={() => setQuantity((q) => Math.max(1, q - 1))} />
          </View>
        </View>
      </ScrollView>

      <View style={styles.bottomBar}>
        <View style={styles.bottomBarPrice}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalPrice}>${totalPrice.toFixed(2)}</Text>
        </View>
        <Button title="Add to Cart" onPress={handleAddToCart} variant="primary" style={styles.addToCartBtn} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: { flex: 1 },
  imageContainer: { height: 300, backgroundColor: colors.surfaceVariant },
  imagePlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  foodEmoji: { fontSize: 100 },
  content: { padding: spacing.md, marginTop: -20, backgroundColor: colors.white, borderTopLeftRadius: 24, borderTopRightRadius: 24 },
  name: { ...typography.h2 },
  priceRow: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.sm, justifyContent: 'space-between' },
  price: { ...typography.h2, color: colors.primary },
  dietaryBadge: { backgroundColor: colors.successLight, paddingHorizontal: spacing.sm, paddingVertical: 4, borderRadius: spacing.sm },
  dietaryText: { fontSize: 12, fontWeight: '500', color: colors.success },
  description: { ...typography.body, color: colors.textSecondary, marginTop: spacing.md, lineHeight: 24 },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: colors.text, marginBottom: spacing.sm },
  sizeRow: { flexDirection: 'row', gap: spacing.sm },
  sizeChip: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: spacing.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  sizeChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  sizeText: { fontSize: 14, fontWeight: '500', color: colors.text },
  sizeTextActive: { color: colors.white },
  extrasContainer: { gap: spacing.sm },
  extraRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: spacing.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  extraRowActive: { borderColor: colors.primary, backgroundColor: '#FFF5F0' },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  checkboxActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  checkMark: { color: colors.white, fontSize: 14, fontWeight: '700' },
  extraLabel: { fontSize: 15, color: colors.text, flex: 1 },
  quantityRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  bottomBarPrice: { marginRight: spacing.md },
  totalLabel: { fontSize: 12, color: colors.textSecondary },
  totalPrice: { ...typography.h3, color: colors.primary },
  addToCartBtn: { flex: 1 },
});
