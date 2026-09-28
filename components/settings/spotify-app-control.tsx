/**
 * SPOTIFY APP CONTROL – components/settings/spotify-app-control.tsx
 *
 * REFERENCE FROM
 * https://github.com/wwdrew/expo-spotify-sdk
 */

import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useCurrentTrack, useIsPlaying } from '@wwdrew/expo-spotify-sdk';

import { getErrorMessage } from '../../lib/errors';
import { connectOrWakeSpotify, togglePlayPause } from '../../lib/spotify/app-remote';
import { useSpotify } from '../../lib/spotify/spotify-provider';
import { colours, fontSizes, spacing } from '../../lib/theme';
import { Button } from '../ui/button';

export function SpotifyAppControl() {
  const spotify = useSpotify();
  const currentSong = useCurrentTrack();
  const isPlaying = useIsPlaying();

  const [isBusy, setIsBusy] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const isLinked = spotify.appConnection === 'connected';

  async function handleLinkButton() {
    setErrorMessage(null);
    setIsBusy(true);
    try {
      const accessToken = await spotify.getAccessToken();
      if (!accessToken) {
        throw new Error('Your Spotify login ran out. Please sign in to Spotify again.');
      }
      await connectOrWakeSpotify(accessToken);
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    }
    setIsBusy(false);
  }

  async function handlePlayPauseButton() {
    setErrorMessage(null);
    try {
      await togglePlayPause(isPlaying);
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    }
  }

  // PICK the words for the status line
  let statusText = 'Spotify app not linked';
  if (spotify.appConnection === 'connecting') {
    statusText = 'Linking Spotify app…';
  } else if (isLinked) {
    statusText = 'Spotify app linked';
  }

  return (
    <View style={styles.box}>
      <View style={styles.statusLine}>
        <View style={[styles.dot, isLinked ? styles.linkedDot : styles.unlinkedDot]} />
        <Text style={styles.statusText}>{statusText}</Text>
      </View>

      {isLinked && currentSong ? (
        <Text style={styles.songText} numberOfLines={1}>
          {isPlaying ? 'Playing: ' : 'Paused: '}
          {currentSong.name} – {currentSong.artist.name}
        </Text>
      ) : null}

      {isLinked ? (
        <Button label={isPlaying ? 'Pause' : 'Play'} outlined onPress={handlePlayPauseButton} />
      ) : (
        <Button
          label="Link Spotify app"
          outlined
          onPress={handleLinkButton}
          isLoading={isBusy || spotify.appConnection === 'connecting'}
        />
      )}

      {!isLinked ? (
        <Text style={styles.hint}>This may open Spotify for a second and start playing music.</Text>
      ) : null}

      {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    borderTopColor: colours.border,
    borderTopWidth: 1,
    paddingTop: spacing.medium,
    gap: spacing.small + 2,
  },
  statusLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  linkedDot: {
    backgroundColor: colours.spotifyGreen,
  },
  unlinkedDot: {
    backgroundColor: colours.textMuted,
  },
  statusText: {
    color: colours.text,
    fontSize: fontSizes.small,
    fontWeight: '600',
  },
  songText: {
    color: colours.textSecondary,
    fontSize: fontSizes.small,
  },
  hint: {
    color: colours.textMuted,
    fontSize: fontSizes.hint,
  },
  errorText: {
    color: colours.danger,
    fontSize: fontSizes.hint,
  },
});
