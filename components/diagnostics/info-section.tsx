import { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colours, fontSizes, spacing } from '../../lib/theme';

export function InfoSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.title}>{title.toUpperCase()}</Text>
      {children}
    </View>
  );
}

type InfoRowProps = {
  label: string;
  value: string;
  highlight?: boolean; 
};

export function InfoRow({ label, value, highlight }: InfoRowProps) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Text style={[styles.value, highlight && styles.highlight]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: 6,
    paddingVertical: spacing.small,
  },
  title: {
    color: colours.textMuted,
    fontSize: fontSizes.hint - 1,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 2,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.medium,
  },
  label: {
    color: colours.textSecondary,
    fontSize: fontSizes.hint,
    width: 110,
  },
  value: {
    flex: 1,
    color: colours.text,
    fontSize: fontSizes.hint,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },
  highlight: {
    fontWeight: '800',
  },
});
