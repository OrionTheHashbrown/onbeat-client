/**
 * EFFORT SNAPSHOT – lib/coach/effort.ts
 *
 *   cadence       – steps per minute over the last 35 s 
 *   fastCadence   – steps per minute over the last 12 s 
 *   paceRatio     – pace now ÷ average pace ~ MORE than 1 = slower than usual, LESS than 1 = faster
 *   strideMetres  – how far each step goes 
 *   motion        – stopped / walking / running 
 *   confidence    – confidence level in the stats numbers (high / low / none)
 *
 */

import { type ActiveRun, getAveragePace, getCadence, getCurrentPace, getFastCadence } from '../run/run-store';

export type Motion = 'stopped' | 'walking' | 'running' | 'unknown';
export type Confidence = 'high' | 'low' | 'none';

export type EffortSnapshot = {
  cadence: number | null;
  fastCadence: number | null;
  paceMsPerKm: number | null;
  averagePace: number | null;
  paceRatio: number | null;
  strideMetres: number | null;
  motion: Motion;
  confidence: Confidence;
};

// SET thresholds for steps per minute to determine motion
const stoppedStepsPerMinute = 40;
const walkingStepsPerMinute = 135;

// SET thresholds for stride length to determine confidence in the numbers
const shortestStrideMetres = 0.6;
const longestStrideMetres = 2.0;

// CALCULATE runner's motion based on cadence
function calculateMotion(cadence: number | null, fastCadence: number | null): Motion {
  let stepsPerMinute = fastCadence;
  if (stepsPerMinute === null) {
    stepsPerMinute = cadence;
  }
  if (stepsPerMinute === null) {
    return 'unknown';
  }
  if (stepsPerMinute < stoppedStepsPerMinute) {
    return 'stopped';
  }
  if (stepsPerMinute < walkingStepsPerMinute) {
    return 'walking';
  }
  return 'running';
}

// CALCULATE the length of each step
function calculateStrideMetres(cadence: number | null, paceMsPerKm: number | null): number | null {
  if (cadence === null || cadence <= 0 || paceMsPerKm === null || paceMsPerKm <= 0) {
    return null;
  }
  const metresPerSecond = 1000 / (paceMsPerKm / 1000);
  const stepsPerSecond = cadence / 60;
  return metresPerSecond / stepsPerSecond;
}

// CALCULATE confidence level based on cadence and stride length
function calculateConfidence(cadence: number | null, strideMetres: number | null): Confidence {
  if (cadence === null) {
    return 'none';
  }
  if (strideMetres === null || strideMetres < shortestStrideMetres || strideMetres > longestStrideMetres) {
    return 'low';
  }
  return 'high';
}

// BUILD an EffortSnapshot based on the current run and time
export function buildEffortSnapshot(run: ActiveRun, now: number): EffortSnapshot {
  const cadence = getCadence(run);
  const fastCadence = getFastCadence(run);
  const paceMsPerKm = getCurrentPace(run, now);
  const averagePace = getAveragePace(run, now);

  let paceRatio: number | null = null;
  if (paceMsPerKm !== null && averagePace !== null && averagePace > 0) {
    paceRatio = paceMsPerKm / averagePace;
  }

  const strideMetres = calculateStrideMetres(cadence, paceMsPerKm);

  return {
    cadence,
    fastCadence,
    paceMsPerKm,
    averagePace,
    paceRatio,
    strideMetres,
    motion: calculateMotion(cadence, fastCadence),
    confidence: calculateConfidence(cadence, strideMetres),
  };
}
