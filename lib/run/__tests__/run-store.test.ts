/**
 * RUN STORE TESTS – lib/run/__tests__/run-store.test.ts
 *
 */

import assert from 'node:assert';
import { afterEach, beforeEach, describe, it } from 'node:test';
import type * as Location from 'expo-location';

import {
  addGpsFixes,
  addStepSample,
  beginRun,
  endRun,
  getActiveRun,
  getCadence,
  getFastCadence,
  getMovingMs,
  pauseRun,
  resumeRun,
} from '../run-store';

const realDateNow = Date.now;
let fakeClockMs = 0;

function startTestRun() {
  beginRun({ goalMinutes: 30, backgroundTracking: true, playlistId: null, plan: [], dropCallouts: 'off' });
}

// MAKE a fake GPS fix
function makeFix(latitude: number, atSeconds: number, accuracy: number): Location.LocationObject {
  return {
    coords: { latitude, longitude: 103.912, accuracy, altitude: null, altitudeAccuracy: null, heading: null, speed: null },
    timestamp: atSeconds * 1000,
  };
}

beforeEach(() => {
  fakeClockMs = 0;
  Date.now = () => fakeClockMs;
  endRun();
});

afterEach(() => {
  Date.now = realDateNow;
});

describe('run store', () => {
  it('should NOT count paused time as moving time', () => {
    
    // START a run
    startTestRun();
    fakeClockMs = 60 * 1000; 
    // PAUSE for 2 minutes
    pauseRun();
    fakeClockMs = 3 * 60 * 1000; 
    // RESUME and run for another minute
    resumeRun();
    fakeClockMs = 4 * 60 * 1000; 

    const run = getActiveRun();
    assert.ok(run);
    // CHECK that the moving time is only 2 minutes (1 minute before pause + 1 minute after resume)
    assert.strictEqual(getMovingMs(run, fakeClockMs), 2 * 60 * 1000);
  });

  it('should add up distance from GPS fixes and skip a blurry first fix', () => {
    startTestRun();

    // 15 metres in 5 seconds, then another 15 metres in 5 seconds, for a total of 30 metres
    addGpsFixes([
      makeFix(1.3, 0, 50),
      makeFix(1.3, 1, 5), 
      makeFix(1.300135, 6, 5),
      makeFix(1.30027, 11, 5), 
    ]);

    const run = getActiveRun();
    assert.ok(run);
    assert.ok(Math.abs(run.distanceMetres - 30) < 1, 'expected about 30 m, got ' + run.distanceMetres);
  });

  it('should work out steps per minute from the step samples', () => {
    startTestRun();

    // 0, 40, 80 steps at 0, 15 and 30 seconds = 80 steps in half a minute = 160 steps per minute
    addStepSample(0, 0);
    addStepSample(40, 15 * 1000);
    addStepSample(80, 30 * 1000);

    const run = getActiveRun();
    assert.ok(run);
    assert.strictEqual(getCadence(run), 160);
  });

  it('should notice a sudden speed up in the 12 second number before the 35 second one', () => {
    startTestRun();

    // 150 steps per minute (2.5 a second) for 30 seconds, THEN 180 steps per minute (3 a second)
    // with a sample every 5 seconds, like the real pedometer check
    for (let seconds = 0; seconds <= 45; seconds += 5) {
      let steps = 2.5 * seconds;
      if (seconds > 30) {
        steps = 75 + 3 * (seconds - 30);
      }
      addStepSample(steps, seconds * 1000);
    }

    const run = getActiveRun();
    assert.ok(run);
    const steadyNumber = getCadence(run) as number;
    const quickNumber = getFastCadence(run) as number;

    // THE quick number jumps up close to 180, the steady one is still catching up
    assert.ok(quickNumber > steadyNumber, 'quick ' + quickNumber + ' should be above steady ' + steadyNumber);
    assert.ok(Math.abs(quickNumber - 180) <= 5, 'expected about 180, got ' + quickNumber);
  });

  it('should clear the run when it ends', () => {
    startTestRun();
    endRun();

    assert.strictEqual(getActiveRun(), null);
  });
});
