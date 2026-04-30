// apps/mobile/src/lib/accountApi.ts
//
// Client for the account-lifecycle Edge Functions (account-pause,
// account-delete, account-export). Each function pulls the current
// session JWT and POSTs to the matching endpoint with that bearer.
//
// All three return a discriminated union — never throw. Callers branch
// on `ok` and surface the error string inline. See Edge Function
// implementations in supabase/functions/account-{pause,delete,export}.

import { supabase } from './supabase';

// @ts-ignore
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
if (!SUPABASE_URL) throw new Error('Missing EXPO_PUBLIC_SUPABASE_URL.');

// ─── Public types ────────────────────────────────────────────────────────────

export type PauseResult =
  | { ok: true;  pausedAt: string }
  | { ok: false; error: string };

export type DeleteResult =
  | { ok: true;  deletedUserId: string }
  | { ok: false; error: string };

export type ExportResult =
  | { ok: true;  url: string; expiresInSeconds: number }
  | { ok: false; error: string };

// ─── Error message resolution ────────────────────────────────────────────────

const SESSION_EXPIRED   = 'Session expired, please sign in again.';
const NETWORK_OR_SERVER = "Couldn't reach Sturdy. Please check your connection and try again.";
const GENERIC           = 'Something went wrong. Please try again.';

function errorForStatus(status: number): string {
  if (status === 401) return SESSION_EXPIRED;
  if (status >= 500)  return NETWORK_OR_SERVER;
  return GENERIC;
}

// ─── Internal: fetch with auth ───────────────────────────────────────────────

type CallResult =
  | { ok: true;  data: unknown }
  | { ok: false; error: string };

async function callFunction(name: string, body: Record<string, unknown>): Promise<CallResult> {
  let jwt: string | null;
  try {
    const { data } = await supabase.auth.getSession();
    jwt = data?.session?.access_token ?? null;
  } catch {
    return { ok: false, error: SESSION_EXPIRED };
  }
  if (!jwt) return { ok: false, error: SESSION_EXPIRED };

  let res: Response;
  try {
    res = await fetch(`${SUPABASE_URL}/functions/v1/${name}`, {
      method: 'POST',
      headers: {
        'Content-Type':  'application/json',
        Authorization:   `Bearer ${jwt}`,
      },
      body: JSON.stringify(body),
    });
  } catch {
    return { ok: false, error: NETWORK_OR_SERVER };
  }

  if (!res.ok) return { ok: false, error: errorForStatus(res.status) };

  try {
    const data = await res.json();
    return { ok: true, data };
  } catch {
    return { ok: false, error: GENERIC };
  }
}

// ─── Public functions ────────────────────────────────────────────────────────

export async function pauseAccount(): Promise<PauseResult> {
  const result = await callFunction('account-pause', {});
  if (!result.ok) return result;
  const data = result.data as { ok?: boolean; pausedAt?: unknown };
  if (data?.ok === true && typeof data.pausedAt === 'string') {
    return { ok: true, pausedAt: data.pausedAt };
  }
  return { ok: false, error: GENERIC };
}

export async function deleteAccount(confirmationText: string): Promise<DeleteResult> {
  const result = await callFunction('account-delete', { confirmationText });
  if (!result.ok) return result;
  const data = result.data as { ok?: boolean; deletedUserId?: unknown };
  if (data?.ok === true && typeof data.deletedUserId === 'string') {
    return { ok: true, deletedUserId: data.deletedUserId };
  }
  return { ok: false, error: GENERIC };
}

export async function requestExport(): Promise<ExportResult> {
  const result = await callFunction('account-export', {});
  if (!result.ok) return result;
  const data = result.data as { ok?: boolean; url?: unknown; expiresInSeconds?: unknown };
  if (data?.ok === true && typeof data.url === 'string' && typeof data.expiresInSeconds === 'number') {
    return { ok: true, url: data.url, expiresInSeconds: data.expiresInSeconds };
  }
  return { ok: false, error: GENERIC };
}
