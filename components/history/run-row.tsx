/**
 * RUN ROW – components/history/run-row.tsx
 *
 * REFERENCE FROM
 * https://docs.swmansion.com/react-native-gesture-handler/docs/components/reanimated_swipeable
 */

import { Pressable, StyleSheet, Text, View } from 'react-native';
import ReanimatedSwipeable, { SwipeableMethods } from 'react-native-gesture-handler/ReanimatedSwipeable';
import { router } from 'expo-router';
import { SymbolView } from 'expo-symbols';

import { formatClock, formatDistance, formatPace, formatRunDate } from '../../lib/run/metrics';
import type { HistoryRun } from '../../lib/run/run-history';
import { colours, fontSizes, spacing } from '../../lib/theme';

type RunRowProps = {
  run: HistoryRun;
  onDelete: (run: HistoryRun) => void;
};

export function RunRow({ run, onDelete }: RunRowProps) {

  function handleOpenRunButton() {
    router.push({ pathname: '/runs/[id]', params: { id: run.key } });
  }

  // CLOSE the swipe first, THEN delete
  function handleDeleteButton(swipeable: SwipeableMethods) {
    swipeable.close();
    onDelete(run);
  }

  function renderDeleteButton(_progress: unknown, _translation: unknown, swipeable: SwipeableMethods) {
    return (
      <Pressable
        onPress={() => handleDeleteButton(swipeable)}
        style={styles.deleteButton}
      >
        <SymbolView name="trash.fill" tintColor={colours.text} size={20} />
        <Text style={styles.deleteLabel}>Delete</Text>
      </Pressable>
    );
  }

  return (
    <ReanimatedSwipeable
      renderRightActions={renderDeleteButton}
      rightThreshold={40}
      friction={2}
      overshootRight={false}
    >
      <Pressable
        onPress={handleOpenRunButton}
        style={styles.card}
      >
        <View style={styles.text}>
          <View style={styles.topLine}>
            <Text style={styles.distance}>{formatDistance(run.distanceM)}</Text>
            {run.isWaiting ? <Text style={styles.waitingChip}>NOT SYNCED</Text> : null}
          </View>
          <Text style={styles.details}>
            {formatRunDate(run.startedAt)} · {formatClock(run.movingMs)} · {formatPace(run.avgPaceMsPerKm)} /km
          </Text>
        </View>
        <SymbolView name="chevron.right" tintColor={colours.textMuted} size={14} />
      </Pressable>
    </ReanimatedSwipeable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.medium,
    backgroundColor: colours.surface,
    borderColor: colours.border,
    borderWidth: 1,
    borderRadius: 18,
    padding: spacing.large + 2,
  },
  deleteButton: {
    width: 88,
    marginLeft: spacing.small,
    borderRadius: 18,
    backgroundColor: colours.danger,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  deleteLabel: {
    color: colours.text,
    fontSize: fontSizes.hint,
    fontWeight: '700',
  },
  text: {
    flex: 1,
    gap: 6,
  },
  topLine: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.medium,
  },
  distance: {
    color: colours.accent,
    fontSize: 24,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  waitingChip: {
    color: colours.warn,
    borderColor: colours.warn,
    borderWidth: 1,
    borderRadius: 999,
    paddingVertical: 2,
    paddingHorizontal: 8,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
    overflow: 'hidden',
  },
  details: {
    color: colours.textSecondary,
    fontSize: fontSizes.small,
  },
});
