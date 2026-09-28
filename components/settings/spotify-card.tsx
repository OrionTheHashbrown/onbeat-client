/**
 * SPOTIFY CARD on the Settings page – components/settings/spotify-card.tsx
 *
 * REFERENCE FROM
 * https://developer.spotify.com/documentation/web-api/reference/#/operations/get-current-users-profile
 */

import { ActivityIndicator, Image, StyleSheet, Text, View } from 'react-native';

import { SpotifyProfile } from '../../lib/spotify/profile';
import { useSpotify } from '../../lib/spotify/spotify-provider';
import { colours, cornerRadius, fontSizes, spacing } from '../../lib/theme';
import { Button } from '../ui/button';
import { SpotifyAppControl } from './spotify-app-control';

export function SpotifyCard() {
  const spotify = useSpotify();

  if (spotify.status === 'checking') {
    return (
      <View style={[styles.card, styles.centred]}>
        <ActivityIndicator color={colours.textSecondary} />
        <Text style={styles.hint}>Checking your Spotify connection…</Text>
      </View>
    );
  }

  if (spotify.status === 'connected' && spotify.profile) {
    return (
      <View style={styles.card}>
        <ConnectedAccount profile={spotify.profile} />

        {!spotify.profile.isPremium ? (
          <Text style={styles.warning}>
            Spotify Premium is required to control your music playback from OnBeat.
          </Text>
        ) : (
          <SpotifyAppControl />
        )}

        <Button label="Disconnect" outlined onPress={spotify.disconnect} />
      </View>
    );
  }

  if (spotify.status === 'error') {
    return (
      <View style={styles.card}>
        <Text style={styles.title}>{"Couldn't reach Spotify"}</Text>
        <Text style={styles.errorText}>{spotify.errorMessage}</Text>
        <Button label="Try again" onPress={spotify.checkAgain} />
        <Button label="Connect a different account" outlined onPress={spotify.connect} />
      </View>
    );
  }

  return (
    <View style={styles.card}>
      <Text style={styles.title}>{"Spotify isn't connected"}</Text>
      <Text style={styles.hint}>Connect Spotify to play music that matches your pace on runs.</Text>
      <Button
        label="Sign in to Spotify"
        spotify
        onPress={spotify.connect}
        isLoading={spotify.status === 'connecting'}
      />
    </View>
  );
}

function ConnectedAccount({ profile }: { profile: SpotifyProfile }) {

  // USE the first letter of their name if they don't have a profile picture
  const firstLetter = profile.displayName.charAt(0).toUpperCase();

  return (
    <View style={styles.account}>
      {profile.pictureUrl ? (
        <Image source={{ uri: profile.pictureUrl }} style={styles.picture} />
      ) : (
        <View style={[styles.picture, styles.letterPicture]}>
          <Text style={styles.letter}>{firstLetter}</Text>
        </View>
      )}

      <View style={styles.accountText}>
        <View style={styles.connectedLine}>
          <View style={styles.greenDot} />
          <Text style={styles.connectedLabel}>Connected to Spotify</Text>
        </View>
        <Text style={styles.title} numberOfLines={1}>{profile.displayName}</Text>
        {profile.email ? <Text style={styles.hint} numberOfLines={1}>{profile.email}</Text> : null}
      </View>

      <View style={[styles.badge, profile.isPremium ? styles.premiumBadge : styles.freeBadge]}>
        <Text style={[styles.badgeText, profile.isPremium ? styles.premiumText : styles.freeText]}>
          {profile.isPremium ? 'Premium' : 'Free'}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colours.surface,
    borderColor: colours.border,
    borderWidth: 1,
    borderRadius: cornerRadius,
    padding: spacing.large,
    gap: spacing.medium,
  },
  centred: {
    alignItems: 'center',
    paddingVertical: spacing.extraLarge,
  },
  title: {
    color: colours.text,
    fontSize: fontSizes.body,
    fontWeight: '700',
  },
  hint: {
    color: colours.textSecondary,
    fontSize: fontSizes.small,
    lineHeight: 18,
  },
  errorText: {
    color: colours.danger,
    fontSize: fontSizes.small,
  },
  warning: {
    color: colours.warn,
    fontSize: fontSizes.small,
    lineHeight: 18,
  },
  account: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.medium,
  },
  picture: {
    width: 52,
    height: 52,
    borderRadius: 26,
  },
  letterPicture: {
    backgroundColor: colours.surfaceHigh,
    alignItems: 'center',
    justifyContent: 'center',
  },
  letter: {
    color: colours.text,
    fontSize: fontSizes.title,
    fontWeight: '700',
  },
  accountText: {
    flex: 1,
    gap: 2,
  },
  connectedLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  greenDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colours.spotifyGreen,
  },
  connectedLabel: {
    color: colours.spotifyGreen,
    fontSize: fontSizes.hint,
    fontWeight: '600',
  },
  badge: {
    borderRadius: 999,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderWidth: 1,
  },
  premiumBadge: {
    borderColor: colours.spotifyGreen,
  },
  freeBadge: {
    borderColor: colours.warn,
  },
  badgeText: {
    fontSize: fontSizes.hint,
    fontWeight: '700',
  },
  premiumText: {
    color: colours.spotifyGreen,
  },
  freeText: {
    color: colours.warn,
  },
});
