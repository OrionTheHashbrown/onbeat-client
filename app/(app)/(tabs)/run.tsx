/**
 * RUN TAB – app/(app)/(tabs)/run.tsx
 *
 * REFERENCE FROM
 * https://docs.expo.dev/router/reference/hooks/#usefocuseffect
 * https://docs.expo.dev/versions/latest/sdk/linear-gradient/
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GpsPill } from '../../../components/run/gps-pill';
import { PermissionCard } from '../../../components/run/permission-card';
import { RecenterButton } from '../../../components/run/recenter-button';
import { RunMap, RunMapControls } from '../../../components/run/run-map';
import { StartRunCard } from '../../../components/run/start-run-card';
import { openPhoneSettings } from '../../../lib/location/permission';
import { useLiveLocation } from '../../../lib/location/use-live-location';
import { colours, fontSizes, spacing } from '../../../lib/theme';

const edgeGap = 16;

export default function RunScreen() {
  const safeArea = useSafeAreaInsets();
  const mapControls = useRef<RunMapControls>(null);
  const hasCentredOnce = useRef(false);
  const [isTabOpen, setIsTabOpen] = useState(true);
  const [isFollowing, setIsFollowing] = useState(true);
  const [startCardHeight, setStartCardHeight] = useState(160);

  useFocusEffect(
    useCallback(() => {
      setIsTabOpen(true);
      return () => setIsTabOpen(false);
    }, []),
  );

  const { permission, position, gpsStrength, errorMessage, askPermission } = useLiveLocation(isTabOpen);

  // CENTRE the map on the user (with an offset abit) the FIRST time we get their location
  useEffect(() => {
    if (position && !hasCentredOnce.current) {
      mapControls.current?.centreOn(position);
      hasCentredOnce.current = true;
    }
  }, [position]);

  function handleRecenterButton() {
    if (!position) {
      return;
    }
    setIsFollowing(true);
    mapControls.current?.centreOn(position);
  }

  // OPEN the Let's Run sheet
  function handleStartRunButton() {
    router.push('/lets-run');
  }

  const canStartRun = permission === 'allowed';
  const bottomOfCards = safeArea.bottom + edgeGap;
  const spaceCoveredByCard = canStartRun ? bottomOfCards + startCardHeight : 0;

  return (
    <View style={styles.screen}>
      <RunMap
        controlsRef={mapControls}
        showUserDot={permission === 'allowed'}
        followUser={isFollowing}
        bottomSpace={spaceCoveredByCard}
        onUserMovedMap={() => setIsFollowing(false)}
      />

      <LinearGradient
        colors={['rgba(11,10,9,0.92)', 'rgba(11,10,9,0)']}
        pointerEvents="none"
        style={[styles.fade, { top: 0, height: safeArea.top + 150 }]}
      />
      <LinearGradient
        colors={['rgba(11,10,9,0)', colours.background]}
        pointerEvents="none"
        style={[styles.fade, { bottom: 0, height: spaceCoveredByCard + 96 }]}
      />

      {/* TOP – title and GPS pill */}
      <View style={[styles.header, { top: safeArea.top + spacing.small }]}>
        <Text style={styles.title}>Run</Text>
        {permission === 'allowed' ? (
          <GpsPill strength={gpsStrength} accuracy={position ? position.accuracy : null} />
        ) : null}
      </View>

      {/* BOTTOM – recenter button, errors, then whichever card fits the permission */}
      <View style={[styles.bottom, { bottom: bottomOfCards }]}>
        {position ? (
          <View style={styles.recenterRow}>
            <RecenterButton isFollowing={isFollowing} onPress={handleRecenterButton} />
          </View>
        ) : null}

        {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}

        {permission === 'not-asked' ? (
          <PermissionCard
            title="Show your runs on the map"
            message="OnBeat needs your location to draw your route and measure your distance and pace."
            buttonLabel="Turn on location"
            onPress={askPermission}
          />
        ) : null}

        {permission === 'denied' ? (
          <PermissionCard
            title="Location is off"
            message="To see yourself on the map and record a run, turn on location for OnBeat in Settings."
            buttonLabel="Open Settings"
            onPress={openPhoneSettings}
          />
        ) : null}

        {canStartRun ? (
          <StartRunCard onPress={handleStartRunButton} onHeightMeasured={setStartCardHeight} />
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colours.background,
  },
  fade: {
    position: 'absolute',
    left: 0,
    right: 0,
  },
  header: {
    position: 'absolute',
    left: 20,
    right: 20,
    gap: spacing.medium,
  },
  title: {
    color: colours.text,
    fontSize: fontSizes.heading,
    fontWeight: '800',
  },
  bottom: {
    position: 'absolute',
    left: 20,
    right: 20,
    gap: edgeGap,
  },
  recenterRow: {
    alignItems: 'flex-end',
  },
  errorText: {
    color: colours.danger,
    fontSize: fontSizes.hint,
  },
});
