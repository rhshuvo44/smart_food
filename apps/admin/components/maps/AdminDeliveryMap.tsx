import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import MapView, { Marker, Callout, Polygon } from 'react-native-maps';
import api from '../../services/api';


interface DeliveryOverview {
  id: string;
  orderId: string;
  status: string;
  driverName?: string;
  driverLocation?: { lat: number; lng: number };
  restaurantName?: string;
  restaurantLocation?: { lat: number; lng: number };
  customerAddress?: string;
  estimatedArrival?: string;
}

interface DeliveryZone {
  id: string;
  name: string;
  boundary: { type: 'Polygon'; coordinates: Array<Array<[number, number]>> };
  baseFee: number;
  feePerKm: number;
}

export function AdminDeliveryMap() {
  const [deliveries, setDeliveries] = useState<DeliveryOverview[]>([]);
  const [zones, setZones] = useState<DeliveryZone[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDelivery, setSelectedDelivery] = useState<DeliveryOverview | null>(null);
  const [filterStatus, setFilterStatus] = useState<string | null>(null);
  const [showZones, setShowZones] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [delResponse, zoneResponse] = await Promise.all([
        api.get('/admin/deliveries'),
        api.get('/delivery/zones'),
      ]);

      if (delResponse.data.success) {
        setDeliveries(delResponse.data.data.deliveries || []);
      }
      if (zoneResponse.data.success) {
        setZones(zoneResponse.data.data.zones || []);
      }
    } catch {
      setDeliveries([]);
      setZones([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (isLoading) return <Text style={{ textAlign: 'center', marginTop: 40, color: '#6C757D' }}>Loading delivery map...</Text>;

  const region = { latitude: 23.8103, longitude: 90.4125, latitudeDelta: 0.1, longitudeDelta: 0.1 };

  const statusColors: Record<string, string> = {
    pending: '#FFC107',
    assigned: '#007AFF',
    picked_up: '#FF6B35',
    in_transit: '#28A745',
    delivered: '#6C757D',
    failed: '#DC3545',
  };

  const filteredDeliveries = filterStatus
    ? deliveries.filter((d) => d.status === filterStatus)
    : deliveries;

  const statusCounts = deliveries.reduce(
    (acc, d) => {
      acc[d.status] = (acc[d.status] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  return (
    <View style={styles.container}>
      <MapView style={styles.map} region={region}>
        {showZones &&
          zones.map((zone) => (
            <Polygon
              key={zone.id}
              coordinates={zone.boundary.coordinates[0].map(([lng, lat]) => ({
                latitude: lat,
                longitude: lng,
              }))}
              fillColor="rgba(255, 107, 53, 0.08)"
              strokeColor="#FF6B35"
              strokeWidth={1}
            />
          ))}

        {filteredDeliveries.map((d) => {
          const loc = d.driverLocation || d.restaurantLocation;
          if (!loc) return null;

          return (
            <Marker
              key={d.id}
              coordinate={{ latitude: loc.lat, longitude: loc.lng }}
              pinColor={statusColors[d.status] || '#007AFF'}
              onPress={() => setSelectedDelivery(d)}
            >
              <Callout>
                <View style={styles.callout}>
                  <Text style={styles.calloutOrder}>Order #{d.orderId.slice(-6)}</Text>
                  <Text style={styles.calloutStatus}>{d.status.replace(/_/g, ' ')}</Text>
                  {d.driverName && <Text style={styles.calloutDriver}>Driver: {d.driverName}</Text>}
                  {d.restaurantName && (
                    <Text style={styles.calloutRestaurant}>{d.restaurantName}</Text>
                  )}
                </View>
              </Callout>
            </Marker>
          );
        })}
      </MapView>

      <View style={styles.filterBar}>
        <FlatList
          horizontal
          data={['all', ...Object.keys(statusColors)]}
          keyExtractor={(item) => item}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterList}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.filterChip, filterStatus === item && styles.filterChipActive]}
              onPress={() => setFilterStatus(item === 'all' ? null : item)}
            >
              <Text
                style={[
                  styles.filterChipText,
                  filterStatus === item && styles.filterChipTextActive,
                ]}
              >
                {item === 'all'
                  ? `All (${deliveries.length})`
                  : `${item} (${statusCounts[item] || 0})`}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      <TouchableOpacity style={styles.toggleZonesBtn} onPress={() => setShowZones(!showZones)}>
        <Text style={styles.toggleZonesText}>{showZones ? 'Hide Zones' : 'Show Zones'}</Text>
      </TouchableOpacity>

      {selectedDelivery && (
        <View style={styles.detailPanel}>
          <Text style={styles.detailTitle}>Order #{selectedDelivery.orderId.slice(-6)}</Text>
          <Text style={styles.detailRow}>Status: {selectedDelivery.status.replace(/_/g, ' ')}</Text>
          {selectedDelivery.driverName && (
            <Text style={styles.detailRow}>Driver: {selectedDelivery.driverName}</Text>
          )}
          {selectedDelivery.restaurantName && (
            <Text style={styles.detailRow}>Restaurant: {selectedDelivery.restaurantName}</Text>
          )}
          {selectedDelivery.customerAddress && (
            <Text style={styles.detailRow}>Delivery: {selectedDelivery.customerAddress}</Text>
          )}
          {selectedDelivery.estimatedArrival && (
            <Text style={styles.detailRow}>
              ETA: {new Date(selectedDelivery.estimatedArrival).toLocaleTimeString()}
            </Text>
          )}
          <TouchableOpacity style={styles.closeBtn} onPress={() => setSelectedDelivery(null)}>
            <Text style={styles.closeBtnText}>Close</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  map: { flex: 1 },
  callout: { padding: 8, minWidth: 140 },
  calloutOrder: { fontSize: 14, fontWeight: '700', color: '#1A1A2E', marginBottom: 4 },
  calloutStatus: { fontSize: 12, color: '#6C757D', textTransform: 'capitalize', marginBottom: 2 },
  calloutDriver: { fontSize: 12, color: '#007AFF', marginBottom: 2 },
  calloutRestaurant: { fontSize: 12, color: '#FF6B35' },
  filterBar: {
    position: 'absolute',
    top: 16,
    left: 16,
    right: 16,
  },
  filterList: { gap: 8 },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DEE2E6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  filterChipActive: { backgroundColor: '#FF6B35', borderColor: '#FF6B35' },
  filterChipText: { fontSize: 12, fontWeight: '600', color: '#6C757D' },
  filterChipTextActive: { color: '#FFFFFF' },
  toggleZonesBtn: {
    position: 'absolute',
    bottom: 24,
    right: 16,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#DEE2E6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  toggleZonesText: { fontSize: 13, fontWeight: '600', color: '#1A1A2E' },
  detailPanel: {
    position: 'absolute',
    bottom: 80,
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
  detailTitle: { fontSize: 16, fontWeight: '700', color: '#1A1A2E', marginBottom: 8 },
  detailRow: { fontSize: 14, color: '#6C757D', marginBottom: 4 },
  closeBtn: {
    marginTop: 8,
    height: 36,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeBtnText: { fontSize: 14, fontWeight: '600', color: '#6C757D' },
});
