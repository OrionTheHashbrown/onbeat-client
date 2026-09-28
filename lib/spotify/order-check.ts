/**
 * SONG QUEUE CHECK – lib/spotify/order-check.ts
 *
 * REFERENCE FROM
 * https://developer.spotify.com/documentation/web-api/reference/get-information-about-the-users-current-playback
 * https://developer.spotify.com/documentation/web-api/reference/get-queue
 */

import { getErrorMessage } from '../errors';

export type OrderCheck = {
  shuffleOn: boolean;
  straySongCount: number; 
};

const waitBeforeCheckingMs = 900;

// RETURNS null if everything looks normal
export async function checkSpotifyOrder(accessToken: string, sentUris: string[]): Promise<OrderCheck | null> {
  if (sentUris.length === 0) {
    return null;
  }

  await new Promise<void>((resolve) => setTimeout(resolve, waitBeforeCheckingMs));
  const headers = { Authorization: 'Bearer ' + accessToken };

  try {
    // CHECK shuffle
    let shuffleOn = false;
    const playerResponse = await fetch('https://api.spotify.com/v1/me/player', { headers });
    if (playerResponse.ok && playerResponse.status !== 204) {
      const player = await playerResponse.json();
      shuffleOn = player.shuffle_state === true;
    }

    // CHECK the queue
    const queueResponse = await fetch('https://api.spotify.com/v1/me/player/queue', { headers });
    if (!queueResponse.ok || queueResponse.status === 204) {
      return shuffleOn ? { shuffleOn, straySongCount: 0 } : null;
    }
    const queue = await queueResponse.json();
    const nowPlayingUri = queue.currently_playing?.uri;
    if (!nowPlayingUri) {
      return shuffleOn ? { shuffleOn, straySongCount: 0 } : null;
    }

    // LOOK at what's playing + what's next (only as many as we sent), and COUNT songs that are not in our list
    const upNext: string[] = [nowPlayingUri];
    for (const item of queue.queue ?? []) {
      if (item?.uri) {
        upNext.push(item.uri);
      }
    }

    let straySongCount = 0;
    for (let index = 0; index < upNext.length && index < sentUris.length; index++) {
      if (!sentUris.includes(upNext[index])) {
        straySongCount++;
      }
    }

    return { shuffleOn, straySongCount };
  } catch (error) {
    console.warn('[order-check] could not read the Spotify queue:', getErrorMessage(error));
    return null;
  }
}
