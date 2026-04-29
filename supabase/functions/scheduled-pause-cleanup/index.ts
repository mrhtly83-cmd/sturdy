// supabase/functions/scheduled-pause-cleanup/index.ts
//
// Daily cron. Finds every account where profiles.paused_at is older than
// 30 days and calls account-delete with confirmationText = "PAUSE_EXPIRED".
//
// Authentication: caller must be the system, not a user. Two acceptable
// signals (see _shared/accountAuth.ts:requireSystemCaller):
//   - Bearer token equal to SUPABASE_SERVICE_ROLE_KEY
//   - X-Cron-Secret header equal to CRON_SHARED_SECRET env
//
// The 30-day deadline is approximate. Per docs/PRODUCT_PRINCIPLES.md §8 the
// commitment is "approximately 30 days" rather than precise to the minute —
// if a cron run fails, the next day's run picks up the missed accounts.

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import {
  adminClient,
  AuthError,
  jsonRes,
  preflight,
  requireSystemCaller,
  SUPABASE_SERVICE_ROLE_KEY,
  SUPABASE_URL,
} from "../_shared/accountAuth.ts";

const PAUSE_TTL_DAYS = 30;

serve(async (req) => {
  const pre = preflight(req);
  if (pre) return pre;
  if (req.method !== "POST") return jsonRes({ error: "Method not allowed." }, 405);

  try {
    requireSystemCaller(req);
  } catch (e) {
    if (e instanceof AuthError) return jsonRes({ error: e.message }, 401);
    return jsonRes({ error: "Authentication failed." }, 401);
  }

  const admin = adminClient();
  const cutoff = new Date(Date.now() - PAUSE_TTL_DAYS * 24 * 60 * 60 * 1000).toISOString();

  // Find expired pauses.
  const { data: expired, error: queryErr } = await admin
    .from("profiles")
    .select("id, paused_at")
    .not("paused_at", "is", null)
    .lt("paused_at", cutoff);

  if (queryErr) {
    console.error("[scheduled-pause-cleanup] query failed", queryErr);
    return jsonRes({ error: "Could not list expired pauses." }, 500);
  }

  const candidates = (expired ?? []) as Array<{ id: string; paused_at: string }>;
  const results: Array<{ userId: string; status: "deleted" | "failed"; error?: string }> = [];

  for (const row of candidates) {
    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/account-delete`, {
        method: "POST",
        headers: {
          "Content-Type":  "application/json",
          "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        },
        body: JSON.stringify({
          confirmationText: "PAUSE_EXPIRED",
          targetUserId:     row.id,
        }),
      });
      if (!res.ok) {
        const body = await res.text();
        results.push({ userId: row.id, status: "failed", error: body.slice(0, 200) });
      } else {
        results.push({ userId: row.id, status: "deleted" });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      results.push({ userId: row.id, status: "failed", error: message });
    }
  }

  const deleted = results.filter(r => r.status === "deleted").length;
  const failed  = results.filter(r => r.status === "failed").length;

  console.log("[scheduled-pause-cleanup]", { deleted, failed, candidates: candidates.length });

  return jsonRes(
    {
      ok: true,
      cutoff,
      candidates: candidates.length,
      deleted,
      failed,
      // Include the full result list so logs (and ad-hoc invocations) are auditable.
      details: results,
    },
    200,
  );
});
