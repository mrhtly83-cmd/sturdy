// src/utils/tone.ts
//
// Per-device tone preference (Soft / Gentle / Direct) — Master Blueprint
// names this a Sturdy+ feature; free users default to Gentle.
// AsyncStorage-backed because user_preferences table is out of scope.

import AsyncStorage from '@react-native-async-storage/async-storage';

export type Tone = 'soft' | 'gentle' | 'direct';

export const TONE_DEFAULT: Tone = 'gentle';
const KEY = '@sturdy/tone-default';

export function isTone(v: unknown): v is Tone {
  return v === 'soft' || v === 'gentle' || v === 'direct';
}

export async function getTone(): Promise<Tone> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    return isTone(raw) ? raw : TONE_DEFAULT;
  } catch {
    return TONE_DEFAULT;
  }
}

export async function setTone(tone: Tone): Promise<void> {
  try {
    await AsyncStorage.setItem(KEY, tone);
  } catch {
    // no-op — preference is non-critical, tone falls back to default
  }
}
