/**
 * GET SPOTIFY PROFILE
 *
 * REFERENCE FROM
 * https://developer.spotify.com/documentation/web-api/reference/get-current-users-profile
 */

export type SpotifyProfile = {
  id: string;
  displayName: string;
  email: string | null;
  pictureUrl: string | null;
  isPremium: boolean;
};

export async function fetchSpotifyProfile(accessToken: string): Promise<SpotifyProfile> {
  const response = await fetch('https://api.spotify.com/v1/me', {
    headers: { Authorization: 'Bearer ' + accessToken },
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.warn('[spotify] ' + response.status + ' from /v1/me:', errorText);
    throw new Error('Spotify returned ' + response.status + ' when loading your profile.');
  }

  const body = await response.json();

  let pictureUrl: string | null = null;
  if (Array.isArray(body.images) && body.images.length > 0) {
    pictureUrl = body.images[0].url;
  }

  return {
    id: body.id,
    displayName: body.display_name || body.id,
    email: body.email ?? null,
    pictureUrl,
    isPremium: body.product === 'premium',
  };
}
