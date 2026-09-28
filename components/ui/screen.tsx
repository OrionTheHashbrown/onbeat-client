/**
 *
 * REFERENCE FROM
 * https://docs.expo.dev/versions/latest/sdk/safe-area-context/
 */

import { ReactNode } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { colours, fontSizes, spacing } from '../../lib/theme';

type ScreenProps = {
  title?: string;
  children: ReactNode;
  footer?: ReactNode; 
  onRefresh?: () => void; 
  isRefreshing?: boolean;
};

export function Screen({ title, children, footer, onRefresh, isRefreshing = false }: ScreenProps) {
  const safeArea = useSafeAreaInsets();

  return (
    <SafeAreaView style={styles.page} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          onRefresh ? (
            <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor={colours.accent} />
          ) : undefined
        }
      >
        {title ? <Text style={styles.title}>{title}</Text> : null}
        {children}
      </ScrollView>

      {footer ? (
        <View style={[styles.footer, { paddingBottom: safeArea.bottom + spacing.medium }]}>
          {footer}
        </View>
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: colours.background,
  },
  content: {
    padding: spacing.large,
    gap: spacing.medium,
  },
  footer: {
    paddingHorizontal: spacing.large,
    paddingTop: spacing.medium,
    borderTopColor: colours.border,
    borderTopWidth: 1,
    backgroundColor: colours.background,
  },
  title: {
    color: colours.text,
    fontSize: fontSizes.heading,
    fontWeight: '800',
    marginBottom: spacing.small,
  },
});
