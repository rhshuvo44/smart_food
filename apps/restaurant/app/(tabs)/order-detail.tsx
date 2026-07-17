import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Alert,
} from 'react-native';
import { router, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { useState, useCallback } from 'react';
import { Loading } from '../../components/common/loading';
import { ErrorState } from '../../components/common/error-state';
import { colors, spacing, borderRadius } from '../../constants';
import api from '../../services/api';

interface OrderDetailData {
  id: string;
  customerName: string;
  customerAddress: string;
  customerPhone: string;
  items: Array<{
    name: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    specialInstructions?: string;
  }>;
  subtotal: number;
  tax: number;
  deliveryFee: number;
  total: number;
  status: string;
  specialInstructions?: string;
  statusHistory: Array<{
    status: string;
    timestamp: string;
  }>;
  createdAt: string;
}

const STATUS_COLORS: Record<string, string> = {
  pending: '#FFC107',
  confirmed: colors.primary,
  preparing: '#004E89',
  ready: '#28A745',
  completed: '#6C757D',
  delivered: '#28A745',
  cancelled: '#DC3545',
};

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  preparing: 'Preparing',
  ready: 'Ready',
  completed: 'Completed',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

const MOCK_ORDER: OrderDetailData = {
  id: 'ORD-001',
  customerName: 'John Doe',
  customerAddress: '123 Main St, Apt 4B, New York, NY 10001',
  customerPhone: '+1 (555) 123-4567',
  items: [
    { name: 'Margherita Pizza', quantity: 2, unitPrice: 12.0, totalPrice: 24.0 },
    {
      name: 'Caesar Salad',
      quantity: 1,
      unitPrice: 8.5,
      totalPrice: 8.5,
      specialInstructions: 'No croutons',
    },
    { name: 'Tiramisu', quantity: 1, unitPrice: 6.0, totalPrice: 6.0 },
  ],
  subtotal: 38.5,
  tax: 4.62,
  deliveryFee: 3.0,
  total: 46.12,
  status: 'preparing',
  statusHistory: [
    { status: 'pending', timestamp: new Date(Date.now() - 30 * 60000).toISOString() },
    { status: 'confirmed', timestamp: new Date(Date.now() - 25 * 60000).toISOString() },
    { status: 'preparing', timestamp: new Date(Date.now() - 10 * 60000).toISOString() },
  ],
  createdAt: new Date(Date.now() - 30 * 60000).toISOString(),
};

export default function OrderDetailScreen() {
  const { orderId } = useLocalSearchParams<{ orderId: string }>();
  const [order, setOrder] = useState<OrderDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);

  const fetchOrder = useCallback(async () => {
    if (!orderId) return;
    setLoading(true);
    setError(null);
    try {
      const response = await api.get<{ success: boolean; data: OrderDetailData }>(
        `/orders/${orderId}`,
      );
      setOrder(response.data.data);
    } catch {
      setOrder({ ...MOCK_ORDER, id: orderId });
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useFocusEffect(
    useCallback(() => {
      fetchOrder();
    }, [fetchOrder]),
  );

  const handleStatusUpdate = async (newStatus: string) => {
    if (!orderId) return;
    setUpdating(true);
    try {
      await api.patch(`/orders/${orderId}/status`, { status: newStatus });
      setOrder((prev) => (prev ? { ...prev, status: newStatus } : prev));
    } catch {
      Alert.alert('Error', 'Failed to update order status.');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) return <Loading message="Loading order details..." />;
  if (error && !order) return <ErrorState message={error} onRetry={fetchOrder} />;
  if (!order) return null;

  const statusColor = STATUS_COLORS[order.status] || colors.textSecondary;

  const nextAction = () => {
    switch (order.status) {
      case 'pending':
        return { label: 'Accept Order', status: 'preparing', color: colors.success };
      case 'preparing':
        return { label: 'Mark as Ready', status: 'ready', color: colors.success };
      case 'ready':
        return { label: 'Mark as Completed', status: 'completed', color: colors.success };
      default:
        return null;
    }
  };

  const action = nextAction();

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Order {order.id}</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Status Banner */}
        <View style={[styles.statusBanner, { backgroundColor: statusColor + '15' }]}>
          <Text style={[styles.statusBannerText, { color: statusColor }]}>
            {STATUS_LABELS[order.status] || order.status}
          </Text>
        </View>

        {/* Customer Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Customer Information</Text>
          <View style={styles.infoCard}>
            <InfoRow label="Name" value={order.customerName} />
            <InfoRow label="Address" value={order.customerAddress} />
            <InfoRow label="Phone" value={order.customerPhone} />
          </View>
        </View>

        {/* Order Items */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order Items</Text>
          <View style={styles.infoCard}>
            {order.items.map((item, index) => (
              <View key={index} style={styles.itemRow}>
                <View style={styles.itemInfo}>
                  <View style={styles.itemNameRow}>
                    <Text style={styles.itemQuantity}>{item.quantity}x</Text>
                    <Text style={styles.itemName}>{item.name}</Text>
                  </View>
                  {item.specialInstructions && (
                    <Text style={styles.itemNote}>Note: {item.specialInstructions}</Text>
                  )}
                </View>
                <Text style={styles.itemPrice}>${item.totalPrice.toFixed(2)}</Text>
              </View>
            ))}
            {order.specialInstructions && (
              <View style={styles.instructionsBox}>
                <Text style={styles.instructionsLabel}>Special Instructions:</Text>
                <Text style={styles.instructionsText}>{order.specialInstructions}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Price Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Price Summary</Text>
          <View style={styles.infoCard}>
            <InfoRow label="Subtotal" value={`$${order.subtotal.toFixed(2)}`} />
            <InfoRow label="Tax" value={`$${order.tax.toFixed(2)}`} />
            <InfoRow label="Delivery Fee" value={`$${order.deliveryFee.toFixed(2)}`} />
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>${order.total.toFixed(2)}</Text>
            </View>
          </View>
        </View>

        {/* Status Timeline */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Status Timeline</Text>
          <View style={styles.infoCard}>
            {order.statusHistory.map((entry, index) => (
              <View key={index} style={styles.timelineItem}>
                <View
                  style={[
                    styles.timelineDot,
                    { backgroundColor: STATUS_COLORS[entry.status] || colors.textSecondary },
                  ]}
                />
                {index < order.statusHistory.length - 1 && <View style={styles.timelineLine} />}
                <View style={styles.timelineContent}>
                  <Text style={styles.timelineStatus}>
                    {STATUS_LABELS[entry.status] || entry.status}
                  </Text>
                  <Text style={styles.timelineTime}>{formatDate(entry.timestamp)}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.section}>
          {action && (
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: action.color }]}
              onPress={() => handleStatusUpdate(action.status)}
              disabled={updating}
            >
              <Text style={styles.actionBtnText}>{updating ? 'Updating...' : action.label}</Text>
            </TouchableOpacity>
          )}
          {!['completed', 'cancelled', 'delivered'].includes(order.status) && (
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: colors.error, marginTop: spacing.sm }]}
              onPress={() => handleStatusUpdate('cancelled')}
              disabled={updating}
            >
              <Text style={styles.actionBtnText}>Cancel Order</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={infoRowStyles.row}>
      <Text style={infoRowStyles.label}>{label}</Text>
      <Text style={infoRowStyles.value}>{value}</Text>
    </View>
  );
}

const infoRowStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  label: { fontSize: 14, color: colors.textSecondary, flex: 1 },
  value: { fontSize: 14, color: colors.text, fontWeight: '500', flex: 2, textAlign: 'right' },
});

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return (
    d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) +
    ' ' +
    d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xl,
    paddingBottom: spacing.md,
    backgroundColor: colors.primary,
  },
  backBtn: { paddingVertical: 4, paddingRight: 8 },
  backBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '500' },
  headerTitle: { color: '#FFFFFF', fontSize: 18, fontWeight: '700' },
  headerSpacer: { width: 60 },
  scrollContent: { paddingBottom: spacing.xl },
  statusBanner: {
    margin: spacing.md,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  statusBannerText: { fontSize: 18, fontWeight: '700' },
  section: { paddingHorizontal: spacing.md, marginTop: spacing.md },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: colors.text, marginBottom: spacing.sm },
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
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  itemInfo: { flex: 1, marginRight: spacing.md },
  itemNameRow: { flexDirection: 'row', alignItems: 'center' },
  itemQuantity: { fontSize: 14, fontWeight: '600', color: colors.primary, marginRight: 6 },
  itemName: { fontSize: 14, fontWeight: '500', color: colors.text },
  itemNote: { fontSize: 12, color: colors.textSecondary, marginTop: 2, fontStyle: 'italic' },
  itemPrice: { fontSize: 14, fontWeight: '600', color: colors.text },
  instructionsBox: {
    backgroundColor: colors.surface,
    padding: spacing.sm,
    borderRadius: borderRadius.sm,
    marginTop: spacing.sm,
  },
  instructionsLabel: { fontSize: 12, fontWeight: '600', color: colors.text, marginBottom: 2 },
  instructionsText: { fontSize: 13, color: colors.textSecondary },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    marginTop: 4,
  },
  totalLabel: { fontSize: 16, fontWeight: '700', color: colors.text },
  totalValue: { fontSize: 16, fontWeight: '700', color: colors.primary },
  timelineItem: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 4, minHeight: 40 },
  timelineDot: { width: 12, height: 12, borderRadius: 6, marginTop: 4, marginRight: 12 },
  timelineLine: {
    position: 'absolute',
    left: 5,
    top: 16,
    bottom: 0,
    width: 2,
    backgroundColor: colors.border,
  },
  timelineContent: { flex: 1, paddingBottom: 12 },
  timelineStatus: { fontSize: 14, fontWeight: '500', color: colors.text },
  timelineTime: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  actionBtn: { paddingVertical: 14, borderRadius: borderRadius.md, alignItems: 'center' },
  actionBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
});
