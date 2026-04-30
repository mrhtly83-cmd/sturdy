// supabase/functions/account-pause/index.ts
//
// Pauses the authenticated user's account. Sets profiles.paused_at = now(),
// then revokes the user's refresh tokens so they're effectively signed out.
//
// The scheduled-pause-cleanup function runs daily and deletes any account
// where paused_at is older than 30 days. The pause window is intentionally
// generous — a parent who deletes in a moment of frustration can sign back
// in within 30 days and be restored.

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import {
  adminClient,
  AuthError,
  jsonRes,
  preflight,
  requireUser,
} from "../_shared/accountAuth.ts";

serve(async (req) => {
  const pre = preflight(req);
  if (pre) return pre;
  if (req.method !== "POST") return jsonRes({ error: "Method not allowed." }, 405);

  let userId: string;
  try {
    ({ userId } = await requireUser(req));
  } catch (e) {
    if (e instanceof AuthError) return jsonRes({ error: e.message }, 401);
    return jsonRes({ error: "Authentication failed." }, 401);
  }

  const admin = adminClient();

  // 1. Set paused_at
  const { error: updateErr } = await admin
    .from("profiles")
    .update({ paused_at: new Date().toISOString() })
    .eq("id", userId);

  if (updateErr) {
    console.error("[account-pause] update failed", updateErr);
    return jsonRes({ error: "Could not pause account." }, 500);
  }

  // 2. Revoke session — the user is signed out as a side effect.
  // 'global' invalidates every refresh token for this user across all devices.
  const { error: signOutErr } = await admin.auth.admin.signOut(userId, "global");
  if (signOutErr) {
    // Pause already succeeded — surface a warning but don't fail the request.
    console.warn("[account-pause] signOut failed", signOutErr);
  }

  return jsonRes({ ok: true, pausedAt: new Date().toISOString() }, 200);
});
