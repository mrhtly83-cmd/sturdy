// supabase/functions/_tests/_smoke.test.ts
// Tiniest possible Deno test — used to confirm Deno + JSR + the test
// runner itself work in CI before chasing test-content failures.

import { assertEquals } from "jsr:@std/assert@1";

Deno.test("smoke — runtime is alive", () => {
  assertEquals(1 + 1, 2);
});
