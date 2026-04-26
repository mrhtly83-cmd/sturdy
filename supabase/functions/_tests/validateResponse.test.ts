// supabase/functions/_tests/validateResponse.test.ts
// Run with: deno test supabase/functions/_tests/validateResponse.test.ts
//
// Covers every shape gate in validateResponse + validateFollowUpResponse:
//   - All required fields present + correct types → true
//   - Each required field missing → false
//   - Each step validated independently
//   - avoid array gate
//   - Optional `coaching` + `strategies` ignored when missing

import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import {
  validateResponse,
  validateFollowUpResponse,
} from "../_shared/validateResponse.ts";

const validStep = { parent_action: "do this", script: "say this" };

const validBody = {
  situation_summary: "child melting down",
  regulate: validStep,
  connect:  validStep,
  guide:    validStep,
  avoid:    ["don't say x", "don't say y"],
};

// ─── validateResponse ─────────────────────────

Deno.test("validateResponse — accepts a complete valid response", () => {
  assertEquals(validateResponse(validBody), true);
});

Deno.test("validateResponse — accepts steps with optional coaching + strategies", () => {
  const body = {
    ...validBody,
    regulate: { ...validStep, coaching: "why", strategies: ["a", "b"] },
  };
  assertEquals(validateResponse(body), true);
});

Deno.test("validateResponse — rejects null + non-object", () => {
  assertEquals(validateResponse(null), false);
  assertEquals(validateResponse(undefined), false);
  assertEquals(validateResponse("string"), false);
  assertEquals(validateResponse(42), false);
  assertEquals(validateResponse([]), false);
});

Deno.test("validateResponse — rejects missing situation_summary", () => {
  const { situation_summary: _, ...rest } = validBody;
  assertEquals(validateResponse(rest), false);
});

Deno.test("validateResponse — rejects empty situation_summary", () => {
  assertEquals(validateResponse({ ...validBody, situation_summary: "" }),    false);
  assertEquals(validateResponse({ ...validBody, situation_summary: "   " }), false);
});

Deno.test("validateResponse — rejects when regulate is missing", () => {
  const { regulate: _, ...rest } = validBody;
  assertEquals(validateResponse(rest), false);
});

Deno.test("validateResponse — rejects when connect is missing", () => {
  const { connect: _, ...rest } = validBody;
  assertEquals(validateResponse(rest), false);
});

Deno.test("validateResponse — rejects when guide is missing", () => {
  const { guide: _, ...rest } = validBody;
  assertEquals(validateResponse(rest), false);
});

Deno.test("validateResponse — rejects step with empty parent_action", () => {
  assertEquals(validateResponse({
    ...validBody,
    regulate: { parent_action: "", script: "x" },
  }), false);
});

Deno.test("validateResponse — rejects step with empty script", () => {
  assertEquals(validateResponse({
    ...validBody,
    regulate: { parent_action: "x", script: "" },
  }), false);
});

Deno.test("validateResponse — rejects step missing parent_action key", () => {
  assertEquals(validateResponse({
    ...validBody,
    regulate: { script: "x" },
  }), false);
});

Deno.test("validateResponse — rejects step that is an array", () => {
  assertEquals(validateResponse({
    ...validBody,
    regulate: ["x", "y"],
  }), false);
});

Deno.test("validateResponse — rejects step that is null", () => {
  assertEquals(validateResponse({
    ...validBody,
    regulate: null,
  }), false);
});

Deno.test("validateResponse — rejects when avoid is not an array", () => {
  assertEquals(validateResponse({ ...validBody, avoid: "don't say x" }), false);
});

Deno.test("validateResponse — rejects when avoid array contains non-strings", () => {
  assertEquals(validateResponse({ ...validBody, avoid: ["good", 42] }), false);
});

Deno.test("validateResponse — rejects when avoid array contains empty strings", () => {
  assertEquals(validateResponse({ ...validBody, avoid: ["good", "  "] }), false);
});

Deno.test("validateResponse — accepts empty avoid array", () => {
  // The validator only requires .every() — empty array trivially passes.
  assertEquals(validateResponse({ ...validBody, avoid: [] }), true);
});


// ─── validateFollowUpResponse ─────────────────

const validFollowUp = {
  followup_type: "refused",
  title:         "They won't budge",
  what_happened: "child is frozen",
  what_to_do:    "wait quietly",
  why_it_works:  "any rationale",
  say_this:      "I'm here",
};

Deno.test("validateFollowUpResponse — accepts complete valid response", () => {
  assertEquals(validateFollowUpResponse(validFollowUp), true);
});

Deno.test("validateFollowUpResponse — rejects null + arrays", () => {
  assertEquals(validateFollowUpResponse(null), false);
  assertEquals(validateFollowUpResponse([]),   false);
});

Deno.test("validateFollowUpResponse — rejects each missing required field", () => {
  for (const k of ["followup_type", "title", "what_happened", "what_to_do", "say_this"] as const) {
    const copy = { ...validFollowUp };
    delete (copy as Record<string, unknown>)[k];
    assertEquals(validateFollowUpResponse(copy), false, `missing ${k} should fail`);
  }
});

Deno.test("validateFollowUpResponse — accepts missing why_it_works only as empty string", () => {
  // why_it_works is only required to be a string (typeof check, no length gate).
  assertEquals(validateFollowUpResponse({ ...validFollowUp, why_it_works: "" }), true);
});
