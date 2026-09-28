/**
 * RUN MAP – components/run/run-map.tsx
 *
 * Using react-native-maps
 *
 * REFERENCE FROM
 * https://github.com/react-native-maps/react-native-maps/blob/master/docs/mapview.md
 * https://react.dev/reference/react/useImperativeHandle
 */

import { Ref, useImperativeHandle, useRef } from 'react';
import { StyleSheet } from 'react-native';
import MapView, { Polyline, UserLocationChangeEvent } from 'react-native-maps';

import { colours } from '../../lib/theme';

export type MapPoint = {
  latitude: number;
  longitude: number;
};

export type RunMapControls = {
  centreOn: (point: MapPoint) => void;
};

type RunMapProps = {
  controlsRef?: Ref<RunMapControls>;
  showUserDot: boolean;
  followUser: boolean;
  bottomSpace?: number; 
  onUserMovedMap?: () => void;
  routeLines?: MapPoint[][]; 
  zoomInOnUser?: boolean; 
  fitWholeRoute?: boolean; 
};

const zoomLevel = 0.004;

export function RunMap({ controlsRef, showUserDot, followUser, bottomSpace = 0, onUserMovedMap, routeLines = [], zoomInOnUser = false, fitWholeRoute = false }: RunMapProps) {
  const mapView = useRef<MapView>(null);
  const hasZoomedIn = useRef(false);
  const isMapReady = useRef(false);
  const waitingToZoomTo = useRef<MapPoint | null>(null); 

  function zoomTo(point: MapPoint) {
    if (!isMapReady.current) {
      waitingToZoomTo.current = point;
      return;
    }
    mapView.current?.animateToRegion(
      {
        latitude: point.latitude,
        longitude: point.longitude,
        latitudeDelta: zoomLevel,
        longitudeDelta: zoomLevel,
      },
      450,
    );
  }

  // LET the screen move the map from outside
  useImperativeHandle(controlsRef, () => ({
    centreOn: zoomTo,
  }));

  // ZOOM in the FIRST time once location is available
  function handleUserLocationChange(event: UserLocationChangeEvent) {
    const coordinate = event.nativeEvent.coordinate;
    if (!zoomInOnUser || hasZoomedIn.current || !coordinate) {
      return;
    }
    hasZoomedIn.current = true;
    zoomTo(coordinate);
  }

  function handleMapReady() {
    isMapReady.current = true;

    if (waitingToZoomTo.current) {
      zoomTo(waitingToZoomTo.current);
      waitingToZoomTo.current = null;
    }

    if (!fitWholeRoute) {
      return;
    }
    const allPoints: MapPoint[] = [];
    for (const line of routeLines) {
      for (const point of line) {
        allPoints.push(point);
      }
    }
    if (allPoints.length < 2) {
      return;
    }
    const edgeGap = 48;
    mapView.current?.fitToCoordinates(allPoints, {
      edgePadding: { top: edgeGap, right: edgeGap, bottom: edgeGap, left: edgeGap },
      animated: false,
    });
  }

  return (
    <MapView
      ref={mapView}
      style={styles.map}
      mapPadding={{ top: 0, right: 0, bottom: bottomSpace, left: 0 }}
      userInterfaceStyle="dark"
      mapType="mutedStandard"
      showsUserLocation={showUserDot}
      followsUserLocation={showUserDot && followUser}
      onPanDrag={onUserMovedMap}
      onUserLocationChange={handleUserLocationChange}
      onMapReady={handleMapReady}
      showsMyLocationButton={false}
      showsCompass={false}
      showsPointsOfInterests={false}
      showsTraffic={false}
      showsBuildings={false}
      pitchEnabled={false}
      rotateEnabled={false}
      loadingEnabled
      loadingBackgroundColor={colours.background}
      loadingIndicatorColor={colours.accent}
    >
      {routeLines.map((line, index) => (
        <Polyline
          key={index}
          coordinates={line}
          strokeColor={colours.accent}
          strokeWidth={5}
          lineCap="round"
          lineJoin="round"
        />
      ))}
    </MapView>
  );
}

const styles = StyleSheet.create({
  map: {
    flex: 1,
  },
});
