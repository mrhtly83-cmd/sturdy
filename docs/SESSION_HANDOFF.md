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

---

# DOCUMENTATION MODEL (designed 2026-05-30, migration NOT yet executed)

This is a complete, agreed model for how Sturdy's documentation works going forward.
It was designed but not yet applied. The migration steps below are the next major
body of work. Execute it with fresh, focused attention — it touches the documents
nearest the heart of the product.

## The problem this solves

Docs went stale because truth migrated into code (especially file-header comments)
while documents drifted. Thai's changes cluster heavily in **visual design / theme**;
the **AI prompt / voice layer is deliberately stable and rarely touched**. The model
must therefore be rigorous where change is rare and consequential, and light where
change is frequent and exploratory.

## Governing principle

Each fact has exactly ONE authoritative home, chosen by the nature of the fact:
- **Mechanism** lives in code (file headers + the tokens file).
- **Intent, constraint, history, scope** live in documents.
- Nothing is described authoritatively in two places. When a document would compete
  with code, the document yields and instead POINTS to the code.

## The governance core (highest protection — the two documents everything descends from)

- `docs/PRODUCT_PRINCIPLES.md` — the locked principles (constraints the code obeys).
- `docs/SCRIPT QUALITY STANDARDS.md` — **THE SOURCE OF THE PRODUCT.** Thai has stated
  this document is the distillation of his personal thinking about how a parent should
  speak to a child, and it is what makes the app. It is ELEVATED to the governance core,
  not the contract tier. It is locked: it changes only through a deliberate, logged
  OPERATIONS.md decision, with the same gravity as amending a principle. The SOS eval
  harness exists specifically to defend this document against silent erosion, and must
  be run before any prompt-layer change that could affect voice.

## The four tiers

1. **Governance** (authoritative, actively maintained, never duplicated in code):
   PRODUCT_PRINCIPLES.md, SCRIPT QUALITY STANDARDS.md (elevated — see above),
   OPERATIONS.md, V1_FREEZE.md, SESSION_END_CHECKLIST.md.
2. **Contract** (authoritative, changes rarely): the 4 legal docs, QUESTION_MODE_QUALITY_STANDARDS.md.
3. **Navigation** (points, does not describe): CLAUDE.md, reconceived as a map (see below).
4. **Archive** (`docs/archive/` — preserved, not maintained, understood as historical):
   completed smoke test, strategy notes, harvested Master Blueprint.

## The two zones (asymmetric rigor)

- **Stable governed core (AI / backend):** prompt builders, safety filter, validators,
  Edge Function, quality standards. Full five-field headers + rigorous decision logging.
  Changed only deliberately. This is the moat.
- **Visual / theme layer:** frequent, exploratory iteration. Authoritative truth = the
  code, especially `src/theme/colors.ts` (the tokens file). Documents describe only the
  ENDURING INTENT (e.g. the purpose-coding rule: urgent/tactile tools = coral/amber;
  insight/growth = cooler gold), never the current pixels. Lighter header (purpose +
  intent reference only). Routine visual iteration is NOT logged; only a SYSTEM-level
  design decision (a new purpose-coding rule, a palette philosophy shift) earns an
  OPERATIONS.md entry. Rule of thumb: log at the level of principle, never of pixels.

## The five-field header format (for stable-core files owning meaningful mechanism)

A file earns a full header if CLAUDE.md's truth map would ever point to it. Trivial
helpers need only a purpose line.

```
/**
 * <FILE PURPOSE — one sentence: what this file is and does.>
 *
 * OWNS: <What this file is the authoritative source of truth for. This is what
 *        CLAUDE.md's navigation tier points to.>
 *
 * KEY BEHAVIOUR: <Non-obvious mechanics — sequence, gotchas, why something is done
 *                 a particular way. Omit anything obvious from reading the code.>
 *
 * DEPENDS ON / DRIFTS WITH: <Cross-file couplings NOT enforced by the compiler that
 *                            break silently if one side changes. e.g. validateResponse.ts
 *                            <-> api.ts guards.>
 *
 * CONSTRAINTS: <Any Product Principle, legal rule, or safety rule this file must honour.
 *               Reference the governing doc by name.>
 */
```

## The divergence-logging rule (addresses the deepest staleness cause)

Thai sometimes conceives something different/unique mid-build and implements it,
which orphans the documented plan. The fix: a divergence from a documented plan is a
DECISION. At the moment of deciding (not at feature-end), log one line in OPERATIONS.md
(context → decision → reasoning) and correct whatever document asserted the old plan.
Trigger is the moment of INVENTION, not of finishing — that is where the energy is.
Applied ASYMMETRICALLY: always in the stable core; in the visual layer only when the
divergence changes the SYSTEM, never for routine iteration. Note: these divergences are
often Thai's BEST product decisions — the log becomes a record of product judgment, not
mere hygiene.

## CLAUDE.md navigation structure (five sections — points, never describes)

1. **Orientation** — what Sturdy is + top-level repo layout. (May describe; stable.)
2. **Truth map** — a table: each domain → its single authoritative home (a file header,
   the tokens file, or a governance doc). ENTRIES ARE POINTERS, NEVER SUMMARIES. This is
   the heart of the navigation tier and the structural cure for drift. Carry a note to
   its maintainer: an entry names a domain and its location, nothing more.
3. **Two-zone section** — states which parts are stable-core (full headers + logging)
   vs visual layer (code-as-truth + system-only logging).
4. **Constraints index** — the locked principles + non-negotiables, each pointing to its
   governing doc and where in code it is honoured.
5. **Operational guidance** — common commands, branch/commit conventions, pointer to
   SESSION_END_CHECKLIST.

## SESSION_END_CHECKLIST amendment (the model's enforcement)

Add three closing checks:
- File headers were updated alongside code changes.
- Any divergence from a documented plan was logged AND the stale document corrected.
- No document was made to duplicate mechanism that belongs in a header.
- (Plus the two-zone rule: visual iteration needs no log; system-level design shifts do.)
- (Consider: a line to refresh SESSION_HANDOFF.md before closing.)

## THE MIGRATION — seven steps, execute in order (harvest before any deletion)

1. **Harvest into PRODUCT_PRINCIPLES.md, then archive the Blueprint.** The durable vision
   is ALREADY in PRODUCT_PRINCIPLES.md ("the bridge from chaos to connection"). Only TWO
   fragments from STURDY_MASTER_BLUEPRINT.md still need harvesting: (a) the
   emergency-tool → daily-thinking-partner shift (one sentence into "What Sturdy is"),
   and (b) the dual standard at the Blueprint's close (hard-moment feel + calm-evening
   feel). Everything else in the Blueprint is either already held better in the principles
   or is mechanical narration the code now owns (navigation, modes, AI config, design
   values, schema) — do NOT harvest those. Then move the Blueprint to docs/archive/.
2. **Reconceive CLAUDE.md** into the five-section navigation structure above. Remove the
   mechanical narration the code now owns; build the truth map and constraints index.
3. **Hierarchy for planning docs:** make STURDY_V1_LAUNCH_PLAN_v2.md authoritative for
   launch scope; reduce ROADMAP.md to post-launch (V2+) horizons only so it stops
   competing with the launch plan.
4. **Date-stamp FEATURE_INVENTORY.md** clearly as a point-in-time snapshot, not a living
   reference.
5. **Create docs/archive/** and move into it: SMOKE_TEST_account_lifecycle.md (feature
   shipped), STURDY_STRATEGY_notes.md (captured session — but FIRST confirm its core
   conclusions about voice-as-moat and stay-solo are preserved in a maintained location),
   and the harvested Master Blueprint.
6. **Amend SESSION_END_CHECKLIST.md** with the three closing checks above.
7. **Apply the five-field header** to load-bearing stable-core files (Edge Function,
   prompt builders, validators, safety filter, subscription hook, context providers).
   Largest mechanical task; gives the truth map its targets. Example header for the Edge
   Function was drafted in the design session — reconstruct from the format above.

## Caution carried forward

The model's principal risk: headers and the divergence log depend on being maintained
under time pressure, the same discipline that let docs drift before. The model is more
robust because it removes the COMPETING system (docs no longer describe mechanism), but
it is not self-enforcing without the checklist amendment. The checklist change (step 6)
is therefore not optional housekeeping — it is what holds the model together.
