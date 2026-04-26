// supabase/functions/_tests/validateInput.test.ts
// Run with: deno test supabase/functions/_tests/validateInput.test.ts
//
// Covers every branch in requestHelpers.validateInput:
//   - SOS mode (default) — childName + childAge required
//   - Question mode      — child context optional
//   - message always required
//   - Age boundaries (2 and 17 inclusive, anything outside throws)
//   - Type-coercion fallbacks (wrong types fall to defaults)
//   - intensity rounding + range gate (1..5)
//   - originalScript shape gate

import { assertEquals, assertThrows, assertStrictEquals } from "jsr:@std/assert@1";
import { validateInput } from "../_shared/requestHelpers.ts";

// ─── SOS mode (default) ───────────────────────

Deno.test("validateInput — SOS — happy path", () => {
  const result = validateInput({
    childName: "Maya",
    childAge:  5,
    message:   "She just hit her brother",
  });
  assertEquals(result.childName, "Maya");
  assertEquals(result.childAge,  5);
  assertEquals(result.message,   "She just hit her brother");
  assertEquals(result.mode,      null);
  assertEquals(result.intensity, null);
  assertEquals(result.isFollowUp, false);
});

Deno.test("validateInput — SOS — trims childName and message", () => {
  const result = validateInput({
    childName: "  Maya  ",
    childAge:  5,
    message:   "  hit her brother  ",
  });
  assertEquals(result.childName, "Maya");
  assertEquals(result.message,   "hit her brother");
});

Deno.test("validateInput — SOS — throws when childName is missing", () => {
  assertThrows(
    () => validateInput({ childAge: 5, message: "x" }),
    Error,
    "childName is required",
  );
});

Deno.test("validateInput — SOS — throws when childName is empty after trim", () => {
  assertThrows(
    () => validateInput({ childName: "   ", childAge: 5, message: "x" }),
    Error,
    "childName is required",
  );
});

Deno.test("validateInput — SOS — throws when childName is wrong type", () => {
  assertThrows(
    () => validateInput({ childName: 123 as unknown, childAge: 5, message: "x" }),
    Error,
    "childName is required",
  );
});

// ─── Age boundaries ──────────────────────────

Deno.test("validateInput — childAge boundary: 2 is allowed", () => {
  const result = validateInput({ childName: "X", childAge: 2, message: "x" });
  assertEquals(result.childAge, 2);
});

Deno.test("validateInput — childAge boundary: 17 is allowed", () => {
  const result = validateInput({ childName: "X", childAge: 17, message: "x" });
  assertEquals(result.childAge, 17);
});

Deno.test("validateInput — childAge below range throws", () => {
  assertThrows(
    () => validateInput({ childName: "X", childAge: 1, message: "x" }),
    Error,
    "childAge must be between 2 and 17",
  );
});

Deno.test("validateInput — childAge above range throws", () => {
  assertThrows(
    () => validateInput({ childName: "X", childAge: 18, message: "x" }),
    Error,
    "childAge must be between 2 and 17",
  );
});

Deno.test("validateInput — childAge missing throws", () => {
  assertThrows(
    () => validateInput({ childName: "X", message: "x" }),
    Error,
    "childAge must be between 2 and 17",
  );
});

Deno.test("validateInput — childAge as string throws", () => {
  assertThrows(
    () => validateInput({ childName: "X", childAge: "5" as unknown, message: "x" }),
    Error,
    "childAge must be between 2 and 17",
  );
});

// ─── message ─────────────────────────────────

Deno.test("validateInput — message required even in SOS", () => {
  assertThrows(
    () => validateInput({ childName: "X", childAge: 5 }),
    Error,
    "message is required",
  );
});

Deno.test("validateInput — message of pure whitespace throws", () => {
  assertThrows(
    () => validateInput({ childName: "X", childAge: 5, message: "    " }),
    Error,
    "message is required",
  );
});

// ─── Question mode ───────────────────────────

Deno.test("validateInput — question mode — no childName/childAge needed", () => {
  const result = validateInput({ mode: "question", message: "Why does my kid bite?" });
  assertEquals(result.mode,      "question");
  assertEquals(result.childName, "");
  assertStrictEquals(Number.isNaN(result.childAge), true);
  assertEquals(result.message,   "Why does my kid bite?");
});

Deno.test("validateInput — question mode — message still required", () => {
  assertThrows(
    () => validateInput({ mode: "question" }),
    Error,
    "message is required",
  );
});

Deno.test("validateInput — question mode — accepts childAge: 1 (out of SOS range)", () => {
  // Question mode skips the age gate entirely.
  const result = validateInput({ mode: "question", childAge: 1, message: "x" });
  assertEquals(result.childAge, 1);
});

// ─── intensity ───────────────────────────────

Deno.test("validateInput — intensity rounded + clamped — 1 stays 1", () => {
  const result = validateInput({ childName: "X", childAge: 5, message: "x", intensity: 1 });
  assertEquals(result.intensity, 1);
});

Deno.test("validateInput — intensity rounded — 3.7 becomes 4", () => {
  const result = validateInput({ childName: "X", childAge: 5, message: "x", intensity: 3.7 });
  assertEquals(result.intensity, 4);
});

Deno.test("validateInput — intensity 0 dropped to null", () => {
  const result = validateInput({ childName: "X", childAge: 5, message: "x", intensity: 0 });
  assertEquals(result.intensity, null);
});

Deno.test("validateInput — intensity 6 dropped to null", () => {
  const result = validateInput({ childName: "X", childAge: 5, message: "x", intensity: 6 });
  assertEquals(result.intensity, null);
});

Deno.test("validateInput — intensity wrong type → null", () => {
  const result = validateInput({ childName: "X", childAge: 5, message: "x", intensity: "3" as unknown });
  assertEquals(result.intensity, null);
});

// ─── isFollowUp + followUpType + originalScript ──

Deno.test("validateInput — isFollowUp must be strictly true", () => {
  const a = validateInput({ childName: "X", childAge: 5, message: "x", isFollowUp: 1 as unknown });
  assertEquals(a.isFollowUp, false);
  const b = validateInput({ childName: "X", childAge: 5, message: "x", isFollowUp: true });
  assertEquals(b.isFollowUp, true);
});

Deno.test("validateInput — followUpType passes when string", () => {
  const r = validateInput({ childName: "X", childAge: 5, message: "x", followUpType: "refused" });
  assertEquals(r.followUpType, "refused");
});

Deno.test("validateInput — followUpType wrong type → null", () => {
  const r = validateInput({ childName: "X", childAge: 5, message: "x", followUpType: 123 as unknown });
  assertEquals(r.followUpType, null);
});

Deno.test("validateInput — originalScript only kept when object", () => {
  const obj = { situation_summary: "s", regulate: "r", connect: "c", guide: "g" };
  const r1 = validateInput({ childName: "X", childAge: 5, message: "x", originalScript: obj });
  assertEquals(r1.originalScript, obj);
  const r2 = validateInput({ childName: "X", childAge: 5, message: "x", originalScript: "nope" as unknown });
  assertEquals(r2.originalScript, null);
});

// ─── userId / childProfileId pass-through ────

Deno.test("validateInput — userId + childProfileId pass through when string", () => {
  const r = validateInput({
    childName: "X", childAge: 5, message: "x",
    userId: "u-1", childProfileId: "c-1",
  });
  assertEquals(r.userId,         "u-1");
  assertEquals(r.childProfileId, "c-1");
});

Deno.test("validateInput — userId + childProfileId default to null when missing", () => {
  const r = validateInput({ childName: "X", childAge: 5, message: "x" });
  assertEquals(r.userId,         null);
  assertEquals(r.childProfileId, null);
});
