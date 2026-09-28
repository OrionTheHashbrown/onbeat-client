/**
 * SET THE COACH LINES – lib/coach/coach-lines.ts
 *
 */

import type { StageId } from '../tempo/plan';

// SAID when each stage starts
export const stageStartLines: Record<StageId, string> = {
  warmup: 'Warm up phase. Get yourself ready.',
  build: "Build phase. Start lifting the pace slightly.",
  peak: 'Peak Phase. This is it, give me everything you have.',
  cooldown: 'Cool down phase. Slow down a little.',
};

export const goalReachedLine = "Goal reached! Amazing work!";

export const beatDropLine = 'Beat drop coming up, get ready!!';

export const slowNudgeLines = [
  "Let's try jogging just a tad bit faster",
  "You're doing great, see if you can pick it up just a little.",
  "Keep pushing yourself a bit more!",
];

export const easeButtonLine = "Okay, easing off. Let's take it down a notch.";
export const pushButtonLine = "Let's push! Picking up the pace.";
