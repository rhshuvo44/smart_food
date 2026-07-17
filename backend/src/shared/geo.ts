const EARTH_RADIUS_METERS = 6371000;

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

export function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return EARTH_RADIUS_METERS * c;
}

export function estimateETA(
  distanceMeters: number,
  averageSpeedKmh: number = 30,
  prepTimeMinutes: number = 15,
): { durationSeconds: number; durationMinutes: number; estimatedArrival: Date } {
  const drivingSeconds = (distanceMeters / 1000 / averageSpeedKmh) * 3600;
  const totalSeconds = drivingSeconds + prepTimeMinutes * 60;
  const totalMinutes = Math.ceil(totalSeconds / 60);

  return {
    durationSeconds: Math.ceil(totalSeconds),
    durationMinutes: totalMinutes,
    estimatedArrival: new Date(Date.now() + totalSeconds * 1000),
  };
}
