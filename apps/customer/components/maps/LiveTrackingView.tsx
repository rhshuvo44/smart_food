import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import { Loading } from '../../components/common/loading';
import type { DeliveryTrackingInfo } from '../../app/hooks/useDeliveryTracking';

const STATUS_STEPS = ['pending', 'assigned', 'picked_up', 'in_transit', 'delivered'];

interface Props {
  tracking: DeliveryTrackingInfo;
  restaurantLocation?: { lat: number; lng: number };
  customerLocation?: { lat: number; lng: number };
  isLoading?: boolean;
}

export function LiveTrackingView({
  tracking,
  restaurantLocation,
  customerLocation,
  isLoading,
}: Props) {
  const currentStepIndex = STATUS_STEPS.indexOf(tracking.status);

  const region = useMemo(() => {
    if (tracking.driverLocation) {
      return {
        latitude: tracking.driverLocation.lat,
        longitude: tracking.driverLocation.lng,
        latitudeDelta: 0.02,
        longitudeDelta: 0.02,
      };
    }
    if (restaurantLocation) {
      return {
        latitude: restaurantLocation.lat,
        longitude: restaurantLocation.lng,
        latitudeDelta: 0.02,
        longitudeDelta: 0.02,
      };
    }
    return {
      latitude: 23.8103,
      longitude: 90.4125,
      latitudeDelta: 0.05,
      longitudeDelta: 0.05,
    };
  }, [tracking.driverLocation, restaurantLocation]);

  if (isLoading) return <Loading message="Loading tracking..." />;

  const routeCoords: Array<{ latitude: number; longitude: number }> = [];
  if (restaurantLocation) {
    routeCoords.push({ latitude: restaurantLocation.lat, longitude: restaurantLocation.lng });
  }
  if (tracking.driverLocation) {
    routeCoords.push({
      latitude: tracking.driverLocation.lat,
      longitude: tracking.driverLocation.lng,
    });
  }
  if (customerLocation) {
    routeCoords.push({ latitude: customerLocation.lat, longitude: customerLocation.lng });
  }

  return (
    <View style={styles.container}>
      <View style={styles.mapContainer}>
        <MapView style={styles.map} region={region} showsUserLocation>
          {restaurantLocation && (
            <Marker
              coordinate={{ latitude: restaurantLocation.lat, longitude: restaurantLocation.lng }}
              title="Restaurant"
              pinColor="#FF6B35"
            />
          )}

          {tracking.driverLocation && (
            <Marker
              coordinate={{
                latitude: tracking.driverLocation.lat,
                longitude: tracking.driverLocation.lng,
              }}
              title={tracking.driverName || 'Driver'}
              description={tracking.driverPhone}
              pinColor="#007AFF"
            />
          )}

          {customerLocation && (
            <Marker
              coordinate={{ latitude: customerLocation.lat, longitude: customerLocation.lng }}
              title="Delivery Location"
              pinColor="#28A745"
            />
          )}

          {routeCoords.length >= 2 && (
            <Polyline
              coordinates={routeCoords}
              strokeColor="#FF6B35"
              strokeWidth={3}
              lineDashPattern={[10, 5]}
            />
          )}
        </MapView>
      </View>

      <View style={styles.infoPanel}>
        <View style={styles.driverInfo}>
          <Text style={styles.statusLabel}>Status</Text>
          <Text style={styles.statusValue}>{tracking.status.replace(/_/g, ' ')}</Text>
          {tracking.driverName && (
            <Text style={styles.driverName}>Driver: {tracking.driverName}</Text>
          )}
          {tracking.estimatedArrival && (
            <Text style={styles.eta}>
              ETA: {new Date(tracking.estimatedArrival).toLocaleTimeString()}
            </Text>
          )}
        </View>

        <View style={styles.progressContainer}>
          {STATUS_STEPS.map((step, index) => {
            const isCompleted = currentStepIndex >= index;
            const isCurrent = currentStepIndex === index;
            return (
              <View key={step} style={styles.stepRow}>
                <View
                  style={[
                    styles.stepDot,
                    isCompleted && styles.stepDotCompleted,
                    isCurrent && styles.stepDotCurrent,
                  ]}
                />
                {index < STATUS_STEPS.length - 1 && (
                  <View
                    style={[styles.stepLine, currentStepIndex > index && styles.stepLineCompleted]}
                  />
                )}
                <Text style={[styles.stepLabel, isCompleted && styles.stepLabelCompleted]}>
                  {step.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                </Text>
              </View>
            );
          })}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  mapContainer: { flex: 1 },
  map: { flex: 1, width: '100%' },
  infoPanel: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#DEE2E6',
    backgroundColor: '#FFFFFF',
  },
  driverInfo: { marginBottom: 16 },
  statusLabel: { fontSize: 12, color: '#6C757D', textTransform: 'uppercase', letterSpacing: 1 },
  statusValue: { fontSize: 18, fontWeight: '700', color: '#1A1A2E', marginBottom: 4 },
  driverName: { fontSize: 14, color: '#6C757D', marginBottom: 2 },
  eta: { fontSize: 14, color: '#28A745', fontWeight: '600' },
  progressContainer: { paddingVertical: 8 },
  stepRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 4 },
  stepDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#DEE2E6',
    marginRight: 8,
    marginTop: 2,
  },
  stepDotCompleted: { backgroundColor: '#28A745' },
  stepDotCurrent: {
    backgroundColor: '#FF6B35',
    width: 14,
    height: 14,
    borderRadius: 7,
    marginTop: 1,
    marginLeft: -1,
  },
  stepLine: {
    width: 2,
    height: 20,
    backgroundColor: '#DEE2E6',
    marginLeft: 5,
    marginRight: 8,
  },
  stepLineCompleted: { backgroundColor: '#28A745' },
  stepLabel: { fontSize: 13, color: '#6C757D' },
  stepLabelCompleted: { color: '#1A1A2E', fontWeight: '600' },
});
