/**
 * GPS STRENGTH – lib/location/gps-strength.ts
 *
 */

export type GpsStrength = 'strong' | 'okay' | 'weak';

export function getGpsStrength(accuracyInMetres: number | null): GpsStrength {
  if (accuracyInMetres === null) {
    return 'weak';
  }
  if (accuracyInMetres < 10) {
    return 'strong';
  }
  if (accuracyInMetres < 30) {
    return 'okay';
  }
  return 'weak';
}

// HOW MANY of the 3 bars to light up
export function getGpsBarCount(strength: GpsStrength): number {
  if (strength === 'strong') {
    return 3;
  }
  if (strength === 'okay') {
    return 2;
  }
  return 1;
}
