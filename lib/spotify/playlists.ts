/**
 * SPOTIFY PLAYLISTS – lib/spotify/playlists.ts
 *
 * REFERENCE FROM
 * https://developer.spotify.com/documentation/web-api/reference/get-a-list-of-current-users-playlists
 * https://developer.spotify.com/documentation/web-api/reference/get-playlists-items
 */

import type { SongCue } from '../api/tracks';

export type Song = {
  id: string;
  uri: string;
  title: string;
  artist: string;
  artworkUrl: string | null;
  durationMs: number;
  bpm: number | null;
  energy: number | null; 
  beatDropsMs: number[]; 
  cues: SongCue[];
};

export type PlaylistSummary = {
  id: string;
  name: string;
  owner: string;
  artworkUrl: string | null;
  songCount: number;
};

// OUR own OnBeat playlist, used until the user picks one
export const defaultPlaylistId = '1gxgKI4vLVadgOZCu1sgV3';
export const defaultPlaylistName = 'OnBeat (Running Mix)';

const pageSize = 50;

// GET something from the Spotify Web API and RETURN the JSON, with friendly errors
async function spotifyGet(accessToken: string, url: string) {
  const response = await fetch(url, {
    headers: { Authorization: 'Bearer ' + accessToken },
  });

  if (response.ok) {
    return response.json();
  }

  const errorText = await response.text();
  console.warn('[playlists] ' + response.status + ' from Spotify:', errorText);

  if (response.status === 401) {
    throw new Error('Please sign in to Spotify again.');
  }
  if (response.status === 404) {
    throw new Error('The playlist could not be found. It may be private or deleted.');
  }
  if (response.status === 429) {
    throw new Error('Spotify is getting too many requests. Try again in a minute.');
  }
  throw new Error('Spotify returned ' + response.status + '.');
}

function pickSmallestPicture(images: { url: string; width: number | null }[] | null | undefined): string | null {
  if (!images || images.length === 0) {
    return null;
  }
  let smallest = images[0];
  for (const image of images) {
    if (image.width !== null && smallest.width !== null && image.width < smallest.width) {
      smallest = image;
    }
  }
  return smallest.url;
}

export async function fetchMyPlaylists(accessToken: string): Promise<PlaylistSummary[]> {
  const body = await spotifyGet(accessToken, 'https://api.spotify.com/v1/me/playlists?limit=' + pageSize);

  const playlists: PlaylistSummary[] = [];
  for (const item of body.items ?? []) {
    if (!item) {
      continue;
    }
    playlists.push({
      id: item.id,
      name: item.name,
      owner: item.owner?.display_name ?? 'Unknown',
      artworkUrl: pickSmallestPicture(item.images),
      songCount: item.tracks?.total ?? item.items?.total ?? 0,
    });
  }
  return playlists;
}

export async function fetchPlaylistSongs(accessToken: string, playlistId: string): Promise<Song[]> {
  const fields = 'total,items(item(id,uri,name,type,is_local,duration_ms,artists(name),album(images)))';
  const url =
    'https://api.spotify.com/v1/playlists/' + playlistId +
    '/items?limit=' + pageSize +
    '&market=from_token&fields=' + encodeURIComponent(fields);

  const body = await spotifyGet(accessToken, url);

  const songs: Song[] = [];
  for (const entry of body.items ?? []) {
    const track = entry?.item;

    // SKIP podcasts, local files and anything missing
    if (!track || track.type !== 'track' || track.is_local || !track.id) {
      continue;
    }

    songs.push({
      id: track.id,
      uri: track.uri,
      title: track.name,
      artist: track.artists?.[0]?.name ?? 'Unknown artist',
      artworkUrl: pickSmallestPicture(track.album?.images),
      durationMs: track.duration_ms,
      bpm: null,
      energy: null,
      beatDropsMs: [],
      cues: [],
    });
  }

  if (body.total > songs.length) {
    console.warn('[playlists] playlist has ' + body.total + ' items, only the first ' + pageSize + ' are used');
  }
  return songs;
}
