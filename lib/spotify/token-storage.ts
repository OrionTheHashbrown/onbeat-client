/**
 * Saves the Spotify token safely on the phone, in SecureStore (Keychain on iOS)
 *
 * REFERENCE FROM
 * https://docs.expo.dev/versions/latest/sdk/securestore/
 */

import * as SecureStore from 'expo-secure-store';

export type SpotifyToken = {
  accessToken: string;
  refreshToken: string | null;
  expiresAt: number;
  scopes: string[];
  clientId: string;
};

const storageKey = 'onbeat.spotify.token';
const keychainOptions = { keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK };

let tokenInMemory: SpotifyToken | null | undefined = undefined;

export async function saveToken(token: SpotifyToken) {
  tokenInMemory = token;
  await SecureStore.setItemAsync(storageKey, JSON.stringify(token), keychainOptions);
}

export async function loadToken(): Promise<SpotifyToken | null> {
  if (tokenInMemory !== undefined) {
    return tokenInMemory;
  }

  const savedText = await SecureStore.getItemAsync(storageKey);
  if (!savedText) {
    tokenInMemory = null;
    return null;
  }

  try {
    const token = JSON.parse(savedText) as SpotifyToken;
    tokenInMemory = token;

    // SAVE it again with the new "after first unlock" setting
    await SecureStore.setItemAsync(storageKey, savedText, keychainOptions);
    return token;
  } catch {
    await clearToken();
    return null;
  }
}

export async function clearToken() {
  tokenInMemory = null;
  await SecureStore.deleteItemAsync(storageKey);
}

// CHECK if the token expired or is about to expire in one minute
export function isTokenExpired(token: SpotifyToken): boolean {
  const oneMinute = 60 * 1000;
  return Date.now() >= token.expiresAt - oneMinute;
}
