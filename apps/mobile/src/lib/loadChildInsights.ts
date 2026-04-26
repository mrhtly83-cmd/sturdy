// src/lib/loadChildInsights.ts
// Aggregates per-child signals from the data we already collect — used
// by the Your Child profile screen.
//
// Sources today (no new tables, per Feature-2 rule):
//   • interaction_logs.trigger_category   → top triggers + counts
//   • saved_scripts (filtered by child)   → "what works" proxy (parent
//     bookmarked = signal that the script helped)
//   • count of all interactions            → for the empty-state copy
//     ("After a few more interactions, Sturdy will fill this in")
//
// child_insights / pattern recognition is spec'd as a future table; for
// now its section renders an empty placeholder + lock icon.

import { supabase } from './supabase';

export type TriggerCount = {
  category: string;   // raw key from triggerClassifier (e.g. 'homework')
  label:    string;   // display-formatted ('Homework')
  count:    number;
};

export type ChildInsights = {
  totalInteractions: number;
  topTriggers:       TriggerCount[];   // up to 5, sorted desc by count
};

const TRIGGER_LABELS: Record<string, string> = {
  homework:         'Homework',
  bedtime:          'Bedtime',
  screen_time:      'Screen time',
  leaving_places:   'Leaving places',
  mealtime:         'Mealtime',
  morning_routine:  'Morning routine',
  sharing:          'Sharing',
  sibling:          'Sibling fights',
  separation:       'Separation',
  public_meltdown:  'Public meltdowns',
  getting_dressed:  'Getting dressed',
  bath_time:        'Bath time',
  sport_activity:   'Sport / activities',
  social_conflict:  'Friend conflict',
};

function formatTriggerLabel(category: string): string {
  return TRIGGER_LABELS[category] ?? category.replace(/_/g, ' ');
}

/**
 * Aggregate trigger counts + total-interaction count for one child.
 *
 * Returns `{ totalInteractions: 0, topTriggers: [] }` if:
 *   - the table is empty for this child (expected for new accounts), or
 *   - the query errors (table missing, RLS blocked, etc.) — surfacing
 *     the empty state is the right UX either way.
 */
export async function loadChildInsights(childProfileId: string): Promise<ChildInsights> {
  if (!childProfileId) return { totalInteractions: 0, topTriggers: [] };

  try {
    const { data, error } = await supabase
      .from('interaction_logs')
      .select('trigger_category')
      .eq('child_profile_id', childProfileId);

    if (error || !Array.isArray(data)) {
      return { totalInteractions: 0, topTriggers: [] };
    }

    const total = data.length;

    // Tally non-null categories
    const counts: Record<string, number> = {};
    for (const row of data) {
      const cat = (row as { trigger_category?: unknown }).trigger_category;
      if (typeof cat === 'string' && cat.length > 0) {
        counts[cat] = (counts[cat] ?? 0) + 1;
      }
    }

    const topTriggers: TriggerCount[] = Object.entries(counts)
      .map(([category, count]) => ({
        category,
        label: formatTriggerLabel(category),
        count,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return { totalInteractions: total, topTriggers };
  } catch {
    return { totalInteractions: 0, topTriggers: [] };
  }
}
