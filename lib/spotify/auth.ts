/**
 * Spotify login with Authorization Code + PKCE, and keeping the token fresh (lib/spotify/auth.ts).
 *
 * REFERENCE FROM
 * https://developer.spotify.com/documentation/web-api/tutorials/code-pkce-flow
 * https://developer.spotify.com/documentation/web-api/tutorials/refreshing-tokens
 * https://docs.expo.dev/versions/latest/sdk/auth-session/
 */

import * as AuthSession from 'expo-auth-session';

import { getErrorMessage } from '../errors';
import { spotifyClientId, spotifyLoginUrls, spotifyRedirectUri, spotifyScopes } from './config';
import { clearToken, isTokenExpired, loadToken, saveToken, SpotifyToken } from './token-storage';

// CONVERT the token Spotify to return into our own format
function toSpotifyToken(response: AuthSession.TokenResponse, oldScopes: string[]): SpotifyToken {
  const issuedAtMs = response.issuedAt * 1000;
  const lastsForMs = (response.expiresIn ?? 3600) * 1000;

  let scopes = oldScopes;
  if (response.scope) {
    scopes = response.scope.split(' ');
  }

  return {
    accessToken: response.accessToken,
    refreshToken: response.refreshToken ?? null,
    expiresAt: issuedAtMs + lastsForMs,
    scopes,
    clientId: spotifyClientId,
  };
}

// SWAP the one time login code for a real token, and SAVE it
export async function swapCodeForToken(code: string, codeVerifier: string): Promise<SpotifyToken> {
  const response = await AuthSession.exchangeCodeAsync(
    {
      clientId: spotifyClientId,
      code,
      redirectUri: spotifyRedirectUri,
      extraParams: { code_verifier: codeVerifier },
    },
    spotifyLoginUrls,
  );

  const token = toSpotifyToken(response, spotifyScopes);
  await saveToken(token);
  return token;
}

// CHECK the saved token still belongs to THIS app and has EVERY permission we ask for now
function tokenMatchesThisApp(token: SpotifyToken): boolean {
  if (token.clientId !== spotifyClientId) {
    return false;
  }
  for (const scope of spotifyScopes) {
    if (!token.scopes.includes(scope)) {
      return false;
    }
  }
  return true;
}

// GET a token that works RIGHT NOW (refreshing it if needed)
export async function getWorkingToken(): Promise<SpotifyToken | null> {
  const savedToken = await loadToken();
  if (!savedToken) {
    return null;
  }

  if (!tokenMatchesThisApp(savedToken)) {
    await clearToken();
    return null;
  }

  if (!isTokenExpired(savedToken)) {
    return savedToken;
  }

  if (!savedToken.refreshToken) {
    await clearToken();
    return null;
  }

  // REFRESH the expired token
  try {
    const response = await AuthSession.refreshAsync(
      { clientId: spotifyClientId, refreshToken: savedToken.refreshToken },
      spotifyLoginUrls,
    );
    const newToken = toSpotifyToken(response, savedToken.scopes);

    if (!newToken.refreshToken) {
      newToken.refreshToken = savedToken.refreshToken;
    }

    await saveToken(newToken);
    return newToken;
  } catch (error) {
    if (getErrorMessage(error).includes('invalid_grant')) {
      await clearToken();
      return null;
    }
    throw error;
  }
}
