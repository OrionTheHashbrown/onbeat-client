/**
 * LIVE ACTIVITY WIDGET BRIDGE – lib/run/live-activity.ts
 *
 *
 * REFERENCE FROM
 * https://docs.expo.dev/versions/latest/sdk/widgets/
 */

import type { LiveActivity } from 'expo-widgets';
import runActivity, { RunActivityProps } from '../../widgets/run-live-activity';
import { coachVoiceStore } from '../coach/voice';
import { getCurrentTempoPlanFromCurrentTime } from '../tempo/plan';
import { formatDistance, formatPace } from './metrics';
import { ActiveRun, getActiveRun, getCurrentPace, getMovingMs, runStore } from './run-store';

const minTimeBetweenUpdatesMs = 2000;
const showCoachLineForMs = 7000;

let activity: LiveActivity<RunActivityProps> | null = null;
let lastSentProps = '';
let lastSentAt = 0;
let stopListeningToRun: (() => void) | null = null;
let stopListeningToCoach: (() => void) | null = null;

function buildProps(run: ActiveRun, now: number): RunActivityProps {
  const movingMs = getMovingMs(run, now);
  const currentTempoPlanStage = getCurrentTempoPlanFromCurrentTime(run.plan, movingMs);

  // WORK OUT when the clock "started"
  let pausedAt: number | null = null;
  let clockStartedAt = now - movingMs;
  if (run.status !== 'running') {
    const lastSegment = run.segments[run.segments.length - 1];
    pausedAt = lastSegment.endedAt ?? now;
    clockStartedAt = pausedAt - movingMs;
  }

  // WHEN the goal will be reached
  const goalMs = run.goalMinutes * 60 * 1000;
  let goalEndsAt: number | null = null;
  if (movingMs < goalMs) {
    goalEndsAt = clockStartedAt + goalMs;
  }

  let note = '';
  let isWarning = false;
  const coachVoice = coachVoiceStore.getValue();
  if (coachVoice.lastLine && now - coachVoice.lastLineAt < showCoachLineForMs) {
    note = coachVoice.lastLine;
  }

  return {
    stageName: currentTempoPlanStage ? currentTempoPlanStage.name.toUpperCase() : null,
    clockStartedAt,
    pausedAt,
    goalEndsAt,
    distance: formatDistance(run.distanceMetres),
    pace: formatPace(getCurrentPace(run, now)),
    note,
    isWarning,
  };
}

// UPDATE the live activity with the latest run data
function updateLiveActivity(forceUpdate: boolean) {
  const run = getActiveRun();
  if (!activity || !run) {
    return;
  }
  const now = Date.now();
  const props = buildProps(run, now);
  const propsText = JSON.stringify(props);

  if (propsText === lastSentProps) {
    return;
  }
  if (!forceUpdate && now - lastSentAt < minTimeBetweenUpdatesMs) {
    return;
  }
  lastSentProps = propsText;
  lastSentAt = now;
  activity.update(props);

  if (props.note.length > 0 && !props.isWarning) {
    setTimeout(() => updateLiveActivity(true), showCoachLineForMs);
  }
}

export function startLiveActivity() {
  const run = getActiveRun();
  if (!run) {
    return;
  }
  endLiveActivity();

  // REMOVES leftover live activities from previous runs
  for (const leftover of runActivity.getInstances()) {
    leftover.end('immediate');
  }

  try {
    const props = buildProps(run, Date.now());
    activity = runActivity.start(props, 'onbeat:///active-run');
    lastSentProps = JSON.stringify(props);
    lastSentAt = Date.now();
  } catch (error) {
    console.warn('[live-activity] could not start:', error);
    return;
  }

  // UPDATE whenever the run changes 
  let lastStatus = run.status;
  stopListeningToRun = runStore.subscribe(() => {
    const current = getActiveRun();
    const statusChanged = current !== null && current.status !== lastStatus;
    if (current) {
      lastStatus = current.status;
    }
    updateLiveActivity(statusChanged);
  });
  stopListeningToCoach = coachVoiceStore.subscribe(() => updateLiveActivity(true));
}

export function endLiveActivity() {
  if (stopListeningToRun) {
    stopListeningToRun();
    stopListeningToRun = null;
  }
  if (stopListeningToCoach) {
    stopListeningToCoach();
    stopListeningToCoach = null;
  }
  if (activity) {
    activity.end('immediate');
    activity = null;
  }
  lastSentProps = '';
  lastSentAt = 0;
}
