import type { Request, Response } from 'express';
import {
  listAllRestaurants,
  getRestaurantDetail,
  updateRestaurantStatus,
  approveRestaurant,
} from './admin-restaurants.service.js';

export async function listRestaurants(req: Request, res: Response): Promise<void> {
  const { status, search, isApproved, page = '1', limit = '20' } = req.query;

  const result = await listAllRestaurants({
    status: typeof status === 'string' ? status : undefined,
    search: typeof search === 'string' ? search : undefined,
    isApproved: typeof isApproved === 'string' ? isApproved : undefined,
    page: parseInt(page as string, 10) || 1,
    limit: parseInt(limit as string, 10) || 20,
  });

  res.status(200).json({
    success: true,
    data: result,
    correlationId: req.correlationId,
  });
}

export async function getRestaurant(req: Request, res: Response): Promise<void> {
  const { id } = req.params;

  const restaurant = await getRestaurantDetail(id);

  res.status(200).json({
    success: true,
    data: { restaurant },
    correlationId: req.correlationId,
  });
}

export async function toggleRestaurantStatus(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const { isActive } = req.body;

  const restaurant = await updateRestaurantStatus(id, isActive);

  res.status(200).json({
    success: true,
    data: { restaurant },
    correlationId: req.correlationId,
  });
}

export async function approve(req: Request, res: Response): Promise<void> {
  const { id } = req.params;

  const restaurant = await approveRestaurant(id);

  res.status(200).json({
    success: true,
    data: { restaurant },
    correlationId: req.correlationId,
  });
}
