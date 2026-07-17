import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Switch,
  Alert,
  StyleSheet,
  Platform,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { useState, useCallback } from 'react';
import { Loading } from '../../components/common/loading';
import { ErrorState } from '../../components/common/error-state';
import { colors, spacing, borderRadius } from '../../constants';
import { useAuthStore } from '../../stores/auth.store';
import { logoutUser } from '../../services/auth.service';
import api from '../../services/api';

interface BusinessHour {
  dayOfWeek: number;
  openTime: string;
  closeTime: string;
  isClosed: boolean;
}

interface RestaurantProfile {
  id: string;
  name: string;
  description: string;
  cuisine: string[];
  phone: string;
  email: string;
  address: {
    formatted: string;
    street: string;
    city: string;
    state: string;
    zipCode: string;
  };
  businessHours: BusinessHour[];
  deliveryRadius: number;
  deliveryFee: number;
  minimumOrder: number;
  imageUrl?: string;
}

const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const MOCK_PROFILE: RestaurantProfile = {
  id: '1',
  name: 'My Restaurant',
  description: 'A wonderful place to enjoy delicious food made with fresh ingredients.',
  cuisine: ['Italian', 'American'],
  phone: '+1 (555) 123-4567',
  email: 'contact@myrestaurant.com',
  address: {
    formatted: '123 Main St, New York, NY 10001',
    street: '123 Main St',
    city: 'New York',
    state: 'NY',
    zipCode: '10001',
  },
  businessHours: [
    { dayOfWeek: 0, openTime: '09:00', closeTime: '22:00', isClosed: false },
    { dayOfWeek: 1, openTime: '09:00', closeTime: '22:00', isClosed: false },
    { dayOfWeek: 2, openTime: '09:00', closeTime: '22:00', isClosed: false },
    { dayOfWeek: 3, openTime: '09:00', closeTime: '22:00', isClosed: false },
    { dayOfWeek: 4, openTime: '09:00', closeTime: '23:00', isClosed: false },
    { dayOfWeek: 5, openTime: '09:00', closeTime: '23:00', isClosed: false },
    { dayOfWeek: 6, openTime: '10:00', closeTime: '21:00', isClosed: true },
  ],
  deliveryRadius: 5,
  deliveryFee: 3.99,
  minimumOrder: 15,
};

export default function ProfileScreen() {
  const user = useAuthStore((s) => s.user);
  const clearAuth = useAuthStore((s) => s.clearAuth);

  const [profile, setProfile] = useState<RestaurantProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [hoursModalVisible, setHoursModalVisible] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  // Edit form state
  const [editForm, setEditForm] = useState({
    name: '',
    description: '',
    cuisine: '',
    phone: '',
    email: '',
    street: '',
    city: '',
    state: '',
    zipCode: '',
    deliveryRadius: '',
    deliveryFee: '',
    minimumOrder: '',
  });

  // Hours form state
  const [hoursForm, setHoursForm] = useState<BusinessHour[]>([]);

  const fetchProfile = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get<{ success: boolean; data: RestaurantProfile }>(
        '/restaurants/me',
      );
      setProfile(response.data.data);
    } catch {
      setProfile(MOCK_PROFILE);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchProfile();
    }, [fetchProfile]),
  );

  const openEditModal = () => {
    if (!profile) return;
    setEditForm({
      name: profile.name,
      description: profile.description,
      cuisine: profile.cuisine.join(', '),
      phone: profile.phone,
      email: profile.email,
      street: profile.address.street,
      city: profile.address.city,
      state: profile.address.state,
      zipCode: profile.address.zipCode,
      deliveryRadius: profile.deliveryRadius.toString(),
      deliveryFee: profile.deliveryFee.toString(),
      minimumOrder: profile.minimumOrder.toString(),
    });
    setEditModalVisible(true);
  };

  const openHoursModal = () => {
    if (!profile) return;
    setHoursForm(profile.businessHours.map((h) => ({ ...h })));
    setHoursModalVisible(true);
  };

  const handleSaveProfile = async () => {
    if (!profile) return;
    setSaving(true);
    try {
      await api.put('/restaurants/me', {
        name: editForm.name,
        description: editForm.description,
        cuisine: editForm.cuisine
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
        phone: editForm.phone,
        email: editForm.email,
        address: {
          street: editForm.street,
          city: editForm.city,
          state: editForm.state,
          zipCode: editForm.zipCode,
        },
        deliveryRadius: Number(editForm.deliveryRadius),
        deliveryFee: Number(editForm.deliveryFee),
        minimumOrder: Number(editForm.minimumOrder),
      });
      setEditModalVisible(false);
      fetchProfile();
    } catch {
      Alert.alert('Error', 'Failed to save profile.');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveHours = async () => {
    if (!profile) return;
    setSaving(true);
    try {
      await api.put(`/restaurants/${profile.id}/hours`, { businessHours: hoursForm });
      setHoursModalVisible(false);
      fetchProfile();
    } catch {
      Alert.alert('Error', 'Failed to save business hours.');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await logoutUser();
    } catch {
      // Already cleared locally
    }
    clearAuth();
    router.replace('/(auth)/login');
    setLoggingOut(false);
  };

  const toggleDayClosed = (index: number) => {
    setHoursForm((prev) => prev.map((h, i) => (i === index ? { ...h, isClosed: !h.isClosed } : h)));
  };

  const updateHour = (index: number, field: 'openTime' | 'closeTime', value: string) => {
    setHoursForm((prev) => prev.map((h, i) => (i === index ? { ...h, [field]: value } : h)));
  };

  if (loading) return <Loading message="Loading profile..." />;
  if (error && !profile) return <ErrorState message={error} onRetry={fetchProfile} />;
  if (!profile) return null;

  const initials = profile.name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{initials}</Text>
            </View>
          </View>
          <Text style={styles.restaurantName}>{profile.name}</Text>
          <Text style={styles.restaurantEmail}>{user?.email || profile.email}</Text>
        </View>

        {/* Restaurant Details */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Restaurant Details</Text>
            <TouchableOpacity onPress={openEditModal}>
              <Text style={styles.editLink}>Edit</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.infoCard}>
            <ProfileInfoRow label="Name" value={profile.name} />
            <ProfileInfoRow label="Description" value={profile.description} />
            <ProfileInfoRow label="Cuisine" value={profile.cuisine.join(', ')} />
            <ProfileInfoRow label="Phone" value={profile.phone} />
            <ProfileInfoRow label="Email" value={profile.email} />
          </View>
        </View>

        {/* Address */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Address</Text>
          <View style={styles.infoCard}>
            <ProfileInfoRow label="Address" value={profile.address.formatted} />
          </View>
        </View>

        {/* Business Hours */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Business Hours</Text>
            <TouchableOpacity onPress={openHoursModal}>
              <Text style={styles.editLink}>Edit</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.infoCard}>
            {profile.businessHours.map((hour, index) => (
              <View key={index} style={styles.hourRow}>
                <Text style={styles.hourDay}>{DAY_NAMES[hour.dayOfWeek]}</Text>
                <Text style={[styles.hourTime, hour.isClosed && styles.hourClosed]}>
                  {hour.isClosed ? 'Closed' : `${hour.openTime} - ${hour.closeTime}`}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Delivery Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Delivery Settings</Text>
          <View style={styles.infoCard}>
            <ProfileInfoRow label="Delivery Radius" value={`${profile.deliveryRadius} miles`} />
            <ProfileInfoRow label="Delivery Fee" value={`$${profile.deliveryFee.toFixed(2)}`} />
            <ProfileInfoRow label="Minimum Order" value={`$${profile.minimumOrder.toFixed(2)}`} />
          </View>
        </View>

        {/* Sign Out */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} disabled={loggingOut}>
          <Text style={styles.logoutText}>{loggingOut ? 'Signing Out...' : 'Sign Out'}</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Edit Profile Modal */}
      <Modal visible={editModalVisible} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setEditModalVisible(false)}>
              <Text style={styles.modalCancel}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Edit Profile</Text>
            <View style={{ width: 60 }} />
          </View>

          <ScrollView contentContainerStyle={styles.modalContent}>
            <Text style={styles.fieldLabel}>Restaurant Name</Text>
            <TextInput
              style={styles.input}
              value={editForm.name}
              onChangeText={(t) => setEditForm((f) => ({ ...f, name: t }))}
            />

            <Text style={styles.fieldLabel}>Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={editForm.description}
              onChangeText={(t) => setEditForm((f) => ({ ...f, description: t }))}
              multiline
              numberOfLines={3}
            />

            <Text style={styles.fieldLabel}>Cuisine (comma separated)</Text>
            <TextInput
              style={styles.input}
              value={editForm.cuisine}
              onChangeText={(t) => setEditForm((f) => ({ ...f, cuisine: t }))}
            />

            <Text style={styles.fieldLabel}>Phone</Text>
            <TextInput
              style={styles.input}
              value={editForm.phone}
              onChangeText={(t) => setEditForm((f) => ({ ...f, phone: t }))}
              keyboardType="phone-pad"
            />

            <Text style={styles.fieldLabel}>Email</Text>
            <TextInput
              style={styles.input}
              value={editForm.email}
              onChangeText={(t) => setEditForm((f) => ({ ...f, email: t }))}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <Text style={[styles.fieldLabel, { marginTop: spacing.lg }]}>Address</Text>
            <TextInput
              style={styles.input}
              value={editForm.street}
              onChangeText={(t) => setEditForm((f) => ({ ...f, street: t }))}
              placeholder="Street"
            />
            <View style={styles.addressRow}>
              <TextInput
                style={[styles.input, { flex: 2, marginRight: spacing.sm }]}
                value={editForm.city}
                onChangeText={(t) => setEditForm((f) => ({ ...f, city: t }))}
                placeholder="City"
              />
              <TextInput
                style={[styles.input, { flex: 1, marginRight: spacing.sm }]}
                value={editForm.state}
                onChangeText={(t) => setEditForm((f) => ({ ...f, state: t }))}
                placeholder="State"
              />
              <TextInput
                style={[styles.input, { flex: 1 }]}
                value={editForm.zipCode}
                onChangeText={(t) => setEditForm((f) => ({ ...f, zipCode: t }))}
                placeholder="Zip"
              />
            </View>

            <Text style={[styles.fieldLabel, { marginTop: spacing.lg }]}>Delivery Settings</Text>
            <View style={styles.addressRow}>
              <TextInput
                style={[styles.input, { flex: 1, marginRight: spacing.sm }]}
                value={editForm.deliveryRadius}
                onChangeText={(t) => setEditForm((f) => ({ ...f, deliveryRadius: t }))}
                placeholder="Radius (miles)"
                keyboardType="decimal-pad"
              />
              <TextInput
                style={[styles.input, { flex: 1, marginRight: spacing.sm }]}
                value={editForm.deliveryFee}
                onChangeText={(t) => setEditForm((f) => ({ ...f, deliveryFee: t }))}
                placeholder="Fee ($)"
                keyboardType="decimal-pad"
              />
              <TextInput
                style={[styles.input, { flex: 1 }]}
                value={editForm.minimumOrder}
                onChangeText={(t) => setEditForm((f) => ({ ...f, minimumOrder: t }))}
                placeholder="Min ($)"
                keyboardType="decimal-pad"
              />
            </View>

            <TouchableOpacity
              style={[styles.saveBtn, saving && { opacity: 0.6 }]}
              onPress={handleSaveProfile}
              disabled={saving}
            >
              <Text style={styles.saveBtnText}>{saving ? 'Saving...' : 'Save Changes'}</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>

      {/* Business Hours Modal */}
      <Modal visible={hoursModalVisible} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setHoursModalVisible(false)}>
              <Text style={styles.modalCancel}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Business Hours</Text>
            <View style={{ width: 60 }} />
          </View>

          <ScrollView contentContainerStyle={styles.modalContent}>
            {hoursForm.map((hour, index) => (
              <View key={index} style={styles.hoursEditRow}>
                <View style={styles.hoursDayRow}>
                  <Text style={styles.hoursDayLabel}>{DAY_NAMES[hour.dayOfWeek]}</Text>
                  <Switch
                    value={!hour.isClosed}
                    onValueChange={() => toggleDayClosed(index)}
                    trackColor={{ false: colors.border, true: colors.success + '60' }}
                    thumbColor={!hour.isClosed ? colors.success : colors.textSecondary}
                  />
                </View>
                {!hour.isClosed && (
                  <View style={styles.hoursTimeRow}>
                    <Text style={styles.hoursLabel}>Open</Text>
                    <TextInput
                      style={styles.hourInput}
                      value={hour.openTime}
                      onChangeText={(t) => updateHour(index, 'openTime', t)}
                      placeholder="09:00"
                      placeholderTextColor={colors.textSecondary}
                    />
                    <Text style={styles.hoursLabel}>Close</Text>
                    <TextInput
                      style={styles.hourInput}
                      value={hour.closeTime}
                      onChangeText={(t) => updateHour(index, 'closeTime', t)}
                      placeholder="22:00"
                      placeholderTextColor={colors.textSecondary}
                    />
                  </View>
                )}
                {index < hoursForm.length - 1 && <View style={styles.hoursDivider} />}
              </View>
            ))}

            <TouchableOpacity
              style={[styles.saveBtn, saving && { opacity: 0.6 }]}
              onPress={handleSaveHours}
              disabled={saving}
            >
              <Text style={styles.saveBtnText}>{saving ? 'Saving...' : 'Save Hours'}</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

function ProfileInfoRow({ label, value }: { label: string; value: string }) {
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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scrollContent: { paddingBottom: spacing.xl },
  header: {
    alignItems: 'center',
    padding: spacing.xl,
    backgroundColor: colors.primary,
    paddingTop: spacing.xl * 1.5,
  },
  avatarContainer: { marginBottom: spacing.md },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: { fontSize: 32, fontWeight: '700', color: '#FFFFFF' },
  restaurantName: { fontSize: 22, fontWeight: '700', color: '#FFFFFF' },
  restaurantEmail: { fontSize: 14, color: '#FFFFFF', opacity: 0.8, marginTop: 4 },
  section: { paddingHorizontal: spacing.md, marginTop: spacing.lg },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: colors.text },
  editLink: { fontSize: 14, color: colors.primary, fontWeight: '600' },
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
  hourRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  hourDay: { fontSize: 14, color: colors.text, fontWeight: '500' },
  hourTime: { fontSize: 14, color: colors.textSecondary },
  hourClosed: { color: colors.error, fontWeight: '500' },
  logoutBtn: {
    marginHorizontal: spacing.md,
    marginTop: spacing.xl,
    marginBottom: 40,
    paddingVertical: 14,
    borderRadius: borderRadius.md,
    backgroundColor: colors.error,
    alignItems: 'center',
  },
  logoutText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
  modalContainer: { flex: 1, backgroundColor: colors.background },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xl,
    paddingBottom: spacing.md,
    backgroundColor: colors.primary,
  },
  modalCancel: { color: '#FFFFFF', fontSize: 16 },
  modalTitle: { color: '#FFFFFF', fontSize: 18, fontWeight: '700' },
  modalContent: { padding: spacing.lg, paddingBottom: 60 },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 6,
    marginTop: spacing.md,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    padding: 12,
    fontSize: 16,
    color: colors.text,
    backgroundColor: '#FFFFFF',
  },
  textArea: { minHeight: 80, textAlignVertical: 'top' },
  addressRow: { flexDirection: 'row', marginTop: spacing.sm },
  saveBtn: {
    backgroundColor: colors.secondary,
    paddingVertical: 14,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    marginTop: spacing.xl,
  },
  saveBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
  hoursEditRow: { marginBottom: spacing.md },
  hoursDayRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  hoursDayLabel: { fontSize: 16, fontWeight: '600', color: colors.text },
  hoursTimeRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginLeft: 4 },
  hoursLabel: { fontSize: 14, color: colors.textSecondary },
  hourInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    padding: 10,
    fontSize: 16,
    color: colors.text,
    backgroundColor: '#FFFFFF',
    width: 80,
    textAlign: 'center',
  },
  hoursDivider: { height: 1, backgroundColor: colors.border, marginTop: spacing.md },
});
