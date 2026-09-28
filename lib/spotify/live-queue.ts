/**
 * LIVE QUEUE – lib/spotify/live-queue.ts
 *
 * REFERENCE FROM
 * https://github.com/wwdrew/expo-spotify-sdk
 * https://developer.spotify.com/documentation/web-api/reference/get-queue
 */

import { recordEvent } from '../diagnostics/run-trace';
import { getErrorMessage } from '../errors';
import { getActiveRun, getMovingMs } from '../run/run-store';
import { getCurrentTempoPlanFromCurrentTime, getTargetBpmAt } from '../tempo/plan';
import { calculateEffectiveBpm, calculatePlacementScore, canBeScored } from '../tempo/order';
import { getWorkingToken } from './auth';
import { getNowPlaying, getPositionNow, nowPlayingStore } from './now-playing';
import type { Song } from './playlists';
import { addToSpotifyQueue, getUpcomingUris } from './queue-api';

// SET how many songs to keep lined up in Spotify's queue
const songsToBeQueuedAtOneTime = 1;
const safetyCheckEveryMs = 15 * 1000;

let songPool: Song[] = []; 
let usedSongIds = new Set<string>(); 
let playedSongIds = new Set<string>(); 
let queuedSongs: Song[] = [];
let lastSongId: string | null = null;
let stopListening: (() => void) | null = null;
let safetyTimer: ReturnType<typeof setInterval> | null = null;
let isBusy = false;
let needsAnotherTopUp = false;

export function startLiveQueue(sentSongs: Song[], poolSongs: Song[]) {
  stopLiveQueue();
  songPool = poolSongs;
  for (const song of sentSongs) {
    usedSongIds.add(song.id);
  }

  // LISTEN for song changes and top up the queue when needed
  stopListening = nowPlayingStore.subscribe(handleSongChange);
  safetyTimer = setInterval(topUpQueue, safetyCheckEveryMs);
  handleSongChange();
}

export function stopLiveQueue() {
  if (stopListening) {
    stopListening();
    stopListening = null;
  }
  if (safetyTimer) {
    clearInterval(safetyTimer);
    safetyTimer = null;
  }
  songPool = [];
  queuedSongs = [];
  usedSongIds = new Set();
  playedSongIds = new Set();
  lastSongId = null;
  needsAnotherTopUp = false;
}

// A NEW song started playing (or we just started)
function handleSongChange() {
  const playing = getNowPlaying();
  if (!playing || playing.songId === lastSongId) {
    return;
  }
  lastSongId = playing.songId;

  if (playedSongIds.has(playing.songId)) {
    recordEvent('detected', 'Spotify replayed an old song – topping up the queue');
  } else {
    recordEvent('song-started', playing.title + ' – ' + playing.artist);
  }

  playedSongIds.add(playing.songId);
  usedSongIds.add(playing.songId);
  topUpQueue();
}

// COUNT how many of our songs are coming up next that haven't played yet
async function countUpcomingQueuedSongs(accessToken: string | null): Promise<number> {

  const ourWaitingUris: string[] = [];
  for (const song of queuedSongs) {
    if (!playedSongIds.has(song.id)) {
      ourWaitingUris.push(song.uri);
    }
  }

  if (!accessToken) {
    return ourWaitingUris.length;
  }

  const upcomingUris = await getUpcomingUris(accessToken);
  if (upcomingUris === null) {
    return ourWaitingUris.length;
  }
  let count = 0;
  for (const uri of upcomingUris) {
    if (ourWaitingUris.includes(uri)) {
      count++;
    }
  }
  return count;
}

// PICK the best song based on the target BPM and the previous song's effective BPM
function pickNextSong(atMs: number, targetBpm: number, previousEffectiveBpm: number | null): Song | null {
  const run = getActiveRun();
  if (!run) {
    return null;
  }
  const stage = getCurrentTempoPlanFromCurrentTime(run.plan, atMs);
  if (!stage) {
    return null;
  }

  let bestSong: Song | null = null;
  let bestScore = Infinity;
  for (const song of songPool) {
    if (!canBeScored(song) || usedSongIds.has(song.id)) {
      continue;
    }
    const score = calculatePlacementScore(song, stage, atMs, previousEffectiveBpm, targetBpm);
    if (score < bestScore) {
      bestScore = score;
      bestSong = song;
    }
  }

  if (bestSong === null) {
    for (const song of songPool) {
      if (!usedSongIds.has(song.id)) {
        return song;
      }
    }
  }
  return bestSong;
}

// ADD the next song to Spotify's queue if none of ours is lined up
async function topUpQueue() {
  if (isBusy) {
    needsAnotherTopUp = true;
    return;
  }
  const run = getActiveRun();
  const playing = getNowPlaying();
  if (!run || run.status === 'finished' || !playing) {
    return;
  }
  isBusy = true;
  try {
    const token = await getWorkingToken();
    const accessToken = token ? token.accessToken : null;

    let queuedCount = await countUpcomingQueuedSongs(accessToken);

    // FIND and CALCULATE when the next song we add will start 
    let atMs = getMovingMs(run, Date.now()) + (playing.durationMs - getPositionNow(playing));
    for (const song of queuedSongs) {
      if (!playedSongIds.has(song.id)) {
        atMs += song.durationMs;
      }
    }
    let previousEffectiveBpm: number | null = null;

    while (queuedCount < songsToBeQueuedAtOneTime) {
      const targetBpm = getTargetBpmAt(run.plan, run.adjustments, atMs);
      if (targetBpm === null) {
        break;
      }
      const nextSong = pickNextSong(atMs, targetBpm, previousEffectiveBpm);
      if (!nextSong) {
        break; 
      }

      const howItWasAdded = await addToSpotifyQueue(accessToken, nextSong.uri);
      if (howItWasAdded === 'app-remote') {
        recordEvent('detected', 'Queued through App Remote');
      }
      recordEvent('song-queued', nextSong.title + ' – ' + nextSong.artist + ' (' + nextSong.bpm + ' BPM, target ' + targetBpm + ')');

      usedSongIds.add(nextSong.id);
      queuedSongs.push(nextSong);
      queuedCount++;
      previousEffectiveBpm = nextSong.bpm === null ? null : calculateEffectiveBpm(nextSong.bpm, targetBpm);
      atMs += nextSong.durationMs;
    }
  } catch (error) {
    console.warn('[live-queue] could not queue the next song:', getErrorMessage(error));
  }
  isBusy = false;

  if (needsAnotherTopUp) {
    needsAnotherTopUp = false;
    topUpQueue();
  }
}

export function getLiveQueueDebug() {
  const linedUp: Song[] = [];
  for (const song of queuedSongs) {
    if (!playedSongIds.has(song.id)) {
      linedUp.push(song);
    }
  }

  let songsLeft = 0;
  for (const song of songPool) {
    if (!usedSongIds.has(song.id)) {
      songsLeft++;
    }
  }
  return { linedUp, songsLeft };
}
