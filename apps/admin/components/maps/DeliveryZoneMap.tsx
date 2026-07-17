import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import MapView from 'react-native-maps';
import { Polygon } from 'react-native-maps';
import type { Region } from 'react-native-maps';
import { colors, spacing, borderRadius } from '../../constants';

interface DeliveryZone {
  id: string;
  name: string;
  boundary: {
    type: 'Polygon';
    coordinates: Array<Array<[number, number]>>;
  };
  baseFee: number;
  feePerKm: number;
  estimatedMinutes: number;
  isActive: boolean;
}

interface DeliveryZoneMapProps {
  zones: DeliveryZone[];
  centerRegion?: Region;
  selectedZoneId?: string;
  onZonePress?: (zone: DeliveryZone) => void;
  showFeeInfo?: boolean;
  style?: any;
}

const ZONE_COLORS = [
  'rgba(255, 107, 53, 0.15)',
  'rgba(0, 78, 137, 0.15)',
  'rgba(40, 167, 69, 0.15)',
  'rgba(255, 193, 7, 0.15)',
  'rgba(111, 66, 193, 0.15)',
];

const ZONE_STROKE_COLORS = [colors.primary, colors.secondary, colors.success, '#FF9800', '#6F42C3'];

export default function DeliveryZoneMap({
  zones,
  centerRegion,
  selectedZoneId,
  onZonePress,
  showFeeInfo = true,
  style,
}: DeliveryZoneMapProps) {
  const defaultRegion: Region = centerRegion || {
    latitude: 23.8103,
    longitude: 90.4125,
    latitudeDelta: 0.1,
    longitudeDelta: 0.1,
  };

  if (!zones || zones.length === 0) {
    return (
      <View style={[styles.emptyContainer, style]}>
        <Text style={styles.emptyIcon}>🗺️</Text>
        <Text style={styles.emptyText}>No delivery zones configured</Text>
        <Text style={styles.emptySubtext}>Create zones to define delivery areas.</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, style]}>
      <MapView initialRegion={defaultRegion} style={styles.map} loadingEnabled>
        {zones
          .filter((z) => z.isActive)
          .map((zone, index) => {
            const colorIndex = index % ZONE_COLORS.length;
            const outerRing = zone.boundary?.coordinates?.[0] || [];
            const coordinates = outerRing.map((coord) => ({
              latitude: coord[1],
              longitude: coord[0],
            }));

            const isSelected = zone.id === selectedZoneId;

            return (
              <Polygon
                key={zone.id}
                coordinates={coordinates}
                fillColor={isSelected ? 'rgba(255, 107, 53, 0.3)' : ZONE_COLORS[colorIndex]}
                strokeColor={isSelected ? colors.primary : ZONE_STROKE_COLORS[colorIndex]}
                strokeWidth={isSelected ? 3 : 2}
                tappable
                onPress={() => onZonePress?.(zone)}
              />
            );
          })}
      </MapView>

      {showFeeInfo && zones.filter((z) => z.isActive).length > 0 && (
        <View style={styles.legendContainer}>
          <Text style={styles.legendTitle}>Delivery Zones</Text>
          {zones
            .filter((z) => z.isActive)
            .map((zone, index) => {
              const colorIndex = index % ZONE_COLORS.length;
              return (
                <View key={zone.id} style={styles.legendItem}>
                  <View
                    style={[
                      styles.legendColor,
                      { backgroundColor: ZONE_STROKE_COLORS[colorIndex] },
                    ]}
                  />
                  <View style={styles.legendInfo}>
                    <Text style={styles.legendName}>{zone.name}</Text>
                    <Text style={styles.legendFee}>
                      ${zone.baseFee.toFixed(2)} + ${zone.feePerKm.toFixed(2)}/km
                    </Text>
                  </View>
                  <Text style={styles.legendTime}>{zone.estimatedMinutes} min</Text>
                </View>
              );
            })}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
  },
  map: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    minHeight: 200,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: spacing.md,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  emptySubtext: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  legendContainer: {
    position: 'absolute',
    bottom: spacing.md,
    left: spacing.md,
    right: spacing.md,
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
  legendTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 3,
    marginRight: spacing.sm,
  },
  legendInfo: {
    flex: 1,
  },
  legendName: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
  },
  legendFee: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  legendTime: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
  },
});
