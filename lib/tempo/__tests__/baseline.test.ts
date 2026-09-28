/**
 * USUAL CADENCE TESTS – lib/tempo/__tests__/baseline.test.ts
 *
 */

import assert from 'node:assert';
import { describe, it } from 'node:test';
import { calculateBaselineSpm } from '../baseline';

const tenMinutes = 10 * 60 * 1000;

// FAKE a run with an average cadence and a moving time (default 10 minutes)
function makeRun(avgCadenceSpm: number, movingMs: number = tenMinutes) {
  return { avgCadenceSpm, movingMs };
}

describe('calculateBaselineSpm', () => {
  it('should use the default 155 when there are fewer than 3 usable runs', () => {
    const runs = [makeRun(170), makeRun(172)];

    assert.strictEqual(calculateBaselineSpm(runs), 155);
  });

  it('should ignore runs shorter than 8 minutes', () => {
    const twoMinutes = 2 * 60 * 1000;
    const runs = [makeRun(160), makeRun(160), makeRun(160), makeRun(200, twoMinutes), makeRun(200, twoMinutes)];

    assert.strictEqual(calculateBaselineSpm(runs), 160);
  });

  it('should ignore the fastest and slowest run once there are 5 or more', () => {
    const runs = [makeRun(140), makeRun(160), makeRun(162), makeRun(164), makeRun(185)];

    assert.strictEqual(calculateBaselineSpm(runs), 162);
  });
});
