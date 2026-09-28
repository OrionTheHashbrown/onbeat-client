/**
 * RUNS – lib/api/runs.ts
 *
 * REFERENCE FROM
 * serverAPI/src/routes/runs.ts (our own backend)
 */

import type { RoutePoint, RunPayload } from '../run/run-payload';
import type { Adjustment, TempoSegment } from '../tempo/plan';
import { ApiError, apiFetch } from './client';

export type RunSummary = {
  id: string;
  startedAt: string;
  endedAt: string;
  movingMs: number;
  distanceM: number;
  avgPaceMsPerKm: number | null;
  totalSteps: number | null;
  avgCadenceSpm: number | null;
  goalType: 'time' | 'distance' | null;
  goalAmount: number | null;
  playlistId: string | null;
};

export async function saveRun(payload: RunPayload): Promise<{ id: string }> {
  return apiFetch<{ id: string }>('/v1/runs', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

// NEWEST runs first
export async function listRuns(limit: number): Promise<RunSummary[]> {
  const response = await apiFetch<{ runs: RunSummary[] }>('/v1/runs?limit=' + limit);
  return response.runs;
}

// ONE run with everything (route, plan and coach changes)
export type RunDetail = RunSummary & {
  plan: TempoSegment[];
  adjustments: Adjustment[];
  route: RoutePoint[][];
  adaptiveMode: boolean | null;
};

// GET one run, RETURNS null if it doesn't exist
export async function getRun(id: string): Promise<RunDetail | null> {
  try {
    return await apiFetch<RunDetail>('/v1/runs/' + encodeURIComponent(id));
  } catch (error) {
    // CHECK the error code too, a plain 404 could also mean the backend is out of date
    if (error instanceof ApiError && error.status === 404 && error.code === 'run_not_found') {
      return null;
    }
    throw error;
  }
}

// DELETE one run
export async function deleteRun(id: string): Promise<void> {
  try {
    await apiFetch<{ deleted: boolean }>('/v1/runs/' + encodeURIComponent(id), { method: 'DELETE' });
  } catch (error) {
    if (error instanceof ApiError && error.status === 404 && error.code === 'run_not_found') {
      return;
    }
    throw error;
  }
}
