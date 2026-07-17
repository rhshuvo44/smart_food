import type { IGeoPoint } from './common.types.js';

export type DeliveryStatus =
  'pending' | 'assigned' | 'picked_up' | 'in_transit' | 'delivered' | 'failed';

export interface IDeliveryZone {
  id: string;
  name: string;
  boundaries: IGeoPoint[];
  baseFee: number;
  feePerKm: number;
  estimatedMinutes: number;
  isActive: boolean;
}

export interface IDeliveryTracking {
  orderId: string;
  driverId?: string;
  driverName?: string;
  driverPhone?: string;
  driverLocation?: IGeoPoint;
  status: DeliveryStatus;
  estimatedArrival?: Date;
  currentLocation?: IGeoPoint;
  lastUpdated: Date;
  trackingHistory: IDeliveryTrackingEvent[];
}

export interface IDeliveryTrackingEvent {
  status: DeliveryStatus;
  location?: IGeoPoint;
  timestamp: Date;
  note?: string;
}
