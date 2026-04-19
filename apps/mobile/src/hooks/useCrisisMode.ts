// src/hooks/useCrisisMode.ts
// Reusable crisis detection hook
// Scans text for crisis phrases and returns detection result
// Used by: now.tsx, result.tsx, home screen input, any future text input
//
// Usage:
//   const { isCrisis, crisisType, riskLevel } = useCrisisMode(text);
//
// Or for one-off checks without the hook:
//   import { detectCrisis } from '../hooks/useCrisisMode';
//   const result = detectCrisis(text);

import { useMemo } from 'react';
import {
  CRISIS_PHRASES,
  RISK_LEVELS,
  type CrisisCategory,
  type RiskLevel,
} from '../data/crisisPhrases';


export type CrisisDetection = {
  /** Whether any crisis phrase was detected */
  isCrisis: boolean;
  /** The category of the first matched crisis phrase, or null */
  crisisType: CrisisCategory | null;
  /** The risk level for routing, or null */
  riskLevel: RiskLevel | null;
  /** The matched phrase (for logging), or null */
  matchedPhrase: string | null;
};

/**
 * Pure function — detect crisis phrases in text.
 * Returns the FIRST match (highest severity phrases are listed first in the data).
 * Can be used outside React components.
 */
export function detectCrisis(text: string): CrisisDetection {
  if (!text || text.trim().length < 3) {
    return { isCrisis: false, crisisType: null, riskLevel: null, matchedPhrase: null };
  }

  const lower = text.toLowerCase();

  for (const entry of CRISIS_PHRASES) {
    if (lower.includes(entry.phrase)) {
      return {
        isCrisis: true,
        crisisType: entry.category,
        riskLevel: RISK_LEVELS[entry.category],
        matchedPhrase: entry.phrase,
      };
    }
  }

  return { isCrisis: false, crisisType: null, riskLevel: null, matchedPhrase: null };
}

/**
 * React hook — memoized crisis detection.
 * Re-evaluates only when text changes.
 */
export function useCrisisMode(text: string): CrisisDetection {
  return useMemo(() => detectCrisis(text), [text]);
}

