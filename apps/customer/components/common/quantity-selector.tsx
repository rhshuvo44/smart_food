import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { colors, borderRadius } from '../../constants';

interface QuantitySelectorProps {
  quantity: number;
  onIncrease: () => void;
  onDecrease: () => void;
  size?: 'sm' | 'md';
}

export function QuantitySelector({ quantity, onIncrease, onDecrease, size = 'md' }: QuantitySelectorProps) {
  const isSm = size === 'sm';
  return (
    <View style={[styles.container, isSm && styles.containerSm]}>
      <TouchableOpacity
        style={[styles.button, isSm && styles.buttonSm]}
        onPress={onDecrease}
        disabled={quantity <= 1}
        activeOpacity={0.7}
      >
        <Text style={[styles.buttonText, isSm && styles.buttonTextSm]}>−</Text>
      </TouchableOpacity>
      <Text style={[styles.quantity, isSm && styles.quantitySm]}>{quantity}</Text>
      <TouchableOpacity
        style={[styles.button, isSm && styles.buttonSm, styles.addButton]}
        onPress={onIncrease}
        activeOpacity={0.7}
      >
        <Text style={[styles.buttonText, isSm && styles.buttonTextSm, styles.addButtonText]}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
  },
  containerSm: { borderRadius: borderRadius.sm },
  button: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
  },
  buttonSm: { width: 28, height: 28 },
  buttonText: { fontSize: 18, color: colors.text, fontWeight: '600' },
  buttonTextSm: { fontSize: 14 },
  quantity: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    minWidth: 40,
    textAlign: 'center',
  },
  quantitySm: { fontSize: 14, minWidth: 32 },
  addButton: { backgroundColor: colors.primary, borderColor: colors.primary },
  addButtonText: { color: colors.white },
});
