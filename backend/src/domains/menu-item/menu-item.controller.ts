import type { Request, Response } from 'express';
import {
  getMenuItems,
  getMenuItemById,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
  toggleAvailability,
  getCategories,
} from './menu-item.service.js';

export async function listMenuItems(req: Request, res: Response): Promise<void> {
  const { restaurantId } = req.params;
  const { category, page: pageStr, limit: limitStr } = req.query;

  const result = await getMenuItems(restaurantId, {
    category: typeof category === 'string' ? category : undefined,
    page: pageStr ? parseInt(pageStr as string, 10) : undefined,
    limit: limitStr ? parseInt(limitStr as string, 10) : undefined,
  });

  res.status(200).json({
    success: true,
    data: { items: result.items, pagination: result.pagination },
    correlationId: req.correlationId,
  });
}

export async function listCategories(req: Request, res: Response): Promise<void> {
  const { restaurantId } = req.params;

  const categories = await getCategories(restaurantId);

  res.status(200).json({
    success: true,
    data: { categories },
    correlationId: req.correlationId,
  });
}

export async function create(req: Request, res: Response): Promise<void> {
  const { restaurantId } = req.params;
  const data = req.body;

  const item = await createMenuItem(restaurantId, data);

  res.status(201).json({
    success: true,
    data: { item },
    correlationId: req.correlationId,
  });
}

export async function getById(req: Request, res: Response): Promise<void> {
  const { id } = req.params;

  const item = await getMenuItemById(id);

  res.status(200).json({
    success: true,
    data: { item },
    correlationId: req.correlationId,
  });
}

export async function update(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const data = req.body;

  const item = await updateMenuItem(id, data);

  res.status(200).json({
    success: true,
    data: { item },
    correlationId: req.correlationId,
  });
}

export async function remove(req: Request, res: Response): Promise<void> {
  const { id } = req.params;

  await deleteMenuItem(id);

  res.status(200).json({
    success: true,
    data: { message: 'Menu item deleted successfully' },
    correlationId: req.correlationId,
  });
}

export async function toggleAvail(req: Request, res: Response): Promise<void> {
  const { id } = req.params;

  const item = await toggleAvailability(id);

  res.status(200).json({
    success: true,
    data: { item },
    correlationId: req.correlationId,
  });
}
