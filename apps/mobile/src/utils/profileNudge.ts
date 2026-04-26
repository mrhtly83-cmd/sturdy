// src/utils/profileNudge.ts
// Tracks per-child script counts so the result screen can show the
// Master Blueprint's "Sturdy is learning how [child] responds. See
// their profile →" nudge exactly once, after the 3rd script for that
// child.
//
// AsyncStorage-backed (per-device, per-child). The counter resets on
// reinstall — that's acceptable: the nudge is a one-time discovery
// moment, not analytics. Server-side counting via interaction_logs is
// possible but unnecessary for this UX.

import AsyncStorage from '@react-native-async-storage/async-storage';

const COUNT_KEY = (childId: string) => `@sturdy/script-count-${childId}`;
const SHOWN_KEY = (childId: string) => `@sturdy/profile-nudge-shown-${childId}`;

export const NUDGE_THRESHOLD = 3;

/**
 * Increment + persist the script count for one child. Returns the new
 * value. Call after a successful script generation; safe to await or
 * fire-and-forget (failures are swallowed).
 */
export async function incrementScriptCount(childId: string): Promise<number> {
  if (!childId) return 0;
  try {
    const raw = await AsyncStorage.getItem(COUNT_KEY(childId));
    const next = (Number(raw) || 0) + 1;
    await AsyncStorage.setItem(COUNT_KEY(childId), String(next));
    return next;
  } catch {
    return 0;
  }
}

export async function getScriptCount(childId: string): Promise<number> {
  if (!childId) return 0;
  try {
    const raw = await AsyncStorage.getItem(COUNT_KEY(childId));
    return Number(raw) || 0;
  } catch {
    return 0;
  }
}

export async function wasNudgeShown(childId: string): Promise<boolean> {
  if (!childId) return true;        // safe default — don't show
  try {
    const raw = await AsyncStorage.getItem(SHOWN_KEY(childId));
    return raw === 'true';
  } catch {
    return true;
  }
}

export async function markNudgeShown(childId: string): Promise<void> {
  if (!childId) return;
  try {
    await AsyncStorage.setItem(SHOWN_KEY(childId), 'true');
  } catch {
    // no-op
  }
}

/**
 * One-call check: should the result screen show the profile nudge for
 * this child right now? True iff count >= 3 AND nudge has not yet been
 * shown for this child. Caller is responsible for calling
 * `markNudgeShown(childId)` once it actually renders.
 */
export async function shouldShowProfileNudge(childId: string): Promise<boolean> {
  if (!childId) return false;
  const [count, shown] = await Promise.all([
    getScriptCount(childId),
    wasNudgeShown(childId),
  ]);
  return count >= NUDGE_THRESHOLD && !shown;
}

/**
 * DEV-only — wipe the count + shown flag for one child so the nudge
 * surfaces again on the next 3rd script. Useful for testing the
 * animation; not used in prod.
 */
export async function resetProfileNudge(childId: string): Promise<void> {
  if (!childId) return;
  try {
    await AsyncStorage.multiRemove([COUNT_KEY(childId), SHOWN_KEY(childId)]);
  } catch {
    // no-op
  }
}
