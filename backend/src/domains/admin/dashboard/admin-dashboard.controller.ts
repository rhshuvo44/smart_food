import type { Request, Response } from 'express';
import { getAdminDashboard } from './admin-dashboard.service.js';

export async function getDashboard(req: Request, res: Response): Promise<void> {
  const dashboard = await getAdminDashboard();

  res.status(200).json({
    success: true,
    data: { dashboard },
    correlationId: req.correlationId,
  });
}
