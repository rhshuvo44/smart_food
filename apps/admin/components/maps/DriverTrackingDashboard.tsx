import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import MapView, { Marker, Callout, Polyline } from 'react-native-maps';
import api from '../../services/api';


interface DriverInfo {
  id: string;
  name: string;
  phone?: string;
  status: string;
  location?: { lat: number; lng: number };
  currentOrderId?: string;
  estimatedArrival?: string;
  lastUpdated?: string;
}

interface RoutePoint {
  lat: number;
  lng: number;
}

export function DriverTrackingDashboard() {
  const [drivers, setDrivers] = useState<DriverInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDriver, setSelectedDriver] = useState<DriverInfo | null>(null);
  const [routeHistory, setRouteHistory] = useState<RoutePoint[]>([]);

  const fetchDrivers = useCallback(async () => {
    try {
      const response = await api.get('/admin/drivers/active');
      if (response.data.success) {
        setDrivers(response.data.data.drivers || []);
      }
    } catch {
      setDrivers([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDrivers();
    const interval = setInterval(fetchDrivers, 15000);
    return () => clearInterval(interval);
  }, [fetchDrivers]);

  const fetchDriverRoute = useCallback(async (driverId: string) => {
    try {
      const response = await api.get(`/admin/drivers/${driverId}/route`);
      if (response.data.success) {
        setRouteHistory(response.data.data.route || []);
      }
    } catch {
      setRouteHistory([]);
    }
  }, []);

  const handleSelectDriver = useCallback(
    (driver: DriverInfo) => {
      setSelectedDriver(driver);
      if (driver.id) fetchDriverRoute(driver.id);
    },
    [fetchDriverRoute],
  );

  if (isLoading) return <Text style={{ textAlign: 'center', marginTop: 40, color: '#6C757D' }}>Loading driver tracking...</Text>;

  const region = {
    latitude: 23.8103,
    longitude: 90.4125,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  };

  const statusColors: Record<string, string> = {
    available: '#28A745',
    busy: '#FF6B35',
    offline: '#6C757D',
    assigned: '#007AFF',
    in_transit: '#FF6B35',
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Live Driver Tracking</Text>
        <Text style={styles.subtitle}>{drivers.length} active drivers</Text>
      </View>

      <MapView style={styles.map} region={region}>
        {routeHistory.length > 1 && (
          <Polyline
            coordinates={routeHistory.map((p) => ({ latitude: p.lat, longitude: p.lng }))}
            strokeColor="#007AFF"
            strokeWidth={3}
            lineDashPattern={[5, 5]}
          />
        )}

        {drivers.map((driver) => {
          if (!driver.location) return null;

          return (
            <Marker
              key={driver.id}
              coordinate={{ latitude: driver.location.lat, longitude: driver.location.lng }}
              pinColor={statusColors[driver.status] || '#007AFF'}
              onPress={() => handleSelectDriver(driver)}
            >
              <Callout>
                <View style={styles.callout}>
                  <Text style={styles.calloutName}>{driver.name}</Text>
                  <Text style={styles.calloutStatus}>{driver.status}</Text>
                  {driver.currentOrderId && (
                    <Text style={styles.calloutOrder}>
                      Order: #{driver.currentOrderId.slice(-6)}
                    </Text>
                  )}
                </View>
              </Callout>
            </Marker>
          );
        })}
      </MapView>

      <FlatList
        horizontal
        data={drivers}
        keyExtractor={(item) => item.id}
        style={styles.driverList}
        contentContainerStyle={styles.driverListContent}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.driverCard, selectedDriver?.id === item.id && styles.driverCardSelected]}
            onPress={() => handleSelectDriver(item)}
          >
            <View
              style={[
                styles.statusDot,
                { backgroundColor: statusColors[item.status] || '#007AFF' },
              ]}
            />
            <Text style={styles.driverName}>{item.name}</Text>
            <Text style={styles.driverStatus}>{item.status}</Text>
            {item.currentOrderId && (
              <Text style={styles.driverOrder}>Order #{item.currentOrderId.slice(-6)}</Text>
            )}
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  header: {
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
  },
  title: { fontSize: 20, fontWeight: '700', color: '#1A1A2E' },
  subtitle: { fontSize: 14, color: '#6C757D', marginTop: 4 },
  map: { flex: 1 },
  callout: { padding: 8, minWidth: 140 },
  calloutName: { fontSize: 14, fontWeight: '700', color: '#1A1A2E', marginBottom: 4 },
  calloutStatus: { fontSize: 12, color: '#6C757D', textTransform: 'capitalize', marginBottom: 2 },
  calloutOrder: { fontSize: 12, color: '#007AFF' },
  driverList: { position: 'absolute', bottom: 16 },
  driverListContent: { paddingHorizontal: 16, gap: 12 },
  driverCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    width: 150,
    borderWidth: 2,
    borderColor: '#DEE2E6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  driverCardSelected: { borderColor: '#007AFF' },
  statusDot: { width: 10, height: 10, borderRadius: 5, marginBottom: 6 },
  driverName: { fontSize: 14, fontWeight: '700', color: '#1A1A2E', marginBottom: 2 },
  driverStatus: { fontSize: 12, color: '#6C757D', textTransform: 'capitalize', marginBottom: 2 },
  driverOrder: { fontSize: 11, color: '#007AFF' },
});
