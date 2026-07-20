import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, typography, shadows, borderRadius } from '../../constants';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: string;
  color?: string;
  change?: string;
  changeType?: 'up' | 'down';
}

export function StatCard({ title, value, icon, color = colors.primary, change, changeType = 'up' }: StatCardProps) {
  return (
    <View style={[styles.card, { borderLeftColor: color }]}>
      <View style={styles.topRow}>
        <Text style={styles.icon}>{icon}</Text>
        <Text style={[styles.change, { color: changeType === 'up' ? colors.success : colors.error }]}>
          {change || ''}
        </Text>
      </View>
      <Text style={styles.value}>{value}</Text>
      <Text style={styles.title}>{title}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderLeftWidth: 4,
    marginBottom: spacing.sm,
    ...shadows.sm,
  },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  icon: { fontSize: 24 },
  change: { fontSize: 12, fontWeight: '600' },
  value: { ...typography.h2, color: colors.text },
  title: { ...typography.bodySmall, color: colors.textSecondary, marginTop: 2 },
});
