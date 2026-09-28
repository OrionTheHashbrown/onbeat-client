/**
 * GOAL PICKER – components/lets-run/goal-picker.tsx
 *
 */

import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SymbolView } from 'expo-symbols';

import { colours, fontSizes, spacing } from '../../lib/theme';
import { sheetTextStyles } from './sheet-section';

type GoalPickerProps = {
  goalMinutes: number;
  songsLengthMs: number; 
  onChange: (direction: 'up' | 'down') => void;
};

export function GoalPicker({ goalMinutes, songsLengthMs, onChange }: GoalPickerProps) {

  function handleMinusButton() {
    onChange('down');
  }

  function handlePlusButton() {
    onChange('up');
  }

  return (
    <View style={styles.wrapper}>
      <Text style={styles.smallHeading}>AIM FOR THIS RUN</Text>

      <View
        style={styles.row}
      >
        <Text style={styles.bigNumber}>{goalMinutes}</Text>
        <Text style={styles.unit}>min</Text>

        {songsLengthMs > 0 ? <Text style={styles.estimate}>{calculateFullLength(songsLengthMs)}</Text> : null}

        <View style={styles.buttons}>
          <RoundButton icon="minus" onPress={handleMinusButton} />
          <RoundButton icon="plus" onPress={handlePlusButton} />
        </View>
      </View>

      {songsLengthMs > 0 ? (
        <Text style={sheetTextStyles.muted}>{explainDifference(songsLengthMs, goalMinutes)}</Text>
      ) : null}
    </View>
  );
}

function RoundButton({ icon, onPress }: { icon: 'minus' | 'plus'; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} hitSlop={8} style={({ pressed }) => [styles.roundButton, pressed && styles.pressed]}>
      <SymbolView name={icon} tintColor={colours.text} size={14} />
    </Pressable>
  );
}

// CALCULATE the total length of the songs in the playlist
function calculateFullLength(lengthMs: number): string {
  const totalSeconds = Math.round(lengthMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return '~' + minutes + ' min ' + seconds + ' sec';
}

// EXPLAIN why the music doesn't match the goal exactly
function explainDifference(lengthMs: number, goalMinutes: number): string {
  const differenceSeconds = Math.round((lengthMs - goalMinutes * 60 * 1000) / 1000);
  if (differenceSeconds === 0) {
    return 'Exactly your aim, to the second.';
  }
  const minutes = Math.floor(Math.abs(differenceSeconds) / 60);
  const seconds = Math.abs(differenceSeconds) % 60;
  let amount = seconds + ' sec';
  if (minutes > 0) {
    amount = minutes + ' min ' + seconds + ' sec';
  }
  if (differenceSeconds > 0) {
    return amount + ' past your aim, so the last song gets to finish.';
  }
  return amount + ' short of your aim, add more songs to the playlist to cover it.';
}

const styles = StyleSheet.create({
  wrapper: {
    gap: spacing.small,
  },
  smallHeading: {
    color: colours.textMuted,
    fontSize: fontSizes.hint,
    fontWeight: '700',
    letterSpacing: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  bigNumber: {
    color: colours.text,
    fontSize: 44,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  unit: {
    color: colours.textSecondary,
    fontSize: fontSizes.body,
    fontWeight: '600',
  },
  estimate: {
    flex: 1,
    color: colours.textMuted,
    fontSize: fontSizes.small,
    marginLeft: spacing.small,
  },
  buttons: {
    flexDirection: 'row',
    gap: spacing.small,
    marginLeft: 'auto',
    alignSelf: 'center',
  },
  roundButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colours.surfaceHigh,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.7,
  },
});
