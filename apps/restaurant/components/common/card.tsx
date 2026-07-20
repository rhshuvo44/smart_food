import { View, StyleSheet, Platform, type ViewStyle } from 'react-native';
import { colors, borderRadius } from '../../constants';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  variant?: 'elevated' | 'outlined';
  padding?: 'sm' | 'md' | 'lg';
}

const PADDING = { sm: 12, md: 16, lg: 24 };

export function Card({ children, style, variant = 'elevated', padding = 'md' }: CardProps) {
  return (
    <View
      style={[
        styles.base,
        { padding: PADDING[padding] },
        variant === 'elevated' ? styles.elevated : styles.outlined,
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: { backgroundColor: colors.white, borderRadius: borderRadius.md },
  elevated: {
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4 },
      android: { elevation: 2 },
    }),
  },
  outlined: { borderWidth: 1, borderColor: colors.border },
});
