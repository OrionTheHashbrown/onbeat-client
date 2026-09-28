/**
 * SPOTIFY QUEUE (WEB API) – lib/spotify/queue-api.ts
 *
 * READS what Spotify will REALLY play next, and ADDS songs to its queue, using the Web API.
 *
 * REFERENCE FROM
 * https://developer.spotify.com/documentation/web-api/reference/get-queue
 * https://developer.spotify.com/documentation/web-api/reference/add-to-queue
 */

import { Player, SpotifyURI } from '@wwdrew/expo-spotify-sdk';

import { getErrorMessage } from '../errors';

// GET the songs Spotify will play next (null if we couldn't find out)
export async function getUpcomingUris(accessToken: string): Promise<string[] | null> {
  try {
    const response = await fetch('https://api.spotify.com/v1/me/player/queue', {
      headers: { Authorization: 'Bearer ' + accessToken },
    });
    if (!response.ok || response.status === 204) {
      return null;
    }
    const body = await response.json();

    const upcoming: string[] = [];
    for (const item of body.queue ?? []) {
      if (item?.uri) {
        upcoming.push(item.uri);
      }
    }
    return upcoming;
  } catch (error) {
    console.warn('[queue-api] could not read the Spotify queue:', getErrorMessage(error));
    return null;
  }
}

// ADD a song to Spotify's queue, with the Web API first and App Remote if that fails
export async function addToSpotifyQueue(accessToken: string | null, uri: string): Promise<'web' | 'app-remote'> {
  if (accessToken) {
    try {
      const response = await fetch('https://api.spotify.com/v1/me/player/queue?uri=' + encodeURIComponent(uri), {
        method: 'POST',
        headers: { Authorization: 'Bearer ' + accessToken },
      });
      if (response.ok) {
        return 'web';
      }
      console.warn('[queue-api] Web API queue returned ' + response.status + ', trying App Remote');
    } catch (error) {
      console.warn('[queue-api] Web API queue failed, trying App Remote:', getErrorMessage(error));
    }
  }

  await Player.queue(SpotifyURI.from(uri));
  return 'app-remote';
}
