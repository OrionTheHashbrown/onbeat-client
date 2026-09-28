import { Link, Href } from 'expo-router';
import { StyleSheet, Text } from 'react-native';
import { colours, fontSizes } from '../../lib/theme';

type SwitchPageLinkProps = {
  question: string;
  linkText: string;
  goTo: Href;
};

export function SwitchPageLink({ question, linkText, goTo }: SwitchPageLinkProps) {
  return (
    <Text style={styles.question}>
      {question + ' '}
      <Link href={goTo} replace style={styles.link}>
        {linkText}
      </Link>
    </Text>
  );
}

const styles = StyleSheet.create({
  question: {
    color: colours.textSecondary,
    fontSize: fontSizes.small,
  },
  link: {
    color: colours.accent,
    fontWeight: '700',
  },
});
