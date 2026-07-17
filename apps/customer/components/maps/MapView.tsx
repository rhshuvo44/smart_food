import React from 'react';
import { View, StyleSheet } from 'react-native';
import MapView, { type MapViewProps } from 'react-native-maps';
import { Loading } from '../../components/common/loading';

interface Props extends MapViewProps {
  isLoading?: boolean;
}

export function AppMapView({ isLoading, children, ...props }: Props) {
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Loading message="Loading map..." />
      </View>
    );
  }

  return (
    <MapView
      {...props}
      style={[styles.map, props.style]}
      showsUserLocation
      showsMyLocationButton
      showsCompass
      showsScale
    >
      {children}
    </MapView>
  );
}

const styles = StyleSheet.create({
  map: {
    flex: 1,
    width: '100%',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
  },
});
