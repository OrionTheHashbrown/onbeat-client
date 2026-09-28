import { Pressable, StyleSheet } from 'react-native';
import { SymbolView } from 'expo-symbols';
import { colours } from '../../lib/theme';

type RecenterButtonProps = {
  isFollowing: boolean; 
  onPress: () => void;
};

export function RecenterButton({ isFollowing, onPress }: RecenterButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      hitSlop={8}
      style={({ pressed }) => [styles.button, pressed && styles.pressed]}
    >
      <SymbolView
        name={isFollowing ? 'location.fill' : 'location'}
        tintColor={isFollowing ? colours.accent : colours.text}
        size={20}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colours.surface,
    borderColor: colours.border,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.7,
  },
});
