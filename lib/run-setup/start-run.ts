/**
 * START RUN – lib/run-setup/start-run.ts
 *
 * REFERENCE FROM
 * https://github.com/wwdrew/expo-spotify-sdk
 * https://docs.expo.dev/versions/latest/sdk/location/
 */

import * as Location from 'expo-location';
import { PlayerError } from '@wwdrew/expo-spotify-sdk';
import { startCoach } from '../coach/coach';
import { loadDiagnosticsSetting } from '../diagnostics/diagnostics-setting';
import { startTrace } from '../diagnostics/run-trace';
import { startLiveActivity } from '../run/live-activity';
import { beginRun, setBackgroundTracking } from '../run/run-store';
import { askMotionPermission, startTracking } from '../run/tracking-task';
import { connectOrWakeSpotify } from '../spotify/app-remote';
import { startLiveQueue } from '../spotify/live-queue';
import { startNowPlaying } from '../spotify/now-playing';
import { checkSpotifyOrder } from '../spotify/order-check';
import { playSongsInOrder, skipSongsAlreadyInQueue, turnOffShuffle } from '../spotify/playback';
import type { Song } from '../spotify/playlists';
import type { TempoSegment } from '../tempo/plan';
import type { DropCallouts } from './saved-choices';

export type StartRunSettings = {
  orderedSongs: Song[];
  spareSongs: Song[];
  plan: TempoSegment[];
  goalMinutes: number;
  playlistId: string;
  dropCallouts: DropCallouts;
  getAccessToken: () => Promise<string | null>;
  onClearingQueue: (songCount: number | null) => void; 
  musicAlreadyStarted: boolean; 
  ignoreWarnings: boolean; 
};

export type StartRunResult =
  | { outcome: 'started' }
  | { outcome: 'warning'; message: string };

export async function startRun(settings: StartRunSettings): Promise<StartRunResult> {
  const accessToken = await settings.getAccessToken();
  const songsToSend = settings.orderedSongs.slice(0, 1);
  const urisToSend = songsToSend.map((song) => song.uri);

  // 1. WAKE Spotify and PLAY the first song in our queue
  if (!settings.musicAlreadyStarted) {
    await playTheQueue(urisToSend, accessToken);
  }

  // 2. CLEAR Spotify's queue if needed, and turn off shuffle
  if (accessToken && !settings.musicAlreadyStarted) {
    await turnOffShuffle(accessToken);
    await skipSongsAlreadyInQueue(accessToken, urisToSend[0], settings.onClearingQueue);
    settings.onClearingQueue(null);
  }

  // 3. CHECK if the first song actually queued and CHECK spotify queue and shuffle state
  if (!settings.ignoreWarnings) {
    const warning = await checkOrderTook(urisToSend, accessToken);
    if (warning) {
      return { outcome: 'warning', message: warning };
    }
  }

  // 4. ASK for permissions such as location and motion (step counter)
  const canUseBackground = await askPermissions();

  // 5. BEGIN the run
  beginRun({
    goalMinutes: settings.goalMinutes,
    backgroundTracking: false,
    playlistId: settings.playlistId,
    plan: settings.plan,
    dropCallouts: settings.dropCallouts,
  });
  startTrace(await loadDiagnosticsSetting(), settings.dropCallouts);

  // 6. START GPS + step tracking
  const isBackground = await startTracking(canUseBackground);
  setBackgroundTracking(isBackground);

  // 7. START the live musicqueue
  const poolSongs = [...settings.orderedSongs.slice(1), ...settings.spareSongs];
  startNowPlaying();
  startLiveQueue(songsToSend, poolSongs);

  // 8. START the coach 
  startCoach([...settings.orderedSongs, ...settings.spareSongs]);

  // 9. SHOW the run on the lock screen
  startLiveActivity();

  return { outcome: 'started' };
}

// PLAY the first song, wake up SPotify if needed
async function playTheQueue(uris: string[], accessToken: string | null) {
  try {
    return await playSongsInOrder(uris, accessToken);
  } catch (error) {
    if (error instanceof PlayerError && error.code === 'PREMIUM_REQUIRED') {
      throw new Error('Spotify Premium is needed to play music during your run.');
    }
    if (error instanceof PlayerError && error.code === 'NOT_CONNECTED' && accessToken) {
      await connectOrWakeSpotify(accessToken, uris[0]);
      return await playSongsInOrder(uris, accessToken);
    }
    throw error;
  }
}

// CHECKS if the first song was actually queued and CHECKS spotify queue and shuffle state
async function checkOrderTook(uris: string[], accessToken: string | null): Promise<string | null> {
  if (!accessToken) {
    return null;
  }

  const check = await checkSpotifyOrder(accessToken, uris);
  if (!check) {
    return null;
  }
  if (check.straySongCount > 0) {
    return 'Spotify current queue is not empty. Clear your Spotify queue, or tap Start Run again to go anyway.';
  }
  if (check.shuffleOn) {
    return "We couldn't turn off Spotify shuffle, so songs may play out of order. Turn it off in Spotify, or tap Start Run again to go anyway.";
  }
  return null;
}

// ASKS for location and motion permissions if needed
async function askPermissions(): Promise<boolean> {

  const whileUsing = await Location.requestForegroundPermissionsAsync();
  if (!whileUsing.granted) {
    throw new Error('OnBeat needs your location to record your run. Please turn it on in Settings.');
  }

  // "ALWAYS" location is a nice to have (keeps recording with the screen off)
  let canUseBackground = false;
  try {
    const always = await Location.requestBackgroundPermissionsAsync();
    canUseBackground = always.granted;
  } catch {
    canUseBackground = false;
  }

  // ASK for motion permission (for the step counter)
  await askMotionPermission();

  return canUseBackground;
}
