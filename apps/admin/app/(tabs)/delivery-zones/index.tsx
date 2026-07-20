import { View, Text, StyleSheet } from 'react-native';
import { Header } from '../../../components/common/header';
import { colors, spacing, typography } from '../../../constants';

export default function DeliveryZonesScreen() {
  return (
    <View style={styles.container}>
      <Header title="Delivery Zones" subtitle="Manage delivery areas" />
      <View style={styles.placeholder}>
        <Text style={styles.emoji}>📍</Text>
        <Text style={styles.text}>Delivery zone management</Text>
        <Text style={styles.subtext}>Use the map to define delivery zones</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  placeholder: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.lg },
  emoji: { fontSize: 64, marginBottom: spacing.md },
  text: { ...typography.h3, color: colors.text, marginBottom: spacing.sm },
  subtext: { ...typography.body, color: colors.textSecondary, textAlign: 'center' },
});
