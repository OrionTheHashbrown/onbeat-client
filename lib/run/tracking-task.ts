/**
 * GPS + STEP TRACKING DURING A RUN – lib/run/tracking-task.ts
 *
 * REFERENCE FROM
 * https://docs.expo.dev/versions/latest/sdk/task-manager/
 * https://docs.expo.dev/versions/latest/sdk/location/#background-location-methods
 * https://docs.expo.dev/versions/latest/sdk/pedometer/
 */

import * as Location from 'expo-location';
import { Pedometer } from 'expo-sensors';
import * as TaskManager from 'expo-task-manager';

import { coachTick } from '../coach/coach';
import { addGpsFixes, addStepSample, getActiveRun } from './run-store';

const backgroundTaskName = 'onbeat-run-location';
const stepCheckEveryMs = 5000;

let foregroundWatch: Location.LocationSubscription | null = null;
let stepTimer: ReturnType<typeof setInterval> | null = null;

// CHECK pedometer for steps and SAVE them to run store
async function checkSteps() {
  const run = getActiveRun();
  if (!run || run.status !== 'running') {
    return;
  }
  try {
    const result = await Pedometer.getStepCountAsync(new Date(run.startedAt), new Date());
    addStepSample(result.steps, Date.now());
  } catch {}
}

TaskManager.defineTask(backgroundTaskName, async ({ data, error }) => {
  if (error) {
    return;
  }
  const locations = (data as { locations?: Location.LocationObject[] })?.locations;
  if (!locations || locations.length === 0) {
    return;
  }
  addGpsFixes(locations);
  await checkSteps();
  coachTick(); 
});

// START tracking GPS and steps, either in the background or foreground
export async function startTracking(canUseBackground: boolean): Promise<boolean> {
  let isBackground = false;

  if (canUseBackground) {
    try {
      await Location.startLocationUpdatesAsync(backgroundTaskName, {
        accuracy: Location.Accuracy.High,
        distanceInterval: 5,
        pausesUpdatesAutomatically: false,
        activityType: Location.ActivityType.Fitness,
        showsBackgroundLocationIndicator: true,
      });
      isBackground = true;
    } catch (error) {
      console.warn('[tracking] background tracking failed, using foreground instead:', error);
    }
  }

  if (!isBackground) {
    foregroundWatch = await Location.watchPositionAsync(
      { accuracy: Location.Accuracy.High, distanceInterval: 5 },
      (fix) => addGpsFixes([fix]),
    );
  }

  // CHECK pedometer for steps every 5 seconds
  stepTimer = setInterval(checkSteps, stepCheckEveryMs);

  return isBackground;
}

export async function stopTracking() {
  if (stepTimer) {
    clearInterval(stepTimer);
    stepTimer = null;
  }
  if (foregroundWatch) {
    foregroundWatch.remove();
    foregroundWatch = null;
  }
  const isRunning = await Location.hasStartedLocationUpdatesAsync(backgroundTaskName);
  if (isRunning) {
    await Location.stopLocationUpdatesAsync(backgroundTaskName);
  }
}

// ASK for motion permission if required
export async function askMotionPermission(): Promise<boolean> {
  try {
    const isAvailable = await Pedometer.isAvailableAsync();
    if (!isAvailable) {
      return false;
    }
    const answer = await Pedometer.requestPermissionsAsync();
    return answer.granted;
  } catch {
    return false;
  }
}
