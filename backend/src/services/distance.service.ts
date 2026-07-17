import axios from 'axios';
import { env } from '../config/env.js';
import { logger } from '../config/logger.js';
import { Restaurant } from '../models/index.js';
import { haversineDistance } from '../shared/geo.js';

// ─── Types ─────────────────────────────────────────────────────────────────

export interface DistanceResult {
  distanceMeters: number;
  distanceKm: number;
  durationSeconds: number;
  durationMinutes: number;
  source: 'api' | 'haversine';
}

export interface NearbyRestaurantResult {
  id: string;
  name: string;
  distanceMeters: number;
  distanceKm: number;
  estimatedMinutes: number;
  coordinates: { lat: number; lng: number };
  cuisine: string[];
  rating: number;
  imageUrl?: string;
}

// ─── Google Maps Distance Matrix API ───────────────────────────────────────

/**
 * Get driving distance and duration from Google Maps Distance Matrix API.
 * Falls back to haversine * 1.3 if API is unavailable.
 */
async function getDrivingDistance(
  originLat: number,
  originLng: number,
  destLat: number,
  destLng: number,
): Promise<{ distanceMeters: number; durationSeconds: number } | null> {
  if (!env.GOOGLE_MAPS_API_KEY) {
    logger.warn('Google Maps API key not configured for distance matrix');
    return null;
  }

  try {
    const response = await axios.get('https://maps.googleapis.com/maps/api/distancematrix/json', {
      params: {
        origins: `${originLat},${originLng}`,
        destinations: `${destLat},${destLng}`,
        mode: 'driving',
        key: env.GOOGLE_MAPS_API_KEY,
      },
      timeout: 5000,
    });

    if (
      response.data.status !== 'OK' ||
      !response.data.rows?.[0]?.elements?.[0] ||
      response.data.rows[0].elements[0].status !== 'OK'
    ) {
      logger.warn('Distance Matrix API returned non-OK status', {
        status: response.data.status,
        elementStatus: response.data.rows?.[0]?.elements?.[0]?.status,
      });
      return null;
    }

    const element = response.data.rows[0].elements[0];
    return {
      distanceMeters: element.distance.value,
      durationSeconds: element.duration.value,
    };
  } catch (error) {
    logger.error('Distance Matrix API request failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return null;
  }
}

// ─── ETA Calculation ───────────────────────────────────────────────────────

/**
 * Estimate delivery time based on distance.
 */
export function estimateETA(
  distanceMeters: number,
  averageSpeedKmh: number = env.DRIVER_AVERAGE_SPEED_KMH,
  prepTimeMinutes: number = 15,
): { durationSeconds: number; durationMinutes: number; estimatedArrival: Date } {
  const drivingSeconds = (distanceMeters / 1000 / averageSpeedKmh) * 3600;
  const totalSeconds = drivingSeconds + prepTimeMinutes * 60;
  const totalMinutes = Math.ceil(totalSeconds / 60);

  return {
    durationSeconds: Math.ceil(totalSeconds),
    durationMinutes: totalMinutes,
    estimatedArrival: new Date(Date.now() + totalSeconds * 1000),
  };
}

// ─── Public API ────────────────────────────────────────────────────────────

/**
 * Calculate distance and ETA between two points.
 * Uses Google Maps Distance Matrix API for driving distance.
 * Falls back to haversine * 1.3 if API is unavailable.
 */
export async function calculateDistance(
  originLat: number,
  originLng: number,
  destLat: number,
  destLng: number,
): Promise<DistanceResult> {
  // Try Google Maps API first
  const apiResult = await getDrivingDistance(originLat, originLng, destLat, destLng);

  if (apiResult) {
    return {
      distanceMeters: apiResult.distanceMeters,
      distanceKm: Math.round((apiResult.distanceMeters / 1000) * 100) / 100,
      durationSeconds: apiResult.durationSeconds,
      durationMinutes: Math.ceil(apiResult.durationSeconds / 60),
      source: 'api',
    };
  }

  // Fallback to haversine approximation
  const straightLine = haversineDistance(originLat, originLng, destLat, destLng);
  // Assume roads are ~30% longer than straight line
  const roadDistance = straightLine * 1.3;
  // Assume average speed of 30 km/h for estimation
  const durationSeconds = (roadDistance / 1000 / 30) * 3600;

  return {
    distanceMeters: Math.round(roadDistance),
    distanceKm: Math.round((roadDistance / 1000) * 100) / 100,
    durationSeconds: Math.ceil(durationSeconds),
    durationMinutes: Math.ceil(durationSeconds / 60),
    source: 'haversine',
  };
}

/**
 * Find restaurants within a radius of a given point, ordered by distance.
 */
export async function findNearbyRestaurants(
  lat: number,
  lng: number,
  radiusKm: number = env.DEFAULT_SEARCH_RADIUS_KM,
): Promise<NearbyRestaurantResult[]> {
  const radiusMeters = radiusKm * 1000;

  // MongoDB $near query on 2dsphere index
  const restaurants = await Restaurant.find({
    isActive: true,
    isApproved: true,
    'address.coordinates': {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: [lng, lat],
        },
        $maxDistance: radiusMeters,
      },
    },
  }).limit(50);

  return restaurants.map((r) => {
    const distanceMeters = haversineDistance(
      lat,
      lng,
      r.address.coordinates[1],
      r.address.coordinates[0],
    );
    const eta = estimateETA(distanceMeters);

    return {
      id: r._id.toString(),
      name: r.name,
      distanceMeters: Math.round(distanceMeters),
      distanceKm: Math.round((distanceMeters / 1000) * 100) / 100,
      estimatedMinutes: eta.durationMinutes,
      coordinates: {
        lat: r.address.coordinates[1],
        lng: r.address.coordinates[0],
      },
      cuisine: r.cuisine,
      rating: r.rating,
      imageUrl: r.imageUrl,
    };
  });
}
