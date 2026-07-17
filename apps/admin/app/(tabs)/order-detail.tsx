import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useState, useEffect } from 'react';
import { colors, spacing, borderRadius } from '../../constants';
import api from '../../services/api';

const STATUS_COLORS: Record<string, string> = {
  pending: colors.warning,
  confirmed: colors.primary,
  preparing: colors.primary,
  ready: colors.success,
  out_for_delivery: '#17A2B8',
  delivered: colors.success,
  cancelled: colors.error,
};

const STATUS_FLOW = ['pending', 'confirmed', 'preparing', 'ready', 'out_for_delivery', 'delivered'];

interface OrderDetailItem {
  name: string;
  quantity: number;
  unitPrice: number;
  totalPrice?: number;
  specialInstructions?: string;
}

interface OrderDetailCustomer {
  _id?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
}

interface OrderDetailRestaurant {
  _id?: string;
  name?: string;
  phone?: string;
}

interface OrderDetail {
  _id: string;
  customerId?: OrderDetailCustomer;
  restaurantId?: OrderDetailRestaurant;
  items?: OrderDetailItem[];
  status: string;
  subtotal?: number;
  deliveryFee?: number;
  tax?: number;
  tip?: number;
  total?: number;
  createdAt?: string;
  updatedAt?: string;
}

export default function OrderDetailScreen() {
  const { orderId } = useLocalSearchParams<{ orderId: string }>();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const res = await api.get(`/admin/orders/${orderId}`);
        if (mounted) setOrder(res.data.data.order);
      } catch (err) {
        if (mounted) console.error('Failed to fetch order:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, [orderId]);

  if (loading) {
    return (
      <View style={styles.center}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  if (!order) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Order not found</Text>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const currentIndex = STATUS_FLOW.indexOf(order.status);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backArrow}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.orderId}>Order {order._id?.slice(-8).toUpperCase()}</Text>
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: (STATUS_COLORS[order.status] || colors.textSecondary) + '20' },
          ]}
        >
          <Text
            style={[
              styles.statusText,
              { color: STATUS_COLORS[order.status] || colors.textSecondary },
            ]}
          >
            {order.status?.replace(/_/g, ' ')}
          </Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Status Timeline */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Status Timeline</Text>
          <View style={styles.timeline}>
            {STATUS_FLOW.map((s, i) => (
              <View key={s} style={styles.timelineItem}>
                <View
                  style={[
                    styles.timelineDot,
                    i <= currentIndex ? styles.timelineActive : styles.timelineInactive,
                  ]}
                />
                <Text style={[styles.timelineText, i <= currentIndex && styles.timelineTextActive]}>
                  {s.replace(/_/g, ' ')}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Customer Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Customer</Text>
          <View style={styles.infoCard}>
            <Text style={styles.infoText}>
              {order.customerId?.firstName} {order.customerId?.lastName}
            </Text>
            <Text style={styles.infoSubtext}>{order.customerId?.email}</Text>
            <Text style={styles.infoSubtext}>{order.customerId?.phone}</Text>
          </View>
        </View>

        {/* Restaurant Info */}
        {order.restaurantId && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Restaurant</Text>
            <View style={styles.infoCard}>
              <Text style={styles.infoText}>{order.restaurantId.name}</Text>
              <Text style={styles.infoSubtext}>{order.restaurantId.phone}</Text>
            </View>
          </View>
        )}

        {/* Order Items */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Items ({order.items?.length || 0})</Text>
          <View style={styles.infoCard}>
            {order.items?.map((item: OrderDetailItem, idx: number) => (
              <View key={idx} style={styles.itemRow}>
                <View style={styles.itemInfo}>
                  <Text style={styles.itemName}>{item.name}</Text>
                  <Text style={styles.itemQty}>x{item.quantity}</Text>
                </View>
                <Text style={styles.itemPrice}>
                  ${(item.totalPrice || item.unitPrice * item.quantity).toFixed(2)}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Price Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Summary</Text>
          <View style={styles.infoCard}>
            <PriceRow label="Subtotal" value={order.subtotal} />
            <PriceRow label="Delivery Fee" value={order.deliveryFee} />
            <PriceRow label="Tax" value={order.tax} />
            {order.tip ? <PriceRow label="Tip" value={order.tip} /> : null}
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>${order.total?.toFixed(2)}</Text>
            </View>
          </View>
        </View>

        {/* Created */}
        <View style={styles.section}>
          <Text style={styles.metaText}>
            Created: {order.createdAt ? new Date(order.createdAt).toLocaleString() : 'N/A'}
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

function PriceRow({ label, value }: { label: string; value?: number }) {
  return (
    <View style={styles.priceRow}>
      <Text style={styles.priceLabel}>{label}</Text>
      <Text style={styles.priceValue}>${(value || 0).toFixed(2)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.lg },
  loadingText: { fontSize: 16, color: colors.textSecondary },
  errorText: { fontSize: 16, color: colors.error, marginBottom: spacing.md },
  backBtn: {
    backgroundColor: colors.primary,
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: borderRadius.md,
  },
  backBtnText: { color: '#FFFFFF', fontSize: 14, fontWeight: '600' },
  header: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.lg,
  },
  backArrow: { fontSize: 16, color: 'rgba(255,255,255,0.8)', marginBottom: spacing.sm },
  orderId: { fontSize: 20, fontWeight: '700', color: '#FFFFFF', marginBottom: spacing.sm },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
  },
  statusText: { fontSize: 13, fontWeight: '600', textTransform: 'capitalize' },
  scrollContent: { paddingBottom: spacing.xl },
  section: { paddingHorizontal: spacing.lg, marginTop: spacing.lg },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: colors.text, marginBottom: spacing.sm },
  timeline: { paddingLeft: spacing.sm },
  timelineItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  timelineDot: { width: 12, height: 12, borderRadius: 6, marginRight: spacing.sm },
  timelineActive: { backgroundColor: colors.success },
  timelineInactive: { backgroundColor: colors.border },
  timelineText: { fontSize: 13, color: colors.textSecondary, textTransform: 'capitalize' },
  timelineTextActive: { fontWeight: '600', color: colors.text },
  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: borderRadius.md,
    padding: spacing.md,
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
  infoText: { fontSize: 15, fontWeight: '600', color: colors.text },
  infoSubtext: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  itemInfo: { flex: 1 },
  itemName: { fontSize: 14, color: colors.text },
  itemQty: { fontSize: 12, color: colors.textSecondary },
  itemPrice: { fontSize: 14, fontWeight: '600', color: colors.text },
  priceRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  priceLabel: { fontSize: 14, color: colors.textSecondary },
  priceValue: { fontSize: 14, color: colors.text },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  totalLabel: { fontSize: 16, fontWeight: '700', color: colors.text },
  totalValue: { fontSize: 16, fontWeight: '700', color: colors.success },
  metaText: { fontSize: 12, color: colors.textSecondary, textAlign: 'center' },
});
