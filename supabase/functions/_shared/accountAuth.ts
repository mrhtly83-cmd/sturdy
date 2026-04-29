// _shared/accountAuth.ts
//
// Shared CORS + JWT-validation helpers for the account-lifecycle Edge Functions
// (account-export, account-pause, account-delete). The existing
// chat-parenting-assistant function trusts the client and delegates auth to
// Postgres RLS; for destructive account operations we want explicit JWT
// validation before doing anything.

import { createClient, type SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

export const SUPABASE_URL =
  Deno.env.get("SUPABASE_URL") ?? "";
export const SUPABASE_SERVICE_ROLE_KEY =
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
export const SUPABASE_ANON_KEY =
  Deno.env.get("SUPABASE_ANON_KEY") ?? "";

export function cors(): Record<string, string> {
  return {
    "Access-Control-Allow-Origin":  "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };
}

export function jsonRes(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors(), "Content-Type": "application/json" },
  });
}

export function preflight(req: Request): Response | null {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors() });
  return null;
}

/**
 * Service-role client. Bypasses RLS. Use for admin operations
 * (deleting auth users, querying any user's data, uploading to private buckets).
 */
export function adminClient(): SupabaseClient {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set");
  }
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/**
 * Validate the incoming JWT and return the authenticated user id.
 *
 * Throws if the Authorization header is missing or the token is invalid /
 * expired. Callers should catch and return jsonRes({error}, 401).
 */
export async function requireUser(req: Request): Promise<{ userId: string; email: string | null }> {
  const auth = req.headers.get("Authorization") ?? "";
  const match = auth.match(/^Bearer\s+(.+)$/i);
  if (!match) throw new AuthError("Missing bearer token");

  const jwt = match[1];
  const admin = adminClient();
  const { data, error } = await admin.auth.getUser(jwt);
  if (error || !data?.user) throw new AuthError("Invalid or expired token");

  return { userId: data.user.id, email: data.user.email ?? null };
}

/**
 * Verify the request is from the cron / system caller. Two acceptable signals:
 *   1. A bearer token equal to SUPABASE_SERVICE_ROLE_KEY (used when Supabase
 *      pg_cron calls the function directly with the service role key).
 *   2. A custom shared secret in the X-Cron-Secret header, matched against
 *      CRON_SHARED_SECRET env. Used when an external scheduler hits the URL.
 *
 * Both paths must be guarded; the scheduled function is destructive.
 */
export function requireSystemCaller(req: Request): void {
  const auth = req.headers.get("Authorization") ?? "";
  const tokenMatch = auth.match(/^Bearer\s+(.+)$/i);
  const cronSecret = req.headers.get("X-Cron-Secret") ?? "";
  const expectedSecret = Deno.env.get("CRON_SHARED_SECRET") ?? "";

  const tokenOk =
    tokenMatch !== null &&
    SUPABASE_SERVICE_ROLE_KEY.length > 0 &&
    tokenMatch[1] === SUPABASE_SERVICE_ROLE_KEY;

  const secretOk =
    expectedSecret.length > 0 && cronSecret === expectedSecret;

  if (!tokenOk && !secretOk) {
    throw new AuthError("System caller authentication required");
  }
}

export class AuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AuthError";
  }
}
