// src/utils/onboarding.ts
// AsyncStorage helpers for the welcome / onboarding flow.

import AsyncStorage from '@react-native-async-storage/async-storage';

const ONBOARDING_KEY = '@sturdy/onboarding-complete';

/**
 * Has this device finished the welcome flow at least once?
 * Used by the root layout to decide whether to route a signed-out user
 * to /welcome (first-time) or /auth?mode=signin (returning).
 */
export async function hasCompletedOnboarding(): Promise<boolean> {
  try {
    const v = await AsyncStorage.getItem(ONBOARDING_KEY);
    return v === 'true';
  } catch {
    // If AsyncStorage is broken, treat the device as fresh — better to
    // re-show onboarding than block a returning user from signing in.
    return false;
  }
}

export async function markOnboardingComplete(): Promise<void> {
  try {
    await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
  } catch {
    // No-op — onboarding completion is not load-bearing.
  }
}

/**
 * DEV-only — wipe the flag so the welcome flow shows again on next launch.
 * Useful for testing the onboarding flow without reinstalling the app.
 */
export async function resetOnboarding(): Promise<void> {
  try {
    await AsyncStorage.removeItem(ONBOARDING_KEY);
  } catch {
    // ignore
  }
}
