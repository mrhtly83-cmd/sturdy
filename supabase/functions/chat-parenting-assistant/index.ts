declare const Deno: {
  env: { get(name: string): string | undefined; };
};

// @ts-ignore
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

import { buildPrompt }      from "../_shared/buildPrompt.ts";
import { validateResponse } from "../_shared/validateResponse.ts";
import { runSafetyFilter }  from "../_shared/safetyFilter.ts";
import { classifyTrigger }  from "../_shared/triggerClassifier.ts";

const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");
const ANTHROPIC_MODEL   = "claude-sonnet-4-20250514";
const SUPABASE_URL      = Deno.env.get("SUPABASE_URL");
const SUPABASE_KEY      = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

type RequestBody = {
  childName?:      unknown;
  childAge?:       unknown;
  message?:        unknown;
  userId?:         unknown;
  childProfileId?: unknown;
  intensity?:      unknown;
  mode?:           unknown;
  isFollowUp?:     unknown;
  followUpType?:   unknown;
  originalScript?: unknown;
};

function cors() {
  return {
    "Access-Control-Allow-Origin":  "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };
}

function jsonRes(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors(), "Content-Type": "application/json" },
  });
}

function validateInput(body: RequestBody) {
  const childName      = typeof body.childName === "string" ? body.childName.trim() : "";
  const childAge       = typeof body.childAge  === "number" ? body.childAge          : Number.NaN;
  const message        = typeof body.message   === "string" ? body.message.trim()    : "";
  const userId         = typeof body.userId    === "string" ? body.userId             : null;
  const childProfileId = typeof body.childProfileId === "string" ? body.childProfileId : null;
  const intensity      = typeof body.intensity === "number" && body.intensity >= 1 && body.intensity <= 5
                           ? Math.round(body.intensity) : null;
  const mode           = typeof body.mode === "string" ? body.mode : null;
  const isFollowUp     = body.isFollowUp === true;
  const followUpType   = typeof body.followUpType === "string" ? body.followUpType : null;
  const originalScript = body.originalScript && typeof body.originalScript === "object"
    ? body.originalScript as { situation_summary: string; regulate: string; connect: string; guide: string; }
    : null;

  if (!childName)    throw new Error("childName is required.");
  if (!Number.isFinite(childAge) || childAge < 2 || childAge > 17) throw new Error("childAge must be between 2 and 17.");
  if (!message)      throw new Error("message is required.");

  return { childName, childAge, message, userId, childProfileId, intensity, mode, isFollowUp, followUpType, originalScript };
}

async function logSafetyEvent(data: { userId: string | null; childProfileId: string | null; messageExcerpt: string; riskLevel: string; policyRoute: string; crisisType: string | null; }) {
  if (!SUPABASE_URL || !SUPABASE_KEY) return;
  try {
    await fetch(`${SUPABASE_URL}/rest/v1/safety_events`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "apikey": SUPABASE_KEY, "Authorization": `Bearer ${SUPABASE_KEY}`, "Prefer": "return=minimal" },
      body: JSON.stringify({ user_id: data.userId, child_profile_id: data.childProfileId, message_excerpt: data.messageExcerpt.slice(0, 120), risk_level: data.riskLevel, policy_route: data.policyRoute, classifier_version: "v1-keyword", resolved_with: data.crisisType }),
    });
  } catch { console.warn("[STURDY_SAFETY] Failed to log"); }
}

async function logUsageEvent(data: { userId: string | null; childProfileId: string | null; eventType: string; eventMeta: Record<string, unknown>; }) {
  if (!SUPABASE_URL || !SUPABASE_KEY || !data.userId) return;
  try {
    await fetch(`${SUPABASE_URL}/rest/v1/usage_events`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "apikey": SUPABASE_KEY, "Authorization": `Bearer ${SUPABASE_KEY}`, "Prefer": "return=minimal" },
      body: JSON.stringify({ user_id: data.userId, child_profile_id: data.childProfileId, event_type: data.eventType, event_meta: data.eventMeta }),
    });
  } catch { console.warn("[STURDY_USAGE] Failed to log"); }
}

async function logInteractionEvent(data: {
  userId:           string | null;
  childProfileId:   string | null;
  conversationId?:  string | null;
  mode:             string | null;
  triggerCategory:  string | null;
  intensityInferred: number | null;
  isFollowup:       boolean;
  followupType?:    string | null;
  situationSummary: string;
  messageLength:    number;
}) {
  if (!SUPABASE_URL || !SUPABASE_KEY || !data.userId) return;
  try {
    await fetch(`${SUPABASE_URL}/rest/v1/interaction_logs`, {
      method: "POST",
      headers: {
        "Content-Type":  "application/json",
        "apikey":        SUPABASE_KEY,
        "Authorization": `Bearer ${SUPABASE_KEY}`,
        "Prefer":        "return=minimal",
      },
      body: JSON.stringify({
        user_id:           data.userId,
        child_profile_id:  data.childProfileId,
        conversation_id:   data.conversationId ?? null,
        mode:              data.mode ?? "sos",
        trigger_category:  data.triggerCategory,
        intensity_inferred: data.intensityInferred,
        is_followup:       data.isFollowup,
        followup_type:     data.followupType ?? null,
        situation_summary: data.situationSummary,
        message_length:    data.messageLength,
      }),
    });
  } catch { console.warn("[STURDY_INTERACTION] Failed to log"); }
}

async function generateScript(prompt: string) {
  if (!ANTHROPIC_API_KEY) throw new Error("Missing ANTHROPIC_API_KEY.");

  const controller = new AbortController();
  const timeoutId  = setTimeout(() => controller.abort(), 30000);

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type":      "application/json",
        "x-api-key":         ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      signal: controller.signal,
      body: JSON.stringify({
        model:      ANTHROPIC_MODEL,
        max_tokens: 1024,
        system:     "You are Sturdy — a calm parenting guide. You write human-sounding parenting scripts parents can say out loud. Return strict JSON only. No markdown. No explanation. No preamble.",
        messages:   [{ role: "user", content: prompt }],
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Anthropic error: ${response.status} ${err}`);
    }

    const payload = await response.json();
    const content = payload?.content?.[0]?.text;
    if (!content || typeof content !== "string") throw new Error("No content in Claude response.");

    let jsonText = content.trim();
    if (jsonText.startsWith("```")) {
      jsonText = jsonText.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "").trim();
    }

    let parsed: unknown;
    try { parsed = JSON.parse(jsonText); }
    catch { throw new Error("Invalid JSON from Claude."); }

    if (!validateResponse(parsed)) throw new Error("Invalid response shape.");
    return parsed;
  } finally {
    clearTimeout(timeoutId);
  }
}

// @ts-ignore
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type", "Access-Control-Allow-Methods": "POST, OPTIONS" },
    });
  }

  if (req.method !== "POST") return jsonRes({ error: "Method not allowed." }, 405);

  let body: RequestBody;
  try { body = await req.json(); }
  catch { return jsonRes({ error: "Invalid JSON." }, 400); }

  let input;
  try { input = validateInput(body); }
  catch (e) { return jsonRes({ error: e instanceof Error ? e.message : "Invalid request." }, 400); }

  // Safety filter — only for SOS mode
  if (!input.mode || input.mode === 'sos') {
    const safety = runSafetyFilter(input.message);
    if (!safety.isSafe) {
      logSafetyEvent({ userId: input.userId, childProfileId: input.childProfileId, messageExcerpt: input.message, riskLevel: safety.riskLevel, policyRoute: safety.policyRoute, crisisType: safety.crisisType });
      return jsonRes({ response_type: "crisis", crisis_type: safety.crisisType, risk_level: safety.riskLevel, policy_route: safety.policyRoute }, 200);
    }
  }

  try {
    const prompt = buildPrompt({
      childName:      input.childName,
      childAge:       input.childAge,
      message:        input.message,
      intensity:      input.intensity,
      mode:           input.mode,
      isFollowUp:     input.isFollowUp,
      followUpType:   input.followUpType,
      originalScript: input.originalScript,
    });

    const result = await generateScript(prompt);

    // Detect trigger category from message
    const triggerCategory = classifyTrigger(input.message);

    // Word count — no content stored
    const messageLength = input.message.trim().split(/\s+/).length;

    // Log usage event (quota tracking)
    logUsageEvent({
      userId:         input.userId,
      childProfileId: input.childProfileId,
      eventType:      input.isFollowUp ? "followup_generated" : "script_generated",
      eventMeta: { intensity: input.intensity, child_age: input.childAge, mode: input.mode ?? 'sos', model: ANTHROPIC_MODEL },
    });

    // Log interaction event (child profile + triggers)
    logInteractionEvent({
      userId:            input.userId,
      childProfileId:    input.childProfileId,
      mode:              input.mode,
      triggerCategory,
      intensityInferred: input.intensity,
      isFollowup:        input.isFollowUp ?? false,
      followupType:      input.followUpType,
      situationSummary:  (result as any).situation_summary ?? "",
      messageLength,
    });

    return jsonRes({ response_type: "normal", ...result as object }, 200);
  } catch (err) {
    console.error("[STURDY_ERROR]", err);
    return jsonRes({ error: "Couldn't generate a script right now." }, 500);
  }
});


