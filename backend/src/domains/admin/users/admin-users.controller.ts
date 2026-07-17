import type { Request, Response } from 'express';
import { listUsers, getUserById, updateUser, getUserOrders } from './admin-users.service.js';

export async function listAllUsers(req: Request, res: Response): Promise<void> {
  const { role, status, search, page = '1', limit = '20' } = req.query;

  const result = await listUsers({
    role: typeof role === 'string' ? role : undefined,
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

export async function getUser(req: Request, res: Response): Promise<void> {
  const { id } = req.params;

  const user = await getUserById(id);

  res.status(200).json({
    success: true,
    data: { user },
    correlationId: req.correlationId,
  });
}

export async function updateUserProfile(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const updates = req.body;

  const user = await updateUser(id, updates);

  res.status(200).json({
    success: true,
    data: { user },
    correlationId: req.correlationId,
  });
}

export async function listUserOrders(req: Request, res: Response): Promise<void> {
  const { id } = req.params;

  const orders = await getUserOrders(id);

  res.status(200).json({
    success: true,
    data: { orders },
    correlationId: req.correlationId,
  });
}
