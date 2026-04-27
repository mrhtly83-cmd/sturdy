// supabase/functions/_shared/requestHelpers.ts
//
// Extracted from chat-parenting-assistant/index.ts so the helpers can be
// unit-tested without spinning up the whole Edge Function.
//
// - validateInput:   parses + validates the POST body. SOS mode requires
//                    childName + childAge (2..17); question mode is laxer.
// - extractContent:  pulls the JSON-string body out of an Anthropic
//                    Messages API response. Handles both string and
//                    content-block-array shapes, strips ```json fences.

// ─────────────────────────────────────────────
// validateInput
// ─────────────────────────────────────────────

export type RequestBody = {
  childName?:      unknown;
  childAge?:       unknown;
  message?:        unknown;
  userId?:         unknown;
  childProfileId?: unknown;
  intensity?:      unknown;
  mode?:           unknown;
  tone?:           unknown;
  isFollowUp?:     unknown;
  followUpType?:   unknown;
  originalScript?: unknown;
};

export type Tone = 'soft' | 'gentle' | 'direct';

export type ValidatedInput = {
  childName:      string;
  childAge:       number;
  message:        string;
  userId:         string | null;
  childProfileId: string | null;
  intensity:      number | null;
  mode:           string | null;
  tone:           Tone | null;
  isFollowUp:     boolean;
  followUpType:   string | null;
  originalScript: {
    situation_summary: string;
    regulate:          string;
    connect:           string;
    guide:             string;
  } | null;
};

export function validateInput(body: RequestBody): ValidatedInput {
  const childName      = typeof body.childName === "string" ? body.childName.trim() : "";
  const childAge       = typeof body.childAge  === "number" ? body.childAge          : Number.NaN;
  const message        = typeof body.message   === "string" ? body.message.trim()    : "";
  const userId         = typeof body.userId    === "string" ? body.userId             : null;
  const childProfileId = typeof body.childProfileId === "string" ? body.childProfileId : null;
  const intensity      = typeof body.intensity === "number" && body.intensity >= 1 && body.intensity <= 5
                           ? Math.round(body.intensity) : null;
  const mode           = typeof body.mode === "string" ? body.mode : null;
  const tone           = (body.tone === 'soft' || body.tone === 'gentle' || body.tone === 'direct')
                           ? body.tone as Tone
                           : null;
  const isFollowUp     = body.isFollowUp === true;
  const followUpType   = typeof body.followUpType === "string" ? body.followUpType : null;
  const originalScript = body.originalScript && typeof body.originalScript === "object"
    ? body.originalScript as ValidatedInput["originalScript"]
    : null;

  // SOS mode requires child context. Question mode does not (auto-detection elsewhere).
  if (mode !== 'question') {
    if (!childName)    throw new Error("childName is required.");
    if (!Number.isFinite(childAge) || childAge < 2 || childAge > 17) {
      throw new Error("childAge must be between 2 and 17.");
    }
  }
  if (!message) throw new Error("message is required.");

  return {
    childName, childAge, message, userId, childProfileId,
    intensity, mode, tone, isFollowUp, followUpType, originalScript,
  };
}


// ─────────────────────────────────────────────
// extractContent
// Pulls the Claude-generated JSON body out of an Anthropic Messages API
// response. Works for both shapes:
//   { content: "raw string" }
//   { content: [ { type: "text", text: "..." }, ... ] }
// Strips ```json ... ``` fences if present, returns the trimmed inner string.
// ─────────────────────────────────────────────

export function extractContent(payload: unknown): string {
  if (!payload || typeof payload !== "object") {
    throw new Error("No content in Claude response.");
  }

  const p = payload as { content?: unknown };
  const raw = p.content;

  let text: string | null = null;

  if (typeof raw === "string") {
    text = raw;
  } else if (Array.isArray(raw)) {
    // Find first { type: "text", text: "..." } block
    for (const block of raw) {
      if (block && typeof block === "object") {
        const b = block as { type?: unknown; text?: unknown };
        if (b.type === "text" && typeof b.text === "string") {
          text = b.text;
          break;
        }
      }
    }
  }

  if (text === null || typeof text !== "string") {
    throw new Error("No content in Claude response.");
  }

  let jsonText = text.trim();
  if (jsonText.startsWith("```")) {
    jsonText = jsonText.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "").trim();
  }

  return jsonText;
}
