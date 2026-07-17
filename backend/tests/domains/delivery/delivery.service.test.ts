import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { Delivery, DeliveryZone } from '../../../src/models/index.js';
import * as deliveryService from '../../../src/domains/delivery/delivery.service.js';
import { haversineDistance } from '../../../src/shared/geo.js';

let mongoServer: MongoMemoryServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create({
    instance: { dbName: 'smartfood_test_delivery' },
  });
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
}, 30000);

afterAll(async () => {
  await mongoose.disconnect();
  if (mongoServer) {
    await mongoServer.stop();
  }
});

afterEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
});

// Helper: create a polygon from an array of [lng, lat] pairs (closes the ring)
function polygonFromCoords(coords: Array<[number, number]>): {
  type: 'Polygon';
  coordinates: Array<Array<[number, number]>>;
} {
  const ring = [...coords];
  const first = ring[0];
  const last = ring[ring.length - 1];
  if (first[0] !== last[0] || first[1] !== last[1]) {
    ring.push([...first]);
  }
  return { type: 'Polygon', coordinates: [ring] };
}

// Helpers / Fixtures
const validZoneData = {
  name: 'Test Zone Downtown',
  boundary: polygonFromCoords([
    [90.4125, 23.8103],
    [90.4225, 23.8153],
    [90.4275, 23.8083],
    [90.4175, 23.8023],
    [90.4075, 23.8053],
  ]),
  baseFee: 5.0,
  feePerKm: 1.5,
  estimatedMinutes: 30,
};

describe('Delivery Service', () => {
  describe('Delivery Zone CRUD', () => {
    it('should create a delivery zone with valid GeoJSON boundaries', async () => {
      const zone = await deliveryService.createDeliveryZone(validZoneData);

      expect(zone).toBeDefined();
      expect(zone.name).toBe('Test Zone Downtown');
      expect(zone.boundary.coordinates[0]).toHaveLength(6);
      expect(zone.baseFee).toBe(5.0);
      expect(zone.feePerKm).toBe(1.5);
      expect(zone.estimatedMinutes).toBe(30);
      expect(zone.isActive).toBe(true);
    });

    it('should reject invalid ObjectId when getting zone', async () => {
      await expect(deliveryService.getZoneById('invalid-id')).rejects.toThrow('Invalid zone ID');
    });

    it('should throw NotFoundError for non-existent zone', async () => {
      const fakeId = new mongoose.Types.ObjectId().toString();
      await expect(deliveryService.getZoneById(fakeId)).rejects.toThrow('Delivery zone not found');
    });

    it('should return all active zones', async () => {
      await deliveryService.createDeliveryZone(validZoneData);
      await deliveryService.createDeliveryZone({
        ...validZoneData,
        name: 'Test Zone Suburb',
        boundary: polygonFromCoords([
          [90.4325, 23.8253],
          [90.4475, 23.8303],
          [90.4525, 23.8203],
          [90.4375, 23.8153],
        ]),
      });

      const zones = await deliveryService.getActiveZones();
      expect(zones).toHaveLength(2);
    });

    it('should update a delivery zone', async () => {
      const zone = await deliveryService.createDeliveryZone(validZoneData);
      const updated = await deliveryService.updateDeliveryZone(zone._id.toString(), {
        baseFee: 7.5,
        feePerKm: 2.0,
      });

      expect(updated.baseFee).toBe(7.5);
      expect(updated.feePerKm).toBe(2.0);
    });

    it('should soft-delete (deactivate) a delivery zone', async () => {
      const zone = await deliveryService.createDeliveryZone(validZoneData);
      const deactivated = await deliveryService.deactivateDeliveryZone(zone._id.toString());

      expect(deactivated.isActive).toBe(false);
    });
  });

  describe('Zone Containment', () => {
    it('should find a zone containing a point inside its boundary', async () => {
      // Create a simple rectangular zone
      await deliveryService.createDeliveryZone({
        name: 'Rect Zone',
        boundary: polygonFromCoords([
          [90.4, 23.8],
          [90.43, 23.8],
          [90.43, 23.82],
          [90.4, 23.82],
        ]),
        baseFee: 3.0,
        feePerKm: 1.0,
        estimatedMinutes: 20,
      });

      // Point inside the rectangle
      const zones = await deliveryService.checkZoneContainment(23.81, 90.415);
      expect(zones.length).toBeGreaterThanOrEqual(1);
      expect(zones[0].name).toBe('Rect Zone');
    });

    it('should NOT find a zone for a point far outside any zone', async () => {
      // Point far away (e.g., somewhere in the ocean)
      const zones = await deliveryService.checkZoneContainment(0, 0);
      expect(zones).toHaveLength(0);
    });

    it('should find the correct zone for a given location with findZoneForLocation', async () => {
      await deliveryService.createDeliveryZone({
        name: 'Zone A',
        boundary: polygonFromCoords([
          [90.4, 23.8],
          [90.44, 23.8],
          [90.44, 23.84],
          [90.4, 23.84],
        ]),
        baseFee: 3.0,
        feePerKm: 1.0,
        estimatedMinutes: 20,
      });

      const zone = await deliveryService.findZoneForLocation(23.82, 90.42);
      expect(zone).not.toBeNull();
      expect(zone!.name).toBe('Zone A');
    });
  });

  describe('Distance Calculation (Haversine)', () => {
    it('should calculate distance correctly between two known points', () => {
      // Distance between two points ~1.5km apart in Dhaka
      const lat1 = 23.8103;
      const lng1 = 90.4125;
      const lat2 = 23.8203;
      const lng2 = 90.4225;

      const distance = haversineDistance(lat1, lng1, lat2, lng2);

      // Expected ~1.4 km
      expect(distance).toBeGreaterThan(1000);
      expect(distance).toBeLessThan(2000);
    });

    it('should return 0 for the same point', () => {
      const distance = haversineDistance(23.8103, 90.4125, 23.8103, 90.4125);
      expect(distance).toBe(0);
    });

    it('should calculate distance between Dhaka and Chittagong (~230km)', () => {
      const distance = haversineDistance(23.8103, 90.4125, 22.3569, 91.7832);

      // Expected roughly 230,000 meters
      expect(distance).toBeGreaterThan(200000);
      expect(distance).toBeLessThan(260000);
    });
  });

  describe('Delivery Status Transitions', () => {
    it('should create a delivery with pending status', async () => {
      const orderId = new mongoose.Types.ObjectId();
      const delivery = await deliveryService.createDelivery({
        orderId: orderId.toString(),
      });

      expect(delivery).toBeDefined();
      expect(delivery.status).toBe('pending');
      expect(delivery.trackingHistory).toHaveLength(1);
    });

    it('should transition from pending to assigned', async () => {
      const orderId = new mongoose.Types.ObjectId();
      const delivery = await deliveryService.createDelivery({
        orderId: orderId.toString(),
      });

      const updated = await deliveryService.updateDeliveryStatus(
        delivery._id.toString(),
        'assigned',
      );

      expect(updated.status).toBe('assigned');
      expect(updated.trackingHistory).toHaveLength(2);
    });

    it('should transition through all valid statuses', async () => {
      const orderId = new mongoose.Types.ObjectId();
      const delivery = await deliveryService.createDelivery({
        orderId: orderId.toString(),
      });

      const transitions: Array<{ from: string; to: string }> = [
        { from: 'pending', to: 'assigned' },
        { from: 'assigned', to: 'picked_up' },
        { from: 'picked_up', to: 'in_transit' },
        { from: 'in_transit', to: 'delivered' },
      ];

      let currentId = delivery._id.toString();
      for (const t of transitions) {
        const updated = await deliveryService.updateDeliveryStatus(currentId, t.to as any);
        expect(updated.status).toBe(t.to);
        currentId = updated._id.toString();
      }
    });

    it('should reject invalid status transition (delivered → assigned)', async () => {
      const orderId = new mongoose.Types.ObjectId();
      const delivery = await deliveryService.createDelivery({
        orderId: orderId.toString(),
      });

      // Fast-forward to delivered
      await deliveryService.updateDeliveryStatus(delivery._id.toString(), 'assigned');
      await deliveryService.updateDeliveryStatus(delivery._id.toString(), 'picked_up');
      await deliveryService.updateDeliveryStatus(delivery._id.toString(), 'in_transit');
      await deliveryService.updateDeliveryStatus(delivery._id.toString(), 'delivered');

      // Try invalid transition
      await expect(
        deliveryService.updateDeliveryStatus(delivery._id.toString(), 'assigned'),
      ).rejects.toThrow('Invalid status transition');
    });

    it('should reject transition from pending to delivered (skip)', async () => {
      const orderId = new mongoose.Types.ObjectId();
      const delivery = await deliveryService.createDelivery({
        orderId: orderId.toString(),
      });

      await expect(
        deliveryService.updateDeliveryStatus(delivery._id.toString(), 'delivered'),
      ).rejects.toThrow('Invalid status transition');
    });
  });

  describe('Location Updates', () => {
    it('should update driver location and add tracking history', async () => {
      const orderId = new mongoose.Types.ObjectId();
      const delivery = await deliveryService.createDelivery({
        orderId: orderId.toString(),
        driverId: new mongoose.Types.ObjectId().toString(),
        driverName: 'Test Driver',
      });

      const updated = await deliveryService.updateDriverLocation(
        delivery._id.toString(),
        23.8123,
        90.4145,
      );

      expect(updated.driverLocation).toBeDefined();
      expect(updated.driverLocation!.coordinates).toEqual([90.4145, 23.8123]); // GeoJSON [lng, lat]
      expect(updated.trackingHistory.length).toBeGreaterThanOrEqual(1);
    });

    it('should not add duplicate tracking entry for same location', async () => {
      const orderId = new mongoose.Types.ObjectId();
      const delivery = await deliveryService.createDelivery({
        orderId: orderId.toString(),
      });

      await deliveryService.updateDriverLocation(delivery._id.toString(), 23.81, 90.41);
      await deliveryService.updateDriverLocation(delivery._id.toString(), 23.81, 90.41);

      const final = await deliveryService.getDeliveryById(delivery._id.toString());
      // Should have only added 1 location tracking entry (since location didn't change significantly)
      const locationEntries = final.trackingHistory.filter((t) => t.note === 'Location updated');
      expect(locationEntries.length).toBeLessThanOrEqual(1);
    });
  });

  describe('Delivery Fee Calculation', () => {
    it('should calculate delivery fee based on zone and distance', async () => {
      await deliveryService.createDeliveryZone({
        name: 'Fee Zone',
        boundary: polygonFromCoords([
          [90.4, 23.8],
          [90.44, 23.8],
          [90.44, 23.84],
          [90.4, 23.84],
        ]),
        baseFee: 5.0,
        feePerKm: 1.5,
        estimatedMinutes: 25,
      });

      const fee = await deliveryService.calculateDeliveryFee(23.8103, 90.4125, 23.8203, 90.4225);

      expect(fee.zoneName).toBe('Fee Zone');
      expect(fee.baseFee).toBe(5.0);
      expect(fee.feePerKm).toBe(1.5);
      expect(fee.distanceKm).toBeGreaterThan(0);
      expect(fee.totalFee).toBeGreaterThan(0);
    });
  });
});
