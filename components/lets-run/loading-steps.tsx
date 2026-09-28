import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { SymbolView } from 'expo-symbols';
import type { LoadingStep } from '../../lib/run-setup/use-run-setup';
import { colours, fontSizes, spacing } from '../../lib/theme';

const steps: { id: Exclude<LoadingStep, null>; label: string }[] = [
  { id: 'playlist', label: 'Reading your playlist' },
  { id: 'tempo', label: 'Analysing tempo' },
];

export function LoadingSteps({ currentStep }: { currentStep: LoadingStep }) {
  if (currentStep === null) {
    return null;
  }

  const currentIndex = steps.findIndex((step) => step.id === currentStep);

  return (
    <View style={styles.box}>
      {steps.map((step, index) => {
        const isDone = index < currentIndex;
        const isNow = index === currentIndex;
        return (
          <View key={step.id} style={styles.row}>
            {isDone ? <SymbolView name="checkmark" tintColor={colours.accentDim} size={14} /> : null}
            {isNow ? <ActivityIndicator size="small" color={colours.accent} /> : null}
            {!isDone && !isNow ? <View style={styles.waitingDot} /> : null}
            <Text style={[styles.label, isNow && styles.labelNow, !isDone && !isNow && styles.labelWaiting]}>
              {step.label}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    gap: spacing.small,
    paddingVertical: spacing.small,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.small,
    minHeight: 20,
  },
  waitingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 3,
    backgroundColor: colours.surfaceHigh,
  },
  label: {
    color: colours.textSecondary,
    fontSize: fontSizes.small,
  },
  labelNow: {
    color: colours.text,
    fontWeight: '600',
  },
  labelWaiting: {
    color: colours.textMuted,
  },
});
