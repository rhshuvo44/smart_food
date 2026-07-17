import type { Request, Response } from 'express';
import { getAllOrders, getOrderDetail } from './admin-orders.service.js';

export async function listAllOrders(req: Request, res: Response): Promise<void> {
  const { status, search, page = '1', limit = '20' } = req.query;

  const result = await getAllOrders({
    status: typeof status === 'string' ? status : undefined,
    search: typeof search === 'string' ? search : undefined,
    page: parseInt(page as string, 10) || 1,
    limit: parseInt(limit as string, 10) || 20,
  });

  res.status(200).json({
    success: true,
    data: result,
    correlationId: req.correlationId,
  });
}

export async function getOrder(req: Request, res: Response): Promise<void> {
  const { id } = req.params;

  const order = await getOrderDetail(id);

  res.status(200).json({
    success: true,
    data: { order },
    correlationId: req.correlationId,
  });
}
