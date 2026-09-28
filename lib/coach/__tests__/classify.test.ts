/**
 * EFFORT VERDICT TESTS – lib/coach/__tests__/classify.test.ts
 *
 */

import assert from 'node:assert';
import { describe, it } from 'node:test';

import { getEffortVerdict } from '../classify';
import type { EffortSnapshot } from '../effort';

// CREATE a fake effort snapshot with default values, and allow overrides
function makeEffort(changes: Partial<EffortSnapshot>): EffortSnapshot {
  return {
    cadence: 160,
    fastCadence: 160,
    paceMsPerKm: 6 * 60 * 1000,
    averagePace: 6 * 60 * 1000,
    paceRatio: 1,
    strideMetres: 1.04,
    motion: 'running',
    confidence: 'high',
    ...changes,
  };
}

describe('getEffortVerdict', () => {
  const targetBpm = 160;

  it('should say on-beat within 12 steps per minute of the target', () => {
    assert.strictEqual(getEffortVerdict(makeEffort({ cadence: 150 }), targetBpm), 'on-beat');
    assert.strictEqual(getEffortVerdict(makeEffort({ cadence: 171 }), targetBpm), 'on-beat');
  });

  it('should say running (long strides) when steps are low but they are faster than usual', () => {
    const effort = makeEffort({ cadence: 140, fastCadence: 140, paceRatio: 0.95 });

    assert.strictEqual(getEffortVerdict(effort, targetBpm), 'running');
  });

  it('should say struggling when steps are low AND they are slower than usual', () => {
    const effort = makeEffort({ cadence: 140, fastCadence: 140, paceRatio: 1.1 });

    assert.strictEqual(getEffortVerdict(effort, targetBpm), 'struggling');
  });

  it('should say walking when they are under about 135 steps per minute', () => {
    const effort = makeEffort({ cadence: 110, fastCadence: 110, motion: 'walking' });

    assert.strictEqual(getEffortVerdict(effort, targetBpm), 'walking');
  });
});
