import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, borderRadius } from '../../constants';

interface StatusBadgeProps {
  status: string;
  colorMap?: Record<string, string>;
  size?: 'sm' | 'md';
}

const defaultColorMap: Record<string, string> = {
  pending: colors.warning,
  confirmed: colors.info,
  preparing: colors.secondary,
  ready: colors.info,
  out_for_delivery: colors.primary,
  delivered: colors.success,
  cancelled: colors.error,
  active: colors.success,
  inactive: colors.textTertiary,
  approved: colors.success,
  suspended: colors.warning,
};

export function StatusBadge({ status, colorMap, size = 'sm' }: StatusBadgeProps) {
  const map = { ...defaultColorMap, ...colorMap };
  const color = map[status.toLowerCase()] || colors.textSecondary;
  const label = status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  return (
    <View style={[styles.badge, { backgroundColor: color + '20', borderColor: color }, size === 'md' && styles.badgeMd]}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <Text style={[styles.text, { color }, size === 'md' && styles.textMd]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.sm, paddingVertical: 3, borderRadius: borderRadius.sm, borderWidth: 1, alignSelf: 'flex-start' },
  badgeMd: { paddingHorizontal: spacing.md, paddingVertical: 5 },
  dot: { width: 6, height: 6, borderRadius: 3, marginRight: 5 },
  text: { fontSize: 11, fontWeight: '600' },
  textMd: { fontSize: 13 },
});
