import request from 'supertest';
import express from 'express';
import { Router } from 'express';
import { deliveryRoutes } from '../../../src/domains/delivery/delivery.routes.js';
import { errorHandler } from '../../../src/middleware/error.js';

// Mock auth middleware to bypass authentication in tests
jest.mock('../../../src/middleware/auth.middleware', () => ({
  authMiddleware: (_req: any, _res: any, next: any) => {
    // Simulate an authenticated admin user
    _req.userId = 'test-user-id';
    _req.userRole = 'admin';
    next();
  },
  requireRole:
    (..._roles: string[]) =>
    (_req: any, _res: any, next: any) =>
      next(),
}));

// Mock validation middleware
jest.mock('../../../src/middleware/validation.middleware', () => ({
  validate: (_schema: any) => (_req: any, _res: any, next: any) => next(),
}));

// Mock the delivery service
jest.mock('../../../src/domains/delivery/delivery.service', () => {
  const actual = jest.requireActual('../../../src/domains/delivery/delivery.service');
  return {
    ...actual,
    createDeliveryZone: jest.fn(),
    getActiveZones: jest.fn(),
    getZoneById: jest.fn(),
    updateDeliveryZone: jest.fn(),
    deactivateDeliveryZone: jest.fn(),
    checkZoneContainment: jest.fn(),
    createDelivery: jest.fn(),
    getDeliveryById: jest.fn(),
    getDeliveryByOrder: jest.fn(),
    updateDeliveryStatus: jest.fn(),
    updateDriverLocation: jest.fn(),
    calculateDeliveryFee: jest.fn(),
    calculateDistance: jest.fn(),
    estimateDeliveryTime: jest.fn(),
  };
});

import * as deliveryService from '../../../src/domains/delivery/delivery.service';

describe('Delivery Controller', () => {
  let app: express.Application;

  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.use('/api/v1', deliveryRoutes);
    app.use(errorHandler);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/v1/delivery/zones', () => {
    it('should create a zone and return 201', async () => {
      const mockZone = {
        _id: 'zone-1',
        name: 'Downtown',
        boundary: {
          type: 'Polygon',
          coordinates: [
            [
              [90.4125, 23.8103],
              [90.4225, 23.8153],
              [90.4275, 23.8083],
              [90.4125, 23.8103],
            ],
          ],
        },
        baseFee: 5.0,
        feePerKm: 1.5,
        estimatedMinutes: 30,
        isActive: true,
      };

      (deliveryService.createDeliveryZone as jest.Mock).mockResolvedValue(mockZone);

      const response = await request(app)
        .post('/api/v1/delivery/zones')
        .send({
          name: 'Downtown',
          boundary: {
            type: 'Polygon',
            coordinates: [
              [
                [90.4125, 23.8103],
                [90.4225, 23.8153],
                [90.4275, 23.8083],
                [90.4125, 23.8103],
              ],
            ],
          },
          baseFee: 5.0,
          feePerKm: 1.5,
          estimatedMinutes: 30,
        })
        .expect('Content-Type', /json/)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.zone.name).toBe('Downtown');
    });

    it('should return 500 when service throws', async () => {
      (deliveryService.createDeliveryZone as jest.Mock).mockRejectedValue(new Error('DB error'));

      const response = await request(app)
        .post('/api/v1/delivery/zones')
        .send({
          name: 'Downtown',
          boundary: {
            type: 'Polygon',
            coordinates: [
              [
                [90.4125, 23.8103],
                [90.4225, 23.8153],
                [90.4275, 23.8083],
                [90.4125, 23.8103],
              ],
            ],
          },
          baseFee: 5.0,
          feePerKm: 1.5,
          estimatedMinutes: 30,
        })
        .expect(500);
    });
  });

  describe('GET /api/v1/delivery/zones', () => {
    it('should return all active zones', async () => {
      const mockZones = [
        { _id: 'zone-1', name: 'Zone A', isActive: true },
        { _id: 'zone-2', name: 'Zone B', isActive: true },
      ];

      (deliveryService.getActiveZones as jest.Mock).mockResolvedValue(mockZones);

      const response = await request(app).get('/api/v1/delivery/zones').expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.zones).toHaveLength(2);
    });
  });

  describe('GET /api/v1/delivery/zones/:id', () => {
    it('should return a zone by ID', async () => {
      const mockZone = { _id: 'zone-1', name: 'Zone A', isActive: true };
      (deliveryService.getZoneById as jest.Mock).mockResolvedValue(mockZone);

      const response = await request(app).get('/api/v1/delivery/zones/zone-1').expect(200);

      expect(response.body.data.zone.name).toBe('Zone A');
    });

    it('should return 404 when zone not found', async () => {
      (deliveryService.getZoneById as jest.Mock).mockRejectedValue(
        new (require('../../../src/shared/errors').NotFoundError)('Delivery zone not found'),
      );

      const response = await request(app).get('/api/v1/delivery/zones/nonexistent-id').expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe('DELETE /api/v1/delivery/zones/:id', () => {
    it('should deactivate a zone and return 200', async () => {
      const mockZone = { _id: 'zone-1', name: 'Zone A', isActive: false };
      (deliveryService.deactivateDeliveryZone as jest.Mock).mockResolvedValue(mockZone);

      const response = await request(app).delete('/api/v1/delivery/zones/zone-1').expect(200);

      expect(response.body.data.zone.isActive).toBe(false);
    });
  });

  describe('POST /api/v1/delivery/zones/check', () => {
    it('should check zone containment for coordinates', async () => {
      (deliveryService.checkZoneContainment as jest.Mock).mockResolvedValue([
        { _id: 'zone-1', name: 'Zone A' },
      ]);

      const response = await request(app)
        .post('/api/v1/delivery/zones/check')
        .send({ lat: 23.81, lng: 90.415 })
        .expect(200);

      expect(response.body.data.isInZone).toBe(true);
      expect(response.body.data.zones).toHaveLength(1);
    });
  });

  describe('POST /api/v1/delivery/deliveries', () => {
    it('should create a delivery and return 201', async () => {
      const mockDelivery = {
        _id: 'del-1',
        orderId: 'order-1',
        status: 'pending',
      };

      (deliveryService.createDelivery as jest.Mock).mockResolvedValue(mockDelivery);

      const response = await request(app)
        .post('/api/v1/delivery/deliveries')
        .send({ orderId: 'order-1', driverId: 'driver-1' })
        .expect(201);

      expect(response.body.data.delivery.status).toBe('pending');
    });
  });

  describe('PUT /api/v1/delivery/deliveries/:id/status', () => {
    it('should update delivery status', async () => {
      const mockDelivery = {
        _id: 'del-1',
        orderId: 'order-1',
        status: 'assigned',
      };

      (deliveryService.updateDeliveryStatus as jest.Mock).mockResolvedValue(mockDelivery);

      const response = await request(app)
        .put('/api/v1/delivery/deliveries/del-1/status')
        .send({ status: 'assigned', note: 'Driver assigned' })
        .expect(200);

      expect(response.body.data.delivery.status).toBe('assigned');
    });
  });

  describe('PUT /api/v1/delivery/deliveries/:id/location', () => {
    it('should update driver location', async () => {
      const mockDelivery = {
        _id: 'del-1',
        driverLocation: { type: 'Point', coordinates: [90.4145, 23.8123] },
      };

      (deliveryService.updateDriverLocation as jest.Mock).mockResolvedValue(mockDelivery);

      const response = await request(app)
        .put('/api/v1/delivery/deliveries/del-1/location')
        .send({ lat: 23.8123, lng: 90.4145 })
        .expect(200);

      expect(response.body.data.delivery).toBeDefined();
    });
  });

  describe('POST /api/v1/delivery/calculate', () => {
    it('should calculate distance and ETA', async () => {
      (deliveryService.calculateDeliveryFee as jest.Mock).mockResolvedValue({
        totalFee: 7.5,
        baseFee: 5.0,
        feePerKm: 1.5,
        zoneName: 'Downtown',
      });

      const response = await request(app)
        .post('/api/v1/delivery/calculate')
        .send({
          origin: { lat: 23.8103, lng: 90.4125 },
          destination: { lat: 23.8203, lng: 90.4225 },
        })
        .expect(200);

      expect(typeof response.body.data.distanceMeters).toBe('number');
      expect(response.body.data.distanceMeters).toBeGreaterThan(0);
      expect(response.body.data.deliveryFee).toBe(7.5);
    });
  });
});
