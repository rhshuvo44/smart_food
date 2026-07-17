import mongoose from 'mongoose';
import { Delivery, DeliveryZone } from '../../models/index.js';
import { NotFoundError, ValidationError } from '../../shared/errors.js';
import { haversineDistance } from '../../shared/geo.js';
import { getIO } from '../../sockets/socket.server.js';
import type { DeliveryStatus } from '@smartfood/shared';

/**
 * Valid delivery status transitions.
 */
const VALID_TRANSITIONS: Record<DeliveryStatus, DeliveryStatus[]> = {
  pending: ['assigned', 'failed'],
  assigned: ['picked_up', 'failed'],
  picked_up: ['in_transit', 'failed'],
  in_transit: ['delivered', 'failed'],
  delivered: [],
  failed: [],
};

/**
 * Check if a status transition is valid.
 */
function isValidDeliveryTransition(from: DeliveryStatus, to: DeliveryStatus): boolean {
  return VALID_TRANSITIONS[from]?.includes(to) ?? false;
}

// ─── DELIVERY ZONE CRUD ────────────────────────────────────────────────────

/**
 * Create a new delivery zone.
 * @param data.name - Zone name
 * @param data.boundary - GeoJSON Polygon boundary (coordinates[0] = outer ring of [lng, lat] pairs)
 * @param data.baseFee - Base delivery fee
 * @param data.feePerKm - Fee per kilometer
 * @param data.estimatedMinutes - Estimated delivery time in minutes
 */
export async function createDeliveryZone(data: {
  name: string;
  boundary: {
    type: 'Polygon';
    coordinates: Array<Array<[number, number]>>;
  };
  baseFee: number;
  feePerKm: number;
  estimatedMinutes: number;
}) {
  const zone = new DeliveryZone({
    name: data.name,
    boundary: data.boundary || {
      type: 'Polygon',
      coordinates: [],
    },
    baseFee: data.baseFee,
    feePerKm: data.feePerKm,
    estimatedMinutes: data.estimatedMinutes,
    isActive: true,
  });
  await zone.save();
  return zone;
}

/**
 * Legacy helper: create a zone from an array of boundary points (closes the ring automatically).
 */
export function polygonFromPoints(
  points: Array<{ type: 'Point'; coordinates: [number, number] }>,
): {
  type: 'Polygon';
  coordinates: Array<Array<[number, number]>>;
} {
  if (points.length < 3) {
    throw new Error('A polygon must have at least 3 points');
  }
  const ring: Array<[number, number]> = points.map((p) => p.coordinates);
  // Close the ring if not already closed
  const first = ring[0];
  const last = ring[ring.length - 1];
  if (first[0] !== last[0] || first[1] !== last[1]) {
    ring.push([...first]);
  }
  return {
    type: 'Polygon',
    coordinates: [ring],
  };
}

/**
 * Get all active delivery zones.
 */
export async function getActiveZones() {
  return DeliveryZone.find({ isActive: true }).sort({ name: 1 });
}

/**
 * Get a delivery zone by ID.
 */
export async function getZoneById(id: string) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new NotFoundError('Invalid zone ID');
  }
  const zone = await DeliveryZone.findById(id);
  if (!zone) {
    throw new NotFoundError('Delivery zone not found');
  }
  return zone;
}

/**
 * Update a delivery zone.
 */
export async function updateDeliveryZone(
  id: string,
  data: Partial<{
    name: string;
    boundary: {
      type: 'Polygon';
      coordinates: Array<Array<[number, number]>>;
    };
    baseFee: number;
    feePerKm: number;
    estimatedMinutes: number;
    isActive: boolean;
  }>,
) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new NotFoundError('Invalid zone ID');
  }
  const zone = await DeliveryZone.findByIdAndUpdate(
    id,
    { $set: data },
    { new: true, runValidators: true },
  );
  if (!zone) {
    throw new NotFoundError('Delivery zone not found');
  }
  return zone;
}

/**
 * Soft-delete (deactivate) a delivery zone.
 */
export async function deactivateDeliveryZone(id: string) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new NotFoundError('Invalid zone ID');
  }
  const zone = await DeliveryZone.findByIdAndUpdate(
    id,
    { $set: { isActive: false } },
    { new: true },
  );
  if (!zone) {
    throw new NotFoundError('Delivery zone not found');
  }
  return zone;
}

/**
 * Check if a point (lat/lng) falls within any active delivery zone.
 * Returns the matching zones.
 */
export async function checkZoneContainment(lat: number, lng: number) {
  // GeoJSON uses [longitude, latitude] order
  const point = {
    type: 'Point' as const,
    coordinates: [lng, lat],
  };

  const containingZones = await DeliveryZone.find({
    isActive: true,
    boundary: {
      $geoIntersects: {
        $geometry: point,
      },
    },
  });

  return containingZones;
}

/**
 * Find the best delivery zone for a given coordinate point.
 * Returns the first matching zone or null.
 */
export async function findZoneForLocation(lat: number, lng: number) {
  const point = {
    type: 'Point' as const,
    coordinates: [lng, lat],
  };

  const zone = await DeliveryZone.findOne({
    isActive: true,
    boundary: {
      $geoIntersects: {
        $geometry: point,
      },
    },
  });

  return zone;
}

// ─── DELIVERY CRUD ─────────────────────────────────────────────────────────

/**
 * Create a new delivery record linked to an order.
 */
export async function createDelivery(data: {
  orderId: string;
  driverId?: string;
  driverName?: string;
  driverPhone?: string;
}) {
  if (!mongoose.Types.ObjectId.isValid(data.orderId)) {
    throw new ValidationError('Invalid order ID');
  }

  const existing = await Delivery.findOne({ orderId: data.orderId });
  if (existing) {
    throw new ValidationError('A delivery already exists for this order');
  }

  const delivery = new Delivery({
    orderId: data.orderId,
    driverId: data.driverId,
    driverName: data.driverName,
    driverPhone: data.driverPhone,
    status: data.driverId ? 'assigned' : 'pending',
    lastUpdated: new Date(),
    trackingHistory: [
      {
        status: data.driverId ? 'assigned' : 'pending',
        timestamp: new Date(),
        note: data.driverId ? 'Driver assigned' : 'Delivery created',
      },
    ],
  });

  await delivery.save();

  // If driver assigned, emit socket event
  if (data.driverId) {
    const io = getIO();
    if (io) {
      io.to(`order:${data.orderId}`).emit('delivery.assigned', {
        orderId: data.orderId,
        driverId: data.driverId,
        driverName: data.driverName,
        estimatedArrival: delivery.estimatedArrival,
      });
    }
  }

  return delivery;
}

/**
 * Get delivery by ID.
 */
export async function getDeliveryById(id: string) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new NotFoundError('Invalid delivery ID');
  }
  const delivery = await Delivery.findById(id)
    .populate('orderId', 'status total')
    .populate('driverId', 'firstName lastName phone');
  if (!delivery) {
    throw new NotFoundError('Delivery not found');
  }
  return delivery;
}

/**
 * Get delivery by order ID.
 */
export async function getDeliveryByOrder(orderId: string) {
  if (!mongoose.Types.ObjectId.isValid(orderId)) {
    throw new NotFoundError('Invalid order ID');
  }
  const delivery = await Delivery.findOne({ orderId })
    .populate('orderId', 'status total')
    .populate('driverId', 'firstName lastName phone');
  if (!delivery) {
    throw new NotFoundError('Delivery not found for this order');
  }
  return delivery;
}

/**
 * Update delivery status with state-machine validation.
 */
export async function updateDeliveryStatus(id: string, newStatus: DeliveryStatus, note?: string) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new NotFoundError('Invalid delivery ID');
  }

  const delivery = await Delivery.findById(id);
  if (!delivery) {
    throw new NotFoundError('Delivery not found');
  }

  const currentStatus = delivery.status as DeliveryStatus;
  if (!isValidDeliveryTransition(currentStatus, newStatus)) {
    throw new ValidationError(
      `Invalid status transition from "${currentStatus}" to "${newStatus}"`,
    );
  }

  delivery.status = newStatus;
  delivery.lastUpdated = new Date();

  delivery.trackingHistory.push({
    status: newStatus,
    timestamp: new Date(),
    location: delivery.driverLocation,
    note: note || `Status changed to ${newStatus}`,
  });

  if (newStatus === 'delivered') {
    delivery.estimatedArrival = new Date();
  }

  await delivery.save();

  // Emit socket event
  const io = getIO();
  if (io) {
    io.to(`order:${delivery.orderId}`).emit('delivery.status_changed', {
      orderId: delivery.orderId.toString(),
      status: newStatus,
      location: delivery.driverLocation?.coordinates
        ? {
            lat: delivery.driverLocation.coordinates[1],
            lng: delivery.driverLocation.coordinates[0],
          }
        : undefined,
      timestamp: new Date(),
    });
  }

  if (newStatus === 'delivered') {
    if (io) {
      io.to(`order:${delivery.orderId}`).emit('delivery.completed', {
        orderId: delivery.orderId.toString(),
        deliveredAt: new Date(),
      });
    }
  }

  return delivery;
}

/**
 * Update driver's current location and add to tracking history.
 */
export async function updateDriverLocation(id: string, lat: number, lng: number) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new NotFoundError('Invalid delivery ID');
  }

  const delivery = await Delivery.findById(id);
  if (!delivery) {
    throw new NotFoundError('Delivery not found');
  }

  // GeoJSON uses [longitude, latitude] order
  const coords: [number, number] = [lng, lat];
  const point = {
    type: 'Point' as const,
    coordinates: coords,
  };

  delivery.driverLocation = point;
  delivery.currentLocation = point;
  delivery.lastUpdated = new Date();

  // Only add to tracking history if location changed significantly (~50m)
  const lastLocation = delivery.trackingHistory[delivery.trackingHistory.length - 1]?.location;
  if (!lastLocation || hasMovedSignificantly(lastLocation.coordinates, [lng, lat])) {
    delivery.trackingHistory.push({
      status: delivery.status as DeliveryStatus,
      location: { type: 'Point' as const, coordinates: coords },
      timestamp: new Date(),
      note: 'Location updated',
    });
  }

  await delivery.save();

  // Emit socket event for real-time tracking
  const io = getIO();
  if (io) {
    io.to(`order:${delivery.orderId}`).emit('delivery.location_updated', {
      orderId: delivery.orderId.toString(),
      location: { lat, lng },
      timestamp: new Date(),
      status: delivery.status,
    });
  }

  return delivery;
}

/**
 * Check if a point has moved significantly from previous position (>50m).
 */
function hasMovedSignificantly(
  oldCoords: [number, number],
  newCoords: [number, number],
  thresholdMeters: number = 50,
): boolean {
  // Old coords are [lng, lat], new coords are [lng, lat]
  const distance = haversineDistance(oldCoords[1], oldCoords[0], newCoords[1], newCoords[0]);
  return distance > thresholdMeters;
}

/**
 * Find nearby drivers within a radius (in meters).
 * Uses the delivery driver role — in a real system you'd query users with role=delivery_driver
 * and check their last known location.
 */
export async function findNearbyDrivers(lat: number, lng: number, radiusMeters: number = 5000) {
  // Find deliveries that are currently in progress (status: in_transit or assigned)
  // where the driver has a recent location
  const point = {
    type: 'Point' as const,
    coordinates: [lng, lat],
  };

  const nearbyDeliveries = await Delivery.find({
    status: { $in: ['assigned', 'picked_up', 'in_transit'] },
    'driverLocation.coordinates': {
      $near: {
        $geometry: point,
        $maxDistance: radiusMeters,
      },
    },
  })
    .select('driverId driverName driverPhone driverLocation status orderId')
    .populate('driverId', 'firstName lastName phone')
    .limit(20);

  return nearbyDeliveries;
}

/**
 * Calculate delivery fee based on zone and distance.
 */
export async function calculateDeliveryFee(
  originLat: number,
  originLng: number,
  destLat: number,
  destLng: number,
): Promise<{
  distanceMeters: number;
  distanceKm: number;
  baseFee: number;
  feePerKm: number;
  totalFee: number;
  estimatedMinutes: number;
  zoneName: string | null;
}> {
  const zone = await findZoneForLocation(destLat, destLng);
  const distance = haversineDistance(originLat, originLng, destLat, destLng);
  const distanceKm = distance / 1000;

  if (!zone) {
    return {
      distanceMeters: Math.round(distance),
      distanceKm: Math.round(distanceKm * 100) / 100,
      baseFee: 5.0,
      feePerKm: 1.5,
      totalFee: 5.0 + 1.5 * Math.ceil(distanceKm),
      estimatedMinutes: Math.ceil((distanceKm / 30) * 60 + 15),
      zoneName: null,
    };
  }

  const totalFee = zone.baseFee + zone.feePerKm * Math.ceil(distanceKm);

  return {
    distanceMeters: Math.round(distance),
    distanceKm: Math.round(distanceKm * 100) / 100,
    baseFee: zone.baseFee,
    feePerKm: zone.feePerKm,
    totalFee: Math.round(totalFee * 100) / 100,
    estimatedMinutes: Math.max(zone.estimatedMinutes, Math.ceil((distanceKm / 30) * 60 + 15)),
    zoneName: zone.name,
  };
}
