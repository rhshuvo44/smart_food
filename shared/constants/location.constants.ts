/**
 * Location and delivery-related constants.
 */

/** Default search radius for nearby restaurants (in km). */
export const DEFAULT_SEARCH_RADIUS_KM = 10;

/** Maximum search radius for nearby restaurants (in km). */
export const MAX_SEARCH_RADIUS_KM = 50;

/** Minimum radius for delivery zone containment checks (in km). */
export const MIN_DELIVERY_RADIUS_KM = 0.5;

/** Default coordinates for the app's primary operational area (Dhaka, Bangladesh). */
export const DEFAULT_LOCATION = {
  lat: 23.8103,
  lng: 90.4125,
} as const;

/** Default region for map initial view. */
export const DEFAULT_MAP_REGION = {
  latitude: DEFAULT_LOCATION.lat,
  longitude: DEFAULT_LOCATION.lng,
  latitudeDelta: 0.05,
  longitudeDelta: 0.05,
} as const;

/** Venue / head office location (used as fallback origin). */
export const VENUE_LOCATION = {
  name: 'SmartFood HQ',
  lat: 23.8103,
  lng: 90.4125,
  address: 'Gulshan Avenue, Dhaka, Bangladesh',
} as const;

/** Driver average speed in km/h for ETA estimation. */
export const DRIVER_AVERAGE_SPEED_KMH = 30;

/** Restaurant average prep time in minutes. */
export const DEFAULT_PREP_TIME_MINUTES = 15;

/** Default delivery fees. */
export const DEFAULT_DELIVERY_FEE = {
  baseFee: 5.0,
  feePerKm: 1.5,
} as const;

/** GeoJSON point type constant. */
export const GEOJSON_POINT_TYPE = 'Point' as const;

/** Distance thresholds in meters. */
export const DISTANCE_THRESHOLDS = {
  /** Minimum distance change to trigger a tracking history update (in meters). */
  LOCATION_UPDATE_THRESHOLD: 50,
  /** Radius for "nearby" driver search (in meters). */
  NEARBY_DRIVER_RADIUS: 5000,
} as const;

/** Conversion factors. */
export const CONVERSION = {
  KM_TO_MILES: 0.621371,
  MILES_TO_KM: 1.60934,
  METERS_TO_KM: 0.001,
  KM_TO_METERS: 1000,
} as const;

/** Geocoding cache TTL (24 hours in milliseconds). */
export const GEOCODING_CACHE_TTL_MS = 24 * 60 * 60 * 1000;

/** Road distance multiplier (haversine fallback). */
export const ROAD_DISTANCE_MULTIPLIER = 1.3;
