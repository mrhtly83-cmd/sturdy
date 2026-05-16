declare const Deno: {
  env: { get(name: string): string | undefined; };
};

// @ts-ignore
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

import { buildPrompt }              from "../_shared/buildPrompt.ts";
import { validateResponse }         from "../_shared/validateResponse.ts";
import { runSafetyFilter }          from "../_shared/safetyFilter.ts";
import { checkAnthropicRateLimit }  from "../_shared/rateLimit.ts";
import { classifyTrigger }          from "../_shared/triggerClassifier.ts";
import { buildQuestionPrompt }      from "../_shared/prompts/question.ts";
import { validateQuestionResponse } from "../_shared/validateQuestionResponse.ts";
import { validateInput, extractContent, type RequestBody } from "../_shared/requestHelpers.ts";

const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");
const ANTHROPIC_MODEL   = "claude-sonnet-4-20250514";
const SUPABASE_URL      = Deno.env.get("SUPABASE_URL");
const SUPABASE_KEY      = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

function cors() {
  return {
    "Access-Control-Allow-Origin":  "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };
}

function jsonRes(body: unknown, status = 200, extraHeaders: Record<string, string> = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors(), "Content-Type": "application/json", ...extraHeaders },
  });
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

  async function logParentThought(data: {
    userId:         string | null;
    childProfileId: string | null;
    promptText:     string;
    responseText:   string;
  }): Promise<string | null> {
    if (!SUPABASE_URL || !SUPABASE_KEY || !data.userId) return null;
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/parent_thoughts`, {
        method: "POST",
        headers: {
          "Content-Type":  "application/json",
          "apikey":        SUPABASE_KEY,
          "Authorization": `Bearer ${SUPABASE_KEY}`,
          "Prefer":        "return=representation",
        },
        body: JSON.stringify({
          user_id:          data.userId,
          child_profile_id: data.childProfileId,
          prompt_text:      data.promptText,
          response_text:    data.responseText,
        }),
      });
      if (!res.ok) return null;
      const rows = await res.json();
      if (Array.isArray(rows) && rows.length > 0 && typeof rows[0]?.id === "string") {
        return rows[0].id;
      }
      return null;
    } catch {
      console.warn("[STURDY_THOUGHT] Failed to log");
      return null;
    }
  }

// ─── Auto-mode classifier ─────────────────────────────────────────────────
// Heuristic: present-tense urgency → SOS script. Reflective/question → prose.
// Keyword lists tuned against SCRIPT QUALITY STANDARDS scenarios.
// Replace with an LLM classification call if heuristic accuracy proves
// insufficient in production.
const SOS_PATTERNS = [
  /\bright\s*now\b/i,
  /\bwon'?t\s+stop\b/i,
  /\bwon'?t\s+(calm|listen|come|sleep|eat|get)\b/i,
  /\b(is|are|keeps?|keeps?\s+on)\s+(scream|hit|throw|bite|kick|crying|tantrum|melt|refus)\w*/i,
  /\b(scream|meltdown|tantrum|losing\s+it|losing\s+my\s+(mind|it)|melting\s+down)\b/i,
  /\b(threw|hit|kicked|bit|spit|slapped)\b/i,
  /\b(ca?n'?t\s+(calm|stop|get)\b)/i,
  /\brefusing\s+to\b/i,
  /\bfreaking\s+out\b/i,
  /\bsnap(ped)?\b/i,
  /\bshut\s+down\b/i,
  /\bhaving\s+a\s+(meltdown|tantrum|fit)\b/i,
  /\bspiraling\b/i,
  /\bhelp\s+me\s+(through|right\s+now)\b/i,
];

const QUESTION_STARTERS = [
  /^(why|how|what|when|should|is\s+it|am\s+i|are\s+they|do\s+i|does\s+he|does\s+she|does\s+my|can\s+i|could\s+i)\b/i,
  /\b(normal|typical|worried|wonder(ing)?|advice|think\s+i\s+(should|need)|pattern|lately|always|never|keep\s+doing|keeps\s+doing)\b/i,
];

function classifyAutoMode(message: string): 'sos' | 'question' {
  const lower = message.trim();
  for (const pattern of SOS_PATTERNS) {
    if (pattern.test(lower)) return 'sos';
  }
  for (const pattern of QUESTION_STARTERS) {
    if (pattern.test(lower)) return 'question';
  }
  // Default: shorter messages with no question markers lean SOS; longer lean question
  return lower.split(/\s+/).length <= 20 ? 'sos' : 'question';
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
    const jsonText = extractContent(payload);

    let parsed: unknown;
    try { parsed = JSON.parse(jsonText); }
    catch { throw new Error("Invalid JSON from Claude."); }

    if (!validateResponse(parsed)) throw new Error("Invalid response shape.");
    return parsed;
  } finally {
    clearTimeout(timeoutId);
  }
}

async function generateQuestionResponse(prompt: string) {
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
          max_tokens: 2048,
          system:     "You are Sturdy — a warm, knowing parent friend. You answer parenting questions in your own voice. Return strict JSON only. No markdown. No explanation. No preamble.",
          messages:   [{ role: "user", content: prompt }],
        }),
      });

      if (!response.ok) {
        const err = await response.text();
        throw new Error(`Anthropic error: ${response.status} ${err}`);
      }

      const payload = await response.json();
      const jsonText = extractContent(payload);

      let parsed: unknown;
      try { parsed = JSON.parse(jsonText); }
      catch { throw new Error("Invalid JSON from Claude."); }

      if (!validateQuestionResponse(parsed)) throw new Error("Invalid question response shape.");
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

  // ─── Safety filter — runs on every path before any Anthropic call.
  //     Crisis short-circuits with a 200 + crisis envelope; never counted
  //     against the rate limit (Principle 4 — crisis is always free). ───
  const safety = runSafetyFilter(input.message);
  if (!safety.isSafe) {
    logSafetyEvent({
      userId:         input.userId,
      childProfileId: input.childProfileId,
      messageExcerpt: input.message,
      riskLevel:      safety.riskLevel,
      policyRoute:    safety.policyRoute,
      crisisType:     safety.crisisType,
    });
    return jsonRes({
      response_type: "crisis",
      crisis_type:   safety.crisisType,
      risk_level:    safety.riskLevel,
      policy_route:  safety.policyRoute,
    }, 200);
  }

  // ─── Rate limit — abuse prevention only. Caps live in _shared/rateLimit.ts. ───
  const rate = await checkAnthropicRateLimit(input.userId);
  if (!rate.ok) {
    const headers: Record<string, string> = {};
    if (rate.retryAfterSeconds) {
      headers["Retry-After"] = String(rate.retryAfterSeconds);
    }
    return jsonRes({ error: rate.error }, rate.status, headers);
  }

      // ─── Auto-mode classification ───
      // Heuristic: present-tense urgency signals → SOS script.
      // All other inputs → Question/thinking-partner response.
      // Child context (name + age) is optional for auto mode; if provided
      // the SOS prompt uses it, otherwise Question mode handles gracefully.
      if (input.mode === 'auto') {
        const detectedMode = classifyAutoMode(input.message);
        if (detectedMode === 'question') {
          try {
            const questionPrompt = buildQuestionPrompt({
              childName:  input.childName || null,
              childAge:   Number.isFinite(input.childAge) ? input.childAge : null,
              message:    input.message,
              parentName: null,
            });
            const result = await generateQuestionResponse(questionPrompt) as { response: string };
            const thoughtId = await logParentThought({
              userId:         input.userId,
              childProfileId: input.childProfileId,
              promptText:     input.message,
              responseText:   result.response,
            });
            logUsageEvent({
              userId:         input.userId,
              childProfileId: input.childProfileId,
              eventType:      "question_generated",
              eventMeta:      { mode: 'auto:question', model: ANTHROPIC_MODEL },
            });
            return jsonRes({ response_type: "question", response: result.response, thought_id: thoughtId, detected_mode: 'question' }, 200);
          } catch (err) {
            console.error("[STURDY_ERROR]", err);
            return jsonRes({ error: "Couldn't generate a response right now." }, 500);
          }
        }

        // SOS-type auto path — requires child context. If missing, fall back to question.
        if (!input.childName || !Number.isFinite(input.childAge)) {
          try {
            const questionPrompt = buildQuestionPrompt({
              childName:  null,
              childAge:   null,
              message:    input.message,
              parentName: null,
            });
            const result = await generateQuestionResponse(questionPrompt) as { response: string };
            const thoughtId = await logParentThought({
              userId:         input.userId,
              childProfileId: input.childProfileId,
              promptText:     input.message,
              responseText:   result.response,
            });
            logUsageEvent({
              userId:         input.userId,
              childProfileId: input.childProfileId,
              eventType:      "question_generated",
              eventMeta:      { mode: 'auto:question_fallback', model: ANTHROPIC_MODEL },
            });
            return jsonRes({ response_type: "question", response: result.response, thought_id: thoughtId, detected_mode: 'question' }, 200);
          } catch (err) {
            console.error("[STURDY_ERROR]", err);
            return jsonRes({ error: "Couldn't generate a response right now." }, 500);
          }
        }

        // SOS path with child context
        try {
          const prompt = buildPrompt({
            childName:      input.childName,
            childAge:       input.childAge,
            message:        input.message,
            intensity:      null,
            mode:           detectedMode,
            tone:           input.tone,
            isFollowUp:     false,
            followUpType:   null,
            originalScript: null,
          });
          const result = await generateScript(prompt);
          const triggerCategory = classifyTrigger(input.message);
          const messageLength = input.message.trim().split(/\s+/).length;
          logUsageEvent({
            userId:         input.userId,
            childProfileId: input.childProfileId,
            eventType:      "script_generated",
            eventMeta:      { mode: `auto:${detectedMode}`, child_age: input.childAge, model: ANTHROPIC_MODEL },
          });
          logInteractionEvent({
            userId:            input.userId,
            childProfileId:    input.childProfileId,
            mode:              detectedMode,
            triggerCategory,
            intensityInferred: null,
            isFollowup:        false,
            situationSummary:  (result as any).situation_summary ?? "",
            messageLength,
          });
          return jsonRes({ response_type: "normal", detected_mode: detectedMode, ...result as object }, 200);
        } catch (err) {
          console.error("[STURDY_ERROR]", err);
          return jsonRes({ error: "Couldn't generate a script right now." }, 500);
        }
      }

      // ─── Question mode branch ───
      if (input.mode === 'question') {
        try {
          const questionPrompt = buildQuestionPrompt({
            childName: input.childName || null,
            childAge:  Number.isFinite(input.childAge) ? input.childAge : null,
            message:   input.message,
            parentName: null,
          });

          const result = await generateQuestionResponse(questionPrompt) as { response: string };

         const thoughtId = await logParentThought({
            userId:         input.userId,
            childProfileId: input.childProfileId,
            promptText:     input.message,
            responseText:   result.response,
          });


          logUsageEvent({
            userId:         input.userId,
            childProfileId: input.childProfileId,
            eventType:      "question_generated",
            eventMeta: { child_age: input.childAge, mode: 'question', model: ANTHROPIC_MODEL },
          });

          return jsonRes({ response_type: "question", response: result.response, thought_id: thoughtId }, 200);
        } catch (err) {
          console.error("[STURDY_ERROR]", err);
          return jsonRes({ error: "Couldn't generate a response right now." }, 500);
        }
      }

      try {


    const prompt = buildPrompt({
      childName:      input.childName,
      childAge:       input.childAge,
      message:        input.message,
      intensity:      input.intensity,
      mode:           input.mode,
      tone:           input.tone,
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


