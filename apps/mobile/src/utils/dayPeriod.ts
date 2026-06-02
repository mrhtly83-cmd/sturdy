// src/utils/dayPeriod.ts
// Single source of truth for time-of-day on the Home screen.
//
// The Home screen adapts silently between two parent headspaces:
//   - 'active' (daytime, ~6am–7pm): kids awake → SOS is the hero
//   - 'calm'   (evening/night, ~7pm–6am): kids asleep → Ask is the hero
//
// Both the greeting copy and the layout flip MUST derive from these same
// helpers so they can never visibly contradict. Boundaries are intentionally
// non-overlapping in a contradictory way:
//   greeting: morning 5–12, afternoon 12–17, evening 17+
//   layout:   active 6–19, calm 19+
// 'afternoon' (12–17) is fully inside 'active' (6–19), so the layout never
// shows "calm" while the greeting says "Good afternoon".

export type DayPeriod = 'active' | 'calm';

/** 'active' between 06:00–18:59 (kids awake), 'calm' otherwise (quiet house). */
export function getDayPeriod(date: Date = new Date()): DayPeriod {
  const h = date.getHours();
  return h >= 6 && h < 19 ? 'active' : 'calm';
}

/** Locked greeting copy — morning / afternoon / evening. */
export function getTimeGreeting(date: Date = new Date()): string {
  const h = date.getHours();
  if (h >= 5 && h < 12) return 'Good morning';
  if (h >= 12 && h < 17) return 'Good afternoon';
  return 'Good evening';
}
