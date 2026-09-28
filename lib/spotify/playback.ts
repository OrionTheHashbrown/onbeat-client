/**
 * PLAY SONGS IN ORDER – lib/spotify/playback.ts
 *
 * REFERENCE FROM
 * https://developer.spotify.com/documentation/web-api/reference/start-a-users-playback
 * https://developer.spotify.com/documentation/web-api/reference/toggle-shuffle-for-users-playback
 * https://developer.spotify.com/documentation/web-api/reference/skip-users-playback-to-next-track
 * https://developer.spotify.com/documentation/web-api/reference/get-a-users-available-devices
 * https://github.com/wwdrew/expo-spotify-sdk
 */

import { Player, SpotifyURI } from '@wwdrew/expo-spotify-sdk';
import { getErrorMessage } from '../errors';
import { getUpcomingUris } from './queue-api';

type SpotifyDevice = {
  id: string | null;
  is_active: boolean;
  is_restricted: boolean;
  type: string;
};

function wait(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

async function getAvailablePlaybackDevice(accessToken: string): Promise<string | null> {
  try {
    const response = await fetch('https://api.spotify.com/v1/me/player/devices', {
      headers: { Authorization: 'Bearer ' + accessToken },
    });
    if (!response.ok) {
      return null;
    }
    const body = await response.json();

    const usableDevices: SpotifyDevice[] = [];
    for (const device of body.devices ?? []) {
      if (device.id && !device.is_restricted) {
        usableDevices.push(device);
      }
    }
    if (usableDevices.length === 0) {
      return null;
    }

    for (const device of usableDevices) {
      if (device.is_active) {
        return device.id;
      }
    }
    for (const device of usableDevices) {
      if (device.type.toLowerCase() === 'smartphone') {
        return device.id;
      }
    }
    return usableDevices[0].id;
  } catch (error) {
    console.warn('[playback] could not list devices:', getErrorMessage(error));
    return null;
  }
}

// KEEP checking for a playback device after a few seconds
async function waitForPlaybackDevice(accessToken: string): Promise<string | null> {
  const waitTimes = [0, 350, 500, 550];
  for (const waitMs of waitTimes) {
    await wait(waitMs);
    const deviceId = await getAvailablePlaybackDevice(accessToken);
    if (deviceId) {
      return deviceId;
    }
  }
  return null;
}

// ASK the Web API to play these songs in order, RETURNS null if it worked 
async function playWithWebApi(accessToken: string, uris: string[], deviceId: string): Promise<string | null> {
  try {
    const response = await fetch(
      'https://api.spotify.com/v1/me/player/play?device_id=' + encodeURIComponent(deviceId),
      {
        method: 'PUT',
        headers: { Authorization: 'Bearer ' + accessToken, 'Content-Type': 'application/json' },
        body: JSON.stringify({ uris, offset: { position: 0 }, position_ms: 0 }),
      },
    );

    if (response.status === 204 || response.status === 202) {
      return null;
    }
    if (response.status === 404) {
      return 'Spotify is not showing as an active device';
    }
    if (response.status === 403) {
      return 'Spotify Premium is needed to control playback';
    }
    if (response.status === 401) {
      return 'Spotify token is no longer valid. Please sign in to Spotify again.';
    }
    return 'Spotify returned ' + response.status;
  } catch (error) {
    return getErrorMessage(error);
  }
}

export async function playSongsInOrder(uris: string[], accessToken: string | null): Promise<void> {
  if (uris.length === 0) {
    throw new Error('There are no songs to play.');
  }

  let webApiFailureReason = 'no Spotify login';

  if (accessToken) {
    const deviceId = await getAvailablePlaybackDevice(accessToken);
    if (deviceId) {
      const problem = await playWithWebApi(accessToken, uris, deviceId);
      if (problem === null) {
        return;
      }
      webApiFailureReason = problem;
    } else {
      webApiFailureReason = 'Spotify was not listed as a device';
    }
  }

  await Player.play(SpotifyURI.from(uris[0]));
  await wait(400);

  if (accessToken) {
    const deviceId = await waitForPlaybackDevice(accessToken);
    if (deviceId) {
      const problem = await playWithWebApi(accessToken, uris, deviceId);
      if (problem === null) {
        return;
      }
      webApiFailureReason = problem;
    } else {
      webApiFailureReason = 'Spotify never showed up as a device';
    }
  }

  for (let index = 1; index < uris.length; index++) {
    try {
      await Player.queue(SpotifyURI.from(uris[index]));
    } catch (error) {
      console.warn('[playback] could not queue ' + uris[index] + ':', getErrorMessage(error));
    }
  }
}

// TURN OFF shuffle in Spotify if its ON
export async function turnOffShuffle(accessToken: string): Promise<boolean> {
  try {
    const response = await fetch('https://api.spotify.com/v1/me/player/shuffle?state=false', {
      method: 'PUT',
      headers: { Authorization: 'Bearer ' + accessToken },
    });
    if (!response.ok) {
      console.warn('[playback] could not turn off shuffle, Spotify returned ' + response.status);
    }
    return response.ok;
  } catch (error) {
    console.warn('[playback] could not turn off shuffle:', getErrorMessage(error));
    return false;
  }
}

const maxSongsToSkip = 40;

// SKIP all songs that is not ours in Spotify's queue
export async function skipSongsAlreadyInQueue(
  accessToken: string,
  firstSongUri: string,
  onSkippingStarted: (songCount: number) => void,
): Promise<number> {

  await wait(900);
  const upcomingUris = await getUpcomingUris(accessToken);
  if (upcomingUris === null) {
    return 0;
  }

  // COUNT songs to skip
  let songsToSkip = 0;
  for (const uri of upcomingUris) {
    if (uri !== firstSongUri) {
      songsToSkip++;
    }
  }
  if (songsToSkip > maxSongsToSkip) {
    songsToSkip = maxSongsToSkip;
  }
  if (songsToSkip === 0) {
    return 0;
  }
  onSkippingStarted(songsToSkip);

  // SKIPPING these songs
  for (let count = 0; count < songsToSkip; count++) {
    try {
      await fetch('https://api.spotify.com/v1/me/player/next', {
        method: 'POST',
        headers: { Authorization: 'Bearer ' + accessToken },
      });
    } catch (error) {
      console.warn('[playback] could not skip a leftover song:', getErrorMessage(error));
    }
    await wait(350);
  }

  // START first song that we have in queue for the run
  const deviceId = await getAvailablePlaybackDevice(accessToken);
  if (deviceId) {
    await playWithWebApi(accessToken, [firstSongUri], deviceId);
  }
  return songsToSkip;
}
