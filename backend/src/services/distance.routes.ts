import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../shared/async-handler.js';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validation.middleware.js';
import { calculateDistance, findNearbyRestaurants } from './distance.service.js';

const router = Router();

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

const nearbyRestaurantsSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  radiusKm: z.number().min(0.1).max(100).optional(),
});

/**
 * POST /api/v1/distance
 * Calculate distance and ETA between two points.
 */
router.post(
  '/distance',
  authMiddleware,
  validate(calculateDistanceSchema),
  asyncHandler(async (req, res) => {
    const { origin, destination } = req.body;

    const result = await calculateDistance(
      origin.lat,
      origin.lng,
      destination.lat,
      destination.lng,
    );

    res.status(200).json({
      success: true,
      data: result,
      correlationId: (req as any).correlationId,
    });
  }),
);

/**
 * POST /api/v1/distance/nearby-restaurants
 * Find restaurants within a radius of a point.
 */
router.post(
  '/distance/nearby-restaurants',
  authMiddleware,
  validate(nearbyRestaurantsSchema),
  asyncHandler(async (req, res) => {
    const { lat, lng, radiusKm } = req.body;

    const restaurants = await findNearbyRestaurants(lat, lng, radiusKm);

    res.status(200).json({
      success: true,
      data: { restaurants, count: restaurants.length },
      correlationId: (req as any).correlationId,
    });
  }),
);

export { router as distanceRoutes };
