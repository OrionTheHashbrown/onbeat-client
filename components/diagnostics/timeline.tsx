/**
 * RUN TIMELINE – components/diagnostics/timeline.tsx
 *
 */

import { StyleSheet, Text, View } from 'react-native';

import type { TraceEvent } from '../../lib/diagnostics/run-trace';
import { colours, fontSizes, spacing } from '../../lib/theme';

// THE little tag on the left of each event
function describeKind(kind: TraceEvent['kind']): string {
  if (kind === 'said') {
    return 'SAID';
  }
  if (kind === 'detected') {
    return 'SAW';
  }
  if (kind === 'tempo-change') {
    return 'TEMPO';
  }
  if (kind === 'song-queued') {
    return 'QUEUED';
  }
  if (kind === 'song-started') {
    return 'PLAYING';
  }
  return 'RUN';
}

function formatTimeOfDay(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit', second: '2-digit' });
}

export function Timeline({ events }: { events: TraceEvent[] }) {
  const newestFirst: TraceEvent[] = [];
  for (let index = events.length - 1; index >= 0; index--) {
    newestFirst.push(events[index]);
  }

  return (
    <View style={styles.list}>
      {newestFirst.length === 0 ? <Text style={styles.empty}>Nothing yet.</Text> : null}
      {newestFirst.map((event, index) => {
        return (
          <View key={index} style={styles.eventRow}>
            <Text style={styles.time}>{formatTimeOfDay(event.happenedAt)}</Text>
            <Text style={styles.tag}>{describeKind(event.kind)}</Text>
            <Text style={styles.detail}>{event.detail}</Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: spacing.small + 2,
  },
  empty: {
    color: colours.textSecondary,
    fontSize: fontSizes.small,
  },
  eventRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.small,
  },
  time: {
    color: colours.textMuted,
    fontSize: fontSizes.hint,
    fontVariant: ['tabular-nums'],
    width: 78,
  },
  tag: {
    color: colours.textSecondary,
    fontSize: 10,
    fontWeight: '800',
    width: 56,
    paddingTop: 1,
  },
  detail: {
    flex: 1,
    color: colours.text,
    fontSize: fontSizes.hint + 1,
    lineHeight: 17,
  },
});
