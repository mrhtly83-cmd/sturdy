// supabase/functions/_shared/prompts/__tests__/question.eval.ts
// Deno eval harness for Question mode.
//
// Reads eval-inputs.json, builds the prompt for each entry via
// buildQuestionPrompt, calls Anthropic with the same model the live
// Edge Function uses (claude-sonnet-4-20250514), parses the JSON
// response, and writes a timestamped Markdown file with all five
// outputs into eval-outputs/.
//
// Usage:
//   ANTHROPIC_API_KEY=sk-ant-... npm run eval:question
//
// This is a manual command, run by a human before merging prompt
// changes. It hits the live Anthropic API and costs real money — it
// is deliberately NOT in CI.
//
// Grade outputs against docs/QUESTION_MODE_QUALITY_STANDARDS.md on
// three axes: (1) opens with answer not preamble, (2) sounds like a
// long walk, (3) length proportional. 4-of-5 across all three axes =
// safe to ship. 3-or-fewer = roll back.

declare const Deno: {
  env: { get(name: string): string | undefined };
  readTextFile(path: string): Promise<string>;
  writeTextFile(path: string, data: string): Promise<void>;
  mkdir(path: string, opts?: { recursive?: boolean }): Promise<void>;
  Command: new (cmd: string, opts: { args: string[] }) => {
    output(): Promise<{ stdout: Uint8Array; stderr: Uint8Array; success: boolean }>;
  };
  exit(code: number): never;
};

import { buildQuestionPrompt } from '../question.ts';

// ─────────────────────────────────────────────
// CONFIG
// ─────────────────────────────────────────────

const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY');
const ANTHROPIC_MODEL   = 'claude-sonnet-4-20250514';   // matches the live Edge Function
const HERE              = new URL('.', import.meta.url).pathname;
const INPUTS_PATH       = `${HERE}eval-inputs.json`;
const PROMPT_FILE_PATH  = `${HERE}../question.ts`;
const OUTPUT_DIR        = `${HERE}eval-outputs`;

// ─────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────

type EvalInput = {
  id:             string;
  classification: string;
  input: {
    childName:   string | null;
    childAge:    number | null;
    message:     string;
    parentName?: string | null;
  };
};

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────

function isoDate(): string {
  return new Date().toISOString().slice(0, 10);          // YYYY-MM-DD
}

async function shellOut(cmd: string, args: string[]): Promise<string> {
  const proc = new Deno.Command(cmd, { args });
  const { stdout } = await proc.output();
  return new TextDecoder().decode(stdout).trim();
}

async function gitShortSha(): Promise<string> {
  try {
    return (await shellOut('git', ['rev-parse', '--short', 'HEAD'])) || 'no-git';
  } catch {
    return 'no-git';
  }
}

async function promptFileHash(): Promise<string> {
  try {
    const text = await Deno.readTextFile(PROMPT_FILE_PATH);
    const buf  = new TextEncoder().encode(text);
    const hash = await crypto.subtle.digest('SHA-256', buf);
    const hex  = Array.from(new Uint8Array(hash))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
    return hex.slice(0, 8);
  } catch {
    return 'unknown';
  }
}

function stripJsonFences(text: string): string {
  let t = text.trim();
  if (t.startsWith('```')) {
    t = t.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim();
  }
  return t;
}

async function callAnthropic(prompt: string): Promise<string> {
  if (!ANTHROPIC_API_KEY) {
    throw new Error('ANTHROPIC_API_KEY env var is required to run the eval.');
  }

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type':      'application/json',
      'x-api-key':         ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model:      ANTHROPIC_MODEL,
      max_tokens: 2048,
      system:     'You are Sturdy — a warm, knowing parent friend. You answer parenting questions in your own voice. Return strict JSON only. No markdown. No explanation. No preamble.',
      messages:   [{ role: 'user', content: prompt }],
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Anthropic ${res.status}: ${body}`);
  }

  const payload = await res.json();
  const content = payload?.content?.[0]?.text;
  if (typeof content !== 'string') {
    throw new Error('No text content in Anthropic response.');
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(stripJsonFences(content));
  } catch {
    throw new Error('Anthropic returned non-JSON content:\n' + content.slice(0, 500));
  }

  const response = (parsed as { response?: unknown }).response;
  if (typeof response !== 'string' || response.trim().length === 0) {
    throw new Error('Anthropic response missing non-empty `response` field.');
  }
  return response;
}

// ─────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────

async function main(): Promise<void> {
  if (!ANTHROPIC_API_KEY) {
    console.error('Missing ANTHROPIC_API_KEY env var.');
    console.error('Re-run with: ANTHROPIC_API_KEY=sk-ant-... npm run eval:question');
    Deno.exit(1);
  }

  const raw    = await Deno.readTextFile(INPUTS_PATH);
  const inputs = JSON.parse(raw) as EvalInput[];

  const date     = isoDate();
  const sha      = await gitShortSha();
  const fileHash = await promptFileHash();

  await Deno.mkdir(OUTPUT_DIR, { recursive: true });
  const outFile = `${OUTPUT_DIR}/${date}_${sha}.md`;

  const sections: string[] = [];
  sections.push(`# Question Mode Eval — ${date}`);
  sections.push(`Commit: ${sha}`);
  sections.push(`Prompt file hash: ${fileHash}`);
  sections.push('');
  sections.push('---');
  sections.push('');

  let n = 0;
  for (const entry of inputs) {
    n++;
    const prompt = buildQuestionPrompt(entry.input);
    let response: string;
    try {
      response = await callAnthropic(prompt);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      response = `(eval error: ${msg})`;
    }

    sections.push(`## Q${n} — ${entry.id}`);
    sections.push(`**Classification expected:** ${entry.classification}  `);
    const previewMsg = entry.input.message.length > 120
      ? entry.input.message.slice(0, 117) + '...'
      : entry.input.message;
    sections.push(`**Input:** "${previewMsg}"`);
    sections.push('');
    sections.push('**Output:**');
    sections.push('');
    sections.push(response);
    sections.push('');
    sections.push('---');
    sections.push('');
  }

  const md = sections.join('\n');
  await Deno.writeTextFile(outFile, md);
  console.log(`Wrote eval to ${outFile}`);
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  Deno.exit(1);
});
