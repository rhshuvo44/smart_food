import { useState, useCallback } from 'react';
import api from '../../services/api';

export function useGeocode() {
  const [isLoading, setIsLoading] = useState(false);

  const searchAddress = useCallback(async (query: string) => {
    if (!query.trim()) return [];
    setIsLoading(true);
    try {
      const response = await api.post('/geocoding/forward', { address: query });
      if (response.data.success) {
        return [
          {
            label: response.data.data.formattedAddress,
            lat: response.data.data.lat,
            lng: response.data.data.lng,
          },
        ];
      }
      return [];
    } catch {
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getAddressFromCoords = useCallback(async (lat: number, lng: number) => {
    setIsLoading(true);
    try {
      const response = await api.post('/geocoding/reverse', { lat, lng });
      if (response.data.success) return response.data.data.address;
      return null;
    } catch {
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { searchAddress, getAddressFromCoords, isLoading };
}
