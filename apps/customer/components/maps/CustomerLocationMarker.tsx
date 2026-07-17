import React from 'react';
import { Marker } from 'react-native-maps';

interface Props {
  latitude: number;
  longitude: number;
}

export function CustomerLocationMarker({ latitude, longitude }: Props) {
  return (
    <Marker coordinate={{ latitude, longitude }} title="Your Location" anchor={{ x: 0.5, y: 0.5 }}>
      <Marker
        coordinate={{ latitude, longitude }}
        anchor={{ x: 0.5, y: 0.5 }}
        style={{ zIndex: 1 }}
      >
        {/* Blue dot marker - react-native-maps handles user location natively via showsUserLocation */}
      </Marker>
    </Marker>
  );
}
