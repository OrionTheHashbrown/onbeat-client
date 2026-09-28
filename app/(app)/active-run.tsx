/**
 * ACTIVE RUN SCREEN – app/(app)/active-run.tsx
 *
 */

import { useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RecenterButton } from '../../components/run/recenter-button';
import { RunMap, RunMapControls } from '../../components/run/run-map';
import { RunSummaryCard } from '../../components/run/run-summary-card';
import { RunWidget } from '../../components/run/run-widget';
import { stopCoach } from '../../lib/coach/coach';
import { recordEvent } from '../../lib/diagnostics/run-trace';
import { endLiveActivity } from '../../lib/run/live-activity';
import { RunPoint } from '../../lib/run/metrics';
import { finishRun, getRouteLines, useActiveRun } from '../../lib/run/run-store';
import { stopTracking } from '../../lib/run/tracking-task';
import { stopLiveQueue } from '../../lib/spotify/live-queue';
import { stopNowPlaying } from '../../lib/spotify/now-playing';
import { colours, spacing } from '../../lib/theme';

export default function ActiveRunScreen() {
  const run = useActiveRun();
  const safeArea = useSafeAreaInsets();
  const mapControls = useRef<RunMapControls>(null);
  const [isFollowing, setIsFollowing] = useState(true);
  const [cardHeight, setCardHeight] = useState(300);

  useEffect(() => {
    Location.getLastKnownPositionAsync().then((position) => {
      if (position) {
        // CENTRE ZOOM into the map of the user's location
        mapControls.current?.centreOn(position.coords);
      }
    });
    Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High })
      .then((position) => mapControls.current?.centreOn(position.coords))
      .catch(() => {
      });
  }, []);

  const routeLines = run ? getRouteLines(run) : [];

  // FIND the latest point on the route (for the recenter button)
  let lastPoint: RunPoint | null = null;
  if (routeLines.length > 0) {
    const lastLine = routeLines[routeLines.length - 1];
    lastPoint = lastLine[lastLine.length - 1];
  }

  // END button was pressed, end the run and stop all tracking and music
  async function handleEndButton() {
    recordEvent('run', 'Run ended');
    finishRun();
    setIsFollowing(false);
    stopCoach();
    endLiveActivity();
    stopLiveQueue();
    stopNowPlaying();
    await stopTracking();
  }

  function handleRecenterButton() {
    if (!lastPoint) {
      return;
    }
    setIsFollowing(true);
    mapControls.current?.centreOn(lastPoint);
  }

  if (!run) {
    return <View style={styles.screen} />;
  }

  const isFinished = run.status === 'finished';
  const bottomOfCard = safeArea.bottom + spacing.large;

  return (
    <View style={styles.screen}>
      <RunMap
        controlsRef={mapControls}
        showUserDot={!isFinished}
        followUser={isFollowing}
        bottomSpace={bottomOfCard + cardHeight}
        onUserMovedMap={() => setIsFollowing(false)}
        routeLines={routeLines}
        zoomInOnUser
      />

      <LinearGradient
        colors={['rgba(11,10,9,0)', colours.background]}
        pointerEvents="none"
        style={[styles.fade, { height: bottomOfCard + cardHeight + 96 }]}
      />

      <View style={[styles.bottom, { bottom: bottomOfCard }]}>
        {lastPoint ? (
          <View style={styles.recenterRow}>
            <RecenterButton isFollowing={isFollowing} onPress={handleRecenterButton} />
          </View>
        ) : null}

        <View onLayout={(event) => setCardHeight(event.nativeEvent.layout.height)}>
          {isFinished ? <RunSummaryCard run={run} /> : <RunWidget run={run} onEnd={handleEndButton} />}
        </View>
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
    bottom: 0,
  },
  bottom: {
    position: 'absolute',
    left: 16,
    right: 16,
    gap: spacing.large,
  },
  recenterRow: {
    alignItems: 'flex-end',
  },
});
