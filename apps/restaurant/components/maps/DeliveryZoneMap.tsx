import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList } from 'react-native';
import MapView, { Polygon } from 'react-native-maps';
import api from '../../services/api';
import { Loading } from '../../components/common/loading';
import { useCurrentLocation } from '../../hooks/useCurrentLocation';

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

export function DeliveryZoneMap() {
  const { location } = useCurrentLocation();
  const [zones, setZones] = useState<DeliveryZone[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedZone, setSelectedZone] = useState<DeliveryZone | null>(null);

  const fetchZones = useCallback(async () => {
    try {
      const response = await api.get('/delivery/zones');
      if (response.data.success) {
        setZones(response.data.data.zones);
      }
    } catch {
      setZones([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchZones();
  }, [fetchZones]);

  if (isLoading) return <Loading message="Loading delivery zones..." />;

  const region = {
    latitude: location?.latitude || 23.8103,
    longitude: location?.longitude || 90.4125,
    latitudeDelta: 0.1,
    longitudeDelta: 0.1,
  };

  return (
    <View style={styles.container}>
      <MapView style={styles.map} region={region}>
        {zones.map((zone) => {
          const coordinates = zone.boundary.coordinates[0].map(([lng, lat]) => ({
            latitude: lat,
            longitude: lng,
          }));

          return (
            <Polygon
              key={zone.id}
              coordinates={coordinates}
              fillColor="rgba(255, 107, 53, 0.15)"
              strokeColor="#FF6B35"
              strokeWidth={2}
              onPress={() => setSelectedZone(zone)}
            />
          );
        })}
      </MapView>

      {selectedZone && (
        <View style={styles.detailPanel}>
          <Text style={styles.zoneName}>{selectedZone.name}</Text>
          <Text style={styles.zoneDetail}>Base Fee: ${selectedZone.baseFee.toFixed(2)}</Text>
          <Text style={styles.zoneDetail}>Per Km: ${selectedZone.feePerKm.toFixed(2)}</Text>
          <Text style={styles.zoneDetail}>Est. Time: ~{selectedZone.estimatedMinutes} min</Text>
          <TouchableOpacity style={styles.closeBtn} onPress={() => setSelectedZone(null)}>
            <Text style={styles.closeBtnText}>Close</Text>
          </TouchableOpacity>
        </View>
      )}

      <FlatList
        horizontal
        data={zones}
        keyExtractor={(item) => item.id}
        style={styles.list}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.zoneCard, selectedZone?.id === item.id && styles.zoneCardSelected]}
            onPress={() => setSelectedZone(item)}
          >
            <Text style={styles.zoneCardName}>{item.name}</Text>
            <Text style={styles.zoneCardFee}>
              ${item.baseFee.toFixed(2)} + ${item.feePerKm.toFixed(2)}/km
            </Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  map: { flex: 1 },
  detailPanel: {
    position: 'absolute',
    top: 16,
    left: 16,
    right: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  zoneName: { fontSize: 18, fontWeight: '700', color: '#1A1A2E', marginBottom: 8 },
  zoneDetail: { fontSize: 14, color: '#6C757D', marginBottom: 4 },
  closeBtn: {
    marginTop: 8,
    height: 36,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeBtnText: { fontSize: 14, fontWeight: '600', color: '#6C757D' },
  list: { position: 'absolute', bottom: 16 },
  listContent: { paddingHorizontal: 16, gap: 12 },
  zoneCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    width: 160,
    borderWidth: 2,
    borderColor: '#DEE2E6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  zoneCardSelected: { borderColor: '#FF6B35' },
  zoneCardName: { fontSize: 14, fontWeight: '700', color: '#1A1A2E', marginBottom: 4 },
  zoneCardFee: { fontSize: 12, color: '#FF6B35' },
});
