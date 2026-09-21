/**
 * Great-circle distance in miles (Haversine).
 * Pure helper for N3 radius matching — no I/O.
 */

const EARTH_RADIUS_MI = 3958.7613;

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

export function distanceMiles(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_MI * Math.asin(Math.min(1, Math.sqrt(a)));
}

export function isWithinRadiusMiles(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
  radiusMiles: number,
): boolean {
  if (!(radiusMiles > 0)) return false;
  return distanceMiles(lat1, lng1, lat2, lng2) <= radiusMiles;
}
