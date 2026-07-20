import { View, Text, StyleSheet } from 'react-native';
import { colors, borderRadius } from '../../constants';

interface BadgeProps {
  count: number;
  size?: 'sm' | 'md';
}

export function Badge({ count, size = 'sm' }: BadgeProps) {
  if (count <= 0) return null;
  return (
    <View style={[styles.badge, size === 'md' && styles.badgeMd]}>
      <Text style={[styles.text, size === 'md' && styles.textMd]}>
        {count > 99 ? '99+' : count}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    position: 'absolute',
    top: -4,
    right: -6,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.full,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeMd: { minWidth: 22, height: 22 },
  text: { fontSize: 10, fontWeight: '700', color: colors.white },
  textMd: { fontSize: 12 },
});
