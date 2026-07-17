import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Alert,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import MapView from 'react-native-maps';
import { Marker, Polygon } from 'react-native-maps';
import type { Region, MapPressEvent } from 'react-native-maps';
import { colors, spacing, borderRadius } from '../../constants';
import api from '../../services/api';

interface ZonePoint {
  latitude: number;
  longitude: number;
}

interface DeliveryZoneSetupProps {
  restaurantId: string;
  initialZone?: {
    id?: string;
    name?: string;
    boundaries?: ZonePoint[];
    baseFee?: number;
    feePerKm?: number;
    estimatedMinutes?: number;
  };
  onSave?: () => void;
  onCancel?: () => void;
}

export default function DeliveryZoneSetup({
  restaurantId,
  initialZone,
  onSave,
  onCancel,
}: DeliveryZoneSetupProps) {
  const [zoneName, setZoneName] = useState(initialZone?.name || '');
  const [boundaryPoints, setBoundaryPoints] = useState<ZonePoint[]>(initialZone?.boundaries || []);
  const [baseFee, setBaseFee] = useState(initialZone?.baseFee?.toString() || '5.00');
  const [feePerKm, setFeePerKm] = useState(initialZone?.feePerKm?.toString() || '1.50');
  const [estimatedMinutes, setEstimatedMinutes] = useState(
    initialZone?.estimatedMinutes?.toString() || '30',
  );
  const [isSaving, setIsSaving] = useState(false);
  const [mode, setMode] = useState<'view' | 'draw'>('view');
  const mapRef = useRef<MapView>(null);

  const initialRegion: Region = {
    latitude: boundaryPoints[0]?.latitude || 23.8103,
    longitude: boundaryPoints[0]?.longitude || 90.4125,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  };

  const handleMapPress = useCallback(
    (event: MapPressEvent) => {
      if (mode !== 'draw') return;
      const { latitude, longitude } = event.nativeEvent.coordinate;
      setBoundaryPoints((prev) => [...prev, { latitude, longitude }]);
    },
    [mode],
  );

  const handleUndoPoint = useCallback(() => {
    setBoundaryPoints((prev) => prev.slice(0, -1));
  }, []);

  const handleClearPoints = useCallback(() => {
    Alert.alert('Clear Zone', 'Are you sure you want to clear all boundary points?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Clear', style: 'destructive', onPress: () => setBoundaryPoints([]) },
    ]);
  }, []);

  const handleSave = useCallback(async () => {
    if (!zoneName.trim()) {
      Alert.alert('Error', 'Please enter a zone name');
      return;
    }
    if (boundaryPoints.length < 3) {
      Alert.alert('Error', 'Please draw at least 3 boundary points on the map');
      return;
    }
    if (!baseFee || isNaN(Number(baseFee))) {
      Alert.alert('Error', 'Please enter a valid base fee');
      return;
    }
    if (!feePerKm || isNaN(Number(feePerKm))) {
      Alert.alert('Error', 'Please enter a valid fee per km');
      return;
    }

    setIsSaving(true);
    try {
      const boundaries = boundaryPoints.map((p) => ({
        type: 'Point' as const,
        coordinates: [p.longitude, p.latitude] as [number, number],
      }));

      const payload = {
        name: zoneName.trim(),
        boundaries,
        baseFee: Number(baseFee),
        feePerKm: Number(feePerKm),
        estimatedMinutes: Number(estimatedMinutes),
      };

      if (initialZone?.id) {
        await api.put(`/delivery/zones/${initialZone.id}`, payload);
      } else {
        await api.post('/delivery/zones', payload);
      }

      Alert.alert('Success', 'Delivery zone saved successfully', [{ text: 'OK', onPress: onSave }]);
    } catch (error) {
      Alert.alert('Error', 'Failed to save delivery zone. Please try again.');
    } finally {
      setIsSaving(false);
    }
  }, [zoneName, boundaryPoints, baseFee, feePerKm, estimatedMinutes, initialZone, onSave]);

  const polygonCoordinates = boundaryPoints.length >= 3 ? boundaryPoints : [];

  return (
    <View style={styles.container}>
      {/* Map */}
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={initialRegion}
        onPress={handleMapPress}
        showsUserLocation
        loadingEnabled
      >
        {/* Show placed points */}
        {boundaryPoints.map((point, index) => (
          <Marker
            key={`point-${index}`}
            coordinate={point}
            title={`Point ${index + 1}`}
            description={`${point.latitude.toFixed(6)}, ${point.longitude.toFixed(6)}`}
            pinColor={index === 0 ? colors.success : colors.primary}
          >
            <View style={[styles.pointMarker, index === 0 && styles.pointMarkerFirst]}>
              <Text style={styles.pointText}>{index + 1}</Text>
            </View>
          </Marker>
        ))}

        {/* Show polygon preview */}
        {polygonCoordinates.length >= 3 && (
          <Polygon
            coordinates={polygonCoordinates}
            fillColor="rgba(255, 107, 53, 0.2)"
            strokeColor={colors.primary}
            strokeWidth={2}
          />
        )}
      </MapView>

      {/* Drawing Controls */}
      <View style={styles.drawControls}>
        {mode === 'view' ? (
          <TouchableOpacity style={styles.drawButton} onPress={() => setMode('draw')}>
            <Text style={styles.drawButtonIcon}>✏️</Text>
            <Text style={styles.drawButtonText}>Draw Zone</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.drawingControls}>
            <Text style={styles.drawingHint}>
              Tap on the map to place boundary points ({boundaryPoints.length} placed)
            </Text>
            <View style={styles.drawingActions}>
              <TouchableOpacity
                style={styles.undoButton}
                onPress={handleUndoPoint}
                disabled={boundaryPoints.length === 0}
              >
                <Text style={styles.undoButtonText}>↩ Undo</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.clearButton}
                onPress={handleClearPoints}
                disabled={boundaryPoints.length === 0}
              >
                <Text style={styles.clearButtonText}>✕ Clear</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.doneButton} onPress={() => setMode('view')}>
                <Text style={styles.doneButtonText}>✓ Done</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>

      {/* Settings Panel */}
      <ScrollView style={styles.settingsPanel} keyboardShouldPersistTaps="handled">
        <Text style={styles.panelTitle}>Zone Settings</Text>

        <View style={styles.field}>
          <Text style={styles.fieldLabel}>Zone Name</Text>
          <TextInput
            style={styles.input}
            value={zoneName}
            onChangeText={setZoneName}
            placeholder="e.g., Downtown Area"
            placeholderTextColor={colors.textSecondary}
          />
        </View>

        <View style={styles.fieldRow}>
          <View style={[styles.field, styles.halfField]}>
            <Text style={styles.fieldLabel}>Base Fee ($)</Text>
            <TextInput
              style={styles.input}
              value={baseFee}
              onChangeText={setBaseFee}
              keyboardType="decimal-pad"
              placeholder="5.00"
              placeholderTextColor={colors.textSecondary}
            />
          </View>
          <View style={[styles.field, styles.halfField]}>
            <Text style={styles.fieldLabel}>Fee per km ($)</Text>
            <TextInput
              style={styles.input}
              value={feePerKm}
              onChangeText={setFeePerKm}
              keyboardType="decimal-pad"
              placeholder="1.50"
              placeholderTextColor={colors.textSecondary}
            />
          </View>
        </View>

        <View style={styles.field}>
          <Text style={styles.fieldLabel}>Est. Delivery Time (min)</Text>
          <TextInput
            style={styles.input}
            value={estimatedMinutes}
            onChangeText={setEstimatedMinutes}
            keyboardType="number-pad"
            placeholder="30"
            placeholderTextColor={colors.textSecondary}
          />
        </View>

        <View style={styles.buttonRow}>
          {onCancel && (
            <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={isSaving}
          >
            {isSaving ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.saveButtonText}>Save Zone</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  map: {
    flex: 1,
    minHeight: 300,
  },
  pointMarker: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  pointMarkerFirst: {
    backgroundColor: colors.success,
  },
  pointText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  drawControls: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 20,
    left: spacing.md,
    right: spacing.md,
    zIndex: 100,
  },
  drawButton: {
    alignSelf: 'center',
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 6,
      },
      android: { elevation: 4 },
    }),
  },
  drawButtonIcon: {
    fontSize: 16,
    marginRight: spacing.xs,
  },
  drawButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  drawingControls: {
    backgroundColor: '#FFFFFF',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 6,
      },
      android: { elevation: 4 },
    }),
  },
  drawingHint: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  drawingActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'center',
  },
  undoButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.surface,
  },
  undoButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
  },
  clearButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.sm,
    backgroundColor: '#FFF0F0',
  },
  clearButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.error,
  },
  doneButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.primary,
  },
  doneButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  settingsPanel: {
    backgroundColor: '#FFFFFF',
    maxHeight: 320,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: Platform.OS === 'ios' ? 34 : spacing.lg,
    borderTopLeftRadius: borderRadius.lg,
    borderTopRightRadius: borderRadius.lg,
  },
  panelTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.md,
  },
  field: {
    marginBottom: spacing.md,
  },
  fieldRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  halfField: {
    flex: 1,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 4,
  },
  input: {
    height: 44,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.md,
    fontSize: 15,
    color: colors.text,
    backgroundColor: colors.surface,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  cancelButton: {
    flex: 1,
    height: 48,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  saveButton: {
    flex: 2,
    height: 48,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
