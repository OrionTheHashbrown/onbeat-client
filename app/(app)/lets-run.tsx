/**
 * LET'S RUN SHEET – app/(app)/lets-run.tsx
 *
 * REFERENCE FROM
 * https://docs.expo.dev/router/advanced/modals/
 */

import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ClearingQueueOverlay } from '../../components/lets-run/clearing-queue-overlay';
import { DropCalloutPicker } from '../../components/lets-run/drop-callout-picker';
import { GoalPicker } from '../../components/lets-run/goal-picker';
import { LoadingSteps } from '../../components/lets-run/loading-steps';
import { PlaylistPicker } from '../../components/lets-run/playlist-picker';
import { PlaylistRow } from '../../components/lets-run/playlist-row';
import { QueuePreview } from '../../components/lets-run/queue-preview';
import { SheetSection, sheetTextStyles } from '../../components/lets-run/sheet-section';
import { StartButton } from '../../components/lets-run/start-button';
import { Button } from '../../components/ui/button';
import { useRunSetup } from '../../lib/run-setup/use-run-setup';
import type { PlaylistSummary } from '../../lib/spotify/playlists';
import { colours, fontSizes, spacing } from '../../lib/theme';

export default function LetsRunScreen() {
  const setup = useRunSetup();
  const safeArea = useSafeAreaInsets();
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const isSpotifyConnected = setup.spotify.status === 'connected';
  const isLoading = setup.loadingStep !== null;
  const hasTempoOrder = setup.orderedMs > 0;

  function handleCloseButton() {
    router.back();
  }

  function handleOpenPlaylistButton() {
    setIsPickerOpen(true);
  }

  function handleClosePlaylistButton() {
    setIsPickerOpen(false);
  }

  function handlePickPlaylistButton(playlist: PlaylistSummary) {
    setIsPickerOpen(false);
    setup.choosePlaylist(playlist.id, playlist.name);
  }

  return (
    <ScrollView
      style={styles.sheet}
      contentContainerStyle={[styles.content, { paddingBottom: safeArea.bottom + spacing.extraLarge }]}
    >
        <View style={styles.header}>
          <View style={styles.headerText}>
            <Text style={styles.title}>{"Let's Run"}</Text>
            <Text style={sheetTextStyles.muted}>{"Set your goal, we'll take care of the music."}</Text>
          </View>
          <Pressable onPress={handleCloseButton} hitSlop={10} style={styles.closeButton}>
            <SymbolView name="xmark" tintColor={colours.textSecondary} size={14} />
          </Pressable>
        </View>

        {/* GOAL */}
        <SheetSection title="Goal">
          <GoalPicker goalMinutes={setup.choices.goalMinutes} songsLengthMs={setup.orderedMs} onChange={setup.handleGoalButton} />
        </SheetSection>

        {/* MUSIC LIST */}
        <SheetSection
          title="Music"
          rightSide={
            isSpotifyConnected && setup.orderedSongs.length > 0 ? (
              <Pressable onPress={setup.handleShuffleButton} hitSlop={10} disabled={isLoading}>
                <SymbolView name="shuffle" tintColor={colours.accent} size={18} />
              </Pressable>
            ) : null
          }
        >
          {isSpotifyConnected ? (
            <>
              <PlaylistRow
                playlistName={setup.choices.playlistName}
                isDisabled={isLoading}
                onPress={handleOpenPlaylistButton}
              />
              <LoadingSteps currentStep={setup.loadingStep} />

              {setup.loadError ? (
                <View style={styles.errorRow}>
                  <Text style={styles.errorText}>{setup.loadError}</Text>
                  <Button label="Try again" outlined onPress={setup.handleTryAgainButton} />
                </View>
              ) : null}

              {!isLoading && setup.orderedSongs.length > 0 ? (
                <Text style={sheetTextStyles.muted}>
                  {hasTempoOrder
                    ? setup.orderedSongs.length + ' songs lined up for your ' + setup.choices.goalMinutes + ' minute tempo plan. Songs can change during the run to match how you feel.'
                    : "We couldn't find BPMs for these songs, so they'll play in playlist order."}
                </Text>
              ) : null}

              <QueuePreview songs={setup.orderedSongs} />
            </>
          ) : (
            <SpotifySignIn status={setup.spotify.status} onConnect={setup.spotify.connect} />
          )}
        </SheetSection>

        {/* COACH */}
        <SheetSection title="Beat drop callouts">
          <DropCalloutPicker value={setup.choices.dropCallouts} onChange={setup.handleDropCalloutButton} />
        </SheetSection>

        {/* START */}
        <StartButton
          isStarting={setup.isStarting}
          isDisabled={!isSpotifyConnected || isLoading || setup.orderedSongs.length === 0}
          warning={setup.startWarning}
          error={setup.startError}
          onPress={setup.handleStartButton}
        />

      <ClearingQueueOverlay songCount={setup.clearingSongCount} />

      <PlaylistPicker
        isOpen={isPickerOpen}
        currentPlaylistId={setup.choices.playlistId}
        getAccessToken={setup.spotify.getAccessToken}
        onPick={handlePickPlaylistButton}
        onClose={handleClosePlaylistButton}
      />
    </ScrollView>
  );
}

// SHOWN instead of the playlist when Spotify have yet to be connected
function SpotifySignIn({ status, onConnect }: { status: string; onConnect: () => void }) {
  if (status === 'checking') {
    return <Text style={sheetTextStyles.muted}>Checking Spotify…</Text>;
  }
  return (
    <View style={styles.signIn}>
      <Text style={sheetTextStyles.muted}>Sign in to Spotify to load your playlist. Nothing will start playing yet.</Text>
      <Button label="Sign in to Spotify" spotify onPress={onConnect} isLoading={status === 'connecting'} />
    </View>
  );
}

const styles = StyleSheet.create({
  sheet: {
    flex: 1,
    backgroundColor: colours.surface,
  },
  content: {
    padding: spacing.large,
    paddingTop: spacing.extraLarge,
    gap: spacing.large,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.medium,
  },
  headerText: {
    flex: 1,
    gap: 4,
  },
  title: {
    color: colours.text,
    fontSize: fontSizes.heading - 4,
    fontWeight: '800',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colours.surfaceHigh,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorRow: {
    gap: spacing.small,
  },
  errorText: {
    color: colours.danger,
    fontSize: fontSizes.small,
  },
  signIn: {
    gap: spacing.medium,
  },
});
