/**
 * PLAYLIST PICKER – components/lets-run/playlist-picker.tsx
 *
 * REFERENCE FROM
 * https://reactnative.dev/docs/modal
 */

import { useState } from 'react';
import { ActivityIndicator, Image, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SymbolView } from 'expo-symbols';
import { getErrorMessage } from '../../lib/errors';
import { fetchMyPlaylists, PlaylistSummary } from '../../lib/spotify/playlists';
import { colours, fontSizes, spacing } from '../../lib/theme';

type PlaylistPickerProps = {
  isOpen: boolean;
  currentPlaylistId: string;
  getAccessToken: () => Promise<string | null>;
  onPick: (playlist: PlaylistSummary) => void;
  onClose: () => void;
};

export function PlaylistPicker({ isOpen, currentPlaylistId, getAccessToken, onPick, onClose }: PlaylistPickerProps) {
  const [playlists, setPlaylists] = useState<PlaylistSummary[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  function handlePlaylistButton(playlist: PlaylistSummary) {
    onPick(playlist);
  }

  async function loadPlaylists() {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const accessToken = await getAccessToken();
      if (!accessToken) {
        throw new Error('Please sign in to Spotify again.');
      }
      setPlaylists(await fetchMyPlaylists(accessToken));
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    }
    setIsLoading(false);
  }

  return (
    // LOAD the playlists every time the picker opens 
    <Modal
      visible={isOpen}
      animationType="slide"
      presentationStyle="pageSheet"
      onShow={loadPlaylists}
      onRequestClose={onClose}
    >
      <View style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>Choose a playlist</Text>
          <Pressable onPress={onClose} hitSlop={10}>
            <SymbolView name="xmark" tintColor={colours.textSecondary} size={18} />
          </Pressable>
        </View>
        <Text style={styles.subtitle}>
          Songs are matched to your tempo plan by BPM, so a playlist with a good mix of speeds works best.
        </Text>

        {isLoading ? <ActivityIndicator color={colours.accent} style={styles.spinner} /> : null}
        {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
        {!isLoading && !errorMessage && playlists.length === 0 ? (
          <Text style={styles.subtitle}>No playlists found on this Spotify account.</Text>
        ) : null}

        <ScrollView contentContainerStyle={styles.list}>
          {playlists.map((playlist) => (
            <Pressable
              key={playlist.id}
              onPress={() => handlePlaylistButton(playlist)}
              style={({ pressed }) => [styles.row, pressed && styles.pressed]}
            >
              {playlist.artworkUrl ? (
                <Image source={{ uri: playlist.artworkUrl }} style={styles.artwork} />
              ) : (
                <View style={[styles.artwork, styles.noArtwork]} />
              )}
              <View style={styles.rowText}>
                <Text style={styles.name} numberOfLines={1}>{playlist.name}</Text>
                <Text style={styles.details} numberOfLines={1}>
                  {playlist.songCount} songs · {playlist.owner}
                </Text>
              </View>
              {playlist.id === currentPlaylistId ? (
                <SymbolView name="checkmark" tintColor={colours.accent} size={16} />
              ) : null}
            </Pressable>
          ))}
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: colours.surface,
    padding: spacing.extraLarge,
    gap: spacing.medium,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    color: colours.text,
    fontSize: fontSizes.title + 2,
    fontWeight: '800',
  },
  subtitle: {
    color: colours.textSecondary,
    fontSize: fontSizes.small,
    lineHeight: 18,
  },
  spinner: {
    marginTop: spacing.extraLarge,
  },
  errorText: {
    color: colours.danger,
    fontSize: fontSizes.small,
  },
  list: {
    gap: spacing.small,
    paddingBottom: spacing.extraLarge,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.medium,
    paddingVertical: 6,
  },
  pressed: {
    opacity: 0.6,
  },
  artwork: {
    width: 44,
    height: 44,
    borderRadius: 6,
  },
  noArtwork: {
    backgroundColor: colours.surfaceHigh,
  },
  rowText: {
    flex: 1,
  },
  name: {
    color: colours.text,
    fontSize: fontSizes.body - 1,
    fontWeight: '600',
  },
  details: {
    color: colours.textSecondary,
    fontSize: fontSizes.hint,
  },
});
