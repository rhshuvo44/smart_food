import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Marker, Callout } from 'react-native-maps';

interface RestaurantData {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  rating?: number;
  estimatedMinutes?: number;
  cuisine?: string[];
  imageUrl?: string;
}

interface Props {
  restaurant: RestaurantData;
  onPress?: (restaurantId: string) => void;
}

export function RestaurantMarker({ restaurant, onPress }: Props) {
  return (
    <Marker
      coordinate={{ latitude: restaurant.latitude, longitude: restaurant.longitude }}
      title={restaurant.name}
      onCalloutPress={() => onPress?.(restaurant.id)}
    >
      <View style={styles.markerContainer}>
        <Text style={styles.markerIcon}>🍽️</Text>
      </View>

      <Callout>
        <View style={styles.callout}>
          <Text style={styles.calloutName}>{restaurant.name}</Text>
          {restaurant.rating ? (
            <Text style={styles.calloutRating}>⭐ {restaurant.rating.toFixed(1)}</Text>
          ) : null}
          {restaurant.estimatedMinutes ? (
            <Text style={styles.calloutEta}>🕐 ~{restaurant.estimatedMinutes} min</Text>
          ) : null}
          {restaurant.cuisine && restaurant.cuisine.length > 0 ? (
            <Text style={styles.calloutCuisine}>{restaurant.cuisine.slice(0, 3).join(', ')}</Text>
          ) : null}
        </View>
      </Callout>
    </Marker>
  );
}

const styles = StyleSheet.create({
  markerContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FF6B35',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  markerIcon: { fontSize: 16 },
  callout: { padding: 8, minWidth: 120, maxWidth: 200 },
  calloutName: { fontSize: 14, fontWeight: '700', color: '#1A1A2E', marginBottom: 4 },
  calloutRating: { fontSize: 12, color: '#FF6B35', marginBottom: 2 },
  calloutEta: { fontSize: 12, color: '#28A745', marginBottom: 2 },
  calloutCuisine: { fontSize: 11, color: '#6C757D' },
});
