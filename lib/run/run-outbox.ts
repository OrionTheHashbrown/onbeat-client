/**
 * RUN OUTBOX (local storage runs) – lib/run/run-outbox.ts
 *
 * REFERENCE FROM
 * https://react-native-async-storage.github.io/async-storage/docs/api
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { ApiError } from '../api/client';
import { saveRun } from '../api/runs';
import { getErrorMessage } from '../errors';
import type { RunPayload } from './run-payload';

const keyPrefix = 'onbeat.runs.waiting.';
const rejectedKeyPrefix = 'onbeat.runs.rejected.';

export async function addToLocalStorage(payload: RunPayload) {
  await AsyncStorage.setItem(keyPrefix + payload.startedAt, JSON.stringify(payload));
}

export async function getWaitingRuns(): Promise<RunPayload[]> {
  try {
    const allKeys = await AsyncStorage.getAllKeys();
    const outboxKeys: string[] = [];
    for (const key of allKeys) {
      if (key.startsWith(keyPrefix)) {
        outboxKeys.push(key);
      }
    }
    if (outboxKeys.length === 0) {
      return [];
    }

    const pairs = await AsyncStorage.multiGet(outboxKeys);
    const runs: RunPayload[] = [];
    for (const [, savedText] of pairs) {
      if (savedText) {
        runs.push(JSON.parse(savedText) as RunPayload);
      }
    }
    runs.sort((a, b) => a.startedAt.localeCompare(b.startedAt));
    return runs;
  } catch (error) {
    console.warn('[outbox] could not read:', getErrorMessage(error));
    return [];
  }
}

export async function sendWaitingRuns(): Promise<number> {
  const waitingRuns = await getWaitingRuns();
  let sentCount = 0;

  for (const payload of waitingRuns) {
    try {
      await saveRun(payload);
      await AsyncStorage.removeItem(keyPrefix + payload.startedAt);
      sentCount++;
    } catch (error) {
      if (error instanceof ApiError && error.status === 400) {
        console.warn('[outbox] the server rejected a run, diagnostics data might be too large:', getErrorMessage(error));
        await AsyncStorage.setItem(rejectedKeyPrefix + payload.startedAt, JSON.stringify(payload));
        await AsyncStorage.removeItem(keyPrefix + payload.startedAt);
        continue;
      }
      console.warn('[outbox] could not send a run, will try again later:', getErrorMessage(error));
      break;
    }
  }
  return sentCount;
}

// REMOVE a waiting run from local storage 
export async function removeWaitingRun(startedAt: string) {
  await AsyncStorage.removeItem(keyPrefix + startedAt);
}
