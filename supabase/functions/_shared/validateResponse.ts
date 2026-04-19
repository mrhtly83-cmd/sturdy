// supabase/functions/_shared/validateResponse.ts
// Validates expanded schema including coaching + strategies per step

type ScriptStep = {
  parent_action: string;
  script:        string;
  coaching?:     string;
  strategies?:   string[];
};

function isValidStep(value: unknown): value is ScriptStep {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.parent_action === 'string' && v.parent_action.trim().length > 0 &&
    typeof v.script        === 'string' && v.script.trim().length > 0
    // coaching and strategies are optional — don't fail if missing
  );
}

function isValidAvoid(value: unknown): boolean {
  if (!Array.isArray(value)) return false;
  return value.every(item => typeof item === 'string' && item.trim().length > 0);
}

export type SturdyResponse = {
  situation_summary: string;
  regulate:          ScriptStep;
  connect:           ScriptStep;
  guide:             ScriptStep;
  avoid:             string[];
};

export function validateResponse(value: unknown): value is SturdyResponse {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const c = value as Record<string, unknown>;
  return (
    typeof c.situation_summary === 'string' && c.situation_summary.trim().length > 0 &&
    isValidStep(c.regulate) &&
    isValidStep(c.connect)  &&
    isValidStep(c.guide)    &&
    isValidAvoid(c.avoid)
  );
}

// ─────────────────────────────────────────────
// Follow-up response validation
// ─────────────────────────────────────────────

export type FollowUpResponse = {
  followup_type: string;
  title:         string;
  what_happened: string;
  what_to_do:    string;
  why_it_works:  string;
  say_this:      string;
};

export function validateFollowUpResponse(value: unknown): value is FollowUpResponse {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const c = value as Record<string, unknown>;
  return (
    typeof c.followup_type === 'string' && c.followup_type.trim().length > 0 &&
    typeof c.title         === 'string' && c.title.trim().length > 0 &&
    typeof c.what_happened === 'string' && c.what_happened.trim().length > 0 &&
    typeof c.what_to_do    === 'string' && c.what_to_do.trim().length > 0 &&
    typeof c.why_it_works  === 'string' &&
    typeof c.say_this      === 'string' && c.say_this.trim().length > 0
  );
}

