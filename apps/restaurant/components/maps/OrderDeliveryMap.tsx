import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import MapView, { Marker, Callout } from 'react-native-maps';
import api from '../../services/api';
import { Loading } from '../../components/common/loading';

interface ActiveDelivery {
  id: string;
  orderId: string;
  status: string;
  driverName?: string;
  driverPhone?: string;
  driverLocation?: { lat: number; lng: number };
  estimatedArrival?: string;
}

export function OrderDeliveryMap() {
  const [deliveries, setDeliveries] = useState<ActiveDelivery[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDelivery, setSelectedDelivery] = useState<ActiveDelivery | null>(null);

  const fetchDeliveries = useCallback(async () => {
    try {
      const response = await api.get('/delivery/deliveries/order/active');
      if (response.data.success) {
        setDeliveries(response.data.data.deliveries || []);
      }
    } catch {
      setDeliveries([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDeliveries();
    const interval = setInterval(fetchDeliveries, 10000);
    return () => clearInterval(interval);
  }, [fetchDeliveries]);

  if (isLoading) return <Loading message="Loading deliveries..." />;

  const region = {
    latitude: 23.8103,
    longitude: 90.4125,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  };

  const statusColors: Record<string, string> = {
    pending: '#FFC107',
    assigned: '#007AFF',
    picked_up: '#FF6B35',
    in_transit: '#28A745',
    delivered: '#6C757D',
  };

  return (
    <View style={styles.container}>
      <MapView style={styles.map} region={region}>
        {deliveries.map((d) => (
          <Marker
            key={d.id}
            coordinate={
              d.driverLocation
                ? { latitude: d.driverLocation.lat, longitude: d.driverLocation.lng }
                : { latitude: 23.8103, longitude: 90.4125 }
            }
            pinColor={statusColors[d.status] || '#007AFF'}
            onPress={() => setSelectedDelivery(d)}
          >
            <Callout>
              <View style={styles.callout}>
                <Text style={styles.calloutOrderId}>Order #{d.orderId.slice(-6)}</Text>
                <Text style={styles.calloutStatus}>{d.status.replace(/_/g, ' ')}</Text>
                {d.driverName && <Text style={styles.calloutDriver}>Driver: {d.driverName}</Text>}
              </View>
            </Callout>
          </Marker>
        ))}
      </MapView>

      {selectedDelivery && (
        <View style={styles.detailPanel}>
          <Text style={styles.detailTitle}>Delivery Detail</Text>
          <Text style={styles.detailText}>Status: {selectedDelivery.status}</Text>
          {selectedDelivery.driverName && (
            <Text style={styles.detailText}>Driver: {selectedDelivery.driverName}</Text>
          )}
          {selectedDelivery.driverPhone && (
            <Text style={styles.detailText}>Phone: {selectedDelivery.driverPhone}</Text>
          )}
          {selectedDelivery.estimatedArrival && (
            <Text style={styles.detailText}>
              ETA: {new Date(selectedDelivery.estimatedArrival).toLocaleTimeString()}
            </Text>
          )}
          <TouchableOpacity style={styles.closeBtn} onPress={() => setSelectedDelivery(null)}>
            <Text style={styles.closeBtnText}>Close</Text>
          </TouchableOpacity>
        </View>
      )}

      <FlatList
        horizontal
        data={deliveries}
        keyExtractor={(item) => item.id}
        style={styles.list}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.deliveryCard} onPress={() => setSelectedDelivery(item)}>
            <View
              style={[
                styles.statusIndicator,
                { backgroundColor: statusColors[item.status] || '#007AFF' },
              ]}
            />
            <Text style={styles.cardOrderId}>#{item.orderId.slice(-6)}</Text>
            <Text style={styles.cardStatus}>{item.status.replace(/_/g, ' ')}</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  map: { flex: 1 },
  callout: { padding: 8, minWidth: 120 },
  calloutOrderId: { fontSize: 14, fontWeight: '700', color: '#1A1A2E', marginBottom: 4 },
  calloutStatus: { fontSize: 12, color: '#6C757D', textTransform: 'capitalize', marginBottom: 2 },
  calloutDriver: { fontSize: 12, color: '#007AFF' },
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
  detailTitle: { fontSize: 16, fontWeight: '700', color: '#1A1A2E', marginBottom: 8 },
  detailText: { fontSize: 14, color: '#6C757D', marginBottom: 4 },
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
  deliveryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    width: 140,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  statusIndicator: { width: 8, height: 8, borderRadius: 4, marginRight: 8 },
  cardOrderId: { fontSize: 12, fontWeight: '700', color: '#1A1A2E', marginRight: 4 },
  cardStatus: { fontSize: 11, color: '#6C757D', flex: 1 },
});
