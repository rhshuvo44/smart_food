import axios from 'axios';
import { env } from '../config/env.js';
import { logger } from '../config/logger.js';
import type { IAddress } from '@smartfood/shared';

// ─── Cache ─────────────────────────────────────────────────────────────────

interface CacheEntry {
  data: unknown;
  expiresAt: number;
}

const cache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
const MAX_CACHE_SIZE = 10000;

function getCached<T>(key: string): T | null {
  const entry = cache.get(key);
  if (entry && entry.expiresAt > Date.now()) {
    return entry.data as T;
  }
  cache.delete(key);
  return null;
}

function setCache(key: string, data: unknown): void {
  if (cache.size >= MAX_CACHE_SIZE) {
    const oldestKey = cache.keys().next().value;
    if (oldestKey) cache.delete(oldestKey);
  }
  cache.set(key, {
    data,
    expiresAt: Date.now() + CACHE_TTL_MS,
  });
}

// ─── Rate Limiter ──────────────────────────────────────────────────────────

interface QueuedRequest<T> {
  execute: () => Promise<T>;
  resolve: (value: T) => void;
  reject: (error: unknown) => void;
}

const requestQueue: QueuedRequest<unknown>[] = [];
let processingQueue = false;
const MIN_REQUEST_INTERVAL = 200; // 200ms between requests (max 5/sec)
let lastRequestTime = 0;

async function processQueue(): Promise<void> {
  if (processingQueue || requestQueue.length === 0) return;
  processingQueue = true;

  while (requestQueue.length > 0) {
    const now = Date.now();
    const timeSinceLastRequest = now - lastRequestTime;
    if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
      await new Promise((resolve) =>
        setTimeout(resolve, MIN_REQUEST_INTERVAL - timeSinceLastRequest),
      );
    }

    const request = requestQueue.shift();
    if (request) {
      lastRequestTime = Date.now();
      try {
        const result = await request.execute();
        request.resolve(result);
      } catch (error) {
        request.reject(error);
      }
    }
  }

  processingQueue = false;
}

function enqueueRequest<T>(execute: () => Promise<T>): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    requestQueue.push({ execute, resolve: resolve as (value: unknown) => void, reject });
    processQueue();
  });
}

// ─── Geocoding Result Types ────────────────────────────────────────────────

export interface GeocodeResult {
  lat: number;
  lng: number;
  formattedAddress: string;
}

export interface ReverseGeocodeResult {
  address: string;
  components: IAddress;
}

// ─── Google Maps Geocoding ─────────────────────────────────────────────────

async function googleGeocode(address: string): Promise<GeocodeResult | null> {
  const cacheKey = `geo:fwd:${address.toLowerCase().trim()}`;
  const cached = getCached<GeocodeResult>(cacheKey);
  if (cached) {
    logger.debug('Geocoding cache hit (forward)', { address });
    return cached;
  }

  if (!env.GOOGLE_MAPS_API_KEY) {
    logger.warn('Google Maps API key not configured');
    return null;
  }

  try {
    const response = await axios.get('https://maps.googleapis.com/maps/api/geocode/json', {
      params: {
        address,
        key: env.GOOGLE_MAPS_API_KEY,
      },
      timeout: 5000,
    });

    if (response.data.status !== 'OK' || response.data.results.length === 0) {
      logger.warn('Geocoding API returned no results', { address, status: response.data.status });
      return null;
    }

    const result = response.data.results[0];
    const geocodeResult: GeocodeResult = {
      lat: result.geometry.location.lat,
      lng: result.geometry.location.lng,
      formattedAddress: result.formatted_address,
    };

    setCache(cacheKey, geocodeResult);
    return geocodeResult;
  } catch (error) {
    logger.error('Geocoding API request failed', {
      address,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return null;
  }
}

async function googleReverseGeocode(
  lat: number,
  lng: number,
): Promise<ReverseGeocodeResult | null> {
  const cacheKey = `geo:rev:${lat.toFixed(6)},${lng.toFixed(6)}`;
  const cached = getCached<ReverseGeocodeResult>(cacheKey);
  if (cached) {
    logger.debug('Geocoding cache hit (reverse)', { lat, lng });
    return cached;
  }

  if (!env.GOOGLE_MAPS_API_KEY) {
    logger.warn('Google Maps API key not configured');
    return null;
  }

  try {
    const response = await axios.get('https://maps.googleapis.com/maps/api/geocode/json', {
      params: {
        latlng: `${lat},${lng}`,
        key: env.GOOGLE_MAPS_API_KEY,
      },
      timeout: 5000,
    });

    if (response.data.status !== 'OK' || response.data.results.length === 0) {
      logger.warn('Reverse geocoding API returned no results', {
        lat,
        lng,
        status: response.data.status,
      });
      return null;
    }

    const result = response.data.results[0];
    const components = extractAddressComponents(result.address_components);

    const reverseResult: ReverseGeocodeResult = {
      address: result.formatted_address,
      components,
    };

    setCache(cacheKey, reverseResult);
    return reverseResult;
  } catch (error) {
    logger.error('Reverse geocoding API request failed', {
      lat,
      lng,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return null;
  }
}

// ─── Mapbox Fallback ───────────────────────────────────────────────────────

async function mapboxGeocode(address: string): Promise<GeocodeResult | null> {
  const cacheKey = `geo:fwd:mb:${address.toLowerCase().trim()}`;
  const cached = getCached<GeocodeResult>(cacheKey);
  if (cached) return cached;

  if (!env.MAPBOX_ACCESS_TOKEN) {
    logger.warn('Mapbox access token not configured');
    return null;
  }

  try {
    const response = await axios.get(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(address)}.json`,
      {
        params: {
          access_token: env.MAPBOX_ACCESS_TOKEN,
          limit: 1,
        },
        timeout: 5000,
      },
    );

    if (response.data.features.length === 0) {
      return null;
    }

    const feature = response.data.features[0];
    const result: GeocodeResult = {
      lat: feature.center[1],
      lng: feature.center[0],
      formattedAddress: feature.place_name,
    };

    setCache(cacheKey, result);
    return result;
  } catch (error) {
    logger.error('Mapbox geocoding request failed', {
      address,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return null;
  }
}

// ─── Public API ────────────────────────────────────────────────────────────

/**
 * Forward geocode an address string to coordinates.
 * Tries Google Maps first, falls back to Mapbox.
 * Results are cached for 24 hours.
 * Rate-limited to avoid API quota issues.
 */
export async function geocode(address: string): Promise<GeocodeResult | null> {
  return enqueueRequest(async () => {
    // Try Google first
    const googleResult = await googleGeocode(address);
    if (googleResult) return googleResult;

    // Fallback to Mapbox
    logger.info('Google geocoding failed, trying Mapbox fallback', { address });
    const mapboxResult = await mapboxGeocode(address);
    if (mapboxResult) return mapboxResult;

    logger.warn('All geocoding providers failed', { address });
    return null;
  });
}

/**
 * Reverse geocode coordinates to an address string.
 * Uses Google Maps API with 24h cache and rate limiting.
 */
export async function reverseGeocode(
  lat: number,
  lng: number,
): Promise<ReverseGeocodeResult | null> {
  return enqueueRequest(async () => {
    const result = await googleReverseGeocode(lat, lng);
    if (result) return result;

    logger.warn('Reverse geocoding failed', { lat, lng });
    return null;
  });
}

/**
 * Clear the geocoding cache.
 */
export function clearGeocodeCache(): void {
  cache.clear();
  logger.info('Geocoding cache cleared');
}

/**
 * Get the number of cached entries.
 */
export function getCacheSize(): number {
  return cache.size;
}

// ─── Helpers ───────────────────────────────────────────────────────────────

function extractAddressComponents(
  components: Array<{
    long_name: string;
    short_name: string;
    types: string[];
  }>,
): IAddress {
  const getComponent = (type: string): string => {
    const comp = components.find((c) => c.types.includes(type));
    return comp?.long_name || '';
  };

  return {
    street: getComponent('route'),
    city: getComponent('locality') || getComponent('administrative_area_level_2'),
    state: getComponent('administrative_area_level_1'),
    zipCode: getComponent('postal_code'),
    country: getComponent('country'),
    formatted: components.map((c) => c.long_name).join(', '),
  };
}
