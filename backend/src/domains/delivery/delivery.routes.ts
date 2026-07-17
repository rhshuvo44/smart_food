import { Router } from 'express';
import { z } from 'zod';
import {
  createZone,
  listZones,
  getZoneById,
  updateZone,
  deleteZone,
  checkZoneContainment,
  createDeliveryHandler,
  getDeliveryById,
  getDeliveryByOrder,
  updateDeliveryStatus,
  updateDeliveryLocation,
  calculateDistanceHandler,
} from './delivery.controller.js';
import { asyncHandler } from '../../shared/async-handler.js';
import { authMiddleware, requireRole } from '../../middleware/auth.middleware.js';
import { UserRole } from '@smartfood/shared';
import { validate } from '../../middleware/validation.middleware.js';

const router = Router();

// ─── Validation schemas ────────────────────────────────────────────────────

const geoPointSchema = z.object({
  type: z.literal('Point'),
  coordinates: z.array(z.number()).length(2),
});

const geoPolygonSchema = z.object({
  type: z.literal('Polygon'),
  coordinates: z.array(z.array(z.array(z.number()).length(2)).min(1)).min(1),
});

const createZoneSchema = z
  .object({
    name: z.string().min(1).max(100).trim(),
    boundary: geoPolygonSchema.optional(),
    boundaries: z.array(geoPointSchema).min(3, 'Boundary must have at least 3 points').optional(),
    baseFee: z.number().min(0),
    feePerKm: z.number().min(0),
    estimatedMinutes: z.number().int().min(1),
  })
  .refine((data) => data.boundary || data.boundaries, {
    message: 'Either "boundary" (GeoJSON Polygon) or "boundaries" (array of Points) is required',
  });

const updateZoneSchema = z.object({
  name: z.string().min(1).max(100).trim().optional(),
  boundary: geoPolygonSchema.optional(),
  boundaries: z.array(geoPointSchema).min(3).optional(),
  baseFee: z.number().min(0).optional(),
  feePerKm: z.number().min(0).optional(),
  estimatedMinutes: z.number().int().min(1).optional(),
  isActive: z.boolean().optional(),
});

const zoneContainmentSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
});

const createDeliverySchema = z.object({
  orderId: z.string().min(1),
  driverId: z.string().optional(),
  driverName: z.string().optional(),
  driverPhone: z.string().optional(),
});

const updateStatusSchema = z.object({
  status: z.enum(['pending', 'assigned', 'picked_up', 'in_transit', 'delivered', 'failed']),
  note: z.string().max(500).optional(),
});

const updateLocationSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
});

const calculateDistanceSchema = z.object({
  origin: z.object({
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180),
  }),
  destination: z.object({
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180),
  }),
});

// ─── Zone Routes (Admin only) ──────────────────────────────────────────────

router.post(
  '/delivery/zones',
  authMiddleware,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  validate(createZoneSchema),
  asyncHandler(createZone),
);

router.get('/delivery/zones', authMiddleware, asyncHandler(listZones));

router.get('/delivery/zones/:id', authMiddleware, asyncHandler(getZoneById));

router.put(
  '/delivery/zones/:id',
  authMiddleware,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  validate(updateZoneSchema),
  asyncHandler(updateZone),
);

router.delete(
  '/delivery/zones/:id',
  authMiddleware,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  asyncHandler(deleteZone),
);

router.post(
  '/delivery/zones/check',
  authMiddleware,
  validate(zoneContainmentSchema),
  asyncHandler(checkZoneContainment),
);

// ─── Delivery Routes ───────────────────────────────────────────────────────

router.post(
  '/delivery/deliveries',
  authMiddleware,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  validate(createDeliverySchema),
  asyncHandler(createDeliveryHandler),
);

router.get('/delivery/deliveries/:id', authMiddleware, asyncHandler(getDeliveryById));

router.get('/delivery/deliveries/order/:orderId', authMiddleware, asyncHandler(getDeliveryByOrder));

router.put(
  '/delivery/deliveries/:id/status',
  authMiddleware,
  requireRole(UserRole.DELIVERY_DRIVER, UserRole.ADMIN, UserRole.SUPER_ADMIN),
  validate(updateStatusSchema),
  asyncHandler(updateDeliveryStatus),
);

router.put(
  '/delivery/deliveries/:id/location',
  authMiddleware,
  requireRole(UserRole.DELIVERY_DRIVER, UserRole.ADMIN, UserRole.SUPER_ADMIN),
  validate(updateLocationSchema),
  asyncHandler(updateDeliveryLocation),
);

// ─── Calculation Routes ────────────────────────────────────────────────────

router.post(
  '/delivery/calculate',
  authMiddleware,
  validate(calculateDistanceSchema),
  asyncHandler(calculateDistanceHandler),
);

export { router as deliveryRoutes };
