// supabase/functions/account-export/index.ts
//
// Generates a portable export of everything a parent has saved in Sturdy.
// Returns a 24-hour signed URL pointing to a zip in the `account-exports`
// bucket. The zip contains:
//
//   - sturdy-export.json  — every row from the user's data, in JSON
//   - sturdy-export.md    — a human-readable summary in Markdown
//
// Markdown was chosen over PDF intentionally. Markdown opens on every device
// in every text app, with no dependency on a PDF library that would balloon
// the function bundle. The privacy policy reflects this ("zipped file
// containing JSON and a readable text version").
//
// What the export does NOT include:
//   - safety_events (operational data, not user content; principle 8)
//   - data Sturdy doesn't have (Anthropic-side message logs are subject to
//     Anthropic's retention schedule — disclosed in the export footer)

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { zipSync, strToU8 } from "https://esm.sh/fflate@0.8.2";
import {
  adminClient,
  AuthError,
  jsonRes,
  preflight,
  requireUser,
} from "../_shared/accountAuth.ts";

const SIGNED_URL_TTL_SECONDS = 60 * 60 * 24; // 24 hours
const BUCKET = "account-exports";

serve(async (req) => {
  const pre = preflight(req);
  if (pre) return pre;
  if (req.method !== "POST") return jsonRes({ error: "Method not allowed." }, 405);

  let userId: string;
  let email: string | null;
  try {
    ({ userId, email } = await requireUser(req));
  } catch (e) {
    if (e instanceof AuthError) return jsonRes({ error: e.message }, 401);
    return jsonRes({ error: "Authentication failed." }, 401);
  }

  const admin = adminClient();

  try {
    const data = await collectUserData(admin, userId);

    const json = JSON.stringify({ exportedAt: new Date().toISOString(), email, ...data }, null, 2);
    const md   = renderMarkdown({ exportedAt: new Date().toISOString(), email, ...data });

    const zip = zipSync({
      "sturdy-export.json": strToU8(json),
      "sturdy-export.md":   strToU8(md),
    });

    const stamp = new Date().toISOString().replace(/[:.]/g, "-");
    const path  = `${userId}/sturdy-export-${stamp}.zip`;

    const { error: upErr } = await admin.storage
      .from(BUCKET)
      .upload(path, zip, { contentType: "application/zip", upsert: true });

    if (upErr) {
      console.error("[account-export] upload failed", upErr);
      return jsonRes({ error: "Could not generate export." }, 500);
    }

    const { data: signed, error: signErr } = await admin.storage
      .from(BUCKET)
      .createSignedUrl(path, SIGNED_URL_TTL_SECONDS);

    if (signErr || !signed?.signedUrl) {
      console.error("[account-export] signed URL failed", signErr);
      return jsonRes({ error: "Could not generate export." }, 500);
    }

    return jsonRes(
      {
        ok: true,
        url: signed.signedUrl,
        expiresInSeconds: SIGNED_URL_TTL_SECONDS,
      },
      200,
    );
  } catch (e) {
    console.error("[account-export] build failed", e);
    return jsonRes({ error: "Could not generate export." }, 500);
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// Data collection
// ─────────────────────────────────────────────────────────────────────────────

type UserData = {
  profile:         unknown;
  childProfiles:   unknown[];
  conversations:   unknown[];
  messages:        unknown[];
  parentThoughts:  unknown[];
  interactionLogs: unknown[];
  usageEvents:     unknown[];
  savedScripts:    unknown[];
  scriptFeedback:  unknown[];
  userPreferences: unknown[];
  childInsights:   unknown[];
  incidentEvents:  unknown[];
};

async function collectUserData(admin: ReturnType<typeof adminClient>, userId: string): Promise<UserData> {
  // Each query is independent — run in parallel for a lower wall-clock time.
  // safeSelect for tables that were created out-of-band via the SQL Editor:
  // missing tables on a given environment return [] rather than crashing.
  const [
    profile,
    childProfiles,
    conversations,
    parentThoughts,
    interactionLogs,
    usageEvents,
    savedScripts,
    scriptFeedback,
    userPreferences,
  ] = await Promise.all([
    admin.from("profiles").select("*").eq("id", userId).maybeSingle().then(r => r.data),
    admin.from("child_profiles").select("*").eq("user_id", userId).then(r => r.data ?? []),
    admin.from("conversations").select("*").eq("user_id", userId).then(r => r.data ?? []),
    safeSelect(admin, "parent_thoughts", userId),
    safeSelect(admin, "interaction_logs", userId),
    admin.from("usage_events").select("*").eq("user_id", userId).then(r => r.data ?? []),
    safeSelect(admin, "saved_scripts", userId),
    safeSelect(admin, "script_feedback", userId),
    safeSelect(admin, "user_preferences", userId),
  ]);

  // Messages live under conversations — fetch in a second pass.
  const conversationIds = (conversations as Array<{ id: string }> | undefined)
    ?.map(c => c.id) ?? [];
  let messages: unknown[] = [];
  if (conversationIds.length > 0) {
    const { data } = await admin
      .from("messages")
      .select("*")
      .in("conversation_id", conversationIds);
    messages = data ?? [];
  }

  // child_insights and incident_events live under child_profiles — fetch in a
  // second pass after childProfiles is known.
  const childProfileIds = (childProfiles as Array<{ id: string }> | undefined)
    ?.map(c => c.id) ?? [];
  let childInsights:  unknown[] = [];
  let incidentEvents: unknown[] = [];
  if (childProfileIds.length > 0) {
    const [insightsResult, incidentsResult] = await Promise.all([
      safeSelectByChildren(admin, "child_insights",  childProfileIds),
      safeSelectByChildren(admin, "incident_events", childProfileIds),
    ]);
    childInsights  = insightsResult;
    incidentEvents = incidentsResult;
  }

  return {
    profile,
    childProfiles,
    conversations,
    messages,
    parentThoughts,
    interactionLogs,
    usageEvents,
    savedScripts,
    scriptFeedback,
    userPreferences,
    childInsights,
    incidentEvents,
  };
}

/**
 * Defensive select for tables that may not exist on every environment
 * (most of these were created out-of-band via the SQL Editor). If the
 * table is missing, return an empty array rather than blowing up the
 * whole export.
 */
async function safeSelect(
  admin: ReturnType<typeof adminClient>,
  table: string,
  userId: string,
): Promise<unknown[]> {
  try {
    const { data, error } = await admin
      .from(table)
      .select("*")
      .eq("user_id", userId);
    if (error) return [];
    return data ?? [];
  } catch {
    return [];
  }
}

/**
 * Same as safeSelect but for child-scoped tables (child_insights,
 * incident_events) that key on child_profile_id rather than user_id.
 */
async function safeSelectByChildren(
  admin: ReturnType<typeof adminClient>,
  table: string,
  childProfileIds: string[],
): Promise<unknown[]> {
  try {
    const { data, error } = await admin
      .from(table)
      .select("*")
      .in("child_profile_id", childProfileIds);
    if (error) return [];
    return data ?? [];
  } catch {
    return [];
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Markdown rendering
// ─────────────────────────────────────────────────────────────────────────────

function renderMarkdown(d: UserData & { exportedAt: string; email: string | null }): string {
  const lines: string[] = [];

  lines.push("# Your Sturdy data");
  lines.push("");
  lines.push(`Exported ${d.exportedAt}`);
  if (d.email) lines.push(`Account: ${d.email}`);
  lines.push("");

  lines.push("## Your account");
  lines.push("");
  lines.push("```json");
  lines.push(JSON.stringify(d.profile ?? null, null, 2));
  lines.push("```");
  lines.push("");

  lines.push(`## Your children (${d.childProfiles.length})`);
  lines.push("");
  for (const c of d.childProfiles as Array<Record<string, unknown>>) {
    lines.push(`- **${String(c.name ?? "(unnamed)")}** — age ${c.child_age ?? c.age_band ?? "?"}`);
  }
  if (d.childProfiles.length === 0) lines.push("_None_");
  lines.push("");

  lines.push(`## Your saved scripts (${d.savedScripts.length})`);
  lines.push("");
  lines.push("Scripts you explicitly saved while using Sturdy.");
  lines.push("");
  for (const s of d.savedScripts as Array<Record<string, unknown>>) {
    const title   = String(s.title         ?? "(untitled)");
    const trigger = s.trigger_label ? String(s.trigger_label) : null;
    const created = String(s.created_at    ?? "");
    lines.push(`### ${title}`);
    const meta: string[] = [];
    if (trigger) meta.push(trigger);
    if (created) meta.push(created);
    if (meta.length > 0) lines.push(`_${meta.join(" · ")}_`);
    lines.push("");
    if (s.structured) {
      lines.push("```json");
      lines.push(JSON.stringify(s.structured, null, 2));
      lines.push("```");
      lines.push("");
    }
    if (s.notes) {
      lines.push(`> ${String(s.notes)}`);
      lines.push("");
    }
    lines.push("---");
    lines.push("");
  }
  if (d.savedScripts.length === 0) {
    lines.push("_None_");
    lines.push("");
  }

  lines.push(`## Your conversations (${d.conversations.length})`);
  lines.push("");
  for (const c of d.conversations as Array<Record<string, unknown>>) {
    const created = String(c.created_at ?? "");
    const title   = String(c.title      ?? "(untitled)");
    lines.push(`### ${title}`);
    lines.push(`_${created}_`);
    lines.push("");
    const conversationMessages = (d.messages as Array<Record<string, unknown>>)
      .filter(m => m.conversation_id === c.id);
    for (const m of conversationMessages) {
      lines.push(`**${String(m.role ?? "?")}:** ${String(m.content ?? "")}`);
      lines.push("");
    }
    lines.push("---");
    lines.push("");
  }
  if (d.conversations.length === 0) {
    lines.push("_None_");
    lines.push("");
  }

  lines.push(`## Your Question conversations (${d.parentThoughts.length})`);
  lines.push("");
  for (const t of d.parentThoughts as Array<Record<string, unknown>>) {
    lines.push(`**You asked:** ${String(t.prompt_text ?? "")}`);
    lines.push("");
    lines.push(`**Sturdy:** ${String(t.response_text ?? "")}`);
    lines.push("");
    lines.push("---");
    lines.push("");
  }
  if (d.parentThoughts.length === 0) {
    lines.push("_None_");
    lines.push("");
  }

  lines.push(`## Your script feedback (${d.scriptFeedback.length})`);
  lines.push("");
  if (d.scriptFeedback.length === 0) {
    lines.push("_None_");
  } else {
    lines.push("```json");
    lines.push(JSON.stringify(d.scriptFeedback, null, 2));
    lines.push("```");
  }
  lines.push("");

  lines.push(`## Your insights (${d.childInsights.length})`);
  lines.push("");
  lines.push("_Auto-generated by Sturdy from your interactions, scoped to each child._");
  lines.push("");
  if (d.childInsights.length === 0) {
    lines.push("_None_");
  } else {
    lines.push("```json");
    lines.push(JSON.stringify(d.childInsights, null, 2));
    lines.push("```");
  }
  lines.push("");

  lines.push(`## Your incidents (${d.incidentEvents.length})`);
  lines.push("");
  if (d.incidentEvents.length === 0) {
    lines.push("_None_");
  } else {
    lines.push("```json");
    lines.push(JSON.stringify(d.incidentEvents, null, 2));
    lines.push("```");
  }
  lines.push("");

  lines.push(`## Your preferences (${d.userPreferences.length})`);
  lines.push("");
  if (d.userPreferences.length === 0) {
    lines.push("_None_");
  } else {
    lines.push("```json");
    lines.push(JSON.stringify(d.userPreferences, null, 2));
    lines.push("```");
  }
  lines.push("");

  lines.push("## Notes on this export");
  lines.push("");
  lines.push(
    "This file contains everything Sturdy has stored about your account. " +
    "Messages you sent to Sturdy were processed by Anthropic (the company " +
    "behind Claude); Anthropic retains those records on their own schedule, " +
    "independent of Sturdy. See anthropic.com/legal for details.",
  );
  lines.push("");

  return lines.join("\n");
}
