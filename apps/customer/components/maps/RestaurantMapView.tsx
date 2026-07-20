import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Platform,
} from 'react-native';
import MapView from 'react-native-maps';
import { useCurrentLocation } from '../../app/hooks/useCurrentLocation';
import { Loading } from '../../components/common/loading';
import api from '../../services/api';
import { RestaurantMarker } from './RestaurantMarker';

interface NearbyRestaurant {
  id: string;
  name: string;
  distanceKm: number;
  estimatedMinutes: number;
  coordinates: { lat: number; lng: number };
  cuisine: string[];
  rating: number;
  imageUrl?: string;
}

interface Props {
  onRestaurantPress?: (restaurantId: string) => void;
}

export function RestaurantMapView({ onRestaurantPress }: Props) {
  const { location, isLoading: locLoading } = useCurrentLocation();
  const [restaurants, setRestaurants] = useState<NearbyRestaurant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showList, setShowList] = useState(false);

  const region = {
    latitude: location?.latitude || 23.8103,
    longitude: location?.longitude || 90.4125,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  };

  const fetchNearby = useCallback(async () => {
    if (!location) return;
    setIsLoading(true);

    try {
      const response = await api.post('/distance/nearby-restaurants', {
        lat: location.latitude,
        lng: location.longitude,
      });
      if (response.data.success) {
        setRestaurants(response.data.data.restaurants);
      }
    } catch {
      setRestaurants([]);
    } finally {
      setIsLoading(false);
    }
  }, [location]);

  useEffect(() => {
    fetchNearby();
  }, [fetchNearby]);

  if (locLoading) return <Loading message="Finding your location..." />;

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search restaurants or cuisine..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        <TouchableOpacity style={styles.toggleBtn} onPress={() => setShowList(!showList)}>
          <Text style={styles.toggleBtnText}>{showList ? 'Map' : 'List'}</Text>
        </TouchableOpacity>
      </View>

      {showList ? (
        <FlatList
          data={restaurants.filter(
            (r) =>
              r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
              r.cuisine.some((c) => c.toLowerCase().includes(searchQuery.toLowerCase())),
          )}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.restaurantCard}
              onPress={() => onRestaurantPress?.(item.id)}
            >
              <Text style={styles.restaurantName}>{item.name}</Text>
              <Text style={styles.restaurantDetail}>
                {item.cuisine.slice(0, 3).join(', ')} · ⭐ {item.rating.toFixed(1)}
              </Text>
              <Text style={styles.restaurantDistance}>
                📍 {item.distanceKm.toFixed(1)} km · 🕐 ~{item.estimatedMinutes} min
              </Text>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <Text style={styles.emptyText}>
              {isLoading ? 'Loading restaurants...' : 'No restaurants found nearby'}
            </Text>
          }
        />
      ) : (
        <MapView style={styles.map} region={region} showsUserLocation>
          {restaurants.map((r) => (
            <RestaurantMarker
              key={r.id}
              restaurant={{
                id: r.id,
                name: r.name,
                latitude: r.coordinates.lat,
                longitude: r.coordinates.lng,
                rating: r.rating,
                estimatedMinutes: r.estimatedMinutes,
                cuisine: r.cuisine,
                imageUrl: r.imageUrl,
              }}
              onPress={onRestaurantPress}
            />
          ))}
        </MapView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  searchContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 8 : 8,
    paddingBottom: 8,
    backgroundColor: '#FFFFFF',
    zIndex: 1,
  },
  searchInput: {
    flex: 1,
    height: 44,
    borderWidth: 1,
    borderColor: '#DEE2E6',
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
    backgroundColor: '#F8F9FA',
  },
  toggleBtn: {
    marginLeft: 8,
    height: 44,
    paddingHorizontal: 16,
    backgroundColor: '#FF6B35',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  toggleBtnText: { color: '#FFFFFF', fontWeight: '600', fontSize: 14 },
  map: { flex: 1 },
  listContent: { padding: 16 },
  restaurantCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#DEE2E6',
  },
  restaurantName: { fontSize: 16, fontWeight: '700', color: '#1A1A2E', marginBottom: 4 },
  restaurantDetail: { fontSize: 13, color: '#6C757D', marginBottom: 4 },
  restaurantDistance: { fontSize: 13, color: '#FF6B35' },
  emptyText: { fontSize: 16, color: '#6C757D', textAlign: 'center', paddingVertical: 40 },
});
