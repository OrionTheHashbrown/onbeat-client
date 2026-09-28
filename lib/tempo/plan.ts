/**
 * TEMPO PLAN – lib/tempo/plan.ts
 *
 */

export type StageId = 'warmup' | 'build' | 'peak' | 'cooldown';

export type TempoSegment = {
  id: StageId;
  name: string;
  targetBpm: number;
  targetEnergy: number; 
  startMs: number;
  endMs: number;
};

export type Adjustment = {
  atMs: number;
  deltaBpm: number;
  reason: 'struggling' | 'recovered' | 'manual-ease' | 'manual-push' | 'drop-push';
  stageId: StageId;
};

// EACH stage's share of the run (weight),
// ex. weights 1 : 3 : 2 : 1 – ex. a 35 min run = 5 min warm up, 15 min build, 10 min peak, 5 min cool down
const tempoBlueprint: { id: StageId; name: string; weight: number; bpmOffset: number; energy: number }[] = [
  { id: 'warmup', name: 'Warm Up', weight: 1, bpmOffset: -20, energy: 45 },
  { id: 'build', name: 'Build', weight: 3, bpmOffset: 0, energy: 65 },
  { id: 'peak', name: 'Peak', weight: 2, bpmOffset: 17, energy: 85 },
  { id: 'cooldown', name: 'Cool Down', weight: 1, bpmOffset: -35, energy: 25 },
];

export const defaultBaselineSpm = 155;
const minTargetBpm = 110;
const maxTargetBpm = 200;
const msPerMinute = 60 * 1000;

// ADD UP all the weights once (1 + 3 + 2 + 1 = 7)
let totalBlueprintWeight = 0;
for (const stage of tempoBlueprint) {
  totalBlueprintWeight += stage.weight;
}

// CALCULATE and RETURN each stage's (WARM UP, BUILD, PEAK, COOL DOWN)
export function buildTempoPlan(goalMinutes: number, baselineSpm: number = defaultBaselineSpm): TempoSegment[] {

  // CONVERT goalMinutes to milliseconds
  const goalInMs = Math.round(goalMinutes * msPerMinute);

  // BUILD the plan segment by segment, taking note of where each segment starts and ends.
  const segments: TempoSegment[] = [];

  let weightSoFar = 0;
  let startMs = 0;

  // FOR each stage in tempoBlueprint, CALCULATE end time and target BPM, STORE it in segments as a TempoSegment
  for (const stage of tempoBlueprint) {
    weightSoFar += stage.weight;
    const fractionOfRunFinished = weightSoFar / totalBlueprintWeight;
    const endMs = Math.round(fractionOfRunFinished * goalInMs);

    // CALCULATE targetBpm based on user's baselineSpm and stage's bpmOffset
    let targetBpm = Math.round(baselineSpm + stage.bpmOffset);

    // CHECKS ensuring values are within range of minTargetBpm and maxTargetBpm
    if (targetBpm < minTargetBpm) {
      targetBpm = minTargetBpm;
    }
    if (targetBpm > maxTargetBpm) {
      targetBpm = maxTargetBpm;
    }

    segments.push({
      id: stage.id,
      name: stage.name,
      targetBpm,
      targetEnergy: stage.energy,
      startMs,
      endMs,
    });
    startMs = endMs;
  }

  return segments;
}

// FIND which stage the run is in at a given time
export function getCurrentTempoPlanFromCurrentTime(plan: TempoSegment[], atMs: number): TempoSegment | null {
  if (plan.length === 0) {
    return null;
  }
  for (const segment of plan) {
    if (atMs < segment.endMs) {
      return segment;
    }
  }
  return plan[plan.length - 1];
}

// HOW LONG the whole plan is (the end of the last stage)
export function getPlanLengthMs(plan: TempoSegment[]): number {
  if (plan.length === 0) {
    return 0;
  }
  return plan[plan.length - 1].endMs;
}

// HOW FAR the coach is allowed to move a stage's target (10% down, 5% up)
const maxEaseDownFraction = 0.1;
const maxPushUpFraction = 0.05;

// CALCULATE the target BPM right now = the stage's target + every coach adjustment so far
export function getTargetBpmAt(plan: TempoSegment[], adjustments: Adjustment[], atMs: number): number | null {
  const stage = getCurrentTempoPlanFromCurrentTime(plan, atMs);
  if (!stage) {
    return null;
  }

  // ADD UP every adjustment made up to this moment
  let totalChange = 0;
  for (const adjustment of adjustments) {
    if (adjustment.atMs <= atMs) {
      totalChange += adjustment.deltaBpm;
    }
  }

  // CHECKS keeping it inside the allowed range for this stage
  let targetBpm = stage.targetBpm + totalChange;
  const lowest = stage.targetBpm * (1 - maxEaseDownFraction);
  const highest = stage.targetBpm * (1 + maxPushUpFraction);
  if (targetBpm < lowest) {
    targetBpm = lowest;
  }
  if (targetBpm > highest) {
    targetBpm = highest;
  }

  return Math.round(targetBpm);
}
