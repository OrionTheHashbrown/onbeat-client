/**
 * SPOTIFY APP REMOTE – lib/spotify/app-remote.ts
 *
 * REFERENCE FROM
 * https://github.com/wwdrew/expo-spotify-sdk
 * https://github.com/wwdrew/expo-spotify-sdk/tree/main/docs
 */

import { AppRemote, AppRemoteError, Player } from '@wwdrew/expo-spotify-sdk';

export async function connectOrWakeSpotify(accessToken: string, wakeSongUri?: string) {
  try {
    await AppRemote.connect(accessToken);
  } catch (error) {
    if (error instanceof AppRemoteError && error.code === 'CONNECTION_FAILED') {
      await AppRemote.authorizeAndPlay(accessToken, wakeSongUri);
      return;
    }
    throw error;
  }
}

export async function tryQuietConnect(accessToken: string): Promise<boolean> {
  try {
    await AppRemote.connect(accessToken);
    return true;
  } catch {
    return false;
  }
}

export async function disconnectSpotifyApp() {
  if (AppRemote.isConnected()) {
    await AppRemote.disconnect();
  }
}

// PLAY or PAUSE depending on player's current state
export async function togglePlayPause(isPlaying: boolean) {
  if (isPlaying) {
    await Player.pause();
  } else {
    await Player.resume();
  }
}
