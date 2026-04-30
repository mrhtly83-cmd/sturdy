// supabase/functions/account-delete/index.ts
//
// Permanently deletes a user's account. Two callers:
//
//   1. The user themselves, after confirming with the literal string "DELETE".
//      Auth: bearer JWT for that user.
//
//   2. The scheduled-pause-cleanup function, with confirmationText
//      "PAUSE_EXPIRED" and a target userId in the body.
//      Auth: service role key (or X-Cron-Secret header).
//
// Implementation note (per docs/OPERATIONS.md 2026-04-29 backend):
// The migration ensures `ON DELETE CASCADE` on every public.* table that
// references auth.users, except `safety_events` which is `ON DELETE SET NULL`.
// So a single `auth.admin.deleteUser()` call atomically:
//   - Deletes profiles, child_profiles, conversations, messages,
//     interaction_logs, parent_thoughts, usage_events
//   - Sets safety_events.user_id = NULL (anonymizing them per Principle 8)
//   - Removes the auth.users row
//
// Subscription check is a stub — useSubscription on the client always returns
// `isPremium: false` until RevenueCat lands. When real billing arrives, the
// hasActiveSubscription() helper here will be wired to the subscription
// provider's API. For now it always returns false (no block).

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import {
  adminClient,
  AuthError,
  jsonRes,
  preflight,
  requireSystemCaller,
  requireUser,
} from "../_shared/accountAuth.ts";

type DeleteBody = {
  confirmationText?: unknown;
  // Only honored when called by the system (cron). Ignored on user-initiated
  // calls — a user can only delete their own account.
  targetUserId?: unknown;
};

const VALID_CONFIRMATIONS = new Set(["DELETE", "PAUSE_EXPIRED"]);

// Stub. When RevenueCat lands, this calls the provider's "is this user
// subscribed?" endpoint. Until then, no user is billed, so no block.
async function hasActiveSubscription(_userId: string): Promise<boolean> {
  return false;
}

serve(async (req) => {
  const pre = preflight(req);
  if (pre) return pre;
  if (req.method !== "POST") return jsonRes({ error: "Method not allowed." }, 405);

  let body: DeleteBody;
  try {
    body = await req.json();
  } catch {
    return jsonRes({ error: "Invalid JSON." }, 400);
  }

  const confirmation =
    typeof body.confirmationText === "string" ? body.confirmationText : null;
  if (!confirmation || !VALID_CONFIRMATIONS.has(confirmation)) {
    return jsonRes({ error: "Confirmation text required." }, 400);
  }

  // Resolve the target userId based on the confirmation type.
  let userId: string;
  if (confirmation === "PAUSE_EXPIRED") {
    // System caller. Validate and use the explicit targetUserId.
    try {
      requireSystemCaller(req);
    } catch (e) {
      if (e instanceof AuthError) return jsonRes({ error: e.message }, 401);
      return jsonRes({ error: "Authentication failed." }, 401);
    }
    if (typeof body.targetUserId !== "string" || !body.targetUserId) {
      return jsonRes({ error: "targetUserId required for system delete." }, 400);
    }
    userId = body.targetUserId;
  } else {
    // User caller. Validate JWT and ignore any targetUserId.
    try {
      ({ userId } = await requireUser(req));
    } catch (e) {
      if (e instanceof AuthError) return jsonRes({ error: e.message }, 401);
      return jsonRes({ error: "Authentication failed." }, 401);
    }

    // Subscription check (stub today; real once billing lands).
    if (await hasActiveSubscription(userId)) {
      return jsonRes(
        {
          error:
            "Active subscription detected. Cancel subscription before deleting account.",
        },
        409,
      );
    }
  }

  const admin = adminClient();

  // The CASCADE FKs in the migration mean we don't need to delete each table
  // by hand. Deleting the auth.users row removes everything that references
  // it with ON DELETE CASCADE and NULLs everything that references it with
  // ON DELETE SET NULL (i.e. safety_events.user_id).
  const { error: deleteErr } = await admin.auth.admin.deleteUser(userId);
  if (deleteErr) {
    console.error("[account-delete] deleteUser failed", { userId, deleteErr });
    return jsonRes({ error: "Could not delete account." }, 500);
  }

  return jsonRes(
    { ok: true, deletedUserId: userId, reason: confirmation },
    200,
  );
});
