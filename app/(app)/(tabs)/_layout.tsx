/**
 * BOTTOM TABS – Home, Run, Settings (app/(app)/(tabs)/_layout.tsx).
 *
 * REFERENCE FROM
 * https://docs.expo.dev/router/advanced/native-tabs/
 */

import { NativeTabs } from 'expo-router/unstable-native-tabs';
import { colours } from '../../../lib/theme';

export default function TabsLayout() {
  return (
    <NativeTabs tintColor={colours.accent}>
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Icon sf="house.fill" />
        <NativeTabs.Trigger.Label>Home</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="run">
        <NativeTabs.Trigger.Icon sf="figure.run" />
        <NativeTabs.Trigger.Label>Run</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="settings">
        <NativeTabs.Trigger.Icon sf="gearshape.fill" />
        <NativeTabs.Trigger.Label>Settings</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
