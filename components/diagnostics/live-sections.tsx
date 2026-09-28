/**
 * LIVE DIAGNOSTICS SECTIONS – components/diagnostics/live-sections.tsx
 *
 */

'use no memo';

import { getCoachDebug, getRunSong } from '../../lib/coach/coach';
import { useCoachVoice } from '../../lib/coach/voice';
import { formatClock, formatDistance, formatPace } from '../../lib/run/metrics';
import {
  ActiveRun,
  getAverageCadence,
  getCurrentStage,
  getMovingMs,
} from '../../lib/run/run-store';
import { getEffortVerdict, isCadenceChangingRapidly } from '../../lib/coach/classify';
import { buildEffortSnapshot } from '../../lib/coach/effort';
import { getLiveQueueDebug } from '../../lib/spotify/live-queue';
import { getNowPlaying, getPositionNow } from '../../lib/spotify/now-playing';
import { getTargetBpmAt } from '../../lib/tempo/plan';
import { InfoRow, InfoSection } from './info-section';

type SectionProps = {
  run: ActiveRun;
  now: number;
};

// TURN milliseconds into seconds or minutes and seconds
function shortTime(ms: number): string {
  const totalSeconds = Math.max(0, Math.round(ms / 1000));
  if (totalSeconds < 60) {
    return totalSeconds + 's';
  }
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return minutes + 'm ' + (seconds < 10 ? '0' : '') + seconds + 's';
}

// SHOW a timer against the time it's waiting for
function timerAgainst(elapsedMs: number | null, neededMs: number): { text: string; isReady: boolean } {
  if (elapsedMs === null) {
    return { text: 'not counting', isReady: false };
  }
  const isReady = elapsedMs >= neededMs;
  return { text: shortTime(elapsedMs) + ' of ' + shortTime(neededMs) + (isReady ? ' ✓' : ''), isReady };
}

export function ClockSection({ run, now }: SectionProps) {
  const movingMs = getMovingMs(run, now);
  const goalMs = run.goalMinutes * 60 * 1000;
  return (
    <InfoSection title="Clock">
      <InfoRow label="Moving time" value={formatClock(movingMs)} />
      <InfoRow label="Since start" value={formatClock(now - run.startedAt) + ' (includes pauses)'} />
      <InfoRow label="Goal" value={run.goalMinutes + ' min, ' + (movingMs < goalMs ? formatClock(goalMs - movingMs) + ' left' : 'reached')} />
      <InfoRow label="Status" value={run.status + ', ' + formatDistance(run.distanceMetres)} />
    </InfoSection>
  );
}

export function RunnerSection({ run, now }: SectionProps) {
  const effort = buildEffortSnapshot(run, now);
  const averageCadence = getAverageCadence(run, now);
  const targetBpm = getTargetBpmAt(run.plan, run.adjustments, getMovingMs(run, now));
  const verdict = targetBpm === null ? 'unknown' : getEffortVerdict(effort, targetBpm);

  return (
    <InfoSection title="Runner">
      <InfoRow label="Verdict" value={verdict} highlight />
      <InfoRow label="Steps /min 35s" value={effort.cadence === null ? 'not enough steps yet' : String(effort.cadence)} />
      <InfoRow label="Steps /min 12s" value={effort.fastCadence === null ? 'not enough steps yet' : String(effort.fastCadence)} />
      <InfoRow label="Changing pace" value={isCadenceChangingRapidly(effort) ? 'yes (coach waits)' : 'no'} />
      <InfoRow label="Steps /min avg" value={averageCadence === null ? '--' : String(averageCadence)} />
      <InfoRow label="Pace now /km" value={formatPace(effort.paceMsPerKm)} />
      <InfoRow label="Pace avg /km" value={formatPace(effort.averagePace)} />
      <InfoRow label="Pace ratio" value={effort.paceRatio === null ? '--' : effort.paceRatio.toFixed(2) + ' (over 1 = slower than usual)'} />
      <InfoRow label="Stride" value={effort.strideMetres === null ? '--' : effort.strideMetres.toFixed(2) + ' m'} />
      <InfoRow label="Motion" value={effort.motion} />
      <InfoRow label="Confidence" value={effort.confidence} />
      <InfoRow label="Total steps" value={run.totalSteps === null ? 'no pedometer' : String(run.totalSteps)} />
      <InfoRow label="Step samples" value={run.stepSamples.length + ' in the last minute'} />
      <InfoRow label="GPS tracking" value={run.backgroundTracking ? 'background (screen can be off)' : 'foreground only (keep screen on)'} />
    </InfoSection>
  );
}

export function PaceCheckSection({ run, now }: SectionProps) {
  const debug = getCoachDebug();
  const limits = debug.thresholds;
  const movingMs = getMovingMs(run, now);
  const stage = getCurrentStage(run, now);

  const slowForMs = debug.slowSinceMs === null ? null : movingMs - debug.slowSinceMs;
  const onBeatForMs = debug.onBeatSinceMs === null ? null : movingMs - debug.onBeatSinceMs;
  const sinceNudgeMs = debug.lastNudgeAtMs === -Infinity ? null : movingMs - debug.lastNudgeAtMs;
  const sinceChangeMs = debug.lastAdjustmentAtMs === -Infinity ? null : movingMs - debug.lastAdjustmentAtMs;

  const nudgeTimer = timerAgainst(slowForMs, limits.slowBeforeNudgeMs);
  const easeTimer = timerAgainst(slowForMs, limits.slowBeforeEasingMs);
  const recoverTimer = timerAgainst(onBeatForMs, limits.onBeatBeforeRecoveringMs);
  const nudgeGap = timerAgainst(sinceNudgeMs, limits.timeBetweenNudgesMs);
  const easeGap = timerAgainst(sinceChangeMs, limits.timeBetweenEasingMs);
  const recoverGap = timerAgainst(sinceChangeMs, limits.timeBetweenRecoveringMs);

  return (
    <InfoSection title="Pace check">
      <InfoRow label="Decision" value={debug.lastPaceCheck} highlight />
      <InfoRow label="Counts as slow" value="struggling (nudge + ease) or walking (nudge only)" />
      <InfoRow label="Slow - nudge" value={nudgeTimer.text} highlight={nudgeTimer.isReady} />
      <InfoRow label="Slow - ease" value={easeTimer.text} highlight={easeTimer.isReady} />
      <InfoRow label="On beat - recover" value={recoverTimer.text} highlight={recoverTimer.isReady} />
      <InfoRow label="Since last nudge" value={sinceNudgeMs === null ? 'none yet' : nudgeGap.text} />
      <InfoRow label="Since last change" value={sinceChangeMs === null ? 'none yet' : easeGap.text + ' ease, ' + recoverGap.text + ' recover'} />
      <InfoRow label="Run start quiet" value={timerAgainst(movingMs, limits.quietAtStartOfRunMs).text} />
      <InfoRow label="Stage start quiet" value={stage ? timerAgainst(movingMs - stage.startMs, limits.quietAtStartOfStageMs).text : '--'} />
      <InfoRow label="Stage ends in" value={stage ? shortTime(stage.endMs - movingMs) + ' (quiet in the last ' + shortTime(limits.quietAtEndOfStageMs) + ')' : '--'} />
    </InfoSection>
  );
}

export function TargetSection({ run, now }: SectionProps) {
  const movingMs = getMovingMs(run, now);
  const stage = getCurrentStage(run, now);
  const targetNow = getTargetBpmAt(run.plan, run.adjustments, movingMs);

  let totalChange = 0;
  for (const adjustment of run.adjustments) {
    totalChange += adjustment.deltaBpm;
  }
  const lastChange = run.adjustments.length > 0 ? run.adjustments[run.adjustments.length - 1] : null;

  return (
    <InfoSection title="Target">
      <InfoRow label="Stage" value={stage ? stage.name + ' (' + formatClock(stage.startMs) + ' – ' + formatClock(stage.endMs) + ')' : '--'} />
      <InfoRow label="Planned BPM" value={stage ? String(stage.targetBpm) : '--'} />
      <InfoRow label="Target BPM now" value={targetNow === null ? '--' : String(targetNow)} highlight />
      <InfoRow label="Total change" value={(totalChange > 0 ? '+' : '') + Math.round(totalChange * 10) / 10 + ' BPM over ' + run.adjustments.length + ' change(s)'} />
      <InfoRow
        label="Last change"
        value={lastChange ? lastChange.reason + ' ' + (lastChange.deltaBpm > 0 ? '+' : '') + lastChange.deltaBpm + ' at ' + formatClock(lastChange.atMs) : 'none yet'}
      />
    </InfoSection>
  );
}

export function SongSection({ run }: SectionProps) {
  const playing = getNowPlaying();
  if (!playing) {
    return (
      <InfoSection title="Song">
        <InfoRow label="Playing" value="nothing reported by Spotify" />
      </InfoSection>
    );
  }

  const song = getRunSong(playing.songId);
  const position = getPositionNow(playing);
  const debug = getCoachDebug();

  // GET the next beat drop in this song, if any
  let nextDropAtMs: number | null = null;
  if (song) {
    for (const cue of song.cues) {
      if ((cue.kind === 'drop' || cue.kind === 'chorus') && cue.atMs > position) {
        nextDropAtMs = cue.atMs;
        break;
      }
    }
  }

  let nextDropText = 'none left in this song';
  if (nextDropAtMs !== null) {
    const warnInMs = nextDropAtMs - debug.thresholds.beatDropWarningMs - position;
    nextDropText = 'at ' + formatClock(nextDropAtMs) + ', ' + (warnInMs > 0 ? 'callout in ' + shortTime(warnInMs) : 'callout due now');
  }

  return (
    <InfoSection title="Song">
      <InfoRow label="Playing" value={playing.title + ' – ' + playing.artist} />
      <InfoRow label="Position" value={formatClock(position) + ' of ' + formatClock(playing.durationMs) + (playing.isPaused ? ' (paused)' : '')} />
      <InfoRow label="Song BPM" value={song && song.bpm !== null ? String(Math.round(song.bpm)) : song ? 'unknown' : 'not from our playlist'} />
      <InfoRow label="Beat drops" value={song ? song.beatDropsMs.length + ' tagged' : '--'} />
      <InfoRow label="Next drop" value={nextDropText} />
      <InfoRow label="Callouts" value={run.dropCallouts} />
    </InfoSection>
  );
}

// SHOW the next songs lined up in the queue, and how many are left to pick from
export function QueueSection(_props: { now: number }) {
  const queue = getLiveQueueDebug();
  return (
    <InfoSection title="Queue">
      {queue.linedUp.length === 0 ? <InfoRow label="Lined up" value="nothing yet" /> : null}
      {queue.linedUp.map((song, index) => (
        <InfoRow
          key={song.id}
          label={index === 0 ? 'Lined up' : ''}
          value={song.title + ' – ' + song.artist + ' (' + (song.bpm === null ? '?' : Math.round(song.bpm)) + ' BPM)'}
        />
      ))}
      <InfoRow label="Songs left" value={queue.songsLeft + ' to pick from'} />
    </InfoSection>
  );
}

export function CoachSection(_props: { now: number }) {
  const debug = getCoachDebug();
  const voice = useCoachVoice();
  return (
    <InfoSection title="Coach">
      <InfoRow label="Voice" value={voice.isVoiceOn ? 'on' : 'off'} />
      <InfoRow label="Stage announced" value={debug.lastStageId ?? 'none yet'} />
      <InfoRow label="Goal reached said" value={debug.hasSaidGoalReached ? 'yes' : 'not yet'} />
      <InfoRow label="Nudges said" value={String(debug.nudgeCount)} />
      <InfoRow label="Drops called out" value={String(debug.dropsCalledOut)} />
      <InfoRow label="Last line" value={voice.lastLine ?? 'nothing yet'} />
    </InfoSection>
  );
}
