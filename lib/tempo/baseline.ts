/**
 * USUAL CADENCE – lib/tempo/baseline.ts
 *
 */

import { defaultBaselineSpm } from './plan';

type PastRun = {
  movingMs: number;
  avgCadenceSpm: number | null;
};

const minRunLengthMs = 8 * 60 * 1000; 
const runsToLookAt = 10;
const lowestBelievableSpm = 100;
const highestBelievableSpm = 220;
const lowestBaseline = 140;
const highestBaseline = 185;

export function calculateBaselineSpm(runs: PastRun[]): number {

  const cadences: number[] = [];
  for (const run of runs) {
    if (cadences.length >= runsToLookAt) {
      break;
    }
    if (run.avgCadenceSpm === null || run.movingMs < minRunLengthMs) {
      continue;
    }
    if (run.avgCadenceSpm < lowestBelievableSpm || run.avgCadenceSpm > highestBelievableSpm) {
      continue;
    }
    cadences.push(run.avgCadenceSpm);
  }

  // USE default cadence if user is still new and not enough runs clocked in
  if (cadences.length < 3) {
    return defaultBaselineSpm;
  }

  // SORT smallest to biggest, and DROP the slowest and fastest run 
  cadences.sort((a, b) => a - b);
  let keptCadences = cadences;
  if (cadences.length >= 5) {
    keptCadences = cadences.slice(1, cadences.length - 1);
  }

  // CALCULATE the average of what's left
  let total = 0;
  for (const cadence of keptCadences) {
    total += cadence;
  }
  let average = total / keptCadences.length;

  // CHECKS keeping it within a sensible range
  if (average < lowestBaseline) {
    average = lowestBaseline;
  }
  if (average > highestBaseline) {
    average = highestBaseline;
  }

  return Math.round(average);
}
