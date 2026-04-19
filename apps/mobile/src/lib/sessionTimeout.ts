// apps/mobile/src/lib/sessionTimeout.ts
// Global 20-minute inactivity timeout.
// Import resetSessionTimeout() in any screen and call on user interaction.
// When timer fires, calls signOut and routes to /welcome.

import { router } from 'expo-router';
import { supabase } from './supabase';

const TIMEOUT_MS = 20 * 60 * 1000; // 20 minutes

let timeoutId: ReturnType<typeof setTimeout> | null = null;
let isActive = false;

export function startSessionTimeout() {
  isActive = true;
  resetSessionTimeout();
}

export function stopSessionTimeout() {
  isActive = false;
  if (timeoutId) {
    clearTimeout(timeoutId);
    timeoutId = null;
  }
}

export function resetSessionTimeout() {
  if (!isActive) return;
  if (timeoutId) clearTimeout(timeoutId);

  timeoutId = setTimeout(async () => {
    try {
      await supabase.auth.signOut();
    } catch { /* non-fatal */ }
    router.replace('/welcome');
  }, TIMEOUT_MS);
}
