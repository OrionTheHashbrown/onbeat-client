import { StyleSheet, Text, View } from 'react-native';
import { colours, cornerRadius, fontSizes, spacing } from '../../lib/theme';

export function FormError({ message }: { message: string | null }) {
  if (!message) {
    return null;
  }

  return (
    <View style={styles.box}>
      <Text style={styles.text}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    borderColor: colours.danger,
    borderWidth: 1,
    borderRadius: cornerRadius,
    padding: spacing.medium,
  },
  text: {
    color: colours.danger,
    fontSize: fontSizes.small,
  },
});
