import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface Props {
  distanceKm: number;
  durationMinutes: number;
  deliveryFee?: number;
  compact?: boolean;
}

export function DistanceInfo({ distanceKm, durationMinutes, deliveryFee, compact }: Props) {
  if (compact) {
    return (
      <View style={styles.compactContainer}>
        <Text style={styles.compactText}>
          📍 {distanceKm.toFixed(1)} km · 🕐 ~{durationMinutes} min
          {deliveryFee !== undefined ? ` · 💰 $${deliveryFee.toFixed(2)}` : ''}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <View style={styles.item}>
          <Text style={styles.label}>Distance</Text>
          <Text style={styles.value}>{distanceKm.toFixed(1)} km</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.item}>
          <Text style={styles.label}>Est. Time</Text>
          <Text style={styles.value}>~{durationMinutes} min</Text>
        </View>
        {deliveryFee !== undefined && (
          <>
            <View style={styles.divider} />
            <View style={styles.item}>
              <Text style={styles.label}>Delivery Fee</Text>
              <Text style={styles.value}>${deliveryFee.toFixed(2)}</Text>
            </View>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  row: { flexDirection: 'row', alignItems: 'center' },
  item: { flex: 1, alignItems: 'center' },
  label: { fontSize: 12, color: '#6C757D', marginBottom: 4 },
  value: { fontSize: 16, fontWeight: '700', color: '#1A1A2E' },
  divider: { width: 1, height: 32, backgroundColor: '#DEE2E6', marginHorizontal: 12 },
  compactContainer: { paddingVertical: 4 },
  compactText: { fontSize: 13, color: '#6C757D' },
});
