/**
 * DIAGNOSTICS ON / OFF – lib/diagnostics/diagnostics-setting.ts
 *
 * REFERENCE FROM
 * https://react-native-async-storage.github.io/async-storage/docs/api
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const storageKey = 'onbeat.diagnostics-on';

export async function loadDiagnosticsSetting(): Promise<boolean> {
  try {
    const savedValue = await AsyncStorage.getItem(storageKey);
    return savedValue === 'true';
  } catch {
    return false;
  }
}

export function saveDiagnosticsSetting(isOn: boolean) {
  AsyncStorage.setItem(storageKey, isOn ? 'true' : 'false').catch((error) => {
    console.warn('[diagnostics] could not save the setting:', error);
  });
}
