/**
 * RUN DETAILS – app/(app)/runs/[id].tsx
 *
 * REFERENCE FROM
 * https://docs.expo.dev/router/reference/url-parameters/
 */

import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RunMap } from '../../../components/run/run-map';
import { Stat } from '../../../components/ui/stat';
import { getErrorMessage } from '../../../lib/errors';
import { formatClock, formatDistance, formatPace, formatRunDate } from '../../../lib/run/metrics';
import { HistoryRun, loadOneRun } from '../../../lib/run/run-history';
import { Adjustment } from '../../../lib/tempo/plan';
import { colours, cornerRadius, fontSizes, spacing } from '../../../lib/theme';

export default function RunDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const safeArea = useSafeAreaInsets();
  const screen = useWindowDimensions();

  const [run, setRun] = useState<HistoryRun | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    loadOneRun(id)
      .then((foundRun) => {
        if (foundRun) {
          setRun(foundRun);
        } else {
          setErrorMessage("This run couldn't be found. It may have been deleted.");
        }
      })
      .catch((error) => setErrorMessage(getErrorMessage(error)))
      .finally(() => setIsLoading(false));
  }, [id]);

  function handleBackButton() {
    router.back();
  }

  // INITIALISE map height to roughly 42% of the screen
  const mapHeight = Math.round(screen.height * 0.42);

  // DRAW the shape of the run from the saved route ([lat, lng, time] lists) into map points
  const routeLines: { latitude: number; longitude: number }[][] = [];
  if (run) {
    for (const line of run.route) {
      const points = [];
      for (const [latitude, longitude] of line) {
        points.push({ latitude, longitude });
      }
      routeLines.push(points);
    }
  }

  return (
    <View style={styles.screen}>
      <View style={[styles.mapBand, { height: mapHeight }]}>
        {run && routeLines.length > 0 ? (
          <RunMap showUserDot={false} followUser={false} routeLines={routeLines} fitWholeRoute />
        ) : (
          <View style={styles.noMap}>
            {run ? <Text style={styles.muted}>No route was recorded for this run.</Text> : null}
          </View>
        )}
        <Pressable
          onPress={handleBackButton}
          hitSlop={8}
          style={[styles.backButton, { top: safeArea.top + spacing.small }]}
        >
          <SymbolView name="chevron.left" tintColor={colours.text} size={18} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: safeArea.bottom + spacing.extraLarge }]}>
        {isLoading ? <ActivityIndicator color={colours.accent} /> : null}
        {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
        {run ? <RunDetails run={run} /> : null}
      </ScrollView>
    </View>
  );
}

function RunDetails({ run }: { run: HistoryRun }) {
  return (
    <>
      <View style={styles.titleBlock}>
        <Text style={styles.title}>{formatRunDate(run.startedAt)}</Text>
        {run.isWaiting ? (
          <Text style={styles.warning}>{"Not synced yet. It'll upload next time you have signal."}</Text>
        ) : null}
      </View>

      <View style={styles.card}>
        <View style={styles.statRow}>
          <Stat label="Distance" value={formatDistance(run.distanceM)} />
          <Stat label="Time" value={formatClock(run.movingMs)} />
        </View>
        <View style={styles.statRow}>
          <Stat label="Avg pace /km" value={formatPace(run.avgPaceMsPerKm)} />
          <Stat label="Avg steps /min" value={run.avgCadenceSpm === null ? '--' : String(run.avgCadenceSpm)} />
        </View>
        <View style={styles.statRow}>
          <Stat label="Steps" value={run.totalSteps === null ? '--' : String(run.totalSteps)} />
          <Stat label="Goal" value={run.goalAmount === null ? '--' : run.goalAmount + ' min'} />
        </View>
      </View>

      {run.plan.length > 0 ? (
        <>
          <Text style={styles.sectionTitle}>Tempo plan</Text>
          <View style={styles.card}>
            {run.plan.map((stage) => (
              <View key={stage.id} style={styles.stageRow}>
                <Text style={styles.stageName}>{stage.name}</Text>
                <Text style={styles.muted}>
                  {formatClock(stage.startMs)} – {formatClock(stage.endMs)}
                </Text>
                <Text style={styles.stageBpm}>{stage.targetBpm} BPM</Text>
              </View>
            ))}
          </View>
        </>
      ) : null}

      {run.adjustments.length > 0 ? (
        <>
          <Text style={styles.sectionTitle}>Tempo changes during the run</Text>
          <View style={styles.card}>
            {run.adjustments.map((adjustment, index) => (
              <View key={index} style={styles.stageRow}>
                <Text style={styles.stageName}>{describeAdjustment(adjustment)}</Text>
                <Text style={styles.muted}>at {formatClock(adjustment.atMs)}</Text>
                <Text style={styles.stageBpm}>
                  {adjustment.deltaBpm > 0 ? '+' : ''}
                  {Math.round(adjustment.deltaBpm)} BPM
                </Text>
              </View>
            ))}
          </View>
        </>
      ) : null}
    </>
  );
}

// TURN the reason code into plain words
function describeAdjustment(adjustment: Adjustment): string {
  if (adjustment.reason === 'struggling') {
    return 'Eased off';
  }
  if (adjustment.reason === 'recovered') {
    return 'Picked back up';
  }
  if (adjustment.reason === 'manual-ease') {
    return 'You eased off';
  }
  if (adjustment.reason === 'manual-push') {
    return 'You pushed';
  }
  return 'Beat drop';
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colours.background,
  },
  mapBand: {
    backgroundColor: colours.surface,
  },
  noMap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButton: {
    position: 'absolute',
    left: spacing.large,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colours.surface,
    borderColor: colours.border,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    padding: spacing.large,
    gap: spacing.medium,
  },
  titleBlock: {
    gap: 4,
  },
  title: {
    color: colours.text,
    fontSize: fontSizes.title + 4,
    fontWeight: '800',
  },
  warning: {
    color: colours.warn,
    fontSize: fontSizes.small,
  },
  errorText: {
    color: colours.danger,
    fontSize: fontSizes.small,
  },
  sectionTitle: {
    color: colours.textSecondary,
    fontSize: fontSizes.body,
    fontWeight: '700',
    marginTop: spacing.small,
  },
  card: {
    backgroundColor: colours.surface,
    borderColor: colours.border,
    borderWidth: 1,
    borderRadius: cornerRadius + 4,
    padding: spacing.large,
    gap: spacing.large,
  },
  statRow: {
    flexDirection: 'row',
  },
  stageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.small,
  },
  stageName: {
    flex: 1,
    color: colours.text,
    fontSize: fontSizes.body - 1,
    fontWeight: '600',
  },
  stageBpm: {
    color: colours.accent,
    fontSize: fontSizes.small,
    fontWeight: '700',
    minWidth: 64,
    textAlign: 'right',
  },
  muted: {
    color: colours.textSecondary,
    fontSize: fontSizes.small,
  },
});
