// apps/mobile/src/lib/sessionTimeout.ts
// Global 20-minute inactivity timeout.
// Import resetSessionTimeout() in any screen and call on user interaction.
// When timer fires, calls signOut. AuthGate in app/_layout.tsx handles the
// post-signout redirect (returning user → /auth?mode=signin).

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
    // AuthGate handles the redirect once the session drops.
  }, TIMEOUT_MS);
}
