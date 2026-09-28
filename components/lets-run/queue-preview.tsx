import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { Song } from '../../lib/spotify/playlists';
import { colours, fontSizes, spacing } from '../../lib/theme';

const rowHeight = 44;
const visibleRows = 4;

export function QueuePreview({ songs }: { songs: Song[] }) {
  if (songs.length === 0) {
    return null;
  }

  return (
    <ScrollView
      style={{ maxHeight: rowHeight * visibleRows + spacing.small * (visibleRows - 1) }}
      contentContainerStyle={styles.list}
      nestedScrollEnabled
    >
      {songs.map((song) => (
        <View key={song.id} style={styles.row}>
          {song.artworkUrl ? (
            <Image source={{ uri: song.artworkUrl }} style={styles.artwork} />
          ) : (
            <View style={[styles.artwork, styles.noArtwork]} />
          )}

          <View style={styles.songText}>
            <Text style={styles.title} numberOfLines={1}>{song.title}</Text>
            <Text style={styles.artist} numberOfLines={1}>{song.artist}</Text>
          </View>

          <Text style={styles.bpmPill}>{song.bpm === null ? '— BPM' : Math.round(song.bpm) + ' BPM'}</Text>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: spacing.small,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.medium,
    height: rowHeight,
  },
  artwork: {
    width: 40,
    height: 40,
    borderRadius: 6,
  },
  noArtwork: {
    backgroundColor: colours.surfaceHigh,
  },
  songText: {
    flex: 1,
  },
  title: {
    color: colours.text,
    fontSize: fontSizes.small + 1,
    fontWeight: '600',
  },
  artist: {
    color: colours.textSecondary,
    fontSize: fontSizes.hint,
  },
  bpmPill: {
    color: colours.onAccent,
    backgroundColor: colours.accent,
    fontSize: fontSizes.hint,
    fontWeight: '700',
    borderRadius: 999,
    paddingVertical: 3,
    paddingHorizontal: 8,
    overflow: 'hidden',
  },
});
