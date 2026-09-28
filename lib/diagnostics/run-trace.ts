/**
 * RUN TRACE RECORDER – lib/diagnostics/run-trace.ts
 *
 */

import { makeStore, useStoreValue } from '../make-store';
import type { DropCallouts } from '../run-setup/saved-choices';
import { getActiveRun, getMovingMs } from '../run/run-store';

export type TraceSample = {
  atMs: number; // moving time
  stage: string | null;
  targetBpm: number | null;
  cadence: number | null;
  fastCadence: number | null;
  strideMetres: number | null;
  confidence: string;
  verdict: string; 
  paceMsPerKm: number | null;
  distanceM: number;
  songId: string | null;
  paceCheck: string; 
};

export type TraceEvent = {
  atMs: number; 
  happenedAt: number; 
  kind: 'said' | 'detected' | 'tempo-change' | 'song-queued' | 'song-started' | 'run';
  detail: string;
};

export type RunTrace = {
  version: 1;
  dropCallouts: DropCallouts;
  samples: TraceSample[];
  events: TraceEvent[];
};

const maxSamples = 1500;
const maxEvents = 3000;
const timeBetweenSamplesMs = 5000;

const traceStore = makeStore<RunTrace | null>(null);

let lastSampleAtMs = -Infinity;

export function useTrace() {
  return useStoreValue(traceStore);
}

// START a new trace for the run
export function startTrace(isDiagnosticsOn: boolean, dropCallouts: DropCallouts) {
  lastSampleAtMs = -Infinity;
  if (!isDiagnosticsOn) {
    traceStore.setValue(null);
    return;
  }
  traceStore.setValue({ version: 1, dropCallouts, samples: [], events: [] });
}

export function getTrace(): RunTrace | null {
  return traceStore.getValue();
}

export function clearTrace() {
  traceStore.setValue(null);
}

export function recordSample(sample: TraceSample) {
  const trace = traceStore.getValue();
  if (!trace || trace.samples.length >= maxSamples) {
    return;
  }
  if (sample.atMs - lastSampleAtMs < timeBetweenSamplesMs) {
    return;
  }
  lastSampleAtMs = sample.atMs;
  traceStore.setValue({ ...trace, samples: [...trace.samples, sample] });
}

// SAVE an event from the run to the trace
export function recordEvent(kind: TraceEvent['kind'], detail: string) {
  const trace = traceStore.getValue();
  if (!trace || trace.events.length >= maxEvents) {
    return;
  }
  const run = getActiveRun();
  const atMs = run ? Math.round(getMovingMs(run, Date.now())) : 0;
  traceStore.setValue({ ...trace, events: [...trace.events, { atMs, happenedAt: Date.now(), kind, detail }] });
}
