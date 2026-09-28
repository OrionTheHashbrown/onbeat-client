import { ActivityIndicator, Modal, StyleSheet, Text, View } from 'react-native';
import { colours, cornerRadius, fontSizes, spacing } from '../../lib/theme';

export function ClearingQueueOverlay({ songCount }: { songCount: number | null }) {
  const isShowing = songCount !== null;

  let songWords = 'songs';
  if (songCount === 1) {
    songWords = 'song';
  }

  return (
    <Modal visible={isShowing} transparent animationType="fade">
      <View style={styles.dimmedBackground}>
        <View style={styles.card}>
          <ActivityIndicator size="large" color={colours.accent} />
          <Text style={styles.title}>Clearing Spotify queue</Text>
          <Text style={styles.message}>
            {'Skipping ' + songCount + ' ' + songWords + " songs in-progress! We'll start your run as soon as it's clear."}
          </Text>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  dimmedBackground: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.extraLarge,
  },
  card: {
    width: '100%',
    backgroundColor: colours.surface,
    borderRadius: cornerRadius + 4,
    padding: spacing.extraLarge,
    alignItems: 'center',
    gap: spacing.medium,
  },
  title: {
    color: colours.text,
    fontSize: fontSizes.title,
    fontWeight: '800',
    textAlign: 'center',
  },
  message: {
    color: colours.textSecondary,
    fontSize: fontSizes.small,
    lineHeight: 19,
    textAlign: 'center',
  },
});
