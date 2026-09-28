import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SymbolView, SymbolViewProps } from 'expo-symbols';
import { colours, fontSizes, spacing } from '../../lib/theme';

type StartRunCardProps = {
  onPress: () => void;
  onHeightMeasured: (height: number) => void; 
};

export function StartRunCard({ onPress, onHeightMeasured }: StartRunCardProps) {
  return (
    <Pressable
      onPress={onPress}
      onLayout={(event) => onHeightMeasured(event.nativeEvent.layout.height)}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <View style={styles.topRow}>
        <View style={styles.headings}>
          <Text style={styles.smallHeading}>{"LET'S GET MOVING"}</Text>
          <Text style={styles.bigHeading}>Start a new run?</Text>
        </View>
        <View style={styles.playCircle}>
          <SymbolView name="play.fill" tintColor={colours.accent} size={24} />
        </View>
      </View>

      <View style={styles.chipRow}>
        <Chip icon="waveform.path.ecg" label="Tempo plan" />
        <Chip icon="music.note" label="Auto-match BPM" />
      </View>
    </Pressable>
  );
}

function Chip({ icon, label }: { icon: SymbolViewProps['name']; label: string }) {
  return (
    <View style={styles.chip}>
      <SymbolView name={icon} tintColor={colours.onAccent} size={15} />
      <Text style={styles.chipLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colours.accent,
    borderRadius: 28,
    padding: spacing.extraLarge,
    gap: 20,
  },
  pressed: {
    opacity: 0.9,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.medium,
  },
  headings: {
    flex: 1,
    gap: 6,
  },
  smallHeading: {
    color: colours.onAccent,
    fontSize: fontSizes.small,
    fontWeight: '600',
    letterSpacing: 1,
  },
  bigHeading: {
    color: colours.onAccent,
    fontSize: 30,
    fontWeight: '700',
  },
  playCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colours.onAccent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(11,10,9,0.10)',
    borderRadius: 20,
    paddingVertical: spacing.small,
    paddingHorizontal: spacing.medium,
  },
  chipLabel: {
    color: colours.onAccent,
    fontSize: fontSizes.hint,
    fontWeight: '600',
  },
});
