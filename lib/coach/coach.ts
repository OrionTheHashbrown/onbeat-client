/**
 * THE COACH – lib/coach/coach.ts
 *
 */

import { recordEvent, recordSample } from '../diagnostics/run-trace';
import { addAdjustment, getActiveRun, getCadence, getMovingMs, ActiveRun } from '../run/run-store';
import { getNowPlaying, getPositionNow } from '../spotify/now-playing';
import type { Song } from '../spotify/playlists';
import { Adjustment, getCurrentTempoPlanFromCurrentTime, getTargetBpmAt, StageId, TempoSegment } from '../tempo/plan';
import { buildEffortSnapshot, type EffortSnapshot } from './effort';
import { getEffortVerdict, isCadenceChangingRapidly } from './classify';
import { beatDropLine, easeButtonLine, goalReachedLine, pushButtonLine, slowNudgeLines, stageStartLines } from './coach-lines';
import { announce, clearVoice } from './voice';

const second = 1000;
const quietAtStartOfRunMs = 90 * second; 
const quietAtStartOfStageMs = 30 * second; 
const quietAtEndOfStageMs = 10 * second; 
const slowBeforeNudgeMs = 30 * second;
const slowBeforeEasingMs = 45 * second;
const onBeatBeforeRecoveringMs = 120 * second;
const timeBetweenNudgesMs = 120 * second;
const timeBetweenEasingMs = 60 * second;
const timeBetweenRecoveringMs = 150 * second;
const timeBetweenButtonChangesMs = 5 * second;
const beatDropWarningMs = 10 * second; 
const beatDropWindowMs = 3 * second; 


const easeStep = 0.05;
const recoverStep = 0.02;
const buttonStep = 0.05;
const maxEaseDown = 0.1;
const maxPushUp = 0.05;

type CoachState = {
  lastStageId: StageId | null;
  hasSaidGoalReached: boolean;
  spokenDropKeys: string[];
  slowSinceMs: number | null; 
  onBeatSinceMs: number | null; 
  lastNudgeAtMs: number;
  lastAdjustmentAtMs: number;
  lastButtonChangeAtMs: number;
  nudgeCount: number;
  lastPaceCheck: string; 
  lastPaceMood: string | null; 
  songsById: Map<string, Song>;
};

function freshCoachState(): CoachState {
  return {
    lastStageId: null,
    hasSaidGoalReached: false,
    spokenDropKeys: [],
    slowSinceMs: null,
    onBeatSinceMs: null,
    lastNudgeAtMs: -Infinity,
    lastAdjustmentAtMs: -Infinity,
    lastButtonChangeAtMs: -Infinity,
    nudgeCount: 0,
    lastPaceCheck: 'not started',
    lastPaceMood: null,
    songsById: new Map(),
  };
}

let coachState = freshCoachState();
let coachTimer: ReturnType<typeof setInterval> | null = null;

export function startCoach(songs: Song[]) {
  stopCoach();
  coachState = freshCoachState();
  for (const song of songs) {
    coachState.songsById.set(song.id, song);
  }
  coachTimer = setInterval(coachTick, second);
}

export function stopCoach() {
  if (coachTimer) {
    clearInterval(coachTimer);
    coachTimer = null;
  }
  clearVoice();
}

export function coachTick() {
  const run = getActiveRun();
  if (!run || run.status !== 'running') {
    return;
  }
  const movingMs = getMovingMs(run, Date.now());
  const stage = getCurrentTempoPlanFromCurrentTime(run.plan, movingMs);
  if (!stage) {
    return;
  }

  // CHECK if the coach should say something at which stage
  let paceCheck = 'spoke: stage start';
  if (!checkStageStart(stage)) {
    paceCheck = 'spoke: goal reached';
    if (!checkGoalReached(run, movingMs)) {
      paceCheck = 'spoke: beat drop';
      if (!checkBeatDrop(run, stage)) {
        paceCheck = checkPace(run, stage, movingMs);
      }
    }
  }

  coachState.lastPaceCheck = paceCheck;
  noteIfPaceMoodChanged(run, paceCheck, movingMs);

  // ONLY APPLICABLE when diagnostics is on
  const targetBpm = getTargetBpmAt(run.plan, run.adjustments, movingMs);
  const effort = buildEffortSnapshot(run, Date.now());
  recordSample({
    atMs: Math.round(movingMs),
    stage: stage.name,
    targetBpm,
    cadence: effort.cadence,
    fastCadence: effort.fastCadence,
    strideMetres: effort.strideMetres === null ? null : Math.round(effort.strideMetres * 100) / 100,
    confidence: effort.confidence,
    verdict: targetBpm === null ? 'unknown' : getEffortVerdict(effort, targetBpm),
    paceMsPerKm: effort.paceMsPerKm,
    distanceM: Math.round(run.distanceMetres),
    songId: getNowPlaying()?.songId ?? null,
    paceCheck,
  });
}


// 1. ANNOUNCE the start of a new stage once
function checkStageStart(stage: TempoSegment): boolean {
  if (stage.id === coachState.lastStageId) {
    return false;
  }
  coachState.lastStageId = stage.id;
  coachState.slowSinceMs = null;
  coachState.onBeatSinceMs = null;

  announce(stageStartLines[stage.id]);
  return true;
}

// 2. ANNOUNCE when the goal is reached once
function checkGoalReached(run: ActiveRun, movingMs: number): boolean {
  if (coachState.hasSaidGoalReached || movingMs < run.goalMinutes * 60 * second) {
    return false;
  }
  coachState.hasSaidGoalReached = true;
  announce(goalReachedLine);
  return true;
}

// 3. ANNOUNCE when a beat drop is coming up 
function checkBeatDrop(run: ActiveRun, stage: TempoSegment): boolean {
  if (run.dropCallouts === 'off') {
    return false;
  }
  if (run.dropCallouts === 'build-and-peak' && stage.id !== 'build' && stage.id !== 'peak') {
    return false;
  }

  const playing = getNowPlaying();
  if (!playing || playing.isPaused) {
    return false;
  }
  const song = coachState.songsById.get(playing.songId);
  if (!song) {
    return false;
  }
  const cues = song.cues;

  const position = getPositionNow(playing);

  for (const cue of cues) {
    if (cue.kind !== 'drop' && cue.kind !== 'chorus') {
      continue;
    }
    const warnAt = cue.atMs - beatDropWarningMs;
    const isTimeToWarn = position >= warnAt && position < warnAt + beatDropWindowMs;
    const dropKey = playing.songId + ':' + cue.atMs;

    if (warnAt >= 0 && isTimeToWarn && !coachState.spokenDropKeys.includes(dropKey)) {
      coachState.spokenDropKeys.push(dropKey);
      announce(beatDropLine);
      return true;
    }
  }
  return false;
}

// 4. ANNOUNCE to push or ease off if they're too slow or back on the beat
function checkPace(run: ActiveRun, stage: TempoSegment, movingMs: number): string {
  const quietReason = getCoachResponseForCertainTime(stage, movingMs);
  if (quietReason) {
    resetPaceTimers();
    return 'quiet: ' + quietReason;
  }

  // WORK OUT how they're really doing (steps per minute + pace + stride, see effort.ts and classify.ts)
  const targetBpm = getTargetBpmAt(run.plan, run.adjustments, movingMs);
  const effort = buildEffortSnapshot(run, Date.now());
  if (targetBpm === null) {
    resetPaceTimers();
    return 'quiet: no target';
  }
  const verdict = getEffortVerdict(effort, targetBpm);

  if (verdict === 'unknown') {
    resetPaceTimers();
    return 'quiet: not enough steps yet';
  }
  if (verdict === 'stopped') {
    resetPaceTimers();
    return 'quiet: stopped';
  }
  if (isCadenceChangingRapidly(effort)) {
    return 'quiet: changing pace';
  }
  if (verdict === 'running') {
    resetPaceTimers();
    return 'quiet: long strides, going well';
  }

  // WALKING or STRUGGLING = too slow
  if (verdict === 'walking' || verdict === 'struggling') {
    coachState.onBeatSinceMs = null;
    if (coachState.slowSinceMs === null) {
      coachState.slowSinceMs = movingMs;
    }
    const slowForMs = movingMs - coachState.slowSinceMs;
    maybeNudge(slowForMs, movingMs);

    // ONLY ease the music for struggling (not walking), and ONLY when we trust the numbers
    if (verdict === 'struggling') {
      maybeEaseTempo(run, stage, effort, slowForMs, movingMs);
    }
    return verdict + ' for ' + Math.round(slowForMs / second) + 's';
  }

  // ON THE BEAT or faster = count towards giving the tempo back
  coachState.slowSinceMs = null;
  if (coachState.onBeatSinceMs === null) {
    coachState.onBeatSinceMs = movingMs;
  }
  const onBeatForMs = movingMs - coachState.onBeatSinceMs;
  maybeRecoverTempo(run, stage, onBeatForMs, movingMs);
  return 'on the beat for ' + Math.round(onBeatForMs / second) + 's';
}

function getCoachResponseForCertainTime(stage: TempoSegment, movingMs: number): string | null {
  if (coachState.hasSaidGoalReached) {
    return 'goal already reached';
  }
  if (stage.id === 'cooldown') {
    return 'cool down';
  }
  if (movingMs < quietAtStartOfRunMs) {
    return 'start of run';
  }
  if (movingMs - stage.startMs < quietAtStartOfStageMs) {
    return 'start of stage';
  }
  if (stage.endMs - movingMs < quietAtEndOfStageMs) {
    return 'end of stage';
  }
  return null;
}

function resetPaceTimers() {
  coachState.slowSinceMs = null;
  coachState.onBeatSinceMs = null;
}

// ANNOUNCE a gentle nudge to push them a tad bit faster
function maybeNudge(slowForMs: number, movingMs: number) {
  if (slowForMs < slowBeforeNudgeMs || movingMs - coachState.lastNudgeAtMs < timeBetweenNudgesMs) {
    return;
  }
  const line = slowNudgeLines[coachState.nudgeCount % slowNudgeLines.length];
  coachState.nudgeCount++;
  coachState.lastNudgeAtMs = movingMs;
  announce(line);
}

function getTotalChange(run: ActiveRun): number {
  let total = 0;
  for (const adjustment of run.adjustments) {
    total += adjustment.deltaBpm;
  }
  return total;
}

function maybeEaseTempo(run: ActiveRun, stage: TempoSegment, effort: EffortSnapshot, slowForMs: number, movingMs: number) {
  if (effort.confidence !== 'high') {
    return;
  }
  if (slowForMs < slowBeforeEasingMs || movingMs - coachState.lastAdjustmentAtMs < timeBetweenEasingMs) {
    return;
  }
  const lowestChange = -stage.targetBpm * maxEaseDown;
  if (getTotalChange(run) <= lowestChange) {
    return;
  }
  saveTempoChange(stage, movingMs, -stage.targetBpm * easeStep, 'struggling');
}

function maybeRecoverTempo(run: ActiveRun, stage: TempoSegment, onBeatForMs: number, movingMs: number) {
  if (onBeatForMs < onBeatBeforeRecoveringMs || movingMs - coachState.lastAdjustmentAtMs < timeBetweenRecoveringMs) {
    return;
  }
  const totalChange = getTotalChange(run);
  if (totalChange >= 0) {
    return;
  }
  let change = stage.targetBpm * recoverStep;
  if (change > -totalChange) {
    change = -totalChange;
  }
  saveTempoChange(stage, movingMs, change, 'recovered');
}

function saveTempoChange(stage: TempoSegment, movingMs: number, deltaBpm: number, reason: Adjustment['reason']) {
  addAdjustment({
    atMs: Math.round(movingMs),
    deltaBpm: Math.round(deltaBpm * 10) / 10,
    reason,
    stageId: stage.id,
  });
  coachState.lastAdjustmentAtMs = movingMs;
  recordEvent('tempo-change', reason + ' ' + (deltaBpm > 0 ? '+' : '') + Math.round(deltaBpm * 10) / 10 + ' BPM');
}

// ANNOUNCE upon tapping the Ease off / Push me buttons
export function easeOffFromButton() {
  changeTempoFromButton(-1, 'manual-ease', easeButtonLine);
}

export function pushFromButton() {
  changeTempoFromButton(1, 'manual-push', pushButtonLine);
}

function changeTempoFromButton(direction: 1 | -1, reason: Adjustment['reason'], line: string) {
  const run = getActiveRun();
  if (!run || run.status !== 'running') {
    return;
  }
  const movingMs = getMovingMs(run, Date.now());
  const stage = getCurrentTempoPlanFromCurrentTime(run.plan, movingMs);
  if (!stage) {
    return;
  }

  const change = direction * stage.targetBpm * buttonStep;
  const newTotal = getTotalChange(run) + change;
  const isInsideRange = newTotal >= -stage.targetBpm * maxEaseDown && newTotal <= stage.targetBpm * maxPushUp;

  // CHECKS if user is tapping the button too quickly, to avoid rapid changes
  const isTooSoon = movingMs - coachState.lastButtonChangeAtMs < timeBetweenButtonChangesMs;

  if (isInsideRange && !isTooSoon) {
    saveTempoChange(stage, movingMs, change, reason);
    coachState.lastButtonChangeAtMs = movingMs;
  }

  resetPaceTimers();
  announce(line);
}

// DIAGNOSTICS to note when pace mood changes
function noteIfPaceMoodChanged(run: ActiveRun, paceCheck: string, movingMs: number) {
  if (paceCheck.startsWith('spoke')) {
    return;
  }
  let mood = paceCheck;
  const forIndex = paceCheck.indexOf(' for ');
  if (forIndex >= 0) {
    mood = paceCheck.slice(0, forIndex);
  }
  if (mood === coachState.lastPaceMood) {
    return;
  }
  coachState.lastPaceMood = mood;

  const cadence = getCadence(run);
  const targetBpm = getTargetBpmAt(run.plan, run.adjustments, movingMs);
  let numbers = '';
  if (cadence !== null && targetBpm !== null) {
    numbers = ' (' + cadence + ' steps/min, target ' + targetBpm + ')';
  }

  if (mood === 'struggling') {
    recordEvent('detected', 'Started struggling' + numbers);
  } else if (mood === 'walking') {
    recordEvent('detected', 'Started walking' + numbers);
  } else if (mood === 'on the beat') {
    recordEvent('detected', 'On the beat' + numbers);
  } else {
    recordEvent('detected', 'Coach went ' + mood);
  }
}

export function getCoachDebug() {
  return {
    lastStageId: coachState.lastStageId,
    hasSaidGoalReached: coachState.hasSaidGoalReached,
    dropsCalledOut: coachState.spokenDropKeys.length,
    slowSinceMs: coachState.slowSinceMs,
    onBeatSinceMs: coachState.onBeatSinceMs,
    lastNudgeAtMs: coachState.lastNudgeAtMs,
    lastAdjustmentAtMs: coachState.lastAdjustmentAtMs,
    nudgeCount: coachState.nudgeCount,
    lastPaceCheck: coachState.lastPaceCheck,
    thresholds: {
      quietAtStartOfRunMs,
      quietAtStartOfStageMs,
      quietAtEndOfStageMs,
      slowBeforeNudgeMs,
      slowBeforeEasingMs,
      onBeatBeforeRecoveringMs,
      timeBetweenNudgesMs,
      timeBetweenEasingMs,
      timeBetweenRecoveringMs,
      beatDropWarningMs,
    },
  };
}

export function getRunSong(songId: string): Song | null {
  return coachState.songsById.get(songId) ?? null;
}
