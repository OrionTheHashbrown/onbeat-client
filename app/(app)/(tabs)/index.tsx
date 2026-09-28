/**
 * HOME TAB – app/(app)/(tabs)/index.tsx
 *
 * REFERENCE FROM
 * https://docs.expo.dev/router/reference/hooks/#usefocuseffect
 */

import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, AppState, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { RunRow } from '../../../components/history/run-row';
import { Screen } from '../../../components/ui/screen';
import { getErrorMessage } from '../../../lib/errors';
import { deleteHistoryRun, HistoryRun, loadHistoryList } from '../../../lib/run/run-history';
import { getDisplayName, useSignedInUser } from '../../../lib/session';
import { colours, fontSizes, spacing } from '../../../lib/theme';

export default function HomeScreen() {
  const user = useSignedInUser();
  const [runs, setRuns] = useState<HistoryRun[] | null>(null); 
  const [couldNotReachServer, setCouldNotReachServer] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  async function loadRuns() {
    const list = await loadHistoryList();
    setRuns(list.runs);
    setCouldNotReachServer(list.couldNotReachServer);
  }

  // DELETE a run from list
  async function handleDeleteButton(runToDelete: HistoryRun) {
    setDeleteError(null);
    if (runs) {
      setRuns(runs.filter((run) => run.key !== runToDelete.key));
    }
    try {
      await deleteHistoryRun(runToDelete);
    } catch (error) {
      setDeleteError("ERROR: Could not delete this run -  " + getErrorMessage(error));
      loadRuns();
    }
  }

  async function handlePullToRefresh() {
    setIsRefreshing(true);
    await loadRuns();
    setIsRefreshing(false);
  }

  useFocusEffect(
    useCallback(() => {
      loadRuns();
    }, []),
  );

  useEffect(() => {
    const listener = AppState.addEventListener('change', (appState) => {
      if (appState === 'active') {
        loadRuns();
      }
    });
    return () => listener.remove();
  }, []);

  return (
    <Screen title={'Hello, ' + getDisplayName(user)} onRefresh={handlePullToRefresh} isRefreshing={isRefreshing}>
      <Text style={styles.sectionTitle}>Your runs</Text>

      {couldNotReachServer ? (
        <Text style={styles.warning}>{"SERVER UNREACHABLE - Runs may not be fully up to date."}</Text>
      ) : null}

      {deleteError ? <Text style={styles.error}>{deleteError}</Text> : null}

      {runs === null ? <ActivityIndicator color={colours.accent} style={styles.spinner} /> : null}

      {runs !== null && runs.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>No runs yet</Text>
          <Text style={styles.emptyText}>
            {couldNotReachServer
              ? 'SAVING RUN IN LOCAL STORAGE FIRST - will sync back when the server is reachable.'
              : 'Head to the Run tab and start one. It will show up here when you finish.'}
          </Text>
        </View>
      ) : null}

      {runs !== null ? (
        <GestureHandlerRootView style={styles.list}>
          {runs.map((run) => <RunRow key={run.key} run={run} onDelete={handleDeleteButton} />)}
        </GestureHandlerRootView>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  sectionTitle: {
    color: colours.textSecondary,
    fontSize: fontSizes.body,
    fontWeight: '700',
  },
  warning: {
    color: colours.warn,
    fontSize: fontSizes.small,
  },
  error: {
    color: colours.danger,
    fontSize: fontSizes.small,
  },
  list: {
    gap: spacing.medium,
  },
  spinner: {
    marginTop: spacing.extraLarge,
  },
  empty: {
    alignItems: 'center',
    gap: spacing.small,
    marginTop: spacing.extraLarge * 2,
    paddingHorizontal: spacing.extraLarge,
  },
  emptyTitle: {
    color: colours.text,
    fontSize: fontSizes.title,
    fontWeight: '700',
  },
  emptyText: {
    color: colours.textSecondary,
    fontSize: fontSizes.small,
    lineHeight: 19,
    textAlign: 'center',
  },
});
