/**
 * RUN SUMMARY – components/run/run-summary-card.tsx
 *
 */

import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { clearTrace } from '../../lib/diagnostics/run-trace';
import { getErrorMessage } from '../../lib/errors';
import { formatClock, formatDistance, formatPace } from '../../lib/run/metrics';
import { addToLocalStorage, sendWaitingRuns } from '../../lib/run/run-outbox';
import { buildRunPayload } from '../../lib/run/run-payload';
import { ActiveRun, endRun, getAverageCadence, getAveragePace, getEndedAt, getMovingMs } from '../../lib/run/run-store';
import { colours, fontSizes, spacing } from '../../lib/theme';
import { Button } from '../ui/button';
import { Stat } from '../ui/stat';

export function RunSummaryCard({ run }: { run: ActiveRun }) {
  const [isSaving, setIsSaving] = useState(false);
  const [isSureAboutDiscard, setIsSureAboutDiscard] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const endedAt = getEndedAt(run);
  const averageCadence = getAverageCadence(run, endedAt);

  async function handleSaveButton() {
    setIsSaving(true);
    setErrorMessage(null);
    try {
      await addToLocalStorage(buildRunPayload(run));
      endRun();
      clearTrace();
      sendWaitingRuns(); 
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
      setIsSaving(false);
    }
  }

  function handleDiscardButton() {
    if (!isSureAboutDiscard) {
      setIsSureAboutDiscard(true);
      return;
    }
    endRun();
    clearTrace();
  }

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Nice run!</Text>

      <View style={styles.stats}>
        <Stat label="Time" value={formatClock(getMovingMs(run, endedAt))} />
        <Stat label="Distance" value={formatDistance(run.distanceMetres)} />
      </View>
      <View style={styles.stats}>
        <Stat label="Avg pace /km" value={formatPace(getAveragePace(run, endedAt))} />
        <Stat label="Avg steps /min" value={averageCadence === null ? '--' : String(averageCadence)} />
      </View>

      {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}

      <Button label="Save run" onPress={handleSaveButton} isLoading={isSaving} />
      <Button
        label={isSureAboutDiscard ? 'Tap again to discard' : 'Discard'}
        outlined
        onPress={handleDiscardButton}
        isDisabled={isSaving}
      />
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
  title: {
    color: colours.text,
    fontSize: fontSizes.title + 2,
    fontWeight: '800',
  },
  stats: {
    flexDirection: 'row',
  },
  errorText: {
    color: colours.danger,
    fontSize: fontSizes.small,
  },
});
