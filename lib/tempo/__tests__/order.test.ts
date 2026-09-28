/**
 * SONG ORDER TESTS – lib/tempo/__tests__/order.test.ts
 *
 */

import assert from 'node:assert';
import { describe, it } from 'node:test';
import type { Song } from '../../spotify/playlists';
import { calculateEffectiveBpm, orderSongsForPlan } from '../order';
import { buildTempoPlan } from '../plan';

const threeMinutes = 3 * 60 * 1000;

// MAKE a fake song with a given BPM 
function makeSong(id: string, bpm: number | null): Song {
  return {
    id,
    uri: 'spotify:track:' + id,
    title: 'Song ' + id,
    artist: 'Test Artist',
    artworkUrl: null,
    durationMs: threeMinutes,
    bpm,
    energy: null,
    beatDropsMs: [],
    cues: [],
  };
}

// MAKE a playlist of songs with a mix of speeds
function makePlaylist(count: number): Song[] {
  const songs: Song[] = [];
  for (let index = 0; index < count; index++) {
    songs.push(makeSong('song-' + index, 120 + index * 3));
  }
  return songs;
}

describe('calculateEffectiveBpm', () => {
  it('should use double time when it is closer to the target', () => {
    // 85 BPM run at double time = 170, much closer to 172 than 85 is
    assert.strictEqual(calculateEffectiveBpm(85, 172), 170);
  });
});

describe('orderSongsForPlan', () => {
  const plan = buildTempoPlan(30, 155);

  it('should add songs until the goal is covered, and keep the rest as spares', () => {
    const songs = makePlaylist(20); 
    const result = orderSongsForPlan(songs, plan, 0);

    // 30 minutes of 3 minute songs = 10 songs
    assert.strictEqual(result.orderedSongs.length, 10);
    assert.ok(result.totalMs >= 30 * 60 * 1000);
    assert.strictEqual(result.orderedSongs.length + result.spareSongs.length, 20);
  });

  it('should put songs with no BPM in the spares, never in the order', () => {
    const songs = [...makePlaylist(12), makeSong('no-bpm', null)];

    const result = orderSongsForPlan(songs, plan, 0);

    const orderedIds = result.orderedSongs.map((song) => song.id);
    const spareIds = result.spareSongs.map((song) => song.id);
    assert.ok(!orderedIds.includes('no-bpm'));
    assert.ok(spareIds.includes('no-bpm'));
  });

  it('should give the same order for the same shuffle number', () => {
    const songs = makePlaylist(20);

    const firstTry = orderSongsForPlan(songs, plan, 3).orderedSongs.map((song) => song.id);
    const secondTry = orderSongsForPlan(songs, plan, 3).orderedSongs.map((song) => song.id);

    assert.deepStrictEqual(firstTry, secondTry);
  });

  it('should give the songs back as they are when none of them have a BPM', () => {
    const songs = [makeSong('a', null), makeSong('b', null)];

    const result = orderSongsForPlan(songs, plan, 0);

    assert.deepStrictEqual(result.orderedSongs, songs);
    assert.strictEqual(result.totalMs, 0);
  });
});
