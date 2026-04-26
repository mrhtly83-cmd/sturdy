// supabase/functions/_tests/_assert.ts
//
// Tiny local assertion helpers — replaces jsr:@std/assert / deno.land/std
// to keep these tests free of network-fetched dependencies. Deno's classic
// std URLs were 403'd in 2024; JSR works but adds a network step that has
// failed in some runners. The set of helpers here is intentionally minimal
// and matches the @std/assert API surface our tests actually use.

export function assertEquals<T>(actual: T, expected: T, msg?: string): void {
  // Use deep-equality via JSON for objects/arrays; Object.is for primitives
  // (so NaN === NaN, 0 !== -0 — matches @std/assert semantics closely enough
  // for our pure-data assertions).
  if (Object.is(actual, expected)) return;
  if (typeof actual === "object" && typeof expected === "object") {
    try {
      if (JSON.stringify(actual) === JSON.stringify(expected)) return;
    } catch { /* fall through to throw */ }
  }
  throw new Error(
    `Values are not equal${msg ? ": " + msg : ""}\n` +
    `  expected: ${stringify(expected)}\n` +
    `  actual:   ${stringify(actual)}`,
  );
}

export function assertStrictEquals<T>(actual: T, expected: T, msg?: string): void {
  if (!Object.is(actual, expected)) {
    throw new Error(
      `Values are not strictly equal${msg ? ": " + msg : ""}\n` +
      `  expected: ${stringify(expected)}\n` +
      `  actual:   ${stringify(actual)}`,
    );
  }
}

export function assertStringIncludes(haystack: string, needle: string, msg?: string): void {
  if (typeof haystack !== "string") {
    throw new Error(`assertStringIncludes: actual is not a string (got ${typeof haystack})`);
  }
  if (!haystack.includes(needle)) {
    throw new Error(
      `String does not include expected substring${msg ? ": " + msg : ""}\n` +
      `  expected to include: ${JSON.stringify(needle)}\n` +
      `  actual:              ${JSON.stringify(haystack.slice(0, 200))}`,
    );
  }
}

// deno-lint-ignore no-explicit-any
type ErrCtor = new (...args: any[]) => Error;

export function assertThrows(
  fn: () => unknown,
  ErrorClass?: ErrCtor,
  msgIncludes?: string,
): void {
  let thrown: unknown = null;
  try {
    fn();
  } catch (e) {
    thrown = e;
  }
  if (thrown === null) {
    throw new Error("Expected function to throw, but it returned normally.");
  }
  if (ErrorClass && !(thrown instanceof ErrorClass)) {
    throw new Error(
      `Thrown value is not an instance of ${ErrorClass.name}: ` +
      `${(thrown as { constructor?: { name: string } })?.constructor?.name ?? typeof thrown}`,
    );
  }
  if (msgIncludes !== undefined) {
    const m = (thrown as Error)?.message ?? String(thrown);
    if (!m.includes(msgIncludes)) {
      throw new Error(
        `Thrown error message does not include expected substring.\n` +
        `  expected to include: ${JSON.stringify(msgIncludes)}\n` +
        `  actual message:      ${JSON.stringify(m)}`,
      );
    }
  }
}

function stringify(v: unknown): string {
  try { return JSON.stringify(v); } catch { return String(v); }
}
