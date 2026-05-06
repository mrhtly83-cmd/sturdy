// supabase/functions/_shared/rateLimit.ts
//
// Per-user abuse-prevention rate limit on the Anthropic-backed paths in
// chat-parenting-assistant. Caps below are deliberately above any real
// parent's usage — they exist to prevent runaway cost from spam or bots,
// not to gate features (Principle 6 forbids quotas as feature gates).
//
// Counts hits in the `usage_events` table, where the existing logUsageEvent
// writes after every Anthropic call (script_generated, followup_generated,
// question_generated). Both windows are checked in a single round-trip.
//
// Crisis-routed responses bypass the limit entirely (Principle 4 — crisis
// is always free) and are not counted because the crisis path returns
// before logUsageEvent.
//
// Auth note: the function trusts `userId` from the request body, so the
// rate-limit attaches to whoever the client claims to be. A determined
// attacker rotating user_ids could bypass — JWT validation is a follow-up
// and would close that gap. For honest abuse + accidental loops this is
// already enough to prevent billing shock.

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

// ─── Caps ─────────────────────────────────────────────────────────────────────
//
// Tuned for a real parent's usage patterns:
//   - 5-10 SOS scripts during a single hard moment is plausible (retries,
//     follow-ups). 10/minute leaves headroom without blocking anyone real.
//   - 100/day is ~5x the heaviest plausible day. Anything past that is
//     a bot or a stuck retry loop.

const BURST_WINDOW_SECONDS = 60;
const BURST_MAX             = 10;

const DAILY_WINDOW_SECONDS = 24 * 60 * 60;
const DAILY_MAX             = 100;

// ─── Result type ──────────────────────────────────────────────────────────────

export type RateLimitResult =
  | { ok: true }
  | { ok: false; status: 401 | 429; error: string; retryAfterSeconds?: number };

// ─── Counted event types ──────────────────────────────────────────────────────

const COUNTED_EVENT_TYPES = [
  "script_generated",
  "followup_generated",
  "question_generated",
];

// ─── Main ─────────────────────────────────────────────────────────────────────

/**
 * Returns ok=false if the user has exceeded a window. Caller should return
 * the included status + error directly to the client and skip the Anthropic
 * call.
 *
 * On any DB error this fails OPEN (returns ok: true) so a transient Supabase
 * outage doesn't block real parents from getting a script during a hard
 * moment. The cost ceiling is preserved by Anthropic-side billing alerts —
 * which this function complements, not replaces.
 */
export async function checkAnthropicRateLimit(
  userId: string | null,
): Promise<RateLimitResult> {
  if (!userId) {
    return {
      ok:     false,
      status: 401,
      error:  "Sign in to continue.",
    };
  }

  if (!SUPABASE_URL || !SUPABASE_KEY) {
    // No DB — fail open; logged so the operator notices.
    console.warn("[STURDY_RATELIMIT] missing SUPABASE_URL/KEY; failing open");
    return { ok: true };
  }

  // Single PostgREST query with two conditional aggregates.
  // PostgREST can't do `count(*) FILTER (WHERE ...)` directly, so we use
  // an RPC-style approach: we pull the most recent N rows (where N >
  // DAILY_MAX so we know we'd hit the cap) and bucket them in JS. This
  // avoids needing a database function while staying cheap (the
  // (user_id, created_at) range query is index-friendly).
  const sinceIso = new Date(Date.now() - DAILY_WINDOW_SECONDS * 1000).toISOString();
  const eventTypeIn = COUNTED_EVENT_TYPES.map((t) => `"${t}"`).join(",");

  const url =
    `${SUPABASE_URL}/rest/v1/usage_events` +
    `?select=created_at` +
    `&user_id=eq.${userId}` +
    `&event_type=in.(${eventTypeIn})` +
    `&created_at=gte.${encodeURIComponent(sinceIso)}` +
    `&order=created_at.desc` +
    `&limit=${DAILY_MAX + 5}`;

  let rows: Array<{ created_at: string }>;
  try {
    const res = await fetch(url, {
      method: "GET",
      headers: {
        "apikey":        SUPABASE_KEY,
        "Authorization": `Bearer ${SUPABASE_KEY}`,
        "Accept":        "application/json",
      },
    });
    if (!res.ok) {
      console.warn("[STURDY_RATELIMIT] PostgREST non-OK", res.status);
      return { ok: true };
    }
    rows = await res.json();
  } catch (err) {
    console.warn("[STURDY_RATELIMIT] fetch failed; failing open", err);
    return { ok: true };
  }

  const now      = Date.now();
  const burstCutoff = now - BURST_WINDOW_SECONDS * 1000;

  let burstCount = 0;
  for (const r of rows) {
    if (Date.parse(r.created_at) >= burstCutoff) burstCount += 1;
  }
  const dailyCount = rows.length; // already filtered by since=daily-cutoff

  if (burstCount >= BURST_MAX) {
    return {
      ok:                false,
      status:            429,
      error:             "Sturdy needs a brief breather. Try again in a minute.",
      retryAfterSeconds: BURST_WINDOW_SECONDS,
    };
  }

  if (dailyCount >= DAILY_MAX) {
    return {
      ok:                false,
      status:            429,
      error:             "You've hit Sturdy's daily limit. It resets in 24 hours.",
      retryAfterSeconds: DAILY_WINDOW_SECONDS,
    };
  }

  return { ok: true };
}

// Exported for tests + the Operations log.
export const RATE_LIMIT_CAPS = {
  burst: { windowSeconds: BURST_WINDOW_SECONDS, max: BURST_MAX },
  daily: { windowSeconds: DAILY_WINDOW_SECONDS, max: DAILY_MAX },
} as const;
