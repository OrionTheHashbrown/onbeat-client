/**
 * Spotify settings, client id, permissions (scopes) and login addresses (lib/spotify/config.ts).
 *
 * REFERENCE FROM
 * https://developer.spotify.com/documentation/web-api/concepts/scopes
 * https://docs.expo.dev/versions/latest/sdk/auth-session/
 */

import * as AuthSession from 'expo-auth-session';

const clientIdFromEnv = process.env.EXPO_PUBLIC_SPOTIFY_CLIENT_ID;

if (!clientIdFromEnv) {
  throw new Error('EXPO_PUBLIC_SPOTIFY_CLIENT_ID is MISSING from .env.local');
}

export const spotifyClientId = clientIdFromEnv;
export const spotifyLoginUrls = {
  authorizationEndpoint: 'https://accounts.spotify.com/authorize',
  tokenEndpoint: 'https://accounts.spotify.com/api/token',
};

export const spotifyRedirectUri = AuthSession.makeRedirectUri({
  scheme: 'onbeat',
  path: 'spotify-pkce',
});

export const spotifyScopes = [
  'app-remote-control',           // CONTROL the Spotify app (App Remote)
  'streaming',                    // PLAY songs through App Remote
  'user-read-private',            // READ their account type (Premium or Free)
  'user-read-email',              // READ their email for the Settings card
  'user-modify-playback-state',   // PLAY, PAUSE and QUEUE songs
  'user-read-playback-state',     // CHECK what's playing right now
  'playlist-read-private',        // READ their private playlists
  'playlist-read-collaborative',  // READ playlists they share
];
