import { Image, StyleSheet, Text, View } from 'react-native';
import { colours, fontSizes, spacing } from '../../lib/theme';

type AuthHeaderProps = {
  subtitle: string;
};

export function AuthHeader({ subtitle }: AuthHeaderProps) {
  return (
    <View style={styles.header}>
      <Image source={require('../../assets/images/splash-icon.png')} style={styles.icon} />
      <Text style={styles.appName}>OnBeat</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    alignItems: 'center',
    gap: spacing.small,
    marginBottom: spacing.extraLarge,
  },
  icon: {
    width: 88,
    height: 88,
    marginBottom: spacing.small,
  },
  appName: {
    color: colours.text,
    fontSize: fontSizes.heading,
    fontWeight: '800',
  },
  subtitle: {
    color: colours.textSecondary,
    fontSize: fontSizes.body,
    textAlign: 'center',
  },
});
