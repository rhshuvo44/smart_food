import type { Request, Response } from 'express';
import {
  getUsersReport,
  getOrdersReport,
  getRevenueReport,
  getRestaurantsReport,
} from './admin-reports.service.js';

export async function usersReport(req: Request, res: Response): Promise<void> {
  const data = await getUsersReport();

  res.status(200).json({
    success: true,
    data,
    correlationId: req.correlationId,
  });
}

export async function ordersReport(req: Request, res: Response): Promise<void> {
  const data = await getOrdersReport();

  res.status(200).json({
    success: true,
    data,
    correlationId: req.correlationId,
  });
}

export async function revenueReport(req: Request, res: Response): Promise<void> {
  const data = await getRevenueReport();

  res.status(200).json({
    success: true,
    data,
    correlationId: req.correlationId,
  });
}

export async function restaurantsReport(req: Request, res: Response): Promise<void> {
  const data = await getRestaurantsReport();

  res.status(200).json({
    success: true,
    data,
    correlationId: req.correlationId,
  });
}
