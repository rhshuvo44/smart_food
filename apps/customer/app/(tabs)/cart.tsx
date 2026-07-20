import { View, Text, FlatList, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { router } from 'expo-router';
import { useCartStore } from '../../stores/cart.store';
import { QuantitySelector } from '../../components/common/quantity-selector';
import { Button } from '../../components/common/button';
import { Divider } from '../../components/common/divider';
import { EmptyState } from '../../components/common/empty-state';
import { colors, spacing, typography, shadows } from '../../constants';

export default function CartScreen() {
  const { items, restaurantName, updateQuantity, removeItem, getSubtotal, clearCart } = useCartStore();

  if (items.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.headerArea}>
          <Text style={styles.headerTitle}>Your Cart</Text>
          <Text style={styles.headerSubtitle}>Food delivery</Text>
        </View>
        <EmptyState
          title="Your cart is empty"
          subtitle="Browse restaurants and add items to get started"
          icon="🛒"
        />
        <View style={styles.bottomPadding}>
          <Button
            title="Browse Restaurants"
            onPress={() => router.push('/(tabs)')}
            variant="primary"
            style={styles.browseButton}
          />
        </View>
      </View>
    );
  }

  const subtotal = getSubtotal();
  const deliveryFee = 2.99;
  const tax = subtotal * 0.08;
  const total = subtotal + deliveryFee + tax;

  return (
    <View style={styles.container}>
      <View style={styles.headerArea}>
        <Text style={styles.headerTitle}>Your Cart</Text>
        <TouchableOpacity onPress={clearCart}>
          <Text style={styles.clearText}>Clear</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.restaurantInfo}>
        <Text style={styles.restaurantName}>{restaurantName}</Text>
      </View>

      <FlatList
        data={items}
        keyExtractor={(item) => item.menuItem.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <View style={styles.cartItem}>
            {item.menuItem.imageUrl ? (
              <Image source={{ uri: item.menuItem.imageUrl }} style={styles.itemImage} />
            ) : (
              <View style={[styles.itemImage, styles.itemImagePlaceholder]}>
                <Text style={styles.itemEmoji}>🍽</Text>
              </View>
            )}
            <View style={styles.itemInfo}>
              <Text style={styles.itemName} numberOfLines={1}>{item.menuItem.name}</Text>
              <Text style={styles.itemPrice}>${(item.menuItem.price * item.quantity).toFixed(2)}</Text>
              <QuantitySelector
                quantity={item.quantity}
                onIncrease={() => updateQuantity(item.menuItem.id, item.quantity + 1)}
                onDecrease={() => {
                  if (item.quantity <= 1) {
                    removeItem(item.menuItem.id);
                  } else {
                    updateQuantity(item.menuItem.id, item.quantity - 1);
                  }
                }}
                size="sm"
              />
            </View>
          </View>
        )}
      />

      <View style={styles.footer}>
        <View style={styles.promoRow}>
          <Text style={styles.promoIcon}>🎫</Text>
          <Text style={styles.promoPlaceholder}>Add promo code</Text>
          <TouchableOpacity>
            <Text style={styles.applyText}>Apply</Text>
          </TouchableOpacity>
        </View>

        <Divider spacing={spacing.sm} />

        <View style={styles.priceBreakdown}>
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Subtotal</Text>
            <Text style={styles.priceValue}>${subtotal.toFixed(2)}</Text>
          </View>
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Delivery Fee</Text>
            <Text style={styles.priceValue}>${deliveryFee.toFixed(2)}</Text>
          </View>
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Tax</Text>
            <Text style={styles.priceValue}>${tax.toFixed(2)}</Text>
          </View>
          <Divider spacing={spacing.sm} />
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>${total.toFixed(2)}</Text>
          </View>
        </View>

        <Button
          title={`Proceed to Checkout • $${total.toFixed(2)}`}
          onPress={() => router.push('/checkout')}
          variant="primary"
          style={styles.checkoutButton}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  headerArea: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  headerTitle: { ...typography.h2 },
  headerSubtitle: { ...typography.bodySmall, color: colors.textSecondary },
  clearText: { ...typography.body, color: colors.error, fontWeight: '600' },
  restaurantInfo: { paddingHorizontal: spacing.md, paddingBottom: spacing.sm },
  restaurantName: { ...typography.body, color: colors.textSecondary },
  listContent: { paddingHorizontal: spacing.md, paddingBottom: spacing.sm },
  cartItem: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderRadius: spacing.md,
    padding: spacing.sm,
    marginBottom: spacing.sm,
    ...shadows.sm,
  },
  itemImage: { width: 64, height: 64, borderRadius: spacing.md, backgroundColor: colors.surfaceVariant },
  itemImagePlaceholder: { alignItems: 'center', justifyContent: 'center' },
  itemEmoji: { fontSize: 28 },
  itemInfo: { flex: 1, marginLeft: spacing.md, justifyContent: 'center' },
  itemName: { fontSize: 15, fontWeight: '600', color: colors.text },
  itemPrice: { fontSize: 15, fontWeight: '700', color: colors.primary, marginTop: 2, marginBottom: spacing.sm },
  footer: {
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    padding: spacing.md,
  },
  promoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: spacing.md,
    padding: spacing.sm,
    marginBottom: spacing.sm,
  },
  promoIcon: { fontSize: 20, marginRight: spacing.sm },
  promoPlaceholder: { flex: 1, fontSize: 14, color: colors.textTertiary },
  applyText: { fontSize: 14, fontWeight: '600', color: colors.primary },
  priceBreakdown: { marginBottom: spacing.md },
  priceRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.xs },
  priceLabel: { fontSize: 14, color: colors.textSecondary },
  priceValue: { fontSize: 14, color: colors.text },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between' },
  totalLabel: { fontSize: 16, fontWeight: '700', color: colors.text },
  totalValue: { fontSize: 16, fontWeight: '700', color: colors.primary },
  checkoutButton: { marginTop: spacing.sm },
  bottomPadding: { padding: spacing.md, marginTop: 'auto' },
  browseButton: { marginTop: 'auto' },
});
