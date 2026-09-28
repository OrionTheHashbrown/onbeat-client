/**
 * SETTINGS TAB – app/(app)/(tabs)/settings.tsx 
 *
 *
 * REFERENCE FROM
 * https://supabase.com/docs/reference/javascript/auth-signout
 */

import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SectionLabel } from '../../../components/settings/section-label';
import { SpotifyCard } from '../../../components/settings/spotify-card';
import { Row, SwitchRow } from '../../../components/ui/row';
import { Screen } from '../../../components/ui/screen';
import { loadDiagnosticsSetting, saveDiagnosticsSetting } from '../../../lib/diagnostics/diagnostics-setting';
import { getDisplayName, useSignedInUser } from '../../../lib/session';
import { useSpotify } from '../../../lib/spotify/spotify-provider';
import { supabase } from '../../../lib/supabase';
import { colours, cornerRadius, fontSizes, spacing } from '../../../lib/theme';

export default function SettingsScreen() {
  const user = useSignedInUser();
  const spotify = useSpotify();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [isDiagnosticsOn, setIsDiagnosticsOn] = useState(false);

  // LOAD the diagnostics switch once
  useEffect(() => {
    loadDiagnosticsSetting().then(setIsDiagnosticsOn);
  }, []);

  function handleDiagnosticsButton(isOn: boolean) {
    setIsDiagnosticsOn(isOn);
    saveDiagnosticsSetting(isOn);
  }

  // SIGN OUT from OnBeat and SIGN OUT any connected Spotify account
  async function handleSignOutButton() {
    if (isSigningOut) {
      return;
    }
    setIsSigningOut(true);
    await spotify.disconnect();
    await supabase.auth.signOut();
  }

  return (
    <Screen
      title="Settings"
      footer={<Row label={isSigningOut ? 'Signing out…' : 'Sign out'} danger onPress={handleSignOutButton} />}
    >
      <SectionLabel text="Account" />
      <View style={styles.accountCard}>
        <Text style={styles.name}>{getDisplayName(user)}</Text>
        <Text style={styles.email}>{user.email}</Text>
      </View>

      <SectionLabel text="Spotify" />
      <SpotifyCard />

      <SectionLabel text="Diagnostics" />
      <SwitchRow
        label="Saves run diagnostics"
        hint="Stores data diagnostics data for each run back to the server."
        isOn={isDiagnosticsOn}
        onChange={handleDiagnosticsButton}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  accountCard: {
    backgroundColor: colours.surface,
    borderColor: colours.border,
    borderWidth: 1,
    borderRadius: cornerRadius,
    padding: spacing.large,
    gap: 4,
  },
  name: {
    color: colours.text,
    fontSize: fontSizes.body,
    fontWeight: '700',
  },
  email: {
    color: colours.textSecondary,
    fontSize: fontSizes.small,
  },
});
