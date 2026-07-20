import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { Button } from '../../components/common/button';
import { Avatar } from '../../components/common/avatar';
import { useAuthStore } from '../../stores/auth.store';
import { logoutUser } from '../../services/auth.service';
import { colors, spacing, typography, shadows } from '../../constants';

const menuSections = [
  {
    title: 'Account',
    items: [
      { icon: '📍', label: 'Saved Addresses', route: '/checkout/address' },
      { icon: '💳', label: 'Payment Methods', route: '/checkout/payment' },
      { icon: '⭐', label: 'Favorites', route: '' },
    ],
  },
  {
    title: 'Settings',
    items: [
      { icon: '🔔', label: 'Notifications', route: '' },
      { icon: '🔒', label: 'Privacy', route: '' },
      { icon: '❓', label: 'Help & Support', route: '' },
    ],
  },
];

export default function ProfileScreen() {
  const { isAuthenticated, user } = useAuthStore();

  async function handleLogout() {
    await logoutUser();
    router.replace('/(auth)/login');
  }

  if (!isAuthenticated) {
    return (
      <View style={[styles.container, styles.centered]}>
        <View style={styles.illustrationCircle}>
          <Text style={styles.illustrationIcon}>👤</Text>
        </View>
        <Text style={styles.signInTitle}>Profile</Text>
        <Text style={styles.signInSubtitle}>Sign in to manage your account and orders.</Text>
        <Button
          title="Sign In"
          onPress={() => router.push('/(auth)/login')}
          variant="primary"
          style={styles.signInButton}
        />
        <Button
          title="Create an Account"
          onPress={() => router.push('/(auth)/register')}
          variant="ghost"
          style={styles.signUpButton}
        />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.profileHeader}>
        <Avatar
          name={`${user?.firstName || ''} ${user?.lastName || ''}`}
          size={72}
        />
        <Text style={styles.profileName}>
          {user?.firstName} {user?.lastName}
        </Text>
        <Text style={styles.profileEmail}>{user?.email}</Text>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>0</Text>
          <Text style={styles.statLabel}>Orders</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>0</Text>
          <Text style={styles.statLabel}>Favorites</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>$0</Text>
          <Text style={styles.statLabel}>Saved</Text>
        </View>
      </View>

      {menuSections.map((section) => (
        <View key={section.title} style={styles.menuSection}>
          <Text style={styles.menuSectionTitle}>{section.title}</Text>
          <View style={styles.menuCard}>
            {section.items.map((item, iIdx) => (
              <TouchableOpacity
                key={item.label}
                style={[styles.menuItem, iIdx < section.items.length - 1 && styles.menuItemBorder]}
                onPress={() => item.route && router.push(item.route as any)}
                activeOpacity={0.7}
              >
                <Text style={styles.menuIcon}>{item.icon}</Text>
                <Text style={styles.menuLabel}>{item.label}</Text>
                <Text style={styles.menuChevron}>›</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      ))}

      <View style={styles.logoutSection}>
        <Button
          title="Sign Out"
          onPress={handleLogout}
          variant="ghost"
          style={styles.logoutButton}
          textStyle={styles.logoutText}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  centered: { justifyContent: 'center', alignItems: 'center', padding: spacing.lg },
  illustrationCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.surfaceVariant,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  illustrationIcon: { fontSize: 48 },
  signInTitle: { ...typography.h2, marginBottom: spacing.sm },
  signInSubtitle: { ...typography.body, color: colors.textSecondary, textAlign: 'center', marginBottom: spacing.xl },
  signInButton: { width: '100%', marginBottom: spacing.sm },
  signUpButton: { width: '100%' },
  profileHeader: { alignItems: 'center', padding: spacing.xl },
  profileName: { ...typography.h3, marginTop: spacing.md },
  profileEmail: { ...typography.bodySmall, color: colors.textSecondary, marginTop: 4 },
  statsRow: {
    flexDirection: 'row',
    marginHorizontal: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: spacing.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  statCard: { flex: 1, alignItems: 'center' },
  statNumber: { ...typography.h3, color: colors.primary },
  statLabel: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  statDivider: { width: 1, backgroundColor: colors.border },
  menuSection: { paddingHorizontal: spacing.md, marginBottom: spacing.md },
  menuSectionTitle: { fontSize: 13, fontWeight: '600', color: colors.textTertiary, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: spacing.sm },
  menuCard: {
    backgroundColor: colors.white,
    borderRadius: spacing.md,
    overflow: 'hidden',
    ...shadows.sm,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
  },
  menuItemBorder: { borderBottomWidth: 1, borderBottomColor: colors.borderLight },
  menuIcon: { fontSize: 20, marginRight: spacing.md, width: 28 },
  menuLabel: { flex: 1, fontSize: 15, color: colors.text },
  menuChevron: { fontSize: 20, color: colors.textTertiary },
  logoutSection: { padding: spacing.md, paddingBottom: spacing.xxl },
  logoutButton: { borderColor: colors.error },
  logoutText: { color: colors.error },
});
