/**
 * SONG ANALYSIS CACHE – lib/api/analysis-cache.ts
 *
 * REFERENCE FROM
 * https://react-native-async-storage.github.io/async-storage/docs/api
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import type { SongCue } from './tracks';

export type SavedAnalysis = {
  bpm: number;
  energy: number | null;
  cues: SongCue[];
  savedAt: number;
};

const keyPrefix = 'onbeat.analysis.';
const keepForMs = 7 * 24 * 60 * 60 * 1000;

// READ the analysis for these songs (if any)
export async function readSavedAnalysis(songIds: string[]): Promise<Map<string, SavedAnalysis>> {
  const found = new Map<string, SavedAnalysis>();
  if (songIds.length === 0) {
    return found;
  }

  try {
    const keys = songIds.map((id) => keyPrefix + id);
    const pairs = await AsyncStorage.multiGet(keys);

    for (const [key, savedText] of pairs) {
      if (!savedText) {
        continue;
      }
      const saved = JSON.parse(savedText) as SavedAnalysis;

      // SKIP anything older than 7 days
      if (Date.now() - saved.savedAt > keepForMs) {
        continue;
      }
      found.set(key.slice(keyPrefix.length), saved);
    }
  } catch (error) {
    console.warn('[analysis-cache] could not read:', error);
  }

  return found;
}

// SAVE the analysis for these songs in cache
export function saveAnalysis(analysisById: Map<string, SavedAnalysis>) {
  const pairs: [string, string][] = [];
  for (const [id, analysis] of analysisById) {
    pairs.push([keyPrefix + id, JSON.stringify(analysis)]);
  }
  if (pairs.length === 0) {
    return;
  }
  AsyncStorage.multiSet(pairs).catch((error) => {
    console.warn('[analysis-cache] could not save:', error);
  });
}
