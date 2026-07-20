import { View, Text, StyleSheet } from 'react-native';
import { colors, borderRadius } from '../../constants';

interface StatusBadgeProps {
  status: string;
  size?: 'sm' | 'md' | 'lg';
  colorMap?: Record<string, string>;
}

const DEFAULT_COLORS: Record<string, string> = {
  pending: colors.warning,
  confirmed: colors.primary,
  preparing: colors.primary,
  ready: colors.success,
  completed: colors.textSecondary,
  delivered: colors.success,
  cancelled: colors.error,
  active: colors.success,
  inactive: colors.textTertiary,
};

export function StatusBadge({ status, size = 'sm', colorMap }: StatusBadgeProps) {
  const colorsMap = colorMap || DEFAULT_COLORS;
  const color = colorsMap[status] || colors.textSecondary;
  const label = status.charAt(0).toUpperCase() + status.slice(1).replace(/_/g, ' ');

  const sizeStyles = {
    sm: { fontSize: 11, paddingH: 8, paddingV: 2 },
    md: { fontSize: 12, paddingH: 10, paddingV: 3 },
    lg: { fontSize: 14, paddingH: 14, paddingV: 5 },
  };

  const s = sizeStyles[size];

  return (
    <View style={[styles.badge, { backgroundColor: color + '20', paddingHorizontal: s.paddingH, paddingVertical: s.paddingV }]}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <Text style={[styles.text, { color, fontSize: s.fontSize }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { flexDirection: 'row', alignItems: 'center', borderRadius: borderRadius.full, alignSelf: 'flex-start' },
  dot: { width: 6, height: 6, borderRadius: 3, marginRight: 5 },
  text: { fontWeight: '600' },
});
