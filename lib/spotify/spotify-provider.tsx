/**
 * SPOTIFY CONNECTION for the whole signed in app (lib/spotify/spotify-provider.tsx).
 *
 * REFERENCE FROM
 * https://docs.expo.dev/versions/latest/sdk/auth-session/
 * https://react.dev/reference/react/createContext
 */

import { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import * as AuthSession from 'expo-auth-session';
import { ConnectionState, useConnectionState } from '@wwdrew/expo-spotify-sdk';
import { getErrorMessage } from '../errors';
import { disconnectSpotifyApp, tryQuietConnect } from './app-remote';
import { getWorkingToken, swapCodeForToken } from './auth';
import { spotifyClientId, spotifyLoginUrls, spotifyRedirectUri, spotifyScopes } from './config';
import { fetchSpotifyProfile, SpotifyProfile } from './profile';
import { clearToken } from './token-storage';

export type SpotifyStatus = 'checking' | 'not-connected' | 'connecting' | 'connected' | 'error';

type SpotifyContextValue = {
  status: SpotifyStatus;
  profile: SpotifyProfile | null;
  errorMessage: string | null;
  appConnection: ConnectionState; 
  connect: () => void;
  disconnect: () => Promise<void>;
  checkAgain: () => void;
  getAccessToken: () => Promise<string | null>;
};

const SpotifyContext = createContext<SpotifyContextValue | null>(null);

export function SpotifyProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<SpotifyStatus>('checking');
  const [profile, setProfile] = useState<SpotifyProfile | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [hasTriedAppConnect, setHasTriedAppConnect] = useState(false);
  const appConnection = useConnectionState();
  const [loginRequest, loginResponse, openLoginPage] = AuthSession.useAuthRequest(
    {
      clientId: spotifyClientId,
      scopes: spotifyScopes,
      redirectUri: spotifyRedirectUri,
      usePKCE: true,
      responseType: AuthSession.ResponseType.Code,
    },
    spotifyLoginUrls,
  );

  // SHOW an error message and set the status to 'error', clearing the profile
  function showError(message: string) {
    setProfile(null);
    setErrorMessage(message);
    setStatus('error');
  }

  // LOAD the saved token if any and check if it still works, then load the profile
  async function loadSavedConnection() {
    setStatus('checking');
    setErrorMessage(null);
    try {
      const token = await getWorkingToken();
      if (!token) {
        setProfile(null);
        setStatus('not-connected');
        return;
      }
      const spotifyProfile = await fetchSpotifyProfile(token.accessToken);
      setProfile(spotifyProfile);
      setStatus('connected');
    } catch (error) {
      showError(getErrorMessage(error));
    }
  }

  useEffect(() => {
    loadSavedConnection();
  }, []);

  useEffect(() => {
    if (!loginResponse) {
      return;
    }
    
    if (loginResponse.type === 'cancel' || loginResponse.type === 'dismiss') {
      setStatus('not-connected');
      return;
    }

    if (loginResponse.type === 'error') {
      showError(loginResponse.params.error_description ?? loginResponse.params.error ?? 'Spotify login failed.');
      return;
    }

    if (loginResponse.type !== 'success') {
      return;
    }

    const code = loginResponse.params.code;
    const codeVerifier = loginRequest?.codeVerifier;
    if (!code || !codeVerifier) {
      showError('Spotify did not send back a login code. Please try again.');
      return;
    }

    finishLogin(code, codeVerifier);
  }, [loginResponse]);

  // TRY linking the Spotify APP quietly first and once if it works
  useEffect(() => {
    if (status !== 'connected' || !profile || !profile.isPremium) {
      return;
    }
    if (hasTriedAppConnect || appConnection !== 'disconnected') {
      return;
    }
    setHasTriedAppConnect(true);
    getAccessToken().then((accessToken) => {
      if (accessToken) {
        tryQuietConnect(accessToken);
      }
    });
  }, [status, profile, appConnection, hasTriedAppConnect]);

  // SWAP the code for a token, THEN load their profile
  async function finishLogin(code: string, codeVerifier: string) {
    try {
      const token = await swapCodeForToken(code, codeVerifier);
      const spotifyProfile = await fetchSpotifyProfile(token.accessToken);
      setProfile(spotifyProfile);
      setErrorMessage(null);
      setStatus('connected');
    } catch (error) {
      showError(getErrorMessage(error));
    }
  }

  function connect() {
    if (!loginRequest) {
      return;
    }
    setErrorMessage(null);
    setStatus('connecting');
    openLoginPage();
  }

  async function disconnect() {
    await disconnectSpotifyApp();
    await clearToken();
    setHasTriedAppConnect(false);
    setProfile(null);
    setErrorMessage(null);
    setStatus('not-connected');
  }

  async function getAccessToken(): Promise<string | null> {
    const token = await getWorkingToken();
    if (!token) {
      return null;
    }
    return token.accessToken;
  }

  const value: SpotifyContextValue = {
    status,
    profile,
    errorMessage,
    appConnection,
    connect,
    disconnect,
    checkAgain: loadSavedConnection,
    getAccessToken,
  };

  return <SpotifyContext.Provider value={value}>{children}</SpotifyContext.Provider>;
}

export function useSpotify(): SpotifyContextValue {
  const value = useContext(SpotifyContext);
  if (!value) {
    throw new Error('useSpotify must be used inside <SpotifyProvider>');
  }
  return value;
}
