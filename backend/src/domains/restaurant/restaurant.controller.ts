import type { Request, Response } from 'express';
import {
  getRestaurantByOwner,
  getRestaurantById,
  updateRestaurant,
  getRestaurantStats,
  updateBusinessHours,
} from './restaurant.service.js';
import { AuthError } from '../../shared/errors.js';

export async function getMyRestaurant(req: Request, res: Response): Promise<void> {
  const userId = req.userId;
  if (!userId) throw new AuthError('Not authenticated');
  const restaurant = await getRestaurantByOwner(userId);

  res.status(200).json({
    success: true,
    data: { restaurant },
    correlationId: req.correlationId,
  });
}

export async function getById(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const restaurant = await getRestaurantById(id);

  res.status(200).json({
    success: true,
    data: { restaurant },
    correlationId: req.correlationId,
  });
}

export async function update(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const data = req.body;

  const restaurant = await updateRestaurant(id, data);

  res.status(200).json({
    success: true,
    data: { restaurant },
    correlationId: req.correlationId,
  });
}

export async function getStats(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const stats = await getRestaurantStats(id);

  res.status(200).json({
    success: true,
    data: { stats },
    correlationId: req.correlationId,
  });
}

export async function updateHours(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const { hours } = req.body;

  const restaurant = await updateBusinessHours(id, hours);

  res.status(200).json({
    success: true,
    data: { restaurant },
    correlationId: req.correlationId,
  });
}
