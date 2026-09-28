/**
 * SPOTIFY listener – lib/spotify/now-playing.ts
 *
 * REFERENCE FROM
 * https://github.com/wwdrew/expo-spotify-sdk
 * https://developer.spotify.com/documentation/web-api/reference/get-the-users-currently-playing-track
 */

import { Player, PlayerState } from '@wwdrew/expo-spotify-sdk';

import { makeStore, useStoreValue } from '../make-store';
import { getWorkingToken } from './auth';

export type NowPlaying = {
  songId: string;
  uri: string;
  title: string;
  artist: string;
  durationMs: number;
  positionMs: number; 
  updatedAt: number; 
  isPaused: boolean;
};

export const nowPlayingStore = makeStore<NowPlaying | null>(null);

export function getNowPlaying() {
  return nowPlayingStore.getValue();
}

export function useNowPlaying() {
  return useStoreValue(nowPlayingStore);
}

let playerListener: { remove: () => void } | null = null;
let recheckTimer: ReturnType<typeof setInterval> | null = null;

function toNowPlaying(state: PlayerState): NowPlaying | null {
  const uriParts = state.track.uri.split(':'); 
  if (uriParts.length !== 3 || uriParts[1] !== 'track') {
    return null;
  }
  return {
    songId: uriParts[2],
    uri: state.track.uri,
    title: state.track.name,
    artist: state.track.artist?.name ?? '',
    durationMs: state.track.duration,
    positionMs: state.playbackPosition,
    updatedAt: Date.now(),
    isPaused: state.isPaused,
  };
}

// ASK the Web API what's playing (used when the App Remote link has dropped, e.g. phone locked)
async function askWebApiWhatsPlaying(): Promise<NowPlaying | null> {
  const token = await getWorkingToken();
  if (!token) {
    return null;
  }
  const response = await fetch('https://api.spotify.com/v1/me/player/currently-playing', {
    headers: { Authorization: 'Bearer ' + token.accessToken },
  });
  // 204 = nothing playing right now
  if (!response.ok || response.status === 204) {
    return null;
  }
  const body = await response.json();
  const track = body.item;
  if (!track || track.type !== 'track') {
    return null;
  }
  return {
    songId: track.id,
    uri: track.uri,
    title: track.name,
    artist: track.artists?.[0]?.name ?? '',
    durationMs: track.duration_ms,
    positionMs: body.progress_ms ?? 0,
    updatedAt: Date.now(),
    isPaused: !body.is_playing,
  };
}

// CHECK what's playing: App Remote first, and the Web API if App Remote isn't connected
async function recheckPlayer() {
  try {
    const state = await Player.getPlayerState();
    nowPlayingStore.setValue(toNowPlaying(state));
    return;
  } catch {
    // App Remote isn't connected right now, so try the Web API below
  }

  try {
    const playing = await askWebApiWhatsPlaying();
    if (playing) {
      nowPlayingStore.setValue(playing);
    }
  } catch {
    // NO internet either, keep what we had
  }
}

export function startNowPlaying() {
  if (playerListener) {
    return;
  }
  playerListener = Player.addListener('playerStateChange', (state) => {
    nowPlayingStore.setValue(toNowPlaying(state));
  });
  recheckPlayer();
  // CHECK every 10 seconds in case connection dropped
  recheckTimer = setInterval(recheckPlayer, 10 * 1000);
}

export function stopNowPlaying() {
  if (playerListener) {
    playerListener.remove();
    playerListener = null;
  }
  if (recheckTimer) {
    clearInterval(recheckTimer);
    recheckTimer = null;
  }
  nowPlayingStore.setValue(null);
}

export function getPositionNow(playing: NowPlaying): number {
  if (playing.isPaused) {
    return playing.positionMs;
  }
  const position = playing.positionMs + (Date.now() - playing.updatedAt);
  if (position > playing.durationMs) {
    return playing.durationMs;
  }
  return position;
}
