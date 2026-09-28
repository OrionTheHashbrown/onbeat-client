/**
 * COACH VOICE – lib/coach/voice.ts
 *
 * REFERENCE FROM
 * https://docs.expo.dev/versions/latest/sdk/speech/
 */

import * as Speech from 'expo-speech';
import { recordEvent } from '../diagnostics/run-trace';
import { makeStore, useStoreValue } from '../make-store';

type CoachVoiceState = {
  isVoiceOn: boolean;
  lastLine: string | null;
  lastLineAt: number;
};

export const coachVoiceStore = makeStore<CoachVoiceState>({
  isVoiceOn: true,
  lastLine: null,
  lastLineAt: 0,
});

export function useCoachVoice() {
  return useStoreValue(coachVoiceStore);
}

// ANNOUNCE a line and SHOW on run widget
export function announce(line: string) {
  const state = coachVoiceStore.getValue();
  coachVoiceStore.setValue({ ...state, lastLine: line, lastLineAt: Date.now() });
  recordEvent('said', line);

  if (state.isVoiceOn) {
    Speech.speak(line, { language: 'en', useApplicationAudioSession: false });
  }
}

export function setVoiceOn(isOn: boolean) {
  const state = coachVoiceStore.getValue();
  coachVoiceStore.setValue({ ...state, isVoiceOn: isOn });
  if (!isOn) {
    Speech.stop();
  }
}

export function clearVoice() {
  Speech.stop();
  const state = coachVoiceStore.getValue();
  coachVoiceStore.setValue({ ...state, lastLine: null, lastLineAt: 0 });
}
