import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, typography } from '../../constants';

interface LoadingScreenProps {
  message?: string;
}

export function LoadingScreen({ message = 'Loading...' }: LoadingScreenProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.spinner}>⏳</Text>
      <Text style={styles.text}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background, padding: spacing.lg },
  spinner: { fontSize: 40, marginBottom: spacing.md },
  text: { ...typography.body, color: colors.textSecondary },
});
