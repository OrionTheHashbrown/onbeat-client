import { StyleSheet, Text, View } from 'react-native';
import { getGpsBarCount, GpsStrength } from '../../lib/location/gps-strength';
import { colours, fontSizes, spacing } from '../../lib/theme';

type GpsPillProps = {
  strength: GpsStrength | null; 
  accuracy: number | null;
};

export function GpsPill({ strength, accuracy }: GpsPillProps) {
  if (strength === null) {
    return (
      <View style={styles.pill}>
        <Text style={styles.label}>FINDING GPS…</Text>
      </View>
    );
  }

  const litBars = getGpsBarCount(strength);

  let barColour = colours.textMuted;
  if (strength === 'strong') {
    barColour = colours.accent;
  } else if (strength === 'okay') {
    barColour = colours.accentDim;
  }

  return (
    <View style={styles.pill}>
      <Text style={styles.label}>GPS</Text>

      <View style={styles.bars}>
        <View style={[styles.bar, styles.shortBar, { backgroundColor: litBars >= 1 ? barColour : colours.surfaceHigh }]} />
        <View style={[styles.bar, styles.middleBar, { backgroundColor: litBars >= 2 ? barColour : colours.surfaceHigh }]} />
        <View style={[styles.bar, styles.tallBar, { backgroundColor: litBars >= 3 ? barColour : colours.surfaceHigh }]} />
      </View>

      {accuracy !== null ? <Text style={styles.accuracy}>±{Math.round(accuracy)} m</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: spacing.small,
    backgroundColor: colours.surface,
    borderColor: colours.border,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: spacing.medium,
    paddingVertical: 7,
  },
  label: {
    color: colours.text,
    fontSize: fontSizes.hint,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  bars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 3,
  },
  bar: {
    width: 3,
    borderRadius: 1.5,
  },
  shortBar: {
    height: 7,
  },
  middleBar: {
    height: 10,
  },
  tallBar: {
    height: 13,
  },
  accuracy: {
    color: colours.textMuted,
    fontSize: fontSizes.hint,
    fontWeight: '700',
  },
});
