import { Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import { colours, cornerRadius, fontSizes, spacing } from '../../lib/theme';

type RowProps = {
  label: string;
  hint?: string;
  onPress: () => void;
  danger?: boolean; 
};

export function Row({ label, hint, onPress, danger }: RowProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
    >
      <Text style={[styles.label, danger && styles.dangerLabel]}>{label}</Text>
      {hint ? <Text style={styles.hint}>{hint}</Text> : null}
    </Pressable>
  );
}

type SwitchRowProps = {
  label: string;
  hint?: string;
  isOn: boolean;
  onChange: (isOn: boolean) => void;
};

export function SwitchRow({ label, hint, isOn, onChange }: SwitchRowProps) {
  return (
    <View style={[styles.row, styles.switchRow]}>
      <View style={styles.switchText}>
        <Text style={styles.label}>{label}</Text>
        {hint ? <Text style={styles.hint}>{hint}</Text> : null}
      </View>
      <Switch
        value={isOn}
        onValueChange={onChange}
        trackColor={{ true: colours.accent, false: colours.surfaceHigh }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    backgroundColor: colours.surface,
    borderColor: colours.border,
    borderWidth: 1,
    borderRadius: cornerRadius,
    paddingVertical: spacing.large - 1,
    paddingHorizontal: spacing.large,
  },
  pressed: {
    opacity: 0.7,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  switchText: {
    flex: 1,
    paddingRight: spacing.medium,
  },
  label: {
    color: colours.text,
    fontSize: fontSizes.body,
    fontWeight: '600',
  },
  dangerLabel: {
    color: colours.danger,
  },
  hint: {
    color: colours.textSecondary,
    fontSize: fontSizes.hint,
    marginTop: 4,
    lineHeight: 16,
  },
});
