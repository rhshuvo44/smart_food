import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { colors, borderRadius, spacing } from '../../constants';

interface CategoryPillProps {
  label: string;
  icon: string;
  selected?: boolean;
  onPress?: () => void;
}

export function CategoryPill({ label, icon, selected, onPress }: CategoryPillProps) {
  return (
    <TouchableOpacity
      style={[styles.pill, selected && styles.selected]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text style={styles.icon}>{icon}</Text>
      <Text style={[styles.label, selected && styles.selectedLabel]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginRight: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  selected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  icon: { fontSize: 16, marginRight: 6 },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
  },
  selectedLabel: { color: colors.white },
});
