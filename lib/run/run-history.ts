/**
 * RUN HISTORY – lib/run/run-history.ts
 *
 */

import { deleteRun, getRun, listRuns } from '../api/runs';
import { getErrorMessage } from '../errors';
import type { Adjustment, TempoSegment } from '../tempo/plan';
import { getWaitingRuns, removeWaitingRun, sendWaitingRuns } from './run-outbox';
import type { RoutePoint, RunPayload } from './run-payload';

export type HistoryRun = {
  key: string;
  isWaiting: boolean; 
  startedAt: string;
  movingMs: number;
  distanceM: number;
  avgPaceMsPerKm: number | null;
  totalSteps: number | null;
  avgCadenceSpm: number | null;
  goalAmount: number | null;
  plan: TempoSegment[];
  adjustments: Adjustment[];
  route: RoutePoint[][];
};

const waitingKeyStart = 'waiting-';
const runsToShow = 20;

function makeWaitingKey(startedAt: string): string {
  return waitingKeyStart + Date.parse(startedAt);
}

function fromWaitingRun(payload: RunPayload): HistoryRun {
  return {
    key: makeWaitingKey(payload.startedAt),
    isWaiting: true,
    startedAt: payload.startedAt,
    movingMs: payload.movingMs,
    distanceM: payload.distanceM,
    avgPaceMsPerKm: payload.avgPaceMsPerKm,
    totalSteps: payload.totalSteps,
    avgCadenceSpm: payload.avgCadenceSpm,
    goalAmount: payload.goalAmount,
    plan: payload.plan,
    adjustments: payload.adjustments,
    route: payload.route,
  };
}

export type HistoryList = {
  runs: HistoryRun[];
  couldNotReachServer: boolean;
};

// LOAD runs from backend and local storage, RETURNS the runs in newest first order
export async function loadHistoryList(): Promise<HistoryList> {
  await sendWaitingRuns();

  const runs: HistoryRun[] = [];
  const waitingRuns = await getWaitingRuns();
  for (const payload of waitingRuns.reverse()) {
    runs.push(fromWaitingRun(payload)); 
  }

  try {
    const savedRuns = await listRuns(runsToShow);
    for (const saved of savedRuns) {
      runs.push({
        key: saved.id,
        isWaiting: false,
        startedAt: saved.startedAt,
        movingMs: saved.movingMs,
        distanceM: saved.distanceM,
        avgPaceMsPerKm: saved.avgPaceMsPerKm,
        totalSteps: saved.totalSteps,
        avgCadenceSpm: saved.avgCadenceSpm,
        goalAmount: saved.goalAmount,
        plan: [],
        adjustments: [],
        route: [],
      });
    }
    return { runs, couldNotReachServer: false };
  } catch (error) {
    console.warn('[history] could not load saved runs:', getErrorMessage(error));
    return { runs, couldNotReachServer: true };
  }
}

// LOAD data for one run
export async function loadOneRun(key: string): Promise<HistoryRun | null> {

  // A WAITING run, find it on the phone
  if (key.startsWith(waitingKeyStart)) {
    const waitingRuns = await getWaitingRuns();
    for (const payload of waitingRuns) {
      if (makeWaitingKey(payload.startedAt) === key) {
        return fromWaitingRun(payload);
      }
    }
    return null;
  }

  const detail = await getRun(key);
  if (!detail) {
    return null;
  }
  return {
    key: detail.id,
    isWaiting: false,
    startedAt: detail.startedAt,
    movingMs: detail.movingMs,
    distanceM: detail.distanceM,
    avgPaceMsPerKm: detail.avgPaceMsPerKm,
    totalSteps: detail.totalSteps,
    avgCadenceSpm: detail.avgCadenceSpm,
    goalAmount: detail.goalAmount,
    plan: detail.plan,
    adjustments: detail.adjustments,
    route: detail.route,
  };
}

// DELETE a pre-saved run 
export async function deleteHistoryRun(run: HistoryRun) {
  if (run.isWaiting) {
    await removeWaitingRun(run.startedAt);
    return;
  }
  await deleteRun(run.key);
}
