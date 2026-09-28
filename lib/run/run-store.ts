/**
 * RUN STORE – lib/run/run-store.ts
 * Active state of the current run, including GPS points and step samples
 * 
 * REFERENCE FROM
 * https://react.dev/reference/react/useSyncExternalStore
 */

import type * as Location from 'expo-location';

import { makeStore, useStoreValue } from '../make-store';
import type { DropCallouts } from '../run-setup/saved-choices';
import { type Adjustment, getCurrentTempoPlanFromCurrentTime, type TempoSegment } from '../tempo/plan';
import { calculateLeastSquaresSlope, calculatePace, isRealMovement, maxTrustedAccuracyMetres, metresBetween, type RunPoint } from './metrics';

export type RunStatus = 'running' | 'paused' | 'finished';

export type RunSegment = {
  startedAt: number;
  endedAt: number | null; 
  points: RunPoint[];
};

export type StepSample = {
  steps: number; 
  at: number;
};

export type ActiveRun = {
  startedAt: number;
  status: RunStatus;
  goalMinutes: number;
  segments: RunSegment[];
  distanceMetres: number;
  stepSamples: StepSample[]; 
  totalSteps: number | null;
  backgroundTracking: boolean;
  playlistId: string | null;
  plan: TempoSegment[];
  adjustments: Adjustment[]; 
  dropCallouts: DropCallouts;
};

export const runStore = makeStore<ActiveRun | null>(null);

export function getActiveRun() {
  return runStore.getValue();
}

export function useActiveRun() {
  return useStoreValue(runStore);
}

type BeginRunSettings = {
  goalMinutes: number;
  backgroundTracking: boolean;
  playlistId: string | null;
  plan: TempoSegment[];
  dropCallouts: DropCallouts;
};

export function beginRun(settings: BeginRunSettings) {
  const now = Date.now();
  runStore.setValue({
    startedAt: now,
    status: 'running',
    goalMinutes: settings.goalMinutes,
    segments: [{ startedAt: now, endedAt: null, points: [] }],
    distanceMetres: 0,
    stepSamples: [],
    totalSteps: null,
    backgroundTracking: settings.backgroundTracking,
    playlistId: settings.playlistId,
    plan: settings.plan,
    adjustments: [],
    dropCallouts: settings.dropCallouts,
  });
}

function closeLastSegment(segments: RunSegment[], at: number): RunSegment[] {
  const lastSegment = segments[segments.length - 1];
  if (!lastSegment || lastSegment.endedAt !== null) {
    return segments;
  }
  const updated = segments.slice();
  updated[updated.length - 1] = { ...lastSegment, endedAt: at };
  return updated;
}

export function pauseRun() {
  const run = getActiveRun();
  if (!run || run.status !== 'running') {
    return;
  }
  runStore.setValue({ ...run, status: 'paused', segments: closeLastSegment(run.segments, Date.now()) });
}

export function resumeRun() {
  const run = getActiveRun();
  if (!run || run.status !== 'paused') {
    return;
  }
  const now = Date.now();
  runStore.setValue({
    ...run,
    status: 'running',
    segments: [...run.segments, { startedAt: now, endedAt: null, points: [] }],
    stepSamples: [], 
  });
}

// FINISH = stop the clock and show the summary
export function finishRun() {
  const run = getActiveRun();
  if (!run || run.status === 'finished') {
    return;
  }
  runStore.setValue({ ...run, status: 'finished', segments: closeLastSegment(run.segments, Date.now()) });
}

// END = clear the run from the store completely 
export function endRun() {
  runStore.setValue(null);
}

// MAX number of adjustments 
export const maxAdjustments = 250;

// SAVE a tempo change made by the coach
export function addAdjustment(adjustment: Adjustment) {
  const run = getActiveRun();
  if (!run || run.status !== 'running') {
    return;
  }
  if (run.adjustments.length >= maxAdjustments) {
    return;
  }
  runStore.setValue({ ...run, adjustments: [...run.adjustments, adjustment] });
}

export function setBackgroundTracking(isOn: boolean) {
  const run = getActiveRun();
  if (!run || run.backgroundTracking === isOn) {
    return;
  }
  runStore.setValue({ ...run, backgroundTracking: isOn });
}

// ADD new GPS fixes to the route, keeping ONLY the ones that are real movement 
export function addGpsFixes(fixes: Location.LocationObject[]) {
  const run = getActiveRun();
  if (!run || run.status !== 'running') {
    return;
  }

  const segments = run.segments.slice();
  const lastIndex = segments.length - 1;
  const currentSegment = segments[lastIndex];
  if (!currentSegment || currentSegment.endedAt !== null) {
    return;
  }

  const points = currentSegment.points.slice();
  let distanceMetres = run.distanceMetres;

  for (const fix of fixes) {
    const newPoint: RunPoint = {
      latitude: fix.coords.latitude,
      longitude: fix.coords.longitude,
      at: fix.timestamp,
    };
    const previousPoint = points[points.length - 1];

    // CHECKS if this is the first point
    if (!previousPoint) {
      const accuracy = fix.coords.accuracy;
      if (accuracy !== null && accuracy <= maxTrustedAccuracyMetres) {
        points.push(newPoint);
      }
      continue;
    }

    // CHECKS if this a real movement by user 
    if (isRealMovement(previousPoint, newPoint, fix.coords.accuracy)) {
      distanceMetres += metresBetween(previousPoint, newPoint);
      points.push(newPoint);
    }
  }

  if (points.length === currentSegment.points.length) {
    return;
  }

  segments[lastIndex] = { ...currentSegment, points };
  runStore.setValue({ ...run, segments, distanceMetres });
}

const stepWindowMs = 60 * 1000;

// ADD new step sample, keep steps from last minute, UPDATE totalSteps
export function addStepSample(steps: number, at: number) {
  const run = getActiveRun();
  if (!run || run.status !== 'running') {
    return;
  }

  const keptSamples: StepSample[] = [];
  for (const sample of run.stepSamples) {
    if (at - sample.at <= stepWindowMs) {
      keptSamples.push(sample);
    }
  }
  keptSamples.push({ steps, at });

  let totalSteps = steps;
  if (run.totalSteps !== null && run.totalSteps > steps) {
    totalSteps = run.totalSteps;
  }

  runStore.setValue({ ...run, stepSamples: keptSamples, totalSteps });
}

// CALCULATE how many milliseconds the run has been active
export function getMovingMs(run: ActiveRun, now: number): number {
  let total = 0;
  for (const segment of run.segments) {
    const segmentEnd = segment.endedAt === null ? now : segment.endedAt;
    total += segmentEnd - segment.startedAt;
  }
  return total;
}

export function getAveragePace(run: ActiveRun, now: number): number | null {
  return calculatePace(run.distanceMetres, getMovingMs(run, now));
}

// CALCULATE current pace over the last 30 seconds
export function getCurrentPace(run: ActiveRun, now: number): number | null {
  const since = now - 30 * 1000;
  let metres = 0;
  let earliestTime: number | null = null;

  for (const segment of run.segments) {
    for (let index = 1; index < segment.points.length; index++) {
      const previousPoint = segment.points[index - 1];
      const point = segment.points[index];
      if (point.at < since) {
        continue;
      }
      metres += metresBetween(previousPoint, point);
      if (earliestTime === null || previousPoint.at < earliestTime) {
        earliestTime = previousPoint.at;
      }
    }
  }

  if (earliestTime === null) {
    return null;
  }
  return calculatePace(metres, now - earliestTime);
}

// CALCULATE cadence (steps per minute) from step samples over a given window of time
function cadenceFromSamples(samples: StepSample[], windowMs: number, minSpanMs: number): number | null {
  if (samples.length < 3) {
    return null;
  }
  const newest = samples[samples.length - 1];

  // KEEP only the samples inside the window
  const times: number[] = [];
  const stepCounts: number[] = [];
  for (const sample of samples) {
    if (newest.at - sample.at <= windowMs) {
      times.push(sample.at);
      stepCounts.push(sample.steps);
    }
  }
  if (times.length < 3 || newest.at - times[0] < minSpanMs) {
    return null;
  }

  // SLOPE = steps per millisecond, so × 60,000 = steps per minute
  const stepsPerMs = calculateLeastSquaresSlope(times, stepCounts);
  if (stepsPerMs === null || stepsPerMs < 0) {
    return null;
  }
  return Math.round(stepsPerMs * 60000);
}

// STEPS PER MINUTE right now, over the last 35 seconds 
export function getCadence(run: ActiveRun): number | null {
  return cadenceFromSamples(run.stepSamples, 35 * 1000, 12 * 1000);
}

// STEPS PER MINUTE over just the last 12 seconds
export function getFastCadence(run: ActiveRun): number | null {
  return cadenceFromSamples(run.stepSamples, 12 * 1000, 7 * 1000);
}

export function getAverageCadence(run: ActiveRun, now: number): number | null {
  const minutes = getMovingMs(run, now) / 60000;
  if (run.totalSteps === null || minutes <= 0) {
    return null;
  }
  return Math.round(run.totalSteps / minutes);
}

export function getCurrentStage(run: ActiveRun, now: number): TempoSegment | null {
  return getCurrentTempoPlanFromCurrentTime(run.plan, getMovingMs(run, now));
}

// GET the map lines for the run 
export function getRouteLines(run: ActiveRun): RunPoint[][] {
  const lines: RunPoint[][] = [];
  for (const segment of run.segments) {
    if (segment.points.length > 1) {
      lines.push(segment.points);
    }
  }
  return lines;
}

// GET time that the run ended
export function getEndedAt(run: ActiveRun): number {
  const lastSegment = run.segments[run.segments.length - 1];
  if (lastSegment && lastSegment.endedAt !== null) {
    return lastSegment.endedAt;
  }
  return Date.now();
}
