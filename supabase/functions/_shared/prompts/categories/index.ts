// supabase/functions/_shared/prompts/categories/index.ts
// Category dispatcher — maps category names to their guidance blocks.
// Add new categories here as they're written.

import { MELTDOWN_GUIDANCE }   from './meltdown.ts';
import { REFUSAL_GUIDANCE }    from './refusal.ts';
import { SHUTDOWN_GUIDANCE }   from './shutdown.ts';
import { AGGRESSION_GUIDANCE } from './aggression.ts';
import { TRANSITION_GUIDANCE } from './transition.ts';

// The list of category labels Claude is allowed to pick from.
// Everything else falls through to "other" (no specific guidance).
export const CATEGORY_LABELS = [
  'meltdown',
  'refusal',
  'shutdown',
  'aggression',
  'transition',
  'other',
] as const;

export type CategoryLabel = typeof CATEGORY_LABELS[number];

// Short descriptions Claude uses to self-classify the incoming message.
// These show up in the prompt as the menu Claude picks from.
export const CATEGORY_DESCRIPTIONS: Record<CategoryLabel, string> = {
  meltdown:   'Child is dysregulated — screaming, crying, flailing, losing control. Thinking brain is offline.',
  refusal:    'Child is dug in, saying no, won\'t comply. Thinking brain is online — they are using it to resist.',
  shutdown:   'Child has gone quiet or frozen. Withdrawn. Not responding. Silent treatment, door closed, curled up.',
  aggression: 'Child is hitting, throwing, biting, or physically harming someone or themselves. Safety is at risk.',
  transition: 'Child is resisting a change of activity — leaving, arriving, switching tasks, stopping an activity.',
  other:      'Does not fit cleanly into any of the above. Use general Sturdy principles.',
};

// Returns the guidance block for a given category. Empty string for "other".
export function getCategoryGuidance(category: CategoryLabel): string {
  switch (category) {
    case 'meltdown':   return MELTDOWN_GUIDANCE;
    case 'refusal':    return REFUSAL_GUIDANCE;
    case 'shutdown':   return SHUTDOWN_GUIDANCE;
    case 'aggression': return AGGRESSION_GUIDANCE;
    case 'transition': return TRANSITION_GUIDANCE;
    case 'other':      return '';
  }
}

// Builds the classification menu that gets injected into the prompt.
// Claude reads this and silently picks one before writing the script.
export function buildCategoryMenu(): string {
  const lines = CATEGORY_LABELS.map(label => `  - ${label}: ${CATEGORY_DESCRIPTIONS[label]}`);
  return lines.join('\n');
}

// Builds the full category block that injects into the SOS prompt.
// Includes classification instruction + all guidance blocks.
// Claude silently picks one category, then uses its matching guidance.
export function buildCategorySection(): string {
  const menu = buildCategoryMenu();

  const allGuidance = CATEGORY_LABELS
    .filter(l => l !== 'other')
    .map(label => getCategoryGuidance(label))
    .join('\n\n');

  return `
== SILENT CLASSIFICATION — READ FIRST, DO NOT OUTPUT ==

Before writing anything, silently classify this moment into exactly ONE of these categories by reading the parent's message carefully:

${menu}

Pick the ONE category that best describes what is happening RIGHT NOW — not what happened earlier, not what the parent is worried about. What is the child doing in this specific moment?

Then use the guidance for THAT category below to shape your script. Do not mention the category name anywhere in your output. The parent never sees it. This is just your internal compass.

If the moment genuinely fits "other", fall back to general Sturdy principles (listed after the categories).

${allGuidance}
`.trim();
}
