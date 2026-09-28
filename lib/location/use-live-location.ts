/**
 * LIVE LOCATION HOOK – lib/location/use-live-location.ts
 *
 * REFERENCE FROM
 * https://docs.expo.dev/versions/latest/sdk/location/
 */

import { useEffect, useState } from 'react';
import * as Location from 'expo-location';

import { getErrorMessage } from '../errors';
import { getGpsStrength, GpsStrength } from './gps-strength';
import { askLocationPermission, checkLocationPermission, LocationPermission } from './permission';

export type Position = {
  latitude: number;
  longitude: number;
  accuracy: number | null; 
};

// ONLY get a new position after moving at least 10 metres 
const metresBetweenUpdates = 10;

export function useLiveLocation(isOn: boolean) {
  const [permission, setPermission] = useState<LocationPermission | 'checking'>('checking');
  const [position, setPosition] = useState<Position | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // CHECK the location permission ONCE when the screen opens
  useEffect(() => {
    checkLocationPermission().then(setPermission);
  }, []);

  useEffect(() => {
    if (!isOn || permission !== 'allowed') {
      return;
    }

    let hasStopped = false;
    let gpsWatch: Location.LocationSubscription | null = null;

    Location.watchPositionAsync(
      { accuracy: Location.Accuracy.High, distanceInterval: metresBetweenUpdates },
      (update) => {
        setPosition({
          latitude: update.coords.latitude,
          longitude: update.coords.longitude,
          accuracy: update.coords.accuracy,
        });
      },
    )
      .then((watch) => {
        if (hasStopped) {
          watch.remove();
        } else {
          gpsWatch = watch;
        }
      })
      .catch((error) => {
        setErrorMessage(getErrorMessage(error));
      });

    return () => {
      hasStopped = true;
      if (gpsWatch) {
        gpsWatch.remove();
      }
    };
  }, [isOn, permission]);

  async function askPermission() {
    setErrorMessage(null);
    const answer = await askLocationPermission();
    setPermission(answer);
  }

  let gpsStrength: GpsStrength | null = null;
  if (position) {
    gpsStrength = getGpsStrength(position.accuracy);
  }

  return { permission, position, gpsStrength, errorMessage, askPermission };
}
