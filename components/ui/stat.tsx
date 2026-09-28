import { StyleSheet, Text, View } from 'react-native';
import { colours, fontSizes } from '../../lib/theme';

type StatProps = {
  label: string;
  value: string;
};

export function Stat({ label, value }: StatProps) {
  return (
    <View style={styles.stat}>
      <Text style={styles.value} numberOfLines={1} maxFontSizeMultiplier={1.3}>
        {value}
      </Text>
      <Text style={styles.label} maxFontSizeMultiplier={1.2}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  stat: {
    flex: 1,
    gap: 3,
  },
  value: {
    color: colours.text,
    fontSize: fontSizes.title,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  label: {
    color: colours.textSecondary,
    fontSize: fontSizes.hint,
  },
});
