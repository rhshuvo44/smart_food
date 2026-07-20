import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { colors, spacing, typography } from '../../constants';

interface HeaderProps {
  title?: string;
  showBack?: boolean;
  rightAction?: { icon: string; onPress: () => void };
  transparent?: boolean;
}

export function Header({ title, showBack, rightAction, transparent }: HeaderProps) {
  const router = useRouter();

  return (
    <View style={[styles.container, transparent && styles.transparent]}>
      <View style={styles.side}>
        {showBack && (
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
        )}
      </View>
      {title && <Text style={styles.title}>{title}</Text>}
      <View style={styles.side}>
        {rightAction && (
          <TouchableOpacity onPress={rightAction.onPress} style={styles.actionButton}>
            <Text style={styles.actionIcon}>{rightAction.icon}</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.white,
  },
  transparent: { backgroundColor: 'transparent' },
  side: { width: 44, alignItems: 'flex-start' },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: { fontSize: 20, color: colors.text },
  title: { ...typography.h4, flex: 1, textAlign: 'center' },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionIcon: { fontSize: 18 },
});
