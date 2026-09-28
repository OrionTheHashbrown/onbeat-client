/**
 * SAVED RUN CHOICES – lib/run-setup/saved-choices.ts
 *
 *
 * REFERENCE FROM
 * https://react-native-async-storage.github.io/async-storage/docs/api
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { defaultPlaylistId, defaultPlaylistName } from '../spotify/playlists';

export type DropCallouts = 'build-and-peak' | 'every-song' | 'off';

export type RunChoices = {
  goalMinutes: number;
  playlistId: string;
  playlistName: string;
  dropCallouts: DropCallouts;
};

export const defaultChoices: RunChoices = {
  goalMinutes: 30,
  playlistId: defaultPlaylistId,
  playlistName: defaultPlaylistName,
  dropCallouts: 'build-and-peak',
};

const storageKey = 'onbeat.run-choices';

export async function loadRunChoices(): Promise<RunChoices> {
  try {
    const savedText = await AsyncStorage.getItem(storageKey);
    if (!savedText) {
      return defaultChoices;
    }
    return { ...defaultChoices, ...JSON.parse(savedText) };
  } catch (error) {
    console.warn('[saved-choices] could not load:', error);
    return defaultChoices;
  }
}

export function saveRunChoices(choices: RunChoices) {
  AsyncStorage.setItem(storageKey, JSON.stringify(choices)).catch((error) => {
    console.warn('[saved-choices] could not save:', error);
  });
}
