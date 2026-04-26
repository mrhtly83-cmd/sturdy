// supabase/functions/_tests/extractContent.test.ts
// Run with: deno test supabase/functions/_tests/extractContent.test.ts
//
// Covers every branch in requestHelpers.extractContent:
//   - String content shape
//   - Array content shape (current Anthropic Messages API)
//   - Multiple text blocks → first one wins
//   - ```json fence stripping
//   - ``` (no language) fence stripping
//   - Whitespace trimming
//   - All error paths (null, non-object, missing content, wrong types)

import { assertEquals, assertThrows } from "./_assert.ts";
import { extractContent } from "../_shared/requestHelpers.ts";

// ─── Array content shape (production Anthropic Messages API) ───

Deno.test("extractContent — array content with single text block", () => {
  const payload = {
    content: [{ type: "text", text: '{"x":1}' }],
  };
  assertEquals(extractContent(payload), '{"x":1}');
});

Deno.test("extractContent — array content — first text block wins", () => {
  const payload = {
    content: [
      { type: "text", text: "first" },
      { type: "text", text: "second" },
    ],
  };
  assertEquals(extractContent(payload), "first");
});

Deno.test("extractContent — array content — skips non-text blocks", () => {
  const payload = {
    content: [
      { type: "tool_use",  id: "abc" },
      { type: "text",      text: "the json" },
    ],
  };
  assertEquals(extractContent(payload), "the json");
});

// ─── String content shape (legacy / completions endpoint) ───

Deno.test("extractContent — string content passes through", () => {
  assertEquals(extractContent({ content: "hello" }), "hello");
});

Deno.test("extractContent — string content trimmed", () => {
  assertEquals(extractContent({ content: "  trimmed  " }), "trimmed");
});

// ─── Fence stripping ───

Deno.test("extractContent — strips ```json fences", () => {
  const payload = {
    content: [{ type: "text", text: '```json\n{"a":1}\n```' }],
  };
  assertEquals(extractContent(payload), '{"a":1}');
});

Deno.test("extractContent — strips bare ``` fences without language tag", () => {
  const payload = {
    content: [{ type: "text", text: '```\n{"a":1}\n```' }],
  };
  assertEquals(extractContent(payload), '{"a":1}');
});

Deno.test("extractContent — content without fences left untouched", () => {
  const payload = { content: [{ type: "text", text: '{"a":1}' }] };
  assertEquals(extractContent(payload), '{"a":1}');
});

// ─── Error paths ───

Deno.test("extractContent — null payload throws", () => {
  assertThrows(() => extractContent(null), Error, "No content");
});

Deno.test("extractContent — non-object payload throws", () => {
  assertThrows(() => extractContent("string"), Error, "No content");
  assertThrows(() => extractContent(42),       Error, "No content");
});

Deno.test("extractContent — object without content throws", () => {
  assertThrows(() => extractContent({}), Error, "No content");
});

Deno.test("extractContent — array content with no text blocks throws", () => {
  const payload = {
    content: [{ type: "tool_use", id: "abc" }],
  };
  assertThrows(() => extractContent(payload), Error, "No content");
});

Deno.test("extractContent — array content with text block missing .text throws", () => {
  const payload = {
    content: [{ type: "text" }],
  };
  assertThrows(() => extractContent(payload), Error, "No content");
});

Deno.test("extractContent — array content with non-string .text throws", () => {
  const payload = {
    content: [{ type: "text", text: 42 }],
  };
  assertThrows(() => extractContent(payload), Error, "No content");
});
