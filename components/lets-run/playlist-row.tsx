import { Pressable, StyleSheet, Text } from 'react-native';
import { SymbolView } from 'expo-symbols';
import { colours, cornerRadius, fontSizes, spacing } from '../../lib/theme';

type PlaylistRowProps = {
  playlistName: string;
  isDisabled: boolean;
  onPress: () => void;
};

export function PlaylistRow({ playlistName, isDisabled, onPress }: PlaylistRowProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [styles.row, pressed && styles.pressed, isDisabled && styles.disabled]}
    >
      <SymbolView name="music.note.list" tintColor={colours.accent} size={18} />
      <Text style={styles.name} numberOfLines={1}>{playlistName}</Text>
      <SymbolView name="chevron.right" tintColor={colours.textMuted} size={14} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.medium,
    backgroundColor: colours.surface,
    borderColor: colours.border,
    borderWidth: 1,
    borderRadius: cornerRadius,
    paddingVertical: spacing.medium,
    paddingHorizontal: spacing.large,
  },
  name: {
    flex: 1,
    color: colours.text,
    fontSize: fontSizes.body - 1,
    fontWeight: '600',
  },
  pressed: {
    opacity: 0.7,
  },
  disabled: {
    opacity: 0.5,
  },
});
