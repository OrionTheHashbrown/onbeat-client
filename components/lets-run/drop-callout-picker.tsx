import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { DropCallouts } from '../../lib/run-setup/saved-choices';
import { colours, fontSizes, spacing } from '../../lib/theme';
import { sheetTextStyles } from './sheet-section';

const options: { value: DropCallouts; label: string; hint: string }[] = [
  {
    value: 'build-and-peak',
    label: 'Build + Peak',
    hint: 'Your coach calls out beat drops during the Build and Peak stages.',
  },
  {
    value: 'every-song',
    label: 'Every song',
    hint: 'Your coach calls out every beat drop, in every stage.',
  },
  {
    value: 'off',
    label: 'Off',
    hint: 'No beat drop callouts. Your coach announce the start of a new stage.',
  },
];

type DropCalloutPickerProps = {
  value: DropCallouts;
  onChange: (value: DropCallouts) => void;
};

export function DropCalloutPicker({ value, onChange }: DropCalloutPickerProps) {
  const selected = options.find((option) => option.value === value) ?? options[0];

  function handleOptionButton(newValue: DropCallouts) {
    onChange(newValue);
  }

  return (
    <View style={styles.wrapper}>
      <View style={styles.segments}>
        {options.map((option) => {
          const isSelected = option.value === value;
          return (
            <Pressable
              key={option.value}
              onPress={() => handleOptionButton(option.value)}
              style={[styles.segment, isSelected && styles.segmentSelected]}
            >
              <Text style={[styles.segmentLabel, isSelected && styles.segmentLabelSelected]}>{option.label}</Text>
            </Pressable>
          );
        })}
      </View>
      <Text style={sheetTextStyles.muted}>{selected.hint}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: spacing.small,
  },
  segments: {
    flexDirection: 'row',
    backgroundColor: colours.surfaceHigh,
    borderRadius: 12,
    padding: 3,
  },
  segment: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.small,
    borderRadius: 9,
  },
  segmentSelected: {
    backgroundColor: colours.accent,
  },
  segmentLabel: {
    color: colours.textSecondary,
    fontSize: fontSizes.small,
    fontWeight: '600',
  },
  segmentLabelSelected: {
    color: colours.onAccent,
    fontWeight: '700',
  },
});
