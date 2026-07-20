import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { colors, spacing } from '../../constants';

interface LoadingScreenProps {
  message?: string;
}

export function LoadingScreen({ message = 'Loading...' }: LoadingScreenProps) {
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={colors.primary} />
      <Text style={styles.message}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
  message: { marginTop: spacing.md, fontSize: 15, color: colors.textSecondary },
});
