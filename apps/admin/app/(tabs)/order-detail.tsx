import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Stack } from 'expo-router';
import { Header } from '../../components/common/header';
import { StatusBadge } from '../../components/common/status-badge';
import { Divider } from '../../components/common/divider';
import { colors, spacing } from '../../constants';

export default function OrderDetailScreen() {
  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <Header title="Order Detail" showBack />
      <View style={styles.content}>
        <View style={styles.badgeRow}>
          <StatusBadge status="preparing" size="md" />
          <Text style={styles.date}>Today, 2:30 PM</Text>
        </View>
        <Divider />
        <Text style={styles.label}>Items</Text>
        <View style={styles.itemRow}>
          <Text style={styles.itemName}>Margherita Pizza × 2</Text>
          <Text style={styles.itemTotal}>$29.98</Text>
        </View>
        <Divider />
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalValue}>$29.98</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md },
  badgeRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  date: { fontSize: 13, color: colors.textSecondary },
  label: { fontSize: 14, fontWeight: '600', color: colors.text, marginBottom: spacing.sm },
  itemRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.sm },
  itemName: { fontSize: 14, color: colors.text, flex: 1 },
  itemTotal: { fontSize: 14, fontWeight: '600', color: colors.text },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between' },
  totalLabel: { fontSize: 16, fontWeight: '700', color: colors.text },
  totalValue: { fontSize: 16, fontWeight: '700', color: colors.primary },
});
