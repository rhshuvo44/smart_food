import type { Request, Response } from 'express';
import {
  getRestaurantOrders,
  getOrderById,
  updateOrderStatus,
  getOrderStatusCounts,
} from './order.service.js';

export async function listOrders(req: Request, res: Response): Promise<void> {
  const { restaurantId, status, page: pageStr, limit: limitStr } = req.query;
  const page = pageStr ? parseInt(pageStr as string, 10) : undefined;
  const limit = limitStr ? parseInt(limitStr as string, 10) : undefined;

  if (restaurantId) {
    const result = await getRestaurantOrders(restaurantId as string, {
      status: typeof status === 'string' ? status : undefined,
      page,
      limit,
    });

    res.status(200).json({
      success: true,
      data: { orders: result.orders, pagination: result.pagination },
      correlationId: req.correlationId,
    });
    return;
  }

  res.status(200).json({
    success: true,
    data: { orders: [], pagination: { page: 1, limit: 20, total: 0, totalPages: 0 } },
    correlationId: req.correlationId,
  });
}

export async function getById(req: Request, res: Response): Promise<void> {
  const { id } = req.params;

  const order = await getOrderById(id);

  res.status(200).json({
    success: true,
    data: { order },
    correlationId: req.correlationId,
  });
}

export async function updateStatus(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const { status } = req.body;

  const order = await updateOrderStatus(id, status);

  res.status(200).json({
    success: true,
    data: { order },
    correlationId: req.correlationId,
  });
}

export async function getStatusCounts(req: Request, res: Response): Promise<void> {
  const { restaurantId } = req.params;

  const counts = await getOrderStatusCounts(restaurantId);

  res.status(200).json({
    success: true,
    data: { counts },
    correlationId: req.correlationId,
  });
}
