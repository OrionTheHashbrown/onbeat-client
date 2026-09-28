/**
 * RUN WIDGET – components/run/run-widget.tsx
 *
 */

import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SymbolView } from 'expo-symbols';
import { router } from 'expo-router';
import { easeOffFromButton, pushFromButton } from '../../lib/coach/coach';
import { recordEvent, useTrace } from '../../lib/diagnostics/run-trace';
import { setVoiceOn, useCoachVoice } from '../../lib/coach/voice';
import { formatClock, formatDistance, formatPace } from '../../lib/run/metrics';
import {
  ActiveRun,
  getCadence,
  getCurrentPace,
  getCurrentStage,
  getMovingMs,
  pauseRun,
  resumeRun,
} from '../../lib/run/run-store';
import { useNowPlaying } from '../../lib/spotify/now-playing';
import { colours, fontSizes, spacing } from '../../lib/theme';
import { Button } from '../ui/button';
import { Stat } from '../ui/stat';

type RunWidgetProps = {
  run: ActiveRun;
  onEnd: () => void;
};

export function RunWidget({ run, onEnd }: RunWidgetProps) {
  const nowPlaying = useNowPlaying();
  const coachVoice = useCoachVoice();
  const trace = useTrace(); 
  const [now, setNow] = useState(() => Date.now());

  // UPDATE every second so the clock and pace update in real time
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const stage = getCurrentStage(run, now);
  const cadence = getCadence(run);
  const isPaused = run.status === 'paused';

  // SHOW the last coach line for 7 seconds after it was spoken
  const showCoachLine = coachVoice.lastLine !== null && now - coachVoice.lastLineAt < 7000;

  function handlePauseButton() {
    recordEvent('run', 'Paused');
    pauseRun();
  }

  function handleResumeButton() {
    resumeRun();
    recordEvent('run', 'Resumed');
  }

  function handleDiagnosticsButton() {
    router.push('/diagnostics');
  }

  function handleVoiceButton() {
    setVoiceOn(!coachVoice.isVoiceOn);
  }

  function handleEaseOffButton() {
    easeOffFromButton();
  }

  function handlePushButton() {
    pushFromButton();
  }

  return (
    <View style={styles.card}>
      <View style={styles.topRow}>
        <Text style={styles.stageName}>{isPaused ? 'PAUSED' : stage ? stage.name.toUpperCase() : 'RUNNING'}</Text>
        <View style={styles.topButtons}>
          {trace ? (
            <Pressable onPress={handleDiagnosticsButton} hitSlop={10} style={styles.voiceButton}>
              <SymbolView name="ladybug.fill" tintColor={colours.textSecondary} size={18} />
            </Pressable>
          ) : null}
          <Pressable onPress={handleVoiceButton} hitSlop={10} style={styles.voiceButton}>
            <SymbolView
              name={coachVoice.isVoiceOn ? 'speaker.wave.2.fill' : 'speaker.slash.fill'}
              tintColor={coachVoice.isVoiceOn ? colours.accent : colours.textMuted}
              size={18}
            />
          </Pressable>
        </View>
      </View>

      {run.backgroundTracking ? null : <Text style={styles.screenOnHint}>Keep the screen on to record</Text>}

      {showCoachLine ? (
        <View style={styles.coachLine}>
          <SymbolView name="megaphone.fill" tintColor={colours.accent} size={14} />
          <Text style={styles.coachLineText}>{coachVoice.lastLine}</Text>
        </View>
      ) : null}

      <View style={styles.stats}>
        <Stat label="Time" value={formatClock(getMovingMs(run, now))} />
        <Stat label="Distance" value={formatDistance(run.distanceMetres)} />
      </View>
      <View style={styles.stats}>
        <Stat label="Pace /km" value={formatPace(getCurrentPace(run, now))} />
        <Stat label="Steps /min" value={cadence === null ? '--' : String(cadence)} />
      </View>

      {nowPlaying ? (
        <View style={styles.songRow}>
          <SymbolView name="music.note" tintColor={colours.spotifyGreen} size={14} />
          <Text style={styles.songText} numberOfLines={1}>
            {nowPlaying.title} – {nowPlaying.artist}
          </Text>
        </View>
      ) : null}

      {!isPaused ? (
        <View style={styles.buttons}>
          <View style={styles.buttonSlot}>
            <Button label="Ease off" icon="minus" tall outlined onPress={handleEaseOffButton} />
          </View>
          <View style={styles.buttonSlot}>
            <Button label="Push me" icon="plus" tall outlined onPress={handlePushButton} />
          </View>
        </View>
      ) : null}

      <View style={styles.buttons}>
        <View style={styles.buttonSlot}>
          {isPaused ? (
            <Button label="Resume" onPress={handleResumeButton} />
          ) : (
            <Button label="Pause" outlined onPress={handlePauseButton} />
          )}
        </View>
        <View style={styles.buttonSlot}>
          <Button label="End" danger onPress={onEnd} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colours.surface,
    borderColor: colours.border,
    borderWidth: 1,
    borderRadius: 22,
    padding: spacing.large + 2,
    gap: spacing.medium + 2,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  stageName: {
    color: colours.accent,
    fontSize: fontSizes.small,
    fontWeight: '800',
    letterSpacing: 1,
  },
  topButtons: {
    flexDirection: 'row',
    gap: spacing.medium,
  },
  voiceButton: {
    padding: 4,
  },
  screenOnHint: {
    color: colours.warn,
    fontSize: fontSizes.hint,
  },
  coachLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.small,
    backgroundColor: colours.surfaceRaised,
    borderRadius: 12,
    paddingVertical: spacing.small,
    paddingHorizontal: spacing.medium,
  },
  coachLineText: {
    flex: 1,
    color: colours.text,
    fontSize: fontSizes.small,
    fontWeight: '600',
  },
  stats: {
    flexDirection: 'row',
  },
  songRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  songText: {
    flex: 1,
    color: colours.textSecondary,
    fontSize: fontSizes.small,
  },
  buttons: {
    flexDirection: 'row',
    gap: spacing.medium,
  },
  buttonSlot: {
    flex: 1,
  },
});
