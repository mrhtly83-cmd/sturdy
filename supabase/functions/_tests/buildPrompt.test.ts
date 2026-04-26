// supabase/functions/_tests/buildPrompt.test.ts
// Run with: deno test --allow-read supabase/functions/_tests/buildPrompt.test.ts
//
// Covers:
//   - getAgeContext: every age branch (2, 3, 4, 5-6, 7-9, 10-12, 13-15, 16+)
//   - getIntensityGuidance: all 5 levels (1..5)
//   - detectNeurotype: each of the 6 categories via explicit + behavioural keywords
//   - getMessageLengthRule: short / moderate / detailed
//   - buildPrompt: assembles the right sections per mode (sos / reconnect /
//                  understand / conversation), follow-up branch, neurotype + intensity injection

import { assertEquals, assertStringIncludes } from "https://deno.land/std@0.224.0/assert/mod.ts";
import {
  buildPrompt,
  detectNeurotype,
  getAgeContext,
  getIntensityGuidance,
  getMessageLengthRule,
  NEUROTYPE_BLOCKS,
} from "../_shared/buildPrompt.ts";

// ─── getAgeContext: every branch ──────────────

Deno.test("getAgeContext — age 2 → 'AGE 2' branch", () => {
  assertStringIncludes(getAgeContext(2), "AGE 2:");
  assertStringIncludes(getAgeContext(2), "Max 3-4 words");
});

Deno.test("getAgeContext — age 3 → 'AGE 3' branch", () => {
  assertStringIncludes(getAgeContext(3), "AGE 3:");
  assertStringIncludes(getAgeContext(3), "No multi-step");
});

Deno.test("getAgeContext — age 4 → 'AGE 4' branch", () => {
  assertStringIncludes(getAgeContext(4), "AGE 4:");
});

Deno.test("getAgeContext — age 5 and 6 → 'AGE 5-6' branch", () => {
  assertStringIncludes(getAgeContext(5), "AGE 5-6");
  assertStringIncludes(getAgeContext(6), "AGE 5-6");
});

Deno.test("getAgeContext — ages 7..9 → mid-child branch", () => {
  for (const age of [7, 8, 9]) {
    assertStringIncludes(getAgeContext(age), `AGE ${age}:`);
    assertStringIncludes(getAgeContext(age), "No babyish tone");
  }
});

Deno.test("getAgeContext — ages 10..12 → 'do not patronize' branch", () => {
  for (const age of [10, 11, 12]) {
    assertStringIncludes(getAgeContext(age), "Do not patronize");
  }
});

Deno.test("getAgeContext — ages 13..15 → near-adult branch", () => {
  for (const age of [13, 14, 15]) {
    assertStringIncludes(getAgeContext(age), "near-adult collaboration");
  }
});

Deno.test("getAgeContext — ages 16+ → adult branch", () => {
  for (const age of [16, 17]) {
    assertStringIncludes(getAgeContext(age), "Do not treat as a child");
  }
});

// ─── getIntensityGuidance: all 5 levels ───────

Deno.test("getIntensityGuidance — level 1 → MILD", () => {
  assertStringIncludes(getIntensityGuidance(1), "MILD");
});

Deno.test("getIntensityGuidance — level 2 → BUILDING", () => {
  assertStringIncludes(getIntensityGuidance(2), "BUILDING");
});

Deno.test("getIntensityGuidance — level 3 → HARD", () => {
  assertStringIncludes(getIntensityGuidance(3), "HARD");
  assertStringIncludes(getIntensityGuidance(3), "Max 8 words");
});

Deno.test("getIntensityGuidance — level 4 → VERY HARD", () => {
  assertStringIncludes(getIntensityGuidance(4), "VERY HARD");
  assertStringIncludes(getIntensityGuidance(4), "Max 6 words");
});

Deno.test("getIntensityGuidance — level 5 → OVERWHELMING + sets coaching empty", () => {
  const out = getIntensityGuidance(5);
  assertStringIncludes(out, "OVERWHELMING");
  assertStringIncludes(out, '"coaching"');
  assertStringIncludes(out, "4 words absolute max");
});

Deno.test("getIntensityGuidance — level 6 falls into the OVERWHELMING bucket", () => {
  // No upper bound, anything > 4 returns the level-5 text
  assertStringIncludes(getIntensityGuidance(6), "OVERWHELMING");
});

// ─── detectNeurotype: explicit triggers ───────

Deno.test("detectNeurotype — ADHD via 'adhd'", () => {
  assertEquals(detectNeurotype("My son has ADHD and won't sit still"), "ADHD");
});

Deno.test("detectNeurotype — Autism via 'autistic'", () => {
  assertEquals(detectNeurotype("She's autistic and just melted down"), "Autism");
});

Deno.test("detectNeurotype — Anxiety via 'anxiety'", () => {
  assertEquals(detectNeurotype("He has anxiety about school"), "Anxiety");
});

Deno.test("detectNeurotype — Sensory via 'spd'", () => {
  assertEquals(detectNeurotype("He has SPD"), "Sensory");
});

Deno.test("detectNeurotype — PDA via 'pda'", () => {
  assertEquals(detectNeurotype("Pretty sure she has PDA"), "PDA");
});

Deno.test("detectNeurotype — 2e via 'twice exceptional'", () => {
  assertEquals(detectNeurotype("He's twice exceptional"), "2e");
});

// ─── detectNeurotype: behavioural fallbacks ───

Deno.test("detectNeurotype — ADHD via 'cant sit still'", () => {
  assertEquals(detectNeurotype("she just cant sit still at dinner"), "ADHD");
});

Deno.test("detectNeurotype — Autism via 'hates transitions'", () => {
  assertEquals(detectNeurotype("he hates transitions, every single time"), "Autism");
});

Deno.test("detectNeurotype — Anxiety via 'school refusal'", () => {
  assertEquals(detectNeurotype("we're dealing with school refusal again"), "Anxiety");
});

Deno.test("detectNeurotype — Sensory via 'sensory overload'", () => {
  assertEquals(detectNeurotype("She's in sensory overload"), "Sensory");
});

Deno.test("detectNeurotype — PDA via 'refuses everything'", () => {
  assertEquals(detectNeurotype("He literally refuses everything I ask"), "PDA");
});

Deno.test("detectNeurotype — null when no match", () => {
  assertEquals(detectNeurotype("She wouldn't put on her shoes"), null);
});

Deno.test("detectNeurotype — explicit beats behavioural (ADHD label wins over autism behaviour)", () => {
  // 'adhd' is explicit — should outrank autism's 'hates transitions' behavioural keyword
  assertEquals(detectNeurotype("ADHD kid who hates transitions"), "ADHD");
});

// ─── getMessageLengthRule ─────────────────────

Deno.test("getMessageLengthRule — short message", () => {
  assertStringIncludes(getMessageLengthRule("She hit her brother"), "SHORT");
});

Deno.test("getMessageLengthRule — moderate message (~20 words)", () => {
  const msg = "She hit her brother because he took her toy and she has been melting down for the past hour straight today";
  assertStringIncludes(getMessageLengthRule(msg), "MODERATE");
});

Deno.test("getMessageLengthRule — detailed message (40+ words)", () => {
  const long = Array(45).fill("word").join(" ");
  assertStringIncludes(getMessageLengthRule(long), "DETAILED");
});

// ─── NEUROTYPE_BLOCKS: every category present ──

Deno.test("NEUROTYPE_BLOCKS — has all 6 categories", () => {
  const expected = ["ADHD", "Autism", "Anxiety", "Sensory", "PDA", "2e"];
  for (const k of expected) {
    assertStringIncludes(
      NEUROTYPE_BLOCKS[k],
      "Stealth Mode Active",
      `block for ${k} should be in stealth mode`,
    );
  }
});

// ─── buildPrompt: assembles SOS prompt with the right sections ──

Deno.test("buildPrompt — SOS default mode includes situation, age guidance, REGULATE/CONNECT/GUIDE", () => {
  const out = buildPrompt({
    childName: "Maya",
    childAge:  5,
    message:   "She hit her brother",
  });
  assertStringIncludes(out, "Maya, age 5");
  assertStringIncludes(out, "She hit her brother");
  assertStringIncludes(out, "AGE 5-6");
  assertStringIncludes(out, "REGULATE");
  assertStringIncludes(out, "CONNECT");
  assertStringIncludes(out, "GUIDE");
  assertStringIncludes(out, "AVOID");
});

Deno.test("buildPrompt — injects neurotype block when message implies it", () => {
  const out = buildPrompt({
    childName: "Maya",
    childAge:  5,
    message:   "My ADHD kid won't stop running around",
  });
  assertStringIncludes(out, "[NEUROTYPE: ADHD");
});

Deno.test("buildPrompt — injects intensity guidance when intensity is set", () => {
  const out = buildPrompt({
    childName: "Maya",
    childAge:  5,
    message:   "She hit her brother",
    intensity: 4,
  });
  assertStringIncludes(out, "VERY HARD");
});

Deno.test("buildPrompt — omits intensity guidance when null", () => {
  const out = buildPrompt({
    childName: "Maya",
    childAge:  5,
    message:   "She hit her brother",
  });
  // No INTENSITY-tagged line should appear
  assertEquals(out.includes("VERY HARD"), false);
  assertEquals(out.includes("OVERWHELMING"), false);
});

Deno.test("buildPrompt — reconnect mode uses RECONNECT MODE CONSTRAINTS", () => {
  const out = buildPrompt({
    childName: "Maya",
    childAge:  5,
    message:   "We had a rough morning",
    mode:      "reconnect",
  });
  assertStringIncludes(out, "RECONNECT MODE CONSTRAINTS");
});

Deno.test("buildPrompt — understand mode uses UNDERSTAND MODE CONSTRAINTS", () => {
  const out = buildPrompt({
    childName: "Maya",
    childAge:  5,
    message:   "Why does she keep biting?",
    mode:      "understand",
  });
  assertStringIncludes(out, "UNDERSTAND MODE CONSTRAINTS");
});

Deno.test("buildPrompt — conversation mode uses CONVERSATION MODE CONSTRAINTS", () => {
  const out = buildPrompt({
    childName: "Maya",
    childAge:  5,
    message:   "I need to talk to her about screen time",
    mode:      "conversation",
  });
  assertStringIncludes(out, "CONVERSATION MODE CONSTRAINTS");
});

Deno.test("buildPrompt — follow-up mode uses follow-up output schema, not 3-step", () => {
  const out = buildPrompt({
    childName:  "Maya",
    childAge:   5,
    message:    "She kept screaming after the script",
    isFollowUp: true,
    followUpType: "escalated",
    originalScript: {
      situation_summary: "park meltdown",
      regulate: "x", connect: "y", guide: "z",
    },
  });
  assertStringIncludes(out, '"followup_type": "escalated"');
  assertStringIncludes(out, "what_to_do");
  assertEquals(out.includes("REGULATE — Stabilise the moment"), false);
});
