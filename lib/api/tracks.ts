/**
 * SONG ANALYSIS – lib/api/tracks.ts
 *
 * REFERENCE FROM
 * serverAPI/src/routes/tracks.ts (our own backend)
 */

import type { Song } from '../spotify/playlists';
import { readSavedAnalysis, SavedAnalysis, saveAnalysis } from './analysis-cache';
import { apiFetch } from './client';

export type SongCue = {
  atMs: number; 
  kind: 'drop' | 'build' | 'chorus' | 'breakdown' | 'outro';
  leadMs: number;
  pushBpm: number | null;
  holdMs: number | null;
  label: string | null; 
};

type AnalysisResult = {
  bpm: number | null;
  energy: number | null;
  status: 'ok' | 'not_found' | 'error';
  cues?: SongCue[];
};

type AnalysisResponse = {
  results: Record<string, AnalysisResult>;
  partial: boolean;
};

// LIMIT max number of songs per request 
const maxSongsPerRequest = 50;

// POPULATE the bpm, energy, cues and beatDropsMs for each song 
export async function analyseSongs(songs: Song[]): Promise<Song[]> {
  const songIds = songs.map((song) => song.id);
  const analysisById = await readSavedAnalysis(songIds);

  // FIND the songs the phone doesn't know about yet
  const missingSongs: Song[] = [];
  for (const song of songs) {
    if (!analysisById.has(song.id)) {
      missingSongs.push(song);
    }
  }

  // QUERY the backend for the missing songs, then save them in cache
  if (missingSongs.length > 0) {
    const newAnalysis = await askBackend(missingSongs.slice(0, maxSongsPerRequest));
    saveAnalysis(newAnalysis);
    for (const [id, analysis] of newAnalysis) {
      analysisById.set(id, analysis);
    }
  }

  // MERGE everything back onto the songs, keeping the same order
  const analysedSongs: Song[] = [];
  for (const song of songs) {
    const analysis = analysisById.get(song.id);
    if (!analysis) {
      analysedSongs.push(song);
      continue;
    }
    analysedSongs.push({
      ...song,
      bpm: analysis.bpm,
      energy: analysis.energy,
      cues: analysis.cues,
      beatDropsMs: getBeatDropsTimestampInMs(analysis.cues),
    });
  }
  return analysedSongs;
}

async function askBackend(songs: Song[]): Promise<Map<string, SavedAnalysis>> {
  const requestBody = {
    tracks: songs.map((song) => ({
      id: song.id,
      title: song.title,
      artist: song.artist,
      durationMs: song.durationMs,
    })),
  };

  const response = await apiFetch<AnalysisResponse>('/v1/tracks/analysis', {
    method: 'POST',
    body: JSON.stringify(requestBody),
  });

  if (response.partial) {
    console.warn('[tracks] backend could only analyse some of the songs this time');
  }

  // KEEP only the songs that came back with a BPM
  const found = new Map<string, SavedAnalysis>();
  for (const id of Object.keys(response.results)) {
    const result = response.results[id];
    if (result.bpm === null) {
      continue;
    }
    found.set(id, {
      bpm: result.bpm,
      energy: result.energy,
      cues: cleanUpCues(result.cues ?? []),
      savedAt: Date.now(),
    });
  }
  return found;
}

// REMOVE any cues that don't have a valid atMs and leadMs, and SORT the rest by atMs
function cleanUpCues(cues: SongCue[]): SongCue[] {
  const usable: SongCue[] = [];
  for (const cue of cues) {
    if (Number.isFinite(cue.atMs) && cue.atMs >= 0 && Number.isFinite(cue.leadMs)) {
      usable.push(cue);
    }
  }
  usable.sort((a, b) => a.atMs - b.atMs);
  return usable;
}

// FIND songs with a beat drop or chorus, and RETURN the times in ms
function getBeatDropsTimestampInMs(cues: SongCue[]): number[] {
  const dropTimes: number[] = [];
  for (const cue of cues) {
    if (cue.kind === 'drop' || cue.kind === 'chorus') {
      dropTimes.push(cue.atMs);
    }
  }
  return dropTimes;
}
