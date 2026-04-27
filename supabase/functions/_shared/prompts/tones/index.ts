// supabase/functions/_shared/prompts/tones/index.ts
// Tone dispatcher — maps a tone string to its guidance block.
// Mirrors the categories/ pattern.
//
// 'gentle' is the canonical Sturdy voice; it returns an empty block so
// nothing changes in the prompt. Anything unknown / missing also falls
// back to gentle (no-op).

import { SOFT_TONE_GUIDANCE }   from './soft.ts';
import { DIRECT_TONE_GUIDANCE } from './direct.ts';

export const TONE_LABELS = ['soft', 'gentle', 'direct'] as const;
export type ToneLabel = typeof TONE_LABELS[number];

export function isToneLabel(v: unknown): v is ToneLabel {
  return v === 'soft' || v === 'gentle' || v === 'direct';
}

/**
 * Returns the prompt block for a given tone, or empty string for the
 * default ('gentle' / null / unknown). Empty strings are dropped from
 * the prompt by .filter(Boolean) so a default-tone request produces
 * the same prompt as before this feature shipped.
 */
export function getToneBlock(tone: ToneLabel | string | null | undefined): string {
  switch (tone) {
    case 'soft':   return SOFT_TONE_GUIDANCE;
    case 'direct': return DIRECT_TONE_GUIDANCE;
    case 'gentle':
    default:       return '';
  }
}
