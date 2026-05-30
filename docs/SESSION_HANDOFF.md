# Session Handoff — Sturdy

**Last session date:** 2026-05-30
**Purpose:** Paste this into a new chat to resume exactly where the previous session ended.
**How to use:** Open a new conversation, attach or paste this file, and say "resume from this handoff."

---

## How to work with me on this project

I am acting as your Fractional CPO and Launch/ASO specialist for Sturdy. The operating contract:

- **Code is ground truth.** Verify against the shipped codebase, not the docs, which drift.
- **Ruthless prioritization.** Every feature must serve the core promise and earn its complexity now, or it goes to the V2 parking lot.
- **The 8 Product Principles are hard constraints**, not suggestions. Surface conflicts; do not quietly override.
- **Protect against scope creep.** This is a solo first project; "park it" and "ship what's real" are valid answers.
- **Honest pushback over agreeableness.** Tell me when I am wrong.
- **Log material decisions** in OPERATIONS.md (context → decision → reasoning).
- **For step-by-step technical instructions, go slow, one command at a time**, state what each command does and what output to expect, and do not assume prior command-line fluency. I work in a GitHub Codespace at `/workspaces/sturdy`, on a Chromebook, using Deno for Edge Function evals.

---

## Where the project stands

Sturdy is in fine-tuning for a V1 Google Play launch (target was June 15, treated as flexible — ship-right over ship-fast). A feature freeze is in effect, documented in `docs/V1_FREEZE.md`. The discovery of the freeze audit was that **the code is generally ahead of the docs**, so most remaining work is correcting docs to match shipped reality, not building features.

The ship gate is defined as: the SOS voice clears a measured bar (eval green), the freeze fix-list is closed, and ~10 real parents have used the app without a trust-breaking bug. The date moves to meet that, not a calendar.

---

## What was accomplished in the last session

1. **Built and calibrated an SOS evaluation harness** (`supabase/functions/_shared/prompts/__tests__/sos.eval.ts` + `sos-eval-inputs.json`), modelled on the existing Question-mode eval. Run with: `ANTHROPIC_API_KEY=<key> npm run eval:sos`. It is a manual, human-graded tool, not a CI gate. Strict tier (mechanical pass/fail): banned phrases, neurotype/clinical leak, high-intensity length cap, structural validity. Advisory tier (human judgment): limit-clause presence, specific-emotion naming, sounds-like-a-real-parent, one-step Guide.

2. **Discovered and fixed a retired model string.** `claude-sonnet-4-20250514` was deprecated and 404ing — meaning production SOS and Question paths were silently failing for parents. Corrected to `claude-sonnet-4-6` in the Edge Function and both eval harnesses, verified against a live API call.

3. **Added a one-retry resilience measure** to `generateScript` in `chat-parenting-assistant/index.ts`: structurally invalid model output (e.g. a dropped `avoid` field) now retries once before failing to the parent.

4. **Committed all of the above** plus an OPERATIONS.md entry (dated 2026-05-30), and a follow-up commit correcting CLAUDE.md (model ID + retry note).

---

## What the eval established about the SOS voice

Across four runs, the voice held to the Script Quality Standards: intensity contrast strong, situation specificity strong, neurotype stealth intact throughout. The eval surfaced two genuine, narrow findings on the hero path — both deferred to a prompt-refinement pass:

- **Occasional banned-phrase intrusion** — "I hear you" appeared in one Connect script.
- **Recurring high-intensity length drift** — the Connect line runs 1–2 words over the cap at intensity 4–5.

Neither undermines the voice; both are addressable in the prompt and now have measured evidence behind them.

---

## Next steps (the watch list — in recommended order)

1. **Prompt-refinement pass on `buildPrompt.ts` (SOS):** tighten the Connect line at higher intensities and reinforce the banned-phrase prohibition (especially "I hear you" and relational-reassurance phrasing). Verify by re-running the SOS eval and confirming the banned phrase is gone and length holds. This is the natural next step and the eval is already in place to grade it.
2. **Extend eval coverage** to the Reconnect, Understand, and Conversation modes, which remain unmeasured. Lower priority than the SOS prompt pass; arguably V2-quality work.
3. **Add error alerting to the Edge Function** so a future model deprecation or outage is caught by monitoring rather than by chance. Direct lesson from this session's silent outage.
4. **Composed-vs-spoken Connect tendency** (watch-list item from earlier): some Connect lines read elegantly but are a mouthful to say mid-moment. Same prompt pass as item 1 likely resolves it.

---

## Open environment notes

- Working in a GitHub Codespace; `.env` does not persist across Codespace rebuilds and is git-ignored by design. The eval reads the key inline from the command, so it does not need `.env`.
- The production Edge Function gets its key from Supabase secrets (`supabase secrets set ANTHROPIC_API_KEY=...`), a separate path from the eval. If billing or the live function is touched next, the `.env` rebuild (Supabase URL + anon key + Anthropic key) is still outstanding from this session and was deliberately deferred.
- Eval output reports land in `eval-outputs/` and are git-ignored — they are run artefacts, not source.

---

## Key reference files in the repo

- `docs/V1_FREEZE.md` — the active feature freeze and fix-list
- `docs/OPERATIONS.md` — decision log (newest entry: 2026-05-30, the model-string fix + eval)
- `docs/PRODUCT_PRINCIPLES.md` — the 8 locked principles
- `docs/SCRIPT QUALITY STANDARDS.md` — the SOS voice bar the eval grades against
- `docs/SESSION_END_CHECKLIST.md` — run before closing any session
- `CLAUDE.md` — repo architecture guide (corrected this session)
