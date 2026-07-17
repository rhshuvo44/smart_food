import type { Request, Response } from 'express';
import * as deliveryService from './delivery.service.js';
import { haversineDistance, estimateETA } from '../../shared/geo.js';
import type { DeliveryStatus } from '@smartfood/shared';

// ─── DELIVERY ZONE HANDLERS ────────────────────────────────────────────────

export async function createZone(req: Request, res: Response): Promise<void> {
  const { name, boundary, boundaries, baseFee, feePerKm, estimatedMinutes } = req.body;

  // Support both new Polygon format and legacy point-array format
  let zoneBoundary = boundary;
  if (!zoneBoundary && boundaries) {
    zoneBoundary = deliveryService.polygonFromPoints(boundaries);
  }

  const zone = await deliveryService.createDeliveryZone({
    name,
    boundary: zoneBoundary,
    baseFee,
    feePerKm,
    estimatedMinutes,
  });

  res.status(201).json({
    success: true,
    data: { zone },
    correlationId: (req as any).correlationId,
  });
}

export async function listZones(_req: Request, res: Response): Promise<void> {
  const zones = await deliveryService.getActiveZones();

  res.status(200).json({
    success: true,
    data: { zones },
    correlationId: (_req as any).correlationId,
  });
}

export async function getZoneById(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const zone = await deliveryService.getZoneById(id);

  res.status(200).json({
    success: true,
    data: { zone },
    correlationId: (req as any).correlationId,
  });
}

export async function updateZone(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const updateData = req.body;

  const zone = await deliveryService.updateDeliveryZone(id, updateData);

  res.status(200).json({
    success: true,
    data: { zone },
    correlationId: (req as any).correlationId,
  });
}

export async function deleteZone(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const zone = await deliveryService.deactivateDeliveryZone(id);

  res.status(200).json({
    success: true,
    data: { zone },
    correlationId: (req as any).correlationId,
  });
}

export async function checkZoneContainment(req: Request, res: Response): Promise<void> {
  const { lat, lng } = req.body;

  const zones = await deliveryService.checkZoneContainment(lat, lng);

  res.status(200).json({
    success: true,
    data: {
      isInZone: zones.length > 0,
      zones,
    },
    correlationId: (req as any).correlationId,
  });
}

// ─── DELIVERY HANDLERS ─────────────────────────────────────────────────────

export async function createDeliveryHandler(req: Request, res: Response): Promise<void> {
  const { orderId, driverId, driverName, driverPhone } = req.body;

  const delivery = await deliveryService.createDelivery({
    orderId,
    driverId,
    driverName,
    driverPhone,
  });

  res.status(201).json({
    success: true,
    data: { delivery },
    correlationId: (req as any).correlationId,
  });
}

export async function getDeliveryById(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const delivery = await deliveryService.getDeliveryById(id);

  res.status(200).json({
    success: true,
    data: { delivery },
    correlationId: (req as any).correlationId,
  });
}

export async function getDeliveryByOrder(req: Request, res: Response): Promise<void> {
  const { orderId } = req.params;
  const delivery = await deliveryService.getDeliveryByOrder(orderId);

  res.status(200).json({
    success: true,
    data: { delivery },
    correlationId: (req as any).correlationId,
  });
}

export async function updateDeliveryStatus(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const { status, note } = req.body as { status: DeliveryStatus; note?: string };

  const delivery = await deliveryService.updateDeliveryStatus(id, status, note);

  res.status(200).json({
    success: true,
    data: { delivery },
    correlationId: (req as any).correlationId,
  });
}

export async function updateDeliveryLocation(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const { lat, lng } = req.body as { lat: number; lng: number };

  const delivery = await deliveryService.updateDriverLocation(id, lat, lng);

  res.status(200).json({
    success: true,
    data: { delivery },
    correlationId: (req as any).correlationId,
  });
}

// ─── DISTANCE / CALCULATION HANDLERS ───────────────────────────────────────

export async function calculateDistanceHandler(req: Request, res: Response): Promise<void> {
  const { origin, destination } = req.body as {
    origin: { lat: number; lng: number };
    destination: { lat: number; lng: number };
  };

  const distanceMeters = haversineDistance(
    origin.lat,
    origin.lng,
    destination.lat,
    destination.lng,
  );

  const eta = estimateETA(distanceMeters);

  const fee = await deliveryService.calculateDeliveryFee(
    origin.lat,
    origin.lng,
    destination.lat,
    destination.lng,
  );

  res.status(200).json({
    success: true,
    data: {
      distanceMeters: Math.round(distanceMeters),
      distanceKm: Math.round((distanceMeters / 1000) * 100) / 100,
      durationSeconds: eta.durationSeconds,
      durationMinutes: eta.durationMinutes,
      estimatedArrival: eta.estimatedArrival,
      deliveryFee: fee.totalFee,
      feeBreakdown: {
        baseFee: fee.baseFee,
        feePerKm: fee.feePerKm,
        zoneName: fee.zoneName,
      },
    },
    correlationId: (req as any).correlationId,
  });
}
