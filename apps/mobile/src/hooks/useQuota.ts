// src/hooks/useQuota.ts
// Fetches both quota counts in one RPC call (get_quota_counts).
// Free users only — Sturdy+ users bypass quota entirely (returns zeroed counts).

import { useCallback, useEffect, useState } from 'react';
import { supabase }       from '../lib/supabase';
import { useAuth }        from '../context/AuthContext';
import { useSubscription } from './useSubscription';

export interface QuotaCounts {
  scriptsUsed:   number;
  scriptsCap:    number;
  questionsUsed: number;
  questionsCap:  number;
  resetDate:     string; // "Jun 1" format
}

const EMPTY: Omit<QuotaCounts, 'resetDate'> = {
  scriptsUsed:   0,
  scriptsCap:    50,
  questionsUsed: 0,
  questionsCap:  25,
};

function getResetDate(): string {
  const now   = new Date();
  const reset = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  return reset.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function useQuota() {
  const { session }   = useAuth();
  const { isPremium } = useSubscription();

  const [counts, setCounts]   = useState<QuotaCounts>({ ...EMPTY, resetDate: getResetDate() });
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!session?.user?.id || isPremium) {
      setCounts({ ...EMPTY, resetDate: getResetDate() });
      setLoading(false);
      return;
    }
    try {
      const { data, error } = await supabase
        .rpc('get_quota_counts', { target_user_id: session.user.id });
      if (error || !data) throw error ?? new Error('empty response');
      setCounts({
        scriptsUsed:   (data as any).scripts_used   ?? 0,
        scriptsCap:    (data as any).scripts_cap    ?? 50,
        questionsUsed: (data as any).questions_used ?? 0,
        questionsCap:  (data as any).questions_cap  ?? 25,
        resetDate:     getResetDate(),
      });
    } catch (err) {
      console.warn('[QUOTA] Failed to fetch counts:', err);
    } finally {
      setLoading(false);
    }
  }, [session?.user?.id, isPremium]);

  useEffect(() => { refresh(); }, [refresh]);

  const scriptsRemaining   = Math.max(0, counts.scriptsCap   - counts.scriptsUsed);
  const questionsRemaining = Math.max(0, counts.questionsCap - counts.questionsUsed);
  const scriptsPct         = counts.scriptsCap   > 0 ? Math.min(1, counts.scriptsUsed   / counts.scriptsCap)   : 0;
  const questionsPct       = counts.questionsCap > 0 ? Math.min(1, counts.questionsUsed / counts.questionsCap) : 0;

  return {
    counts,
    loading,
    refresh,
    scriptsRemaining,
    questionsRemaining,
    scriptsPct,
    questionsPct,
    isScriptsLow:    !isPremium && scriptsPct   >= 0.8,
    isQuestionsLow:  !isPremium && questionsPct >= 0.8,
    isScriptsGone:   !isPremium && scriptsRemaining   === 0,
    isQuestionsGone: !isPremium && questionsRemaining === 0,
  };
}
