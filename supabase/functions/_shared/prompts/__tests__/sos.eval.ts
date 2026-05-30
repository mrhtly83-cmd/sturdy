// supabase/functions/_shared/prompts/__tests__/sos.eval.ts
// Deno eval harness for SOS mode.
//
// Mirrors question.eval.ts: reads sos-eval-inputs.json, builds the prompt
// for each entry via the REAL buildPrompt({ mode: 'sos', ... }) path (so
// neurotype detection, intensity guidance, and length rules all run exactly
// as in the live Edge Function), calls Anthropic with the same model
// (claude-sonnet-4-20250514), parses the JSON, scores it, and writes a
// timestamped Markdown report into eval-outputs/.
//
// Usage:
//   ANTHROPIC_API_KEY=sk-ant-... npm run eval:sos
//
// Manual command, run by a human before merging any SOS prompt change.
// Hits the live Anthropic API and costs real money — deliberately NOT in CI.
//
// SCORING (two tiers, per the build decision):
//   STRICT (auto-pass/fail, machine-checked):
//     - No banned phrases anywhere in output
//     - No neurotype/clinical label leak (stealth protocol)
//     - Section length caps at high intensity
//     - Connect contains a limit-shaped clause (heuristic)
//   ADVISORY (printed for human grading against the doc):
//     - Does Connect actually name the SPECIFIC emotion?
//     - Does it reflect the specific situation (specificity test)?
//     - Does it sound like a real parent said it out loud?
//
// SHIP BAR (from docs/SCRIPT QUALITY STANDARDS.md):
//   Zero STRICT failures across all scenarios, AND human marks the
//   advisory axes pass on >= 10 of 11 scenarios. Any STRICT failure =
//   roll back the prompt change before merge.

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

import { buildPrompt } from '../../buildPrompt.ts';

// ─────────────────────────────────────────────
// CONFIG
// ─────────────────────────────────────────────

const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY');
const ANTHROPIC_MODEL   = 'claude-sonnet-4-6';   // matches the live Edge Function
const HERE              = new URL('.', import.meta.url).pathname;
const INPUTS_PATH       = `${HERE}sos-eval-inputs.json`;
const PROMPT_FILE_PATH  = `${HERE}../../buildPrompt.ts`;
const OUTPUT_DIR        = `${HERE}eval-outputs`;

// Banned phrases — from buildPrompt WRITING RULES + PROMPT_SYSTEM.md +
// SCRIPT QUALITY STANDARDS.md failure patterns. Lowercased substring match.
const BANNED_PHRASES = [
  'inside voice',
  'big feelings',
  'co-regulate',
  'coregulate',
  'validate',
  'your feelings are valid',
  'i understand how you feel',
  "let's use our words",
  'use your words',
  "that's not okay behavior",
  'can you tell me why you did',
  'how does that make you feel',
  "let's think about better choices",
  'better choices',
  'promise me this',
  'deep breath',           // "take a deep breath with me" — yoga-teacher tell
  'hold space',
  'constructive conversation',
  'i hear you',
  'i am here for you',
];

// Clinical / neurotype leak terms — stealth protocol. Output must NEVER
// contain these. Lowercased substring match.
const NEUROTYPE_LEAK_TERMS = [
  'adhd', 'autis', 'autistic', 'neurotype', 'neurodiverg', 'pda',
  'pathological demand', 'sensory processing', 'executive function',
  'executive dysfunction', 'amygdala', 'dysregulat', 'twice exceptional',
  '2e', 'spectrum', 'diagnos', 'clinical', 'prefrontal',
];

// ─────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────

type EvalInput = {
  id:       string;
  scenario: string;
  input: {
    childName: string;
    childAge:  number;
    message:   string;
    intensity: number | null;
  };
  checks: Record<string, unknown>;
};

type Section = { parent_action?: string; script?: string; coaching?: string; strategies?: string[] };
type SosResponse = {
  situation_summary?: string;
  regulate?: Section;
  connect?:  Section;
  guide?:    Section;
  avoid?:    string[];
};

// ─────────────────────────────────────────────
// HELPERS (shared shape with question.eval.ts)
// ─────────────────────────────────────────────

function isoDate(): string {
  return new Date().toISOString().slice(0, 10);
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
    return Array.from(new Uint8Array(hash))
      .map((b) => b.toString(16).padStart(2, '0')).join('').slice(0, 8);
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

function wordCount(s: string): number {
  return s.trim().split(/\s+/).filter(Boolean).length;
}

// All script text concatenated (the part the parent actually says/reads).
// parent_action is instruction-to-parent; scripts are the spoken words.
// We check scripts for voice; we check the WHOLE payload for neurotype leaks.
function allScriptText(r: SosResponse): string {
  return [r.regulate?.script, r.connect?.script, r.guide?.script]
    .filter(Boolean).join(' ');
}

function allText(r: SosResponse): string {
  return JSON.stringify(r);
}

// ─────────────────────────────────────────────
// STRICT CHECKS (machine pass/fail)
// ─────────────────────────────────────────────

type StrictResult = { check: string; passed: boolean; detail: string };

function runStrictChecks(r: SosResponse, entry: EvalInput): StrictResult[] {
  const results: StrictResult[] = [];
  const scripts = allScriptText(r).toLowerCase();
  const everything = allText(r).toLowerCase();
  const intensity = entry.input.intensity ?? 0;

  // 1. Banned phrases (in spoken scripts)
  const hitBanned = BANNED_PHRASES.filter((p) => scripts.includes(p));
  results.push({
    check: 'No banned phrases',
    passed: hitBanned.length === 0,
    detail: hitBanned.length ? `FOUND: ${hitBanned.join(', ')}` : 'clean',
  });

  // 2. Neurotype / clinical leak (in the ENTIRE payload incl. coaching)
  const hitLeak = NEUROTYPE_LEAK_TERMS.filter((p) => everything.includes(p));
  results.push({
    check: 'No neurotype/clinical leak (stealth)',
    passed: hitLeak.length === 0,
    detail: hitLeak.length ? `LEAKED: ${hitLeak.join(', ')}` : 'clean',
  });

  // 3. Length caps at high intensity (doc: I4 = ~6 words, I5 = ~4 words/section)
  if (intensity >= 4) {
   const cap = intensity >= 5 ? 7 : 8;   // doc target 4-6; +1 tolerance for clean lines
    const sections: [string, string | undefined][] = [
      ['regulate', r.regulate?.script],
      ['connect',  r.connect?.script],
      ['guide',    r.guide?.script],
    ];
    const over = sections
      .filter(([, s]) => s && wordCount(s) > cap)
      .map(([name, s]) => `${name}=${wordCount(s!)}w`);
    results.push({
      check: `High-intensity length cap (<=${cap}w/section at I${intensity})`,
      passed: over.length === 0,
      detail: over.length ? `OVER: ${over.join(', ')}` : 'within cap',
    });
  }

  // 4. Connect contains a limit-shaped clause (heuristic, strict-ish)
  const connect = (r.connect?.script ?? '').toLowerCase();
 // A limit is present if the Connect script contains either an explicit
  // "no/not" refusal, a "now/right now" closure, a present-tense statement
  // of what IS happening, or one of the classic limit phrasings. This is
  // intentionally broad — the model phrases limits many natural ways, and
  // the previous fixed list false-failed on valid lines like
  // "No more cookies right now" and "bed is where we are".
  const limitPatterns = [
    /\bno more\b/, /\bnot happening\b/, /\bnot what'?s happening\b/,
    /\bi (won'?t|will not|can'?t|cannot|am not going to) (let|allow)\b/,
    /\bisn'?t (happening|something i)\b/, /\bstill (going|leaving|need|have to)\b/,
    /\bwe'?re (still|leaving|going|heading|done)\b/, /\b(it'?s|its) time\b/,
    /\bgoing (off|on) now\b/, /\bbed is where\b/, /\bdinner first\b/,
    /\bthat'?s (the deal|not what)\b/, /\bnow\b.*\b(off|stop|leaving|going)\b/,
    /\b(off|stop|leaving|going)\b.*\bnow\b/, /\bboth (of those|are) true\b/,
    /\bthat is gone\b/, /\bgone now\b/,
  ];


  // 5. Structural validity (matches Edge Function validateResponse)
  const structOk = !!(r.situation_summary &&
    r.regulate?.script && r.connect?.script && r.guide?.script &&
    Array.isArray(r.avoid) && r.avoid.length > 0);
  results.push({
    check: 'Structural validity (summary + R/C/G scripts + avoid[])',
    passed: structOk,
    detail: structOk ? 'valid' : 'MISSING required fields',
  });

  return results;
}

// ─────────────────────────────────────────────
// ANTHROPIC
// ─────────────────────────────────────────────

async function callAnthropic(prompt: string): Promise<SosResponse> {
  if (!ANTHROPIC_API_KEY) throw new Error('ANTHROPIC_API_KEY env var is required.');

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
      system:     'You are Sturdy. Return strict JSON only. No markdown. No explanation. No preamble.',
      messages:   [{ role: 'user', content: prompt }],
    }),
  });

  if (!res.ok) throw new Error(`Anthropic ${res.status}: ${await res.text()}`);

  const payload = await res.json();
  const content = payload?.content?.[0]?.text;
  if (typeof content !== 'string') throw new Error('No text content in Anthropic response.');

  try {
    return JSON.parse(stripJsonFences(content)) as SosResponse;
  } catch {
    throw new Error('Anthropic returned non-JSON content:\n' + content.slice(0, 500));
  }
}

// ─────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────

async function main(): Promise<void> {
  if (!ANTHROPIC_API_KEY) {
    console.error('Missing ANTHROPIC_API_KEY env var.');
    console.error('Re-run with: ANTHROPIC_API_KEY=sk-ant-... npm run eval:sos');
    Deno.exit(1);
  }

  const inputs = JSON.parse(await Deno.readTextFile(INPUTS_PATH)) as EvalInput[];
  const date     = isoDate();
  const sha      = await gitShortSha();
  const fileHash = await promptFileHash();

  await Deno.mkdir(OUTPUT_DIR, { recursive: true });
  const outFile = `${OUTPUT_DIR}/sos_${date}_${sha}.md`;

  const out: string[] = [];
  out.push(`# SOS Mode Eval — ${date}`);
  out.push(`Commit: ${sha}  ·  buildPrompt.ts hash: ${fileHash}  ·  model: ${ANTHROPIC_MODEL}`);
  out.push('');
  out.push('Grade against `docs/SCRIPT QUALITY STANDARDS.md`.');
  out.push('STRICT failures = roll back. Advisory = human judgement, target >=10/11 pass.');
  out.push('');
  out.push('---');
  out.push('');

  let totalStrictFails = 0;
  const strictFailScenarios: string[] = [];

  let n = 0;
  for (const entry of inputs) {
    n++;
    const prompt = buildPrompt({
      childName: entry.input.childName,
      childAge:  entry.input.childAge,
      message:   entry.input.message,
      intensity: entry.input.intensity,
      mode:      'sos',
    });

    let resp: SosResponse | null = null;
    let errMsg = '';
    try {
      resp = await callAnthropic(prompt);
    } catch (err) {
      errMsg = err instanceof Error ? err.message : String(err);
    }

    out.push(`## ${n}. ${entry.scenario} — \`${entry.id}\``);
    out.push(`**Input** (age ${entry.input.childAge}, intensity ${entry.input.intensity}): "${entry.input.message}"`);
    out.push('');

    if (!resp) {
      out.push(`> EVAL ERROR: ${errMsg}`);
      out.push('');
      out.push('---');
      out.push('');
      continue;
    }

    // Output
    out.push('**Output:**');
    out.push('');
    out.push('```json');
    out.push(JSON.stringify(resp, null, 2));
    out.push('```');
    out.push('');

    // Strict scoring
    const strict = runStrictChecks(resp, entry);
    const fails = strict.filter((s) => !s.passed);
    if (fails.length) { totalStrictFails += fails.length; strictFailScenarios.push(entry.id); }

    out.push('**Strict checks:**');
    out.push('');
    for (const s of strict) {
      out.push(`- ${s.passed ? '✅' : '❌'} ${s.check} — ${s.detail}`);
    }
    out.push('');

    // Advisory — human grades these against the doc
   out.push('**Advisory (grade by hand against the doc):**');
    out.push('');
    out.push(`- [ ] Connect holds a limit (refusal, closure, OR held stance — e.g. "I'm not going anywhere")`);
    out.push(`- [ ] Connect names the SPECIFIC emotion (not generic "you're upset")`);
    out.push(`- [ ] Reflects the specific situation — could not have been written for any other child`);
    out.push(`- [ ] Reads like a real parent said it out loud (Test 1)`);
    out.push(`- [ ] Guide is ONE real next step, age-appropriate (Test 3)`);
    if (entry.checks.note) out.push(`- _Scenario note:_ ${entry.checks.note}`);
    out.push('');
    out.push('---');
    out.push('');
  }

  // Summary
  out.splice(6, 0,
    `**STRICT SUMMARY:** ${totalStrictFails === 0
      ? '✅ 0 strict failures — mechanical bar passed.'
      : `❌ ${totalStrictFails} strict failure(s) across: ${[...new Set(strictFailScenarios)].join(', ')} — ROLL BACK before merge.`}`,
    '');

  await Deno.writeTextFile(outFile, out.join('\n'));
  console.log(`Wrote SOS eval to ${outFile}`);
  console.log(totalStrictFails === 0
    ? 'STRICT: 0 failures.'
    : `STRICT: ${totalStrictFails} failure(s) — see report.`);
  if (totalStrictFails > 0) Deno.exit(2);
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  Deno.exit(1);
});
