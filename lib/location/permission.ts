/**
 * LOCATION PERMISSION – lib/location/permission.ts
 *
 * REFERENCE FROM
 * https://docs.expo.dev/versions/latest/sdk/location/
 */

import * as Location from 'expo-location';
import { Linking } from 'react-native';

export type LocationPermission = 'not-asked' | 'allowed' | 'denied';

function toSimplePermission(answer: Location.LocationPermissionResponse): LocationPermission {
  if (answer.granted) {
    return 'allowed';
  }
  if (answer.status === 'undetermined') {
    return 'not-asked';
  }
  return 'denied';
}

// CHECK what the user picked before
export async function checkLocationPermission(): Promise<LocationPermission> {
  const answer = await Location.getForegroundPermissionsAsync();
  return toSimplePermission(answer);
}

// ASK for location "While Using the App" 
export async function askLocationPermission(): Promise<LocationPermission> {
  const answer = await Location.requestForegroundPermissionsAsync();
  return toSimplePermission(answer);
}

// OPEN OnBeat's page in the iPhone Settings app 
export function openPhoneSettings() {
  Linking.openSettings();
}
