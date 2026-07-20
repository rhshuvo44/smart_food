import { useState, useEffect, useRef } from 'react';
import * as Location from 'expo-location';

export interface CurrentLocation {
  latitude: number;
  longitude: number;
  address?: string;
}

interface UseCurrentLocationReturn {
  location: CurrentLocation | null;
  permissionStatus: Location.PermissionStatus | null;
  error: string | null;
  isLoading: boolean;
  refresh: () => Promise<void>;
}

export function useCurrentLocation(watch: boolean = false): UseCurrentLocationReturn {
  const [location, setLocation] = useState<CurrentLocation | null>(null);
  const [permissionStatus, setPermissionStatus] = useState<Location.PermissionStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const subscriberRef = useRef<Location.LocationSubscription | null>(null);

  async function requestLocation() {
    setIsLoading(true);
    setError(null);

    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      setPermissionStatus(status);

      if (status !== Location.PermissionStatus.GRANTED) {
        setError('Location permission denied');
        setIsLoading(false);
        return;
      }

      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const current: CurrentLocation = {
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      };

      try {
        const [address] = await Location.reverseGeocodeAsync({
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
        });
        if (address) {
          const parts = [
            address.street,
            address.district,
            address.city,
            address.region,
            address.country,
          ].filter(Boolean);
          current.address = parts.join(', ');
        }
      } catch {}

      setLocation(current);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get location');
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    requestLocation();

    return () => {
      if (subscriberRef.current) {
        subscriberRef.current.remove();
      }
    };
  }, []);

  useEffect(() => {
    if (!watch || permissionStatus !== Location.PermissionStatus.GRANTED) return;

    let cancelled = false;

    (async () => {
      const sub = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.Balanced,
          timeInterval: 10000,
          distanceInterval: 50,
        },
        (loc) => {
          setLocation({
            latitude: loc.coords.latitude,
            longitude: loc.coords.longitude,
          });
        },
      );
      if (!cancelled) {
        subscriberRef.current = sub;
      }
    })();

    return () => {
      cancelled = true;
      if (subscriberRef.current) {
        subscriberRef.current.remove();
      }
    };
  }, [watch, permissionStatus]);

  return { location, permissionStatus, error, isLoading, refresh: requestLocation };
}
