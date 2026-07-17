import { View, Text } from 'react-native';
import { colors } from '../../constants';

interface StatusBadgeProps {
  status: string;
  colorMap?: Record<string, string>;
  size?: 'sm' | 'md';
}

const DEFAULT_COLOR_MAP: Record<string, string> = {
  pending: colors.warning,
  confirmed: colors.primary,
  preparing: colors.primary,
  ready: colors.success,
  out_for_delivery: '#17A2B8',
  delivered: colors.success,
  cancelled: colors.error,
  active: colors.success,
  inactive: colors.error,
  approved: colors.success,
  rejected: colors.error,
};

export function StatusBadge({ status, colorMap, size = 'sm' }: StatusBadgeProps) {
  const map = { ...DEFAULT_COLOR_MAP, ...colorMap };
  const color = map[status] || colors.textSecondary;
  const isSmall = size === 'sm';

  return (
    <View
      style={{
        alignSelf: 'flex-start',
        paddingHorizontal: isSmall ? 8 : 12,
        paddingVertical: isSmall ? 2 : 4,
        borderRadius: 9999,
        backgroundColor: color + '20',
      }}
    >
      <Text
        style={{
          fontSize: isSmall ? 11 : 13,
          fontWeight: '600',
          color,
          textTransform: 'capitalize' as const,
        }}
      >
        {status.replace(/_/g, ' ')}
      </Text>
    </View>
  );
}
