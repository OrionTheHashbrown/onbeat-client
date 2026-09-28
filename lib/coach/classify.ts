/**
 * EFFORT VERDICT – lib/coach/classify.ts
 *
 * GETS a verdict on how the runner is performing based on the current effort snapshot and the target steps per minute
 *   unknown    – not enough steps yet (or we can't trust the numbers)
 *   stopped    – standing still 
 *   walking    – under ~135 steps per minute
 *   on-beat    – within 12 steps per minute of the target
 *   surging    – above the target 
 *   running    – under the target BUT faster than usual 
 *   struggling – under the target AND slower than usual 
 *
 */

import type { EffortSnapshot } from './effort';

export type EffortVerdict = 'unknown' | 'stopped' | 'walking' | 'on-beat' | 'surging' | 'running' | 'struggling';

// SET onBeat threshold range to number of steps per minute
export const onBeatRange = 12;

// SET fast or slow thresholds to pace ratio 
const fasterThanUsualRatio = 0.98;
const slowerThanUsualRatio = 1.06;

// SET cadence gap threshold
const rapidCadenceChangeGap = 10;

export function getEffortVerdict(effort: EffortSnapshot, targetBpm: number): EffortVerdict {
  if (effort.cadence === null || effort.confidence === 'none') {
    return 'unknown';
  }
  if (effort.motion === 'stopped') {
    return 'stopped';
  }
  if (effort.motion === 'walking') {
    return 'walking';
  }

  const gap = effort.cadence - targetBpm;
  if (Math.abs(gap) <= onBeatRange) {
    return 'on-beat';
  }

  // CHECKS if they're surging, on-beat, running or struggling based on the pace ratio
  const isSlowerThanUsual = effort.paceRatio !== null && effort.paceRatio > slowerThanUsualRatio;

  if (gap > 0) {
    if (isSlowerThanUsual) {
      return 'on-beat';
    }
    return 'surging';
  }
  if (effort.paceRatio === null) {
    return 'unknown';
  }
  if (effort.paceRatio <= fasterThanUsualRatio) {
    return 'running'; 
  }
  if (isSlowerThanUsual) {
    return 'struggling';
  }
  return 'on-beat';
}

// CHECK if they're speeding up or slowing down right now 
export function isCadenceChangingRapidly(effort: EffortSnapshot): boolean {
  if (effort.cadence === null || effort.fastCadence === null) {
    return false;
  }
  return Math.abs(effort.fastCadence - effort.cadence) > rapidCadenceChangeGap;
}
