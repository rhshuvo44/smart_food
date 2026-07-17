import { useState, useCallback, useRef } from 'react';
import api from '../services/api';

const cache = new Map<string, { lat: number; lng: number; formattedAddress: string }>();
const CACHE_TTL = 24 * 60 * 60 * 1000;

interface UseGeocodeReturn {
  searchAddress: (query: string) => Promise<Array<{ label: string; lat: number; lng: number }>>;
  getAddressFromCoords: (lat: number, lng: number) => Promise<string | null>;
  isLoading: boolean;
  error: string | null;
}

export function useGeocode(): UseGeocodeReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const searchAddress = useCallback(async (query: string) => {
    if (!query.trim()) return [];

    setIsLoading(true);
    setError(null);

    try {
      const response = await api.post('/geocoding/forward', { address: query });
      if (response.data.success) {
        const result = response.data.data;
        cache.set(query.toLowerCase(), {
          lat: result.lat,
          lng: result.lng,
          formattedAddress: result.formattedAddress,
        });
        return [
          {
            label: result.formattedAddress,
            lat: result.lat,
            lng: result.lng,
          },
        ];
      }
      return [];
    } catch {
      const cached = cache.get(query.toLowerCase());
      if (cached) {
        return [{ label: cached.formattedAddress, lat: cached.lat, lng: cached.lng }];
      }
      setError('Could not find address');
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getAddressFromCoords = useCallback(async (lat: number, lng: number) => {
    setIsLoading(true);
    setError(null);

    const cacheKey = `${lat.toFixed(4)},${lng.toFixed(4)}`;
    const cached = cache.get(cacheKey);
    if (cached) return cached.formattedAddress;

    try {
      const response = await api.post('/geocoding/reverse', { lat, lng });
      if (response.data.success) {
        const result = response.data.data;
        cache.set(cacheKey, {
          lat,
          lng,
          formattedAddress: result.address,
        });
        return result.address;
      }
      return null;
    } catch {
      setError('Could not resolve address');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { searchAddress, getAddressFromCoords, isLoading, error };
}
