import { useState, useCallback } from 'react';
import api from '../services/api';

interface GeocodeResult {
  lat: number;
  lng: number;
  formattedAddress: string;
}

const CACHE_TTL = 24 * 60 * 60 * 1000;
const localCache = new Map<string, { data: unknown; timestamp: number }>();

function getFromCache<T>(key: string): T | null {
  const entry = localCache.get(key);
  if (entry && Date.now() - entry.timestamp < CACHE_TTL) {
    return entry.data as T;
  }
  localCache.delete(key);
  return null;
}

function addToCache<T>(key: string, data: T): void {
  localCache.set(key, { data, timestamp: Date.now() });
}

export function useGeocode() {
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const searchAddress = useCallback(async (query: string): Promise<GeocodeResult | null> => {
    if (!query.trim()) return null;

    const cacheKey = `geo:fwd:${query.toLowerCase().trim()}`;
    const cached = getFromCache<GeocodeResult>(cacheKey);
    if (cached) return cached;

    setIsSearching(true);
    setError(null);

    try {
      const response = await api.post('/geocoding/forward', { address: query.trim() });
      if (response.data.success && response.data.data) {
        const result: GeocodeResult = response.data.data;
        addToCache(cacheKey, result);
        return result;
      }
      setError('Address not found');
      return null;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Geocoding failed');
      return null;
    } finally {
      setIsSearching(false);
    }
  }, []);

  const getAddressFromCoords = useCallback(
    async (lat: number, lng: number): Promise<string | null> => {
      const cacheKey = `geo:rev:${lat.toFixed(6)},${lng.toFixed(6)}`;
      const cached = getFromCache<string>(cacheKey);
      if (cached) return cached;

      setIsSearching(true);
      setError(null);

      try {
        const response = await api.post('/geocoding/reverse', { lat, lng });
        if (response.data.success && response.data.data) {
          addToCache(cacheKey, response.data.data.address);
          return response.data.data.address;
        }
        return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Reverse geocoding failed');
        return null;
      } finally {
        setIsSearching(false);
      }
    },
    [],
  );

  return { searchAddress, getAddressFromCoords, isSearching, error };
}
