/**
 * SAVING A RUN to the backend DB – lib/run/run-payload.ts
 */

import { getTrace, RunTrace } from '../diagnostics/run-trace';
import type { Adjustment, TempoSegment } from '../tempo/plan';
import { ActiveRun, getAverageCadence, getAveragePace, getEndedAt, getMovingMs } from './run-store';

//                       [latitude, longitude, time]
export type RoutePoint = [number, number, number];

export type RunPayload = {
  startedAt: string;
  endedAt: string;
  movingMs: number;
  distanceM: number;
  avgPaceMsPerKm: number | null;
  totalSteps: number | null;
  avgCadenceSpm: number | null;
  goalType: 'time' | null;
  goalAmount: number | null;
  playlistId: string | null;
  plan: TempoSegment[];
  adjustments: Adjustment[];
  route: RoutePoint[][];
  adaptiveMode: boolean;
  trace: RunTrace | null; 
};

function roundCoordinate(value: number): number {
  return Number(value.toFixed(6));
}

export function buildRunPayload(run: ActiveRun): RunPayload {
  const endedAt = getEndedAt(run);
  const route: RoutePoint[][] = [];
  for (const segment of run.segments) {
    if (segment.points.length < 2) {
      continue;
    }
    const line: RoutePoint[] = [];
    for (const point of segment.points) {
      line.push([roundCoordinate(point.latitude), roundCoordinate(point.longitude), point.at]);
    }
    route.push(line);
  }

  const averagePace = getAveragePace(run, endedAt);

  return {
    startedAt: new Date(run.startedAt).toISOString(),
    endedAt: new Date(endedAt).toISOString(),
    movingMs: Math.round(getMovingMs(run, endedAt)),
    distanceM: Math.round(run.distanceMetres),
    avgPaceMsPerKm: averagePace === null ? null : Math.round(averagePace),
    totalSteps: run.totalSteps,
    avgCadenceSpm: getAverageCadence(run, endedAt),
    goalType: 'time',
    goalAmount: run.goalMinutes,
    playlistId: run.playlistId,
    plan: run.plan,
    adjustments: run.adjustments,
    route,
    adaptiveMode: true, 
    trace: getTrace(),
  };
}
