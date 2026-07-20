import { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { Header } from '../../components/common/header';
import { Button } from '../../components/common/button';
import { Divider } from '../../components/common/divider';
import { colors, spacing, typography, borderRadius } from '../../constants';

const PAYMENT_METHODS = [
  { id: 'card', label: 'Credit/Debit Card', icon: '💳' },
  { id: 'cash', label: 'Cash on Delivery', icon: '💵' },
  { id: 'paypal', label: 'PayPal', icon: '🅿' },
];

const SAVED_ADDRESSES = [
  { id: 'a1', label: 'Home', address: '123 Main St, Apt 4B', icon: '🏠' },
  { id: 'a2', label: 'Work', address: '456 Office Blvd, Suite 200', icon: '💼' },
];

export default function CheckoutScreen() {
  const [selectedAddress, setSelectedAddress] = useState('a1');
  const [selectedPayment, setSelectedPayment] = useState('card');
  const [tip, setTip] = useState<number | null>(null);
  const [placing, setPlacing] = useState(false);

  const tips = [3, 5, 8, null];
  const subtotal = 30.97;
  const deliveryFee = 2.99;
  const tax = subtotal * 0.08;
  const tipAmount = tip ?? 0;
  const total = subtotal + deliveryFee + tax + tipAmount;

  const handlePlaceOrder = () => {
    setPlacing(true);
    setTimeout(() => {
      setPlacing(false);
      router.replace('/order-confirmation/123');
    }, 1500);
  };

  return (
    <View style={styles.container}>
      <Header title="Checkout" showBack />

      <ScrollView showsVerticalScrollIndicator={false} style={styles.scroll}>
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Delivery Address</Text>
            <TouchableOpacity onPress={() => router.push('/checkout/address')}>
              <Text style={styles.addText}>+ Add New</Text>
            </TouchableOpacity>
          </View>
          {SAVED_ADDRESSES.map((addr) => (
            <TouchableOpacity
              key={addr.id}
              style={[styles.selectRow, selectedAddress === addr.id && styles.selectRowActive]}
              onPress={() => setSelectedAddress(addr.id)}
            >
              <Text style={styles.selectIcon}>{addr.icon}</Text>
              <View style={styles.selectInfo}>
                <Text style={styles.selectLabel}>{addr.label}</Text>
                <Text style={styles.selectValue}>{addr.address}</Text>
              </View>
              <View style={[styles.radio, selectedAddress === addr.id && styles.radioActive]}>
                {selectedAddress === addr.id && <View style={styles.radioDot} />}
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <Divider />

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment Method</Text>
          {PAYMENT_METHODS.map((pm) => (
            <TouchableOpacity
              key={pm.id}
              style={[styles.selectRow, selectedPayment === pm.id && styles.selectRowActive]}
              onPress={() => setSelectedPayment(pm.id)}
            >
              <Text style={styles.selectIcon}>{pm.icon}</Text>
              <Text style={[styles.selectLabel, { flex: 1 }]}>{pm.label}</Text>
              <View style={[styles.radio, selectedPayment === pm.id && styles.radioActive]}>
                {selectedPayment === pm.id && <View style={styles.radioDot} />}
              </View>
            </TouchableOpacity>
          ))}
          {selectedPayment === 'card' && (
            <TouchableOpacity
              style={styles.addCardRow}
              onPress={() => router.push('/checkout/payment')}
            >
              <Text style={styles.addCardIcon}>➕</Text>
              <Text style={styles.addCardText}>Add new card</Text>
            </TouchableOpacity>
          )}
        </View>

        <Divider />

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Add a Tip</Text>
          <View style={styles.tipRow}>
            {tips.map((t, i) => (
              <TouchableOpacity
                key={i}
                style={[styles.tipChip, tip === t && styles.tipChipActive]}
                onPress={() => setTip(t)}
              >
                <Text style={[styles.tipText, tip === t && styles.tipTextActive]}>
                  {t === null ? 'No Tip' : `$${t}`}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <Divider />

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order Summary</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subtotal</Text>
            <Text style={styles.summaryValue}>${subtotal.toFixed(2)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Delivery Fee</Text>
            <Text style={styles.summaryValue}>${deliveryFee.toFixed(2)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Tax</Text>
            <Text style={styles.summaryValue}>${tax.toFixed(2)}</Text>
          </View>
          {tipAmount > 0 && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Tip</Text>
              <Text style={styles.summaryValue}>${tipAmount.toFixed(2)}</Text>
            </View>
          )}
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>${total.toFixed(2)}</Text>
          </View>
        </View>
      </ScrollView>

      <View style={styles.bottomBar}>
        <Button
          title={`Place Order • $${total.toFixed(2)}`}
          onPress={handlePlaceOrder}
          variant="primary"
          loading={placing}
          style={styles.placeOrderButton}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: { flex: 1 },
  section: { padding: spacing.md },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  sectionTitle: { ...typography.h4, marginBottom: spacing.sm },
  addText: { fontSize: 14, fontWeight: '600', color: colors.primary },
  selectRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  selectRowActive: { borderColor: colors.primary, backgroundColor: '#FFF5F0' },
  selectIcon: { fontSize: 24, marginRight: spacing.md },
  selectInfo: { flex: 1 },
  selectLabel: { fontSize: 15, fontWeight: '600', color: colors.text },
  selectValue: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioActive: { borderColor: colors.primary },
  radioDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: colors.primary },
  addCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
  },
  addCardIcon: { fontSize: 16, marginRight: spacing.md },
  addCardText: { fontSize: 14, fontWeight: '500', color: colors.primary },
  tipRow: { flexDirection: 'row', gap: spacing.sm },
  tipChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tipChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  tipText: { fontSize: 14, fontWeight: '500', color: colors.text },
  tipTextActive: { color: colors.white },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.xs },
  summaryLabel: { fontSize: 14, color: colors.textSecondary },
  summaryValue: { fontSize: 14, color: colors.text },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.sm },
  totalLabel: { fontSize: 18, fontWeight: '700', color: colors.text },
  totalValue: { fontSize: 18, fontWeight: '700', color: colors.primary },
  bottomBar: {
    padding: spacing.md,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  placeOrderButton: { width: '100%' },
});
