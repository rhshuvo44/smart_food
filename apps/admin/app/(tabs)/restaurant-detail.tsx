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

interface RestaurantDetailAddress {
  street?: string;
  city?: string;
  state?: string;
  zipCode?: string;
}

interface RestaurantDetail {
  _id: string;
  name: string;
  email: string;
  phone: string;
  description?: string;
  cuisine?: string[];
  rating?: number;
  isActive: boolean;
  isApproved: boolean;
  deliveryFee?: number;
  minimumOrder?: number;
  deliveryRadius?: number;
  address?: RestaurantDetailAddress;
  createdAt?: string;
}

export default function RestaurantDetailScreen() {
  const { restaurantId } = useLocalSearchParams<{ restaurantId: string }>();
  const [restaurant, setRestaurant] = useState<RestaurantDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const res = await api.get(`/admin/restaurants/${restaurantId}`);
        if (mounted) setRestaurant(res.data.data.restaurant);
      } catch (err) {
        if (mounted) console.error('Failed to fetch restaurant:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, [restaurantId]);

  async function handleApprove() {
    if (!restaurant) return;
    try {
      const res = await api.patch(`/admin/restaurants/${restaurantId}/approve`);
      setRestaurant(res.data.data.restaurant);
      Alert.alert('Success', 'Restaurant approved');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to approve';
      Alert.alert('Error', message);
    }
  }

  async function toggleActive() {
    if (!restaurant) return;
    try {
      const res = await api.patch(`/admin/restaurants/${restaurantId}/status`, {
        isActive: !restaurant.isActive,
      });
      setRestaurant(res.data.data.restaurant);
      Alert.alert('Success', `Restaurant ${restaurant.isActive ? 'deactivated' : 'activated'}`);
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

  if (!restaurant) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Restaurant not found</Text>
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
        <Text style={styles.name}>{restaurant.name}</Text>
        <View style={styles.headerBadges}>
          {!restaurant.isApproved && (
            <View style={[styles.badge, { backgroundColor: colors.warning + '20' }]}>
              <Text style={[styles.badgeText, { color: colors.warning }]}>Pending Approval</Text>
            </View>
          )}
          <View
            style={[
              styles.badge,
              { backgroundColor: restaurant.isActive ? '#28A74520' : '#DC354520' },
            ]}
          >
            <Text
              style={[
                styles.badgeText,
                { color: restaurant.isActive ? colors.success : colors.error },
              ]}
            >
              {restaurant.isActive ? 'Active' : 'Inactive'}
            </Text>
          </View>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Details</Text>
          <View style={styles.card}>
            <DetailRow label="Email" value={restaurant.email} />
            <DetailRow label="Phone" value={restaurant.phone} />
            <DetailRow
              label="Rating"
              value={restaurant.rating ? `★ ${restaurant.rating.toFixed(1)}` : 'N/A'}
            />
            <DetailRow label="Cuisine" value={restaurant.cuisine?.join(', ') || 'N/A'} />
            <DetailRow
              label="Delivery Fee"
              value={`$${restaurant.deliveryFee?.toFixed(2) || '0.00'}`}
            />
            <DetailRow
              label="Min Order"
              value={`$${restaurant.minimumOrder?.toFixed(2) || '0.00'}`}
            />
            <DetailRow label="Delivery Radius" value={`${restaurant.deliveryRadius || 0} km`} />
          </View>
        </View>

        {/* Description */}
        {restaurant.description && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Description</Text>
            <View style={styles.card}>
              <Text style={styles.descText}>{restaurant.description}</Text>
            </View>
          </View>
        )}

        {/* Address */}
        {restaurant.address && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Address</Text>
            <View style={styles.card}>
              <Text style={styles.descText}>
                {restaurant.address.street}, {restaurant.address.city}, {restaurant.address.state}{' '}
                {restaurant.address.zipCode}
              </Text>
            </View>
          </View>
        )}

        {/* Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Actions</Text>
          {!restaurant.isApproved && (
            <TouchableOpacity
              style={[
                styles.actionBtn,
                { backgroundColor: colors.success, marginBottom: spacing.sm },
              ]}
              onPress={handleApprove}
            >
              <Text style={styles.actionBtnText}>Approve Restaurant</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={[
              styles.actionBtn,
              { backgroundColor: restaurant.isActive ? colors.error : colors.success },
            ]}
            onPress={toggleActive}
          >
            <Text style={styles.actionBtnText}>
              {restaurant.isActive ? 'Deactivate Restaurant' : 'Activate Restaurant'}
            </Text>
          </TouchableOpacity>
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
  backArrow: { fontSize: 16, color: 'rgba(255,255,255,0.8)', marginBottom: spacing.sm },
  name: { fontSize: 22, fontWeight: '700', color: '#FFFFFF', marginBottom: spacing.sm },
  headerBadges: { flexDirection: 'row', gap: spacing.sm },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
    alignSelf: 'flex-start',
  },
  badgeText: { fontSize: 13, fontWeight: '600' },
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
  descText: { fontSize: 14, color: colors.text, lineHeight: 20 },
  actionBtn: { paddingVertical: 14, borderRadius: borderRadius.md, alignItems: 'center' },
  actionBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
});
