jest.mock('../../../src/config/env', () => {
  process.env.GOOGLE_MAPS_API_KEY = 'test-google-key';
  process.env.MAPBOX_ACCESS_TOKEN = 'test-mapbox-token';
  return jest.requireActual('../../../src/config/env');
});

import {
  geocode,
  reverseGeocode,
  clearGeocodeCache,
  getCacheSize,
} from '../../../src/services/geocoding.service.js';

// Mock axios to avoid real API calls
import axios from 'axios';

jest.mock('axios');
const mockedAxios = jest.mocked(axios);

const mockGeocodeResponse = {
  data: {
    status: 'OK',
    results: [
      {
        formatted_address: '123 Main St, Dhaka, Bangladesh',
        geometry: {
          location: {
            lat: 23.8103,
            lng: 90.4125,
          },
        },
        address_components: [
          { long_name: '123', short_name: '123', types: ['street_number'] },
          { long_name: 'Main St', short_name: 'Main St', types: ['route'] },
          { long_name: 'Dhaka', short_name: 'Dhaka', types: ['locality'] },
          { long_name: 'Dhaka Division', short_name: 'DH', types: ['administrative_area_level_1'] },
          { long_name: '1000', short_name: '1000', types: ['postal_code'] },
          { long_name: 'Bangladesh', short_name: 'BD', types: ['country'] },
        ],
      },
    ],
  },
};

const mockReverseGeocodeResponse = {
  data: {
    status: 'OK',
    results: [
      {
        formatted_address: '123 Main St, Dhaka, Bangladesh',
        address_components: [
          { long_name: '123', short_name: '123', types: ['street_number'] },
          { long_name: 'Main St', short_name: 'Main St', types: ['route'] },
          { long_name: 'Dhaka', short_name: 'Dhaka', types: ['locality'] },
          { long_name: 'Dhaka Division', short_name: 'DH', types: ['administrative_area_level_1'] },
          { long_name: '1000', short_name: '1000', types: ['postal_code'] },
          { long_name: 'Bangladesh', short_name: 'BD', types: ['country'] },
        ],
      },
    ],
  },
};

describe('Geocoding Service', () => {
  beforeEach(() => {
    clearGeocodeCache();
    jest.clearAllMocks();
  });

  describe('Forward Geocoding', () => {
    it('should return coordinates for a valid address', async () => {
      mockedAxios.get.mockResolvedValue(mockGeocodeResponse);

      const result = await geocode('123 Main St, Dhaka');

      expect(result).not.toBeNull();
      expect(result!.lat).toBe(23.8103);
      expect(result!.lng).toBe(90.4125);
      expect(result!.formattedAddress).toBe('123 Main St, Dhaka, Bangladesh');
    });

    it('should return null when API returns no results', async () => {
      mockedAxios.get.mockResolvedValue({
        data: { status: 'ZERO_RESULTS', results: [] },
      });

      const result = await geocode('Nonexistent Address XYZ');
      expect(result).toBeNull();
    });

    it('should return null on API failure gracefully', async () => {
      mockedAxios.get.mockRejectedValue(new Error('Network error'));

      const result = await geocode('Some Address');
      expect(result).toBeNull();
    });

    it('should return null when API key is not configured', async () => {
      // Temporarily remove the API key
      const originalKey = process.env.GOOGLE_MAPS_API_KEY;
      process.env.GOOGLE_MAPS_API_KEY = '';

      const result = await geocode('Test Address');
      expect(result).toBeNull();

      process.env.GOOGLE_MAPS_API_KEY = originalKey;
    });
  });

  describe('Cache', () => {
    it('should cache geocoding results', async () => {
      mockedAxios.get.mockResolvedValue(mockGeocodeResponse);

      // First call — should make API request
      const result1 = await geocode('123 Main St, Dhaka');
      expect(result1).not.toBeNull();
      expect(mockedAxios.get).toHaveBeenCalledTimes(1);

      // Second call — should return cached result
      const result2 = await geocode('123 Main St, Dhaka');
      expect(result2).not.toBeNull();
      expect(mockedAxios.get).toHaveBeenCalledTimes(1); // Still 1 — cached
    });

    it('should report cache size correctly', async () => {
      mockedAxios.get.mockResolvedValue(mockGeocodeResponse);

      expect(getCacheSize()).toBe(0);

      await geocode('Address One');
      await geocode('Address Two');

      expect(getCacheSize()).toBe(2);
    });

    it('should clear cache when requested', async () => {
      mockedAxios.get.mockResolvedValue(mockGeocodeResponse);

      await geocode('Test Address');
      expect(getCacheSize()).toBe(1);

      clearGeocodeCache();
      expect(getCacheSize()).toBe(0);
    });
  });

  describe('Reverse Geocoding', () => {
    it('should return address for valid coordinates', async () => {
      mockedAxios.get.mockResolvedValue(mockReverseGeocodeResponse);

      const result = await reverseGeocode(23.8103, 90.4125);

      expect(result).not.toBeNull();
      expect(result!.address).toBe('123 Main St, Dhaka, Bangladesh');
      expect(result!.components).toBeDefined();
      expect(result!.components.city).toBe('Dhaka');
      expect(result!.components.country).toBe('Bangladesh');
    });

    it('should return null on reverse geocoding failure', async () => {
      mockedAxios.get.mockRejectedValue(new Error('API Error'));

      const result = await reverseGeocode(0, 0);
      expect(result).toBeNull();
    });

    it('should cache reverse geocoding results', async () => {
      mockedAxios.get.mockResolvedValue(mockReverseGeocodeResponse);

      await reverseGeocode(23.8103, 90.4125);
      expect(mockedAxios.get).toHaveBeenCalledTimes(1);

      await reverseGeocode(23.8103, 90.4125);
      expect(mockedAxios.get).toHaveBeenCalledTimes(1); // Cached
    });
  });
});
