import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../shared/async-handler.js';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validation.middleware.js';
import { geocode, reverseGeocode } from './geocoding.service.js';

const router = Router();

const forwardGeocodeSchema = z.object({
  address: z.string().min(1).max(500).trim(),
});

const reverseGeocodeSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
});

/**
 * POST /api/v1/geocoding/forward
 * Forward geocode an address to coordinates.
 */
router.post(
  '/geocoding/forward',
  authMiddleware,
  validate(forwardGeocodeSchema),
  asyncHandler(async (req, res) => {
    const { address } = req.body;
    const result = await geocode(address);

    if (!result) {
      res.status(422).json({
        success: false,
        error: {
          code: 'GEOCODING_FAILED',
          message:
            'Could not geocode the provided address. Please try a different address or enter coordinates manually.',
        },
        correlationId: (req as any).correlationId,
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: result,
      correlationId: (req as any).correlationId,
    });
  }),
);

/**
 * POST /api/v1/geocoding/reverse
 * Reverse geocode coordinates to an address.
 */
router.post(
  '/geocoding/reverse',
  authMiddleware,
  validate(reverseGeocodeSchema),
  asyncHandler(async (req, res) => {
    const { lat, lng } = req.body;
    const result = await reverseGeocode(lat, lng);

    if (!result) {
      res.status(422).json({
        success: false,
        error: {
          code: 'REVERSE_GEOCODING_FAILED',
          message: 'Could not reverse geocode the provided coordinates.',
        },
        correlationId: (req as any).correlationId,
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: result,
      correlationId: (req as any).correlationId,
    });
  }),
);

export { router as geocodingRoutes };
