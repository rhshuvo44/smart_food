import type { Request, Response } from 'express';
import {
  getRevenueAnalytics,
  getOrderAnalytics,
  getUserAnalytics,
} from './admin-analytics.service.js';

export async function revenueAnalytics(req: Request, res: Response): Promise<void> {
  const period = (req.query.period as string) || '30d';
  const data = await getRevenueAnalytics(period);

  res.status(200).json({
    success: true,
    data,
    correlationId: req.correlationId,
  });
}

export async function orderAnalytics(req: Request, res: Response): Promise<void> {
  const period = (req.query.period as string) || '30d';
  const data = await getOrderAnalytics(period);

  res.status(200).json({
    success: true,
    data,
    correlationId: req.correlationId,
  });
}

export async function userAnalytics(req: Request, res: Response): Promise<void> {
  const period = (req.query.period as string) || '30d';
  const data = await getUserAnalytics(period);

  res.status(200).json({
    success: true,
    data,
    correlationId: req.correlationId,
  });
}
