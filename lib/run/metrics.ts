/**
 * CALCULATES metrics for runs – lib/run/metrics.ts
 *
 * REFERENCE FROM
 * https://www.geeksforgeeks.org/dsa/haversine-formula-to-find-distance-between-two-points-on-a-sphere (adapted haversine formula in KM)
 * https://en.wikipedia.org/wiki/Simple_linear_regression (least squares line of best fit, for steps per minute)
 */

export type RunPoint = {
  latitude: number;
  longitude: number;
  at: number; 
};

const earthRadiusMetres = 6371000;

export const maxTrustedAccuracyMetres = 30;

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

// CALCULATE the distance in metres between 2 GPS points (haversine formula)
export function metresBetween(from: RunPoint, to: RunPoint): number {
  const latitudeChange = toRadians(to.latitude - from.latitude);
  const longitudeChange = toRadians(to.longitude - from.longitude);

  const a =
    Math.sin(latitudeChange / 2) * Math.sin(latitudeChange / 2) +
    Math.cos(toRadians(from.latitude)) * Math.cos(toRadians(to.latitude)) *
    Math.sin(longitudeChange / 2) * Math.sin(longitudeChange / 2);

  return 2 * earthRadiusMetres * Math.asin(Math.sqrt(a));
}

// CHECK GPS points for true movement
export function isRealMovement(previous: RunPoint, next: RunPoint, accuracy: number | null): boolean {
  if (accuracy === null || accuracy > maxTrustedAccuracyMetres) {
    return false;
  }

  const seconds = (next.at - previous.at) / 1000;
  if (seconds <= 0) {
    return false;
  }

  const metres = metresBetween(previous, next);

  // LESS than 2 metres = probably just GPS wobble
  if (metres < 2) {
    return false;
  }

  // FASTER than 8 m/s (about 29 km/h) – MAX threshold for a human running
  if (metres / seconds > 8) {
    return false;
  }

  return true;
}

// CALCULATE pace as milliseconds per km 
export function calculatePace(metres: number, timeMs: number): number | null {
  if (metres < 20 || timeMs <= 0) {
    return null;
  }
  return (timeMs / metres) * 1000;
}

function twoDigits(value: number): string {
  if (value < 10) {
    return '0' + value;
  }
  return String(value);
}

// FORMAT a time like "06:34" or "1:06:34"
export function formatClock(timeMs: number): string {
  let totalSeconds = Math.floor(timeMs / 1000);
  if (totalSeconds < 0) {
    totalSeconds = 0;
  }
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return hours + ':' + twoDigits(minutes) + ':' + twoDigits(seconds);
  }
  return twoDigits(minutes) + ':' + twoDigits(seconds);
}

// FORMAT a distance like "850 m" or "2.41 km"
export function formatDistance(metres: number): string {
  if (metres < 1000) {
    return Math.round(metres) + ' m';
  }
  return (metres / 1000).toFixed(2) + ' km';
}

// FORMAT a pace like "5:32" (minutes per km)
export function formatPace(msPerKm: number | null): string {
  const thirtyMinutes = 30 * 60 * 1000; 
  if (msPerKm === null || msPerKm <= 0 || msPerKm > thirtyMinutes) {
    return '--:--';
  }
  const totalSeconds = Math.round(msPerKm / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return minutes + ':' + twoDigits(seconds);
}
// FORMAT a run date to a certain style
export function formatRunDate(isoDate: string): string {
  const runDate = new Date(isoDate);
  const time = runDate.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });

  const today = new Date();
  const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
  const runMidnight = new Date(runDate.getFullYear(), runDate.getMonth(), runDate.getDate()).getTime();
  const daysAgo = Math.round((todayMidnight - runMidnight) / (24 * 60 * 60 * 1000));

  if (daysAgo === 0) {
    return 'Today, ' + time;
  }
  if (daysAgo === 1) {
    return 'Yesterday, ' + time;
  }
  return runDate.toLocaleDateString(undefined, { day: 'numeric', month: 'short' }) + ', ' + time;
}

// CALCULATE the slope of the least squares line of best fit between x and y values
export function calculateLeastSquaresSlope(xValues: number[], yValues: number[]): number | null {
  const count = xValues.length;
  if (count < 2 || yValues.length !== count) {
    return null;
  }

  // FIND the average x and average y
  let totalX = 0;
  let totalY = 0;
  for (let index = 0; index < count; index++) {
    totalX += xValues[index];
    totalY += yValues[index];
  }
  const averageX = totalX / count;
  const averageY = totalY / count;

  // SLOPE = how x and y move together ÷ how much x spreads out
  let movesTogether = 0;
  let spreadOfX = 0;
  for (let index = 0; index < count; index++) {
    const xDistance = xValues[index] - averageX;
    movesTogether += xDistance * (yValues[index] - averageY);
    spreadOfX += xDistance * xDistance;
  }

  if (spreadOfX === 0) {
    return null;
  }
  return movesTogether / spreadOfX;
}
