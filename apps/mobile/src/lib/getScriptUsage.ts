// apps/mobile/src/lib/getScriptUsage.ts
// Reads real script usage count from usage_events table.
// Returns how many scripts the user has generated and how many remain.

import { supabase } from './supabase';

const FREE_TOTAL = 5;

export type ScriptUsage = {
  used:      number;
  remaining: number;
  total:     number;
  isOut:     boolean;
};

export async function getScriptUsage(userId: string): Promise<ScriptUsage> {
  const { count, error } = await supabase
    .from('usage_events')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('event_type', 'script_generated');

  if (error) {
    console.warn('[STURDY_USAGE] Could not load usage count:', error.message);
    // Fail open — show full quota rather than blocking the user
    return {
      used:      0,
      remaining: FREE_TOTAL,
      total:     FREE_TOTAL,
      isOut:     false,
    };
  }

  const used      = count ?? 0;
  const remaining = Math.max(0, FREE_TOTAL - used);

  return {
    used,
    remaining,
    total:  FREE_TOTAL,
    isOut:  remaining === 0,
  };
}
