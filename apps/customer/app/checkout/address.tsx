import { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { Header } from '../../components/common/header';
import { Button } from '../../components/common/button';
import { Input } from '../../components/common/input';
import { colors, spacing, typography, borderRadius } from '../../constants';

export default function AddAddressScreen() {
  const [label, setLabel] = useState('');
  const [street, setStreet] = useState('');
  const [city, setCity] = useState('');
  const [zipCode, setZipCode] = useState('');

  const labels = ['Home', 'Work', 'Other'];

  const handleSave = () => {
    router.back();
  };

  return (
    <View style={styles.container}>
      <Header title="Add Address" showBack />

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <View style={styles.mapPlaceholder}>
          <Text style={styles.mapEmoji}>📍</Text>
          <Text style={styles.mapText}>Pin your location on the map</Text>
          <TouchableOpacity style={styles.mapButton}>
            <Text style={styles.mapButtonText}>Set Location on Map</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.form}>
          <Text style={styles.label}>Label</Text>
          <View style={styles.labelRow}>
            {labels.map((l) => (
              <TouchableOpacity
                key={l}
                style={[styles.labelChip, label === l && styles.labelChipActive]}
                onPress={() => setLabel(l)}
              >
                <Text style={[styles.labelText, label === l && styles.labelTextActive]}>{l}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Input label="Street Address" value={street} onChangeText={setStreet} placeholder="Enter street address" />
          <Input label="City" value={city} onChangeText={setCity} placeholder="Enter city" />
          <Input label="Zip Code" value={zipCode} onChangeText={setZipCode} placeholder="Enter zip code" keyboardType="phone-pad" />
        </View>

        <Button title="Save Address" onPress={handleSave} variant="primary" style={styles.saveButton} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: { flex: 1 },
  content: { paddingBottom: spacing.xxl },
  mapPlaceholder: {
    height: 200,
    backgroundColor: colors.surfaceVariant,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
    borderRadius: 16,
  },
  mapEmoji: { fontSize: 48, marginBottom: spacing.sm },
  mapText: { fontSize: 14, color: colors.textSecondary, marginBottom: spacing.md },
  mapButton: {
    backgroundColor: colors.white,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: spacing.md,
    ...typography.body,
  },
  mapButtonText: { fontSize: 14, fontWeight: '600', color: colors.primary },
  form: { padding: spacing.md },
  label: { fontSize: 14, fontWeight: '500', color: colors.text, marginBottom: spacing.sm },
  labelRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
  labelChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  labelChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  labelText: { fontSize: 14, fontWeight: '500', color: colors.text },
  labelTextActive: { color: colors.white },
  saveButton: { marginHorizontal: spacing.md, marginTop: spacing.md },
});
