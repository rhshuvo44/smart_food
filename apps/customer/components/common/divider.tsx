import { View, StyleSheet } from 'react-native';
import { colors, spacing } from '../../constants';

interface DividerProps {
  spacing?: number;
}

export function Divider({ spacing: space = spacing.md }: DividerProps) {
  return <View style={[styles.divider, { marginVertical: space }]} />;
}

const styles = StyleSheet.create({
  divider: { height: 1, backgroundColor: colors.border },
});
