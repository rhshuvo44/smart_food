import { TouchableOpacity, Text, ActivityIndicator, type ViewStyle, type TextStyle } from 'react-native';
import { colors, borderRadius } from '../../constants';

type ButtonVariant = 'primary' | 'secondary' | 'ghost';
interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

const variantStyles: Record<ButtonVariant, { container: ViewStyle; text: TextStyle }> = {
  primary: {
    container: { backgroundColor: colors.primary, paddingVertical: 14, paddingHorizontal: 24, borderRadius: borderRadius.md, alignItems: 'center' as const, justifyContent: 'center' as const },
    text: { color: colors.white, fontSize: 16, fontWeight: '600' as const },
  },
  secondary: {
    container: { backgroundColor: colors.secondary, paddingVertical: 14, paddingHorizontal: 24, borderRadius: borderRadius.md, alignItems: 'center' as const, justifyContent: 'center' as const },
    text: { color: colors.white, fontSize: 16, fontWeight: '600' as const },
  },
  ghost: {
    container: { paddingVertical: 14, paddingHorizontal: 24, borderRadius: borderRadius.md, alignItems: 'center' as const, justifyContent: 'center' as const, borderWidth: 1, borderColor: colors.border },
    text: { color: colors.text, fontSize: 16, fontWeight: '600' as const },
  },
};

export function Button({ title, onPress, variant = 'primary', loading, disabled, style, textStyle }: ButtonProps) {
  const styles = variantStyles[variant];
  return (
    <TouchableOpacity onPress={onPress} disabled={disabled || loading} style={[styles.container, (disabled || loading) && { opacity: 0.5 }, style]} activeOpacity={0.8}>
      {loading ? <ActivityIndicator color={styles.text.color as string} /> : <Text style={[styles.text, textStyle]}>{title}</Text>}
    </TouchableOpacity>
  );
}
