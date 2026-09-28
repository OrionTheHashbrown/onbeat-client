import { StyleSheet, Text } from 'react-native';
import { colours, fontSizes, spacing } from '../../lib/theme';

export function SectionLabel({ text }: { text: string }) {
  return <Text style={styles.label}>{text.toUpperCase()}</Text>;
}

const styles = StyleSheet.create({
  label: {
    color: colours.textMuted,
    fontSize: fontSizes.hint,
    fontWeight: '700',
    letterSpacing: 1,
    marginTop: spacing.medium,
  },
});
