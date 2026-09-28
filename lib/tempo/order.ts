/**
 * SONG ORDER – lib/tempo/order.ts
 *
 */

import type { Song } from '../spotify/playlists';
import { getCurrentTempoPlanFromCurrentTime, getPlanLengthMs, type TempoSegment } from './plan';

// WEIGHTAGE for each factor in the song scoring system
const tempoWeight = 1.0;
const smoothnessWeight = 0.25;
const energyWeight = 0.05;
const beatDropAlignmentWeight = 8;

// WHEN reshuffling, any song within this much of the best score can be picked
const reshuffleTolerance = 8;

// SONG's BPM must be within a certain usable range to be considered for scoring
const lowestUsableBpm = 60;
const highestUsableBpm = 200;

// PICK whichever of bpm, double bpm or half bpm is closest to the target
export function calculateEffectiveBpm(bpm: number, targetBpm: number): number {
  const options = [bpm, bpm * 2, bpm / 2];

  let closest: number | null = null;
  for (const option of options) {
    if (option < lowestUsableBpm || option > highestUsableBpm) {
      continue;
    }
    if (closest === null || Math.abs(option - targetBpm) < Math.abs(closest - targetBpm)) {
      closest = option;
    }
  }

  if (closest === null) {
    return bpm;
  }
  return closest;
}

// SONG SCORING SYSTEM – for individual song placement score
export function calculatePlacementScore(
  song: Song,
  segment: TempoSegment,
  atMs: number,
  previousEffectiveBpm: number | null,
  targetBpm: number = segment.targetBpm,
): number {

  const effective = calculateEffectiveBpm(song.bpm as number, targetBpm);
  let score = tempoWeight * Math.abs(effective - targetBpm);

  // CALCULATE smoothness score
  if (previousEffectiveBpm !== null) {
    score += smoothnessWeight * Math.abs(effective - previousEffectiveBpm);
  }

  // CALCULATE energy score
  if (song.energy !== null) {
    score += energyWeight * Math.abs(song.energy - segment.targetEnergy);
  }

  // CALCULATE beat drop score (only for Peak stage of the tempo plan)
  if (segment.id === 'peak' && song.beatDropsMs.length > 0) {
    let landsInPeak = false;
    for (const offsetMs of song.beatDropsMs) {
      const at = atMs + offsetMs;
      if (at >= segment.startMs && at < segment.endMs) {
        landsInPeak = true;
      }
    }
    if (landsInPeak) {
      score -= beatDropAlignmentWeight;
    }
  }
  return score;
}

// A SIMPLE random number maker that gives the SAME numbers for the same seed
function makeRandomPicker(seed: number) {
  let current = seed;
  return function nextRandom(): number {
    current = (current * 9901 + 49239) % 223180;
    return current / 223180; 
  };
}

// CHECK a song can be scored at all (needs a BPM and a length)
export function canBeScored(song: Song): boolean {
  return song.bpm !== null && song.bpm > 0 && song.durationMs > 0;
}

export type OrderResult = {
  orderedSongs: Song[];
  spareSongs: Song[];
  totalMs: number; 
};

// ORDER the songs for the plan 
export function orderSongsForPlan(songs: Song[], plan: TempoSegment[], shuffleNumber: number): OrderResult {
  const planLengthMs = getPlanLengthMs(plan);
  const nextRandom = makeRandomPicker(shuffleNumber);

  // SPLIT the songs into ones we can score and ones we can't (no BPM found)
  let songsLeft: Song[] = [];
  const unscoredSongs: Song[] = [];
  for (const song of songs) {
    if (canBeScored(song)) {
      songsLeft.push(song);
    } else {
      unscoredSongs.push(song);
    }
  }

  if (songsLeft.length === 0 || planLengthMs === 0) {
    return { orderedSongs: songs, spareSongs: [], totalMs: 0 };
  }

  const orderedSongs: Song[] = [];
  let atMs = 0;
  let previousEffectiveBpm: number | null = null;

  // KEEP adding songs until the goal time is covered 
  while (atMs < planLengthMs && songsLeft.length > 0) {
    const segment = getCurrentTempoPlanFromCurrentTime(plan, atMs) as TempoSegment;

    const chosenSong = pickBestSong(songsLeft, segment, atMs, previousEffectiveBpm, shuffleNumber, nextRandom);

    orderedSongs.push(chosenSong);
    songsLeft = songsLeft.filter((song) => song.id !== chosenSong.id);
    previousEffectiveBpm = calculateEffectiveBpm(chosenSong.bpm as number, segment.targetBpm);
    atMs += chosenSong.durationMs;
  }

  // SPARES = the scored songs we didn't need + the songs with no BPM at the very end
  const spareSongs = [...songsLeft, ...unscoredSongs];

  return { orderedSongs, spareSongs, totalMs: atMs };
}

// PICK one song for this point in the run
function pickBestSong(
  candidates: Song[],
  segment: TempoSegment,
  atMs: number,
  previousEffectiveBpm: number | null,
  shuffleNumber: number,
  nextRandom: () => number,
): Song {

  const scores: number[] = [];
  let bestScore = Infinity;
  let bestSong = candidates[0];
  for (const song of candidates) {
    const score = calculatePlacementScore(song, segment, atMs, previousEffectiveBpm);
    scores.push(score);
    if (score < bestScore) {
      bestScore = score;
      bestSong = song;
    }
  }

  // NOT reshuffling, so the best one wins
  if (shuffleNumber === 0) {
    return bestSong;
  }

  // RESHUFFLING, pick a random song from the ones that are almost as good as the best
  const almostAsGood: Song[] = [];
  for (let index = 0; index < candidates.length; index++) {
    if (scores[index] <= bestScore + reshuffleTolerance) {
      almostAsGood.push(candidates[index]);
    }
  }
  const randomIndex = Math.floor(nextRandom() * almostAsGood.length);
  return almostAsGood[randomIndex];
}
