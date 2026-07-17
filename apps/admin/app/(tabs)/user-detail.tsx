import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Alert,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useState, useEffect } from 'react';
import { colors, spacing, borderRadius } from '../../constants';
import api from '../../services/api';

interface UserDetail {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  role: string;
  isActive: boolean;
  isEmailVerified: boolean;
  createdAt: string;
  lastLoginAt?: string;
}

interface UserOrderItem {
  _id: string;
  total?: number;
  createdAt: string;
  status?: string;
}

export default function UserDetailScreen() {
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const [user, setUser] = useState<UserDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<UserOrderItem[]>([]);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const [userRes, orderRes] = await Promise.all([
          api.get(`/admin/users/${userId}`),
          api.get(`/admin/users/${userId}/orders`),
        ]);
        if (mounted) {
          setUser(userRes.data.data.user);
          setOrders(orderRes.data.data.orders);
        }
      } catch (err) {
        if (mounted) console.error('Failed to fetch user:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, [userId]);

  async function toggleActive() {
    if (!user) return;
    try {
      const res = await api.patch(`/admin/users/${userId}`, { isActive: !user.isActive });
      setUser(res.data.data.user);
      Alert.alert('Success', `User ${user.isActive ? 'deactivated' : 'activated'} successfully`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Update failed';
      Alert.alert('Error', message);
    }
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  if (!user) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>User not found</Text>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backArrow}>← Back</Text>
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {(user.firstName?.charAt(0) || '?').toUpperCase()}
            </Text>
          </View>
          <Text style={styles.userName}>
            {user.firstName} {user.lastName}
          </Text>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: user.isActive ? '#28A74520' : '#DC354520' },
            ]}
          >
            <Text
              style={[styles.statusText, { color: user.isActive ? colors.success : colors.error }]}
            >
              {user.isActive ? 'Active' : 'Inactive'}
            </Text>
          </View>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Details</Text>
          <View style={styles.card}>
            <DetailRow label="Email" value={user.email} />
            <DetailRow label="Role" value={user.role?.replace(/_/g, ' ')} />
            <DetailRow label="Phone" value={user.phone || 'N/A'} />
            <DetailRow label="Email Verified" value={user.isEmailVerified ? 'Yes' : 'No'} />
            <DetailRow label="Joined" value={new Date(user.createdAt).toLocaleDateString()} />
            {user.lastLoginAt && (
              <DetailRow label="Last Login" value={new Date(user.lastLoginAt).toLocaleString()} />
            )}
          </View>
        </View>

        {/* Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Actions</Text>
          <TouchableOpacity
            style={[
              styles.actionBtn,
              { backgroundColor: user.isActive ? colors.error : colors.success },
            ]}
            onPress={toggleActive}
          >
            <Text style={styles.actionBtnText}>
              {user.isActive ? 'Deactivate User' : 'Activate User'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Recent Orders */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Orders ({orders.length})</Text>
          {orders.length === 0 ? (
            <Text style={styles.emptyText}>No orders yet</Text>
          ) : (
            orders.slice(0, 10).map((order: UserOrderItem) => (
              <TouchableOpacity
                key={order._id}
                style={styles.orderCard}
                onPress={() =>
                  router.push({ pathname: '/(tabs)/order-detail', params: { orderId: order._id } })
                }
              >
                <Text style={styles.orderId}>{order._id.slice(-8).toUpperCase()}</Text>
                <Text style={styles.orderTotal}>${order.total?.toFixed(2)}</Text>
                <Text style={styles.orderDate}>
                  {new Date(order.createdAt).toLocaleDateString()}
                </Text>
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
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
  backArrow: { fontSize: 16, color: 'rgba(255,255,255,0.8)', marginBottom: spacing.md },
  headerContent: { alignItems: 'center' },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  avatarText: { fontSize: 28, fontWeight: '700', color: '#FFFFFF' },
  userName: { fontSize: 22, fontWeight: '700', color: '#FFFFFF', marginBottom: spacing.xs },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: borderRadius.full },
  statusText: { fontSize: 13, fontWeight: '600' },
  scrollContent: { paddingBottom: spacing.xl },
  section: { paddingHorizontal: spacing.lg, marginTop: spacing.lg },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: colors.text, marginBottom: spacing.sm },
  card: {
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
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  detailLabel: { fontSize: 14, color: colors.textSecondary, flex: 1 },
  detailValue: { fontSize: 14, color: colors.text, fontWeight: '500', flex: 1, textAlign: 'right' },
  actionBtn: { paddingVertical: 14, borderRadius: borderRadius.md, alignItems: 'center' },
  actionBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
  emptyText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    paddingVertical: spacing.lg,
  },
  orderCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
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
  orderId: { fontSize: 13, fontWeight: '600', color: colors.text, flex: 1 },
  orderTotal: { fontSize: 14, fontWeight: '700', color: colors.success },
  orderDate: { fontSize: 12, color: colors.textSecondary, marginLeft: spacing.sm },
});
