/**
 * Distance calculation utilities
 * Uses Haversine formula for great-circle distance
 */

export interface Coordinate {
  latitude: number;
  longitude: number;
}

/**
 * Calculate distance between two coordinates in meters
 * Uses Haversine formula
 */
export const calculateDistance = (
  coord1: Coordinate,
  coord2: Coordinate,
): number => {
  const R = 6371000; // Earth's radius in meters
  const dLat = toRadians(coord2.latitude - coord1.latitude);
  const dLon = toRadians(coord2.longitude - coord1.longitude);
  
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(coord1.latitude)) *
      Math.cos(toRadians(coord2.latitude)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  
  return distance;
};

const toRadians = (degrees: number): number => {
  return degrees * (Math.PI / 180);
};

/**
 * Check if a coordinate is within a radius (in meters) of another coordinate
 */
export const isWithinRadius = (
  center: Coordinate,
  point: Coordinate,
  radiusMeters: number,
): boolean => {
  const distance = calculateDistance(center, point);
  return distance <= radiusMeters;
};

/**
 * Format distance for display
 */
export const formatDistance = (meters: number): string => {
  if (meters < 1000) {
    return `${Math.round(meters)}m`;
  }
  return `${(meters / 1000).toFixed(1)}km`;
};

/**
 * Check if two circles (with given radii) overlap
 * Returns true if the distance between centers is less than the sum of radii
 */
export const doCirclesOverlap = (
  center1: Coordinate,
  center2: Coordinate,
  radius1: number,
  radius2: number,
): boolean => {
  const distance = calculateDistance(center1, center2);
  return distance <= (radius1 + radius2);
};

