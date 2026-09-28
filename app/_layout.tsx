/**
 * ROOT LAYOUT LOGIC
 *
 * REFERENCE FROM
 * https://docs.expo.dev/router/advanced/authentication/
 * https://docs.expo.dev/router/advanced/protected/
 * https://docs.expo.dev/versions/latest/sdk/splash-screen/
 */

import { useEffect } from 'react';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { SessionProvider, useSession } from '../lib/session';
import { colours } from '../lib/theme';

// IMPORTED here for background GPS tracking 
import '../lib/run/tracking-task';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <SessionProvider>
          <StatusBar style="light" />
          <SignedInGuard />
        </SessionProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

function SignedInGuard() {
  const sessionState = useSession();
  const isLoading = sessionState === 'loading';
  const isSignedIn = !isLoading && sessionState !== 'signed-out';

  useEffect(() => {
    if (!isLoading) {
      SplashScreen.hideAsync();
    }
  }, [isLoading]);

  if (isLoading) {
    return null;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colours.background },
      }}
    >
      <Stack.Protected guard={isSignedIn}>
        <Stack.Screen name="(app)" />
      </Stack.Protected>

      <Stack.Protected guard={!isSignedIn}>
        <Stack.Screen name="(auth)" />
      </Stack.Protected>
    </Stack>
  );
}
