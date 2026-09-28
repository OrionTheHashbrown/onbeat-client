/**
 * RUN METRICS TESTS – lib/run/__tests__/metrics.test.ts
 *
 */

import assert from 'node:assert';
import { describe, it } from 'node:test';

import {
  calculateLeastSquaresSlope,
  formatClock,
  formatDistance,
  formatPace,
  isRealMovement,
  metresBetween,
  type RunPoint,
} from '../metrics';

// MAKE a pretend GPS point
function makePoint(latitude: number, longitude: number, atSeconds: number): RunPoint {
  return { latitude, longitude, at: atSeconds * 1000 };
}

// KNOWN coordinates for East Coast Park, Singapore
const coordinatesForEastCoastPark = { latitude: 1.301, longitude: 103.912 };

describe('metresBetween', () => {
  it('should measure a known distance correctly', () => {
    const start = makePoint(coordinatesForEastCoastPark.latitude, coordinatesForEastCoastPark.longitude, 0);
    const metres = metresBetween(start, makePoint(1.302, coordinatesForEastCoastPark.longitude, 0));

    assert.ok(Math.abs(metres - 111) < 1, 'expected about 111 m, got ' + metres);
  });
});

describe('isRealMovement', () => {
  const start = makePoint(coordinatesForEastCoastPark.latitude, coordinatesForEastCoastPark.longitude, 0);

  it('should ignore small GPS jumps and bad accuracy', () => {
    // 1 metre in 5 seconds = from GPS noise, not a real update
    const wobble = makePoint(1.301009, coordinatesForEastCoastPark.longitude, 5);
    assert.strictEqual(isRealMovement(start, wobble, 5), false);

    // 111 metres in 5 seconds = 22 m/s, normal people cannot run that fast – GPS noise
    const jump = makePoint(1.302, coordinatesForEastCoastPark.longitude, 5);
    assert.strictEqual(isRealMovement(start, jump, 5), false);

    // A normal 15 metres in 5 seconds, but with +/- 50 m accuracy – GPS noise, not a real update
    const blurry = makePoint(1.301135, coordinatesForEastCoastPark.longitude, 5);
    assert.strictEqual(isRealMovement(start, blurry, 50), false);

    // THE same 15 metres with +/- 5 m accuracy - REAL movement
    assert.strictEqual(isRealMovement(start, blurry, 5), true);
  });
});

describe('formatting', () => {
  it('should show time, distance and pace the way the app does', () => {
    assert.strictEqual(formatClock(6 * 60 * 1000 + 51 * 1000), '06:51');
    assert.strictEqual(formatClock(62 * 60 * 1000 + 37 * 1000), '1:02:37');

    assert.strictEqual(formatDistance(900), '900 m');
    assert.strictEqual(formatDistance(2412), '2.41 km');

    assert.strictEqual(formatPace(5 * 60 * 1000 + 32 * 1000), '5:32');
    assert.strictEqual(formatPace(null), '--:--');
  });
});

describe('calculateLeastSquaresSlope', () => {
  it('should find the slope of a straight line, even with one wobbly point', () => {
    // A perfect line going up by 2 each time = slope of 2
    assert.strictEqual(calculateLeastSquaresSlope([0, 1, 2, 3, 4], [0, 2, 4, 6, 8]), 2);

    // ONE wobbly point only nudges it a little (that's why it's better than last minus first)
    const wobblySlope = calculateLeastSquaresSlope([0, 1, 2, 3, 4], [0, 2, 5, 6, 8]);
    assert.ok(wobblySlope !== null && Math.abs(wobblySlope - 2) < 0.2);
  });
});
