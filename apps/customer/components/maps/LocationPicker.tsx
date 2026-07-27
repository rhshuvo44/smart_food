import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, TextInput, StyleSheet, Platform } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { useGeocode } from '../../hooks/useGeocode';

export interface PickedLocation {
  lat: number;
  lng: number;
  address?: string;
}

interface Props {
  initialLocation?: { lat: number; lng: number };
  onLocationSelected: (location: PickedLocation) => void;
  onCancel?: () => void;
}

export function LocationPicker({ initialLocation, onLocationSelected, onCancel }: Props) {
  const [region, setRegion] = useState({
    latitude: initialLocation?.lat || 23.8103,
    longitude: initialLocation?.lng || 90.4125,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  });
  const [selectedLat, setSelectedLat] = useState(initialLocation?.lat || region.latitude);
  const [selectedLng, setSelectedLng] = useState(initialLocation?.lng || region.longitude);
  const [address, setAddress] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const { searchAddress, isLoading } = useGeocode();

  const handleMapPress = useCallback((e: any) => {
    const { latitude, longitude } = e.nativeEvent.coordinate;
    setSelectedLat(latitude);
    setSelectedLng(longitude);
    setAddress('');
  }, []);

  const handleSearch = useCallback(async () => {
    const results = await searchAddress(searchQuery);
    if (results.length > 0) {
      const r = results[0];
      setSelectedLat(r.lat);
      setSelectedLng(r.lng);
      setAddress(r.label);
      setRegion({
        latitude: r.lat,
        longitude: r.lng,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      });
    }
  }, [searchQuery, searchAddress]);

  const handleConfirm = useCallback(() => {
    onLocationSelected({ lat: selectedLat, lng: selectedLng, address });
  }, [selectedLat, selectedLng, address, onLocationSelected]);

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search address..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          onSubmitEditing={handleSearch}
          returnKeyType="search"
        />
        <TouchableOpacity style={styles.searchBtn} onPress={handleSearch} disabled={isLoading}>
          <Text style={styles.searchBtnText}>Search</Text>
        </TouchableOpacity>
      </View>

      <MapView
        style={styles.map}
        region={region}
        onRegionChangeComplete={setRegion}
        onPress={handleMapPress}
      >
        <Marker
          coordinate={{ latitude: selectedLat, longitude: selectedLng }}
          draggable
          onDragEnd={(e) => {
            const { latitude, longitude } = e.nativeEvent.coordinate;
            setSelectedLat(latitude);
            setSelectedLng(longitude);
          }}
        />
      </MapView>

      {address ? (
        <View style={styles.addressPreview}>
          <Text style={styles.addressText}>{address}</Text>
        </View>
      ) : null}

      <View style={styles.footer}>
        {onCancel && (
          <TouchableOpacity style={styles.cancelBtn} onPress={onCancel}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity style={styles.confirmBtn} onPress={handleConfirm}>
          <Text style={styles.confirmText}>Confirm Location</Text>
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
  addressPreview: {
    padding: 12,
    backgroundColor: '#F8F9FA',
    borderTopWidth: 1,
    borderTopColor: '#DEE2E6',
  },
  addressText: { fontSize: 14, color: '#1A1A2E', textAlign: 'center' },
  footer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#DEE2E6',
    backgroundColor: '#FFFFFF',
  },
  cancelBtn: {
    flex: 1,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#DEE2E6',
  },
  cancelText: { fontSize: 16, fontWeight: '600', color: '#6C757D' },
  confirmBtn: {
    flex: 2,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: '#FF6B35',
  },
  confirmText: { fontSize: 16, fontWeight: '600', color: '#FFFFFF' },
});
