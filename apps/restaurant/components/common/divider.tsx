import { View, StyleSheet } from 'react-native';
import { colors, spacing } from '../../constants';

interface DividerProps {
  inset?: boolean;
  color?: string;
}

export function Divider({ inset, color }: DividerProps) {
  return (
    <View
      style={[
        styles.divider,
        { backgroundColor: color || colors.border },
        inset && styles.inset,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  divider: { height: 1, backgroundColor: colors.border, marginVertical: spacing.sm },
  inset: { marginHorizontal: spacing.md },
});
