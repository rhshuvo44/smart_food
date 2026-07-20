import { View, Text, StyleSheet, Platform } from 'react-native';
import { colors, spacing, borderRadius } from '../../constants';

interface StatCardProps {
  icon: string;
  value: string;
  label: string;
  color?: string;
}

export function StatCard({ icon, value, label, color = colors.primary }: StatCardProps) {
  return (
    <View style={[styles.card, { borderLeftColor: color }]}>
      <Text style={styles.icon}>{icon}</Text>
      <Text style={[styles.value, { color }]}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white, borderRadius: borderRadius.lg, padding: spacing.md,
    width: 150, borderLeftWidth: 4,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8 },
      android: { elevation: 3 },
    }),
  },
  icon: { fontSize: 24, marginBottom: spacing.xs },
  value: { fontSize: 22, fontWeight: '700' },
  label: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
});
