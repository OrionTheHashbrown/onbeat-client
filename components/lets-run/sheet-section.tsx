import { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colours, cornerRadius, fontSizes, spacing } from '../../lib/theme';

type SheetSectionProps = {
  title: string;
  rightSide?: ReactNode; 
  children: ReactNode;
};

export function SheetSection({ title, rightSide, children }: SheetSectionProps) {
  return (
    <View style={styles.section}>
      <View style={styles.titleRow}>
        <Text style={styles.title}>{title}</Text>
        {rightSide}
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    backgroundColor: colours.surfaceRaised,
    borderColor: colours.border,
    borderWidth: 1,
    borderRadius: cornerRadius + 4,
    padding: spacing.large,
    gap: spacing.medium,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.small,
  },
  title: {
    color: colours.text,
    fontSize: 17,
    fontWeight: '700',
  },
});

export const sheetTextStyles = StyleSheet.create({
  muted: {
    color: colours.textSecondary,
    fontSize: fontSizes.small,
    lineHeight: 18,
  },
  greyLabel: {
    color: colours.textSecondary,
    fontSize: fontSizes.hint,
    fontWeight: '600',
    backgroundColor: colours.surfaceHigh,
    borderRadius: 999,
    paddingVertical: 4,
    paddingHorizontal: 10,
    overflow: 'hidden',
  },
});
