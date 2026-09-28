/**
 * DIAGNOSTICS SCREEN – app/(app)/diagnostics.tsx
 *
 */

import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ClockSection,
  CoachSection,
  PaceCheckSection,
  QueueSection,
  RunnerSection,
  SongSection,
  TargetSection,
} from '../../components/diagnostics/live-sections';
import { Timeline } from '../../components/diagnostics/timeline';
import { useTrace } from '../../lib/diagnostics/run-trace';
import { useActiveRun } from '../../lib/run/run-store';
import { colours, fontSizes, spacing } from '../../lib/theme';

export default function DiagnosticsScreen() {
  const trace = useTrace();
  const run = useActiveRun();
  const safeArea = useSafeAreaInsets();
  const [now, setNow] = useState(() => Date.now());

  // REFRESHES the state so the clock and pace update in real time
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  function handleCloseButton() {
    router.back();
  }

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[styles.content, { paddingBottom: safeArea.bottom + spacing.extraLarge }]}
    >
      <View style={styles.header}>
        <Text style={styles.title}>Diagnostics</Text>
        <Pressable onPress={handleCloseButton} hitSlop={10} style={styles.closeButton}>
          <SymbolView name="xmark" tintColor={colours.text} size={16} />
        </Pressable>
      </View>

      {!trace || !run ? <Text style={styles.muted}>Diagnostics is turned off for this run.</Text> : null}

      {trace && run ? (
        <>
          <Text style={styles.sectionTitle}>Right now</Text>
          <ClockSection run={run} now={now} />
          <RunnerSection run={run} now={now} />
          <PaceCheckSection run={run} now={now} />
          <TargetSection run={run} now={now} />
          <SongSection run={run} now={now} />
          <QueueSection now={now} />
          <CoachSection now={now} />

          <Text style={styles.sectionTitle}>Timeline</Text>
          <Timeline events={trace.events} />

        </>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colours.background,
  },
  content: {
    padding: spacing.large,
    paddingTop: spacing.extraLarge,
    gap: spacing.medium,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    color: colours.text,
    fontSize: fontSizes.heading - 4,
    fontWeight: '800',
  },
  closeButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    color: colours.textSecondary,
    fontSize: fontSizes.body,
    fontWeight: '700',
    marginTop: spacing.small,
  },
  muted: {
    color: colours.textSecondary,
    fontSize: fontSizes.small,
    lineHeight: 18,
  },
});
