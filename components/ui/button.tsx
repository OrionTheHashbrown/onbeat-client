import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';
import { SymbolView, SymbolViewProps } from 'expo-symbols';
import { colours, cornerRadius, fontSizes, spacing } from '../../lib/theme';

type ButtonProps = {
  label: string;
  onPress: () => void;
  isLoading?: boolean;
  isDisabled?: boolean;
  outlined?: boolean; 
  spotify?: boolean; 
  danger?: boolean; 
  icon?: SymbolViewProps['name']; 
  tall?: boolean; 
};

export function Button({ label, onPress, isLoading, isDisabled, outlined, spotify, danger, icon, tall }: ButtonProps) {

  const cannotPress = isLoading || isDisabled;

  return (
    <Pressable
      onPress={onPress}
      disabled={cannotPress}
      style={({ pressed }) => [
        styles.button,
        outlined ? styles.outlined : styles.filled,
        spotify && styles.spotify,
        danger && styles.danger,
        tall && styles.tall,
        pressed && styles.pressed,
        cannotPress && styles.disabled,
      ]}
    >
      {isLoading ? (
        <ActivityIndicator color={outlined ? colours.text : colours.onAccent} />
      ) : (
        <>
          {icon ? <SymbolView name={icon} tintColor={outlined ? colours.text : colours.onAccent} size={tall ? 30 : 16} /> : null}
          <Text style={[styles.label, tall && styles.tallLabel, outlined ? styles.outlinedLabel : styles.filledLabel, danger && styles.dangerLabel]}>
            {label}
          </Text>
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: cornerRadius,
    paddingVertical: spacing.large - 2,
    paddingHorizontal: spacing.large,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.small,
  },
  tall: {
    flexDirection: 'column',
    minHeight: 140,
  },
  tallLabel: {
    fontSize: fontSizes.title,
  },
  filled: {
    backgroundColor: colours.accent,
  },
  spotify: {
    backgroundColor: colours.spotifyGreen,
  },
  danger: {
    backgroundColor: colours.danger,
    borderWidth: 0,
  },
  dangerLabel: {
    color: colours.text,
  },
  outlined: {
    borderWidth: 1,
    borderColor: colours.border,
    backgroundColor: 'transparent',
  },
  pressed: {
    opacity: 0.8,
  },
  disabled: {
    opacity: 0.5,
  },
  label: {
    fontSize: fontSizes.body,
    fontWeight: '700',
  },
  filledLabel: {
    color: colours.onAccent,
  },
  outlinedLabel: {
    color: colours.text,
  },
});
