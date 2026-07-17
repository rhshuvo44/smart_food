import { Router, type Request, type Response } from 'express';
import mongoose from 'mongoose';
import { asyncHandler } from '../shared/async-handler.js';
import { env } from '../config/env.js';

const router = Router();

/**
 * GET /health
 * Returns server health status including uptime, timestamp, and DB connection state.
 */
router.get(
  '/health',
  asyncHandler(async (req: Request, res: Response) => {
    const dbState = mongoose.connection.readyState;
    const dbStateMap: Record<number, string> = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting',
    };

    const healthData = {
      status: 'healthy',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      environment: env.NODE_ENV,
      database: {
        state: dbStateMap[dbState] || 'unknown',
        connected: dbState === 1,
      },
      memory: process.memoryUsage(),
      version: '1.0.0',
    };

    res.status(200).json({
      success: true,
      data: healthData,
      correlationId: req.correlationId,
    });
  }),
);

export { router as healthRoutes };
