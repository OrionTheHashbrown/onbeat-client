/**
 * REFERENCE FROM
 * https://reactnative.dev/docs/keyboardavoidingview
 */

import { ReactNode } from 'react';
import { KeyboardAvoidingView, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colours, spacing } from '../../lib/theme';

type AuthPageProps = {
  children: ReactNode;
  footer: ReactNode; 
};

export function AuthPage({ children, footer }: AuthPageProps) {
  return (
    <SafeAreaView style={styles.page}>
      <KeyboardAvoidingView style={styles.page} behavior="padding">
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.form}>{children}</View>
          <View style={styles.footer}>{footer}</View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: colours.background,
  },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: spacing.extraLarge,
  },
  form: {
    gap: spacing.large,
  },
  footer: {
    marginTop: spacing.extraLarge,
    alignItems: 'center',
  },
});
