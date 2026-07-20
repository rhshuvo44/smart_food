import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';

export interface DeliveryTrackingInfo {
  orderId: string;
  status: string;
  driverLocation?: { lat: number; lng: number };
  driverName?: string;
  driverPhone?: string;
  estimatedArrival?: string;
  trackingHistory: Array<{
    status: string;
    location?: { lat: number; lng: number };
    timestamp: string;
    note?: string;
  }>;
}

interface UseDeliveryTrackingReturn {
  tracking: DeliveryTrackingInfo | null;
  isLoading: boolean;
  error: string | null;
}

export function useDeliveryTracking(orderId: string | undefined): UseDeliveryTrackingReturn {
  const [tracking, setTracking] = useState<DeliveryTrackingInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDelivery = useCallback(async () => {
    if (!orderId) return;

    try {
      const response = await api.get(`/delivery/deliveries/order/${orderId}`);
      if (response.data.success) {
        const delivery = response.data.data.delivery;
        setTracking({
          orderId: delivery.orderId?.toString() || orderId,
          status: delivery.status,
          driverLocation: delivery.driverLocation?.coordinates
            ? {
                lat: delivery.driverLocation.coordinates[1],
                lng: delivery.driverLocation.coordinates[0],
              }
            : undefined,
          driverName: delivery.driverName,
          driverPhone: delivery.driverPhone,
          estimatedArrival: delivery.estimatedArrival,
          trackingHistory: (delivery.trackingHistory || []).map((e: any) => ({
            status: e.status,
            location: e.location?.coordinates
              ? { lat: e.location.coordinates[1], lng: e.location.coordinates[0] }
              : undefined,
            timestamp: e.timestamp,
            note: e.note,
          })),
        });
      }
    } catch {
      setError('Failed to load tracking info');
    } finally {
      setIsLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    if (!orderId) return;
    fetchDelivery();
  }, [orderId, fetchDelivery]);

  return { tracking, isLoading, error };
}
