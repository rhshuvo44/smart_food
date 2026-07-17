import type { Request, Response } from 'express';
import { getRestaurantDashboard } from './dashboard.service.js';

export async function getDashboard(req: Request, res: Response): Promise<void> {
  const { restaurantId } = req.params;

  const dashboard = await getRestaurantDashboard(restaurantId);

  res.status(200).json({
    success: true,
    data: { dashboard },
    correlationId: req.correlationId,
  });
}
