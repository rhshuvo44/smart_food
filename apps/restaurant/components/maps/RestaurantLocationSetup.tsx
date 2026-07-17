import React, { useState, useCallback } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { useCurrentLocation } from '../../hooks/useCurrentLocation';
import { useGeocode } from './useGeocode';
import { Loading } from '../../components/common/loading';
import api from '../../services/api';

interface Props {
  initialLocation?: { lat: number; lng: number };
  onSaved?: (location: { lat: number; lng: number; address: string }) => void;
}

export function RestaurantLocationSetup({ initialLocation, onSaved }: Props) {
  const { location: currentLocation, isLoading: locLoading } = useCurrentLocation();
  const { searchAddress } = useGeocode();
  const [lat, setLat] = useState(initialLocation?.lat || currentLocation?.latitude || 23.8103);
  const [lng, setLng] = useState(initialLocation?.lng || currentLocation?.longitude || 90.4125);
  const [address, setAddress] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const region = {
    latitude: lat,
    longitude: lng,
    latitudeDelta: 0.02,
    longitudeDelta: 0.02,
  };

  const handleSearch = useCallback(async () => {
    const results = await searchAddress(searchQuery);
    if (results.length > 0) {
      setLat(results[0].lat);
      setLng(results[0].lng);
      setAddress(results[0].label);
    }
  }, [searchQuery, searchAddress]);

  const handleSave = useCallback(async () => {
    setIsSaving(true);
    try {
      await api.put('/restaurant/me/location', { lat, lng, address });
      onSaved?.({ lat, lng, address });
    } catch {
    } finally {
      setIsSaving(false);
    }
  }, [lat, lng, address, onSaved]);

  if (locLoading) return <Loading message="Getting your location..." />;

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search restaurant address..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          onSubmitEditing={handleSearch}
          returnKeyType="search"
        />
        <TouchableOpacity style={styles.searchBtn} onPress={handleSearch}>
          <Text style={styles.searchBtnText}>Search</Text>
        </TouchableOpacity>
      </View>

      <MapView
        style={styles.map}
        region={region}
        onPress={(e) => {
          setLat(e.nativeEvent.coordinate.latitude);
          setLng(e.nativeEvent.coordinate.longitude);
        }}
      >
        <Marker
          coordinate={{ latitude: lat, longitude: lng }}
          draggable
          onDragEnd={(e) => {
            setLat(e.nativeEvent.coordinate.latitude);
            setLng(e.nativeEvent.coordinate.longitude);
          }}
        />
      </MapView>

      <View style={styles.form}>
        <Text style={styles.coordinatesText}>
          📍 {lat.toFixed(6)}, {lng.toFixed(6)}
        </Text>
        <TextInput
          style={styles.addressInput}
          placeholder="Full address"
          value={address}
          onChangeText={setAddress}
        />
        <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={isSaving}>
          <Text style={styles.saveBtnText}>{isSaving ? 'Saving...' : 'Save Location'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  searchContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 60 : 16,
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
  searchBtn: {
    marginLeft: 8,
    height: 44,
    paddingHorizontal: 16,
    backgroundColor: '#FF6B35',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchBtnText: { color: '#FFFFFF', fontWeight: '600', fontSize: 14 },
  map: { flex: 1 },
  form: { padding: 16, borderTopWidth: 1, borderTopColor: '#DEE2E6' },
  coordinatesText: { fontSize: 14, color: '#6C757D', marginBottom: 8, textAlign: 'center' },
  addressInput: {
    height: 44,
    borderWidth: 1,
    borderColor: '#DEE2E6',
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
    backgroundColor: '#F8F9FA',
    marginBottom: 12,
  },
  saveBtn: {
    height: 48,
    backgroundColor: '#FF6B35',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
});
