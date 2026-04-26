// supabase/functions/_tests/_smoke.test.ts
// Tiniest possible Deno test — confirms the runtime + the local
// _assert helper module work in CI before chasing test-content failures.

import { assertEquals } from "./_assert.ts";

Deno.test("smoke — runtime is alive", () => {
  assertEquals(1 + 1, 2);
});
