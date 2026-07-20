import { View, Text, StyleSheet } from 'react-native';
import { colors, borderRadius } from '../../constants';

interface BadgeProps {
  text: string;
  variant?: 'primary' | 'success' | 'warning' | 'error' | 'info' | 'neutral';
  size?: 'sm' | 'md';
}

const BADGE_COLORS = {
  primary: { bg: colors.primary + '15', text: colors.primary },
  success: { bg: colors.successLight, text: colors.success },
  warning: { bg: colors.warningLight, text: '#B8860B' },
  error: { bg: '#FFEBEE', text: colors.error },
  info: { bg: '#E3F2FD', text: colors.info },
  neutral: { bg: colors.surface, text: colors.textSecondary },
};

export function Badge({ text, variant = 'primary', size = 'sm' }: BadgeProps) {
  const colorSet = BADGE_COLORS[variant];
  return (
    <View style={[styles.base, { backgroundColor: colorSet.bg }, size === 'sm' ? styles.sm : styles.md]}>
      <Text style={[styles.text, { color: colorSet.text }, size === 'sm' ? styles.smText : styles.mdText]}>
        {text}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: { alignSelf: 'flex-start', borderRadius: borderRadius.full },
  sm: { paddingHorizontal: 8, paddingVertical: 2 },
  md: { paddingHorizontal: 12, paddingVertical: 4 },
  text: { fontWeight: '600' },
  smText: { fontSize: 11 },
  mdText: { fontSize: 13 },
});
