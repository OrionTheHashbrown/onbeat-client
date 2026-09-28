import { StyleSheet, Text, View } from 'react-native';
import { colours, fontSizes, spacing } from '../../lib/theme';
import { Button } from '../ui/button';

type PermissionCardProps = {
  title: string;
  message: string;
  buttonLabel: string;
  onPress: () => void;
};

export function PermissionCard({ title, message, buttonLabel, onPress }: PermissionCardProps) {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
      <Button label={buttonLabel} onPress={onPress} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colours.surface,
    borderColor: colours.border,
    borderWidth: 1,
    borderRadius: 18,
    padding: spacing.large + 2,
    gap: spacing.medium,
  },
  title: {
    color: colours.text,
    fontSize: 17,
    fontWeight: '700',
  },
  message: {
    color: colours.textSecondary,
    fontSize: fontSizes.small,
    lineHeight: 19,
  },
});
