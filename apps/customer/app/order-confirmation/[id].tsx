import { View, Text, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useEffect, useRef } from 'react';
import { Animated } from 'react-native';
import { Button } from '../../components/common/button';
import { colors, spacing, typography } from '../../constants';
import { useCartStore } from '../../stores/cart.store';

export default function OrderConfirmationScreen() {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const clearCart = useCartStore((s) => s.clearCart);

  useEffect(() => {
    clearCart();
    Animated.sequence([
      Animated.spring(scaleAnim, { toValue: 1, damping: 8, stiffness: 100, useNativeDriver: true }),
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Animated.View style={[styles.checkCircle, { transform: [{ scale: scaleAnim }] }]}>
          <Text style={styles.checkMark}>✓</Text>
        </Animated.View>

        <Animated.View style={{ opacity: fadeAnim, alignItems: 'center' }}>
          <Text style={styles.title}>Order Placed! 🎉</Text>
          <Text style={styles.subtitle}>
            Your order has been received and is being prepared.
          </Text>

          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Order #</Text>
              <Text style={styles.infoValue}>SMF-123456</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Estimated Delivery</Text>
              <Text style={styles.infoValue}>25-35 min</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Payment</Text>
              <Text style={styles.infoValue}>Paid via Card</Text>
            </View>
          </View>

          <View style={styles.actions}>
            <Button
              title="Track Order"
              onPress={() => router.push('/order-tracking/123')}
              variant="primary"
              style={styles.actionButton}
            />
            <Button
              title="Back to Home"
              onPress={() => router.replace('/(tabs)')}
              variant="ghost"
              style={styles.actionButton}
            />
          </View>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  checkCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.success,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  checkMark: { fontSize: 36, color: colors.white, fontWeight: '700' },
  title: { ...typography.h1, marginBottom: spacing.sm },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  infoCard: {
    width: '100%',
    backgroundColor: colors.surface,
    borderRadius: spacing.lg,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
  },
  infoLabel: { fontSize: 14, color: colors.textSecondary },
  infoValue: { fontSize: 14, fontWeight: '600', color: colors.text },
  actions: { width: '100%', gap: spacing.sm },
  actionButton: { width: '100%' },
});
