/**
 * SIGNED IN LAYOUT
 *
 * REFERENCE FROM
 * https://docs.expo.dev/router/basics/layout/
 */

import { Stack } from 'expo-router';

import { useActiveRun } from '../../lib/run/run-store';
import { SpotifyProvider } from '../../lib/spotify/spotify-provider';
import { colours } from '../../lib/theme';

export default function SignedInLayout() {
  const activeRun = useActiveRun();
  const isRunGoing = activeRun !== null;

  return (
    <SpotifyProvider>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colours.background },
        }}
      >
        <Stack.Protected guard={!isRunGoing}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="runs/[id]" />
          <Stack.Screen
            name="lets-run"
            options={{
              presentation: 'formSheet',
              sheetAllowedDetents: [1], 
              sheetGrabberVisible: true,
              contentStyle: { backgroundColor: colours.surface },
            }}
          />
        </Stack.Protected>

        <Stack.Protected guard={isRunGoing}>
          <Stack.Screen name="active-run" options={{ gestureEnabled: false }} />
          <Stack.Screen name="diagnostics" options={{ presentation: 'modal' }} />
        </Stack.Protected>
      </Stack>
    </SpotifyProvider>
  );
}
