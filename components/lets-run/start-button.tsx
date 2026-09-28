import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { SymbolView } from 'expo-symbols';
import { colours, fontSizes, spacing } from '../../lib/theme';

type StartButtonProps = {
  isStarting: boolean;
  isDisabled: boolean;
  warning: string | null; 
  error: string | null; 
  onPress: () => void;
};

export function StartButton({ isStarting, isDisabled, warning, error, onPress }: StartButtonProps) {
  const cannotPress = isStarting || isDisabled;

  return (
    <View style={styles.wrapper}>
      {warning ? <Text style={styles.warning}>{warning}</Text> : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Pressable
        onPress={onPress}
        disabled={cannotPress}
        style={({ pressed }) => [styles.button, pressed && styles.pressed, cannotPress && styles.disabled]}
      >
        {isStarting ? (
          <ActivityIndicator color={colours.onAccent} />
        ) : (
          <>
            <Text style={styles.label}>{warning ? 'Start anyway' : 'Start Run'}</Text>
            <SymbolView name="arrow.right" tintColor={colours.onAccent} size={18} />
          </>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: spacing.medium,
  },
  warning: {
    color: colours.warn,
    fontSize: fontSizes.small,
    lineHeight: 18,
  },
  error: {
    color: colours.danger,
    fontSize: fontSizes.small,
    lineHeight: 18,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.small,
    backgroundColor: colours.accent,
    borderRadius: 18,
    paddingVertical: 18,
  },
  label: {
    color: colours.onAccent,
    fontSize: fontSizes.body + 1,
    fontWeight: '800',
  },
  pressed: {
    opacity: 0.85,
  },
  disabled: {
    opacity: 0.45,
  },
});
