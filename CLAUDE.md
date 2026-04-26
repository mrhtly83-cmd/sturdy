# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository layout

Sturdy is a small monorepo with three independent workspaces. There is no root build tool — each workspace installs and runs on its own.

- `apps/mobile/` — Expo / React Native app (the product). Uses Expo Router file-based routing under `app/`, shared code under `src/`.
- `apps/web/` — Next.js 16 marketing/landing site (`app/page.tsx`, components in `src/components/landing/`). Tailwind v4 via `@tailwindcss/postcss`.
- `supabase/` — Edge Functions (Deno) and SQL migrations. The mobile app talks to one function: `chat-parenting-assistant`.
- `docs/` — Product source-of-truth. `master/STURDY_MASTER_BLUEPRINT.md` is the canonical product spec; `OPERATIONS.md` is an append-only decision log; `ai/PROMPT_SYSTEM.md` and `SCRIPT QUALITY STANDARDS.md` define what good AI output looks like.

The root `package.json` only carries the `supabase` CLI as a devDependency — there are no root scripts.

## Common commands

Mobile (`apps/mobile/`):
```bash
npm install
npx expo start -c --tunnel    # README's standard dev command (clears cache, tunnel for device testing)
npm run ios | npm run android | npm run web
```
TypeScript is strict (`tsconfig.json` extends `expo/tsconfig.base`). There is no test runner or linter wired up in this workspace; type-check via `npx tsc --noEmit` if needed.

Web (`apps/web/`):
```bash
npm install
npm run dev          # next dev
npm run build
npm run lint         # eslint via eslint.config.mjs
```

Supabase Edge Function (run from repo root):
```bash
npx supabase functions deploy chat-parenting-assistant
```
Local secrets for the function live in `supabase/functions/.env` (see `.env.example`): `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `ANTHROPIC_API_KEY`. The function ignores `OPENAI_API_KEY` despite it appearing in the example — the live model is Anthropic Claude.

Database migrations are plain SQL under `supabase/migrations/` (timestamped). Apply via the Supabase CLI; every migration must be transactional with a documented rollback (see Operations rules below).

## Mobile app architecture

Routing is Expo Router with the file tree under `apps/mobile/app/`:
- `_layout.tsx` mounts `AuthProvider` → `ChildProfileProvider` → `<Stack>`. `AuthGate` routes:
  - signed in → `/(tabs)`
  - no session + onboarding-flag set in `AsyncStorage` (`@sturdy/onboarding-complete`) → `/auth/sign-in`
  - no session + first-time → `/welcome`
- `(tabs)/` is currently a 2-tab structure: `index.tsx` (Home / child selector) and `settings.tsx`. The legacy `(tabs)/child.tsx` and root `now.tsx` were removed in the Phase 1 architecture shift — do not reintroduce a single shared SOS screen.
- `welcome/` is the 5-screen onboarding stack. `_layout.tsx` mounts `OnboardingProvider` so trial input + result + child-setup data carry across screens. Screens: `index` (the moment) → `trial` → `trial-result` (regulate visible, connect/guide blurred via `expo-blur`) → `child-setup` → `signup`. The trial calls `getParentingScript` with no `userId` (no logging, no profile attachment) so it works without an account; crisis responses still route to `/crisis`. `signup` writes the optional child profile to `child_profiles` (with `preferences.challenges` jsonb), calls `markOnboardingComplete()`, and routes to `/(tabs)`.
- `child/[id].tsx` is the per-child hub. SOS flows are scoped to a specific child here, then route to `result.tsx`. `result.tsx` back-navigates to the originating child hub.
- `thought/[id].tsx` is the Question-mode result screen.
- `crisis.tsx` is the safety-support screen reached when the Edge Function returns `response_type: "crisis"`.

State:
- `src/context/AuthContext.tsx` wraps Supabase auth; `src/context/ChildProfileContext.tsx` loads `child_profiles` for signed-in users and falls back to `AsyncStorage` (`sturdy_guest_child` key) for guests. Guest data migrates on sign-up.
- `src/context/OnboardingContext.tsx` is scoped to the welcome stack only — holds trial input, AI result, and child-setup data so screens 1→5 carry forward without URL params.
- `src/lib/supabase.ts` reads `EXPO_PUBLIC_SUPABASE_URL` / `EXPO_PUBLIC_SUPABASE_ANON_KEY` and throws at import if missing.
- `src/lib/api.ts` is the only call-site to the Edge Function. It exposes `getParentingScript()` (SOS) and `getQuestionResponse()` (question mode), both POSTing to `/functions/v1/chat-parenting-assistant`. A `crisis` `response_type` is converted into a thrown `CrisisDetectedError` carrying `crisisType` and `riskLevel` so callers can route to `/crisis`.
- `src/utils/onboarding.ts` — `hasCompletedOnboarding()` / `markOnboardingComplete()` / `resetOnboarding()` (dev-only) wrap the AsyncStorage key.
- `src/utils/analytics.ts` — `track(event, props)` stub. Logs in `__DEV__`, no-op in prod until a tracking backend is wired.

Theme + fonts (v5 — locked):
- `src/theme/colors.ts` is the single source of truth. v5 "Logo-derived premium dark" — warm dark base (`#1A1614`, NOT pure black, NOT blue-black) over a `LinearGradient` from `gradientTop` → `gradientBottom`. Brand: coral `#FF5C75` (primary), amber `#F79566` (CTA / active tab), steel `#5778A3` (trust), sage `#8AA060` (success), sos `#E87461` (crisis). Glass surfaces (`surface`, `surfaceRaised`) at 4.5% / 7% white. Backwards-compat aliases (`rose`, `base`, `subtle`, `raised`, `coral`, `peach`, `blue`, `textSub`, `textSecondary`, `cardGlass*`, `cat*`) retained because 21 unmigrated screens still reference them — tracked in Issue #3.
- Fonts switched from Manrope-only to **Fraunces (serif) + DM Sans (sans)**. Loaded in `app/_layout.tsx`. `fonts.heading`/`script` → Fraunces; `fonts.body`/`label`/`subheading` → DM Sans. Components use the family name string directly: `<Text style={{ fontFamily: fonts.body }}>`.
- `Screen.tsx` wraps children in the warm-dark gradient. `Card.tsx` (re-exported as `GlassCard`) is a glass-on-dark surface — `surface` fill, `border` border, no `borderTopWidth` (it creates a visible highlight line bug on dark surfaces).

## Edge Function pipeline

`supabase/functions/chat-parenting-assistant/index.ts` is the single endpoint for both SOS and Question modes. The pipeline is:

1. `validateInput()` — SOS requires `childName` + `childAge` (2–17). Question mode (`mode === 'question'`) does not require child context (auto-detection is handled later).
2. `runSafetyFilter()` (`_shared/safetyFilter.ts`) — keyword scan over 8 categories ordered by priority: medical emergency → suicidal parent → suicidal child → violence toward child → parent losing control → violence toward parent → child self-harm → abuse indicator. First match wins; non-safe results return a `{ response_type: "crisis", crisis_type, risk_level, policy_route }` 200 response and are logged to `safety_events`. SOS currently runs the safety filter inside the SOS path; question mode runs it explicitly before prompt build. Keep both paths gated.
3. Prompt assembly:
   - SOS uses `_shared/buildPrompt.ts` which composes age-aware instructions, neurotype auto-detection (`detectNeurotype`, explicit labels first, then behavioural patterns), trigger category sections from `_shared/prompts/categories/`, and global `COACHING_INSTRUCTIONS`. The "stealth protocol" is load-bearing: never surface neurotype labels or clinical terms in output.
   - Question mode uses `_shared/prompts/question.ts` (`buildQuestionPrompt`).
4. Anthropic call — model is hardcoded to `claude-sonnet-4-20250514`. Strict-JSON system prompt; the response is unwrapped from optional ```json fences before `JSON.parse`.
5. Response validation — `validateResponse` (SOS) requires `situation_summary`, three `ScriptStep`s (`regulate`/`connect`/`guide`, each with `parent_action` + `script`; `coaching` and `strategies` optional), and a string `avoid[]`. `validateQuestionResponse` requires a non-empty `response` string. Invalid shapes throw, returning a 500 with `"Couldn't generate a script right now."` — do not leak Anthropic errors to clients.
6. Logging — `logUsageEvent` (quota), `logInteractionEvent` (child profile + classified trigger from `triggerClassifier.ts`), `logParentThought` (question mode persists prompt+response and returns `thought_id`), `logSafetyEvent` (crisis paths). All log calls are fire-and-forget; failures are warned, not thrown.

When changing the response shape, update both `supabase/functions/_shared/validateResponse.ts` and the matching `isValidStep` / `isValidResponse` guards in `apps/mobile/src/lib/api.ts` — they are not generated and drift silently.

## Database

Schema lives entirely in `supabase/migrations/`. Core tables (RLS enabled on every one — verified in the April 2026 security pass): `profiles`, `child_profiles`, `conversations`, `messages`, `safety_events`, `usage_events`, plus `interaction_logs` and `parent_thoughts` written by the Edge Function. Notes:

- `child_profiles` historically used `age_band` (`'2-4' | '5-7' | '8-12'`); migration `20260327_002_add_child_age.sql` added an exact `child_age` integer (2–17) and backfilled. The product uses exact age — never reintroduce age bands in new code.
- `conversations` has a `enforce_conversation_child_ownership` trigger ensuring `child_profile_id.user_id = conversations.user_id`. Preserve this when adding new tables that reference `child_profiles`.
- `handle_new_user()` (auth trigger) auto-inserts a `profiles` row on signup.

## Conventions to follow

These rules come from the Operations log and are non-obvious:

- **Exact age, not age bands.** Prompts, validators, and UI all key off integer age.
- **Neurotype is invisible.** `buildPrompt.ts` detects ADHD/Autism/Anxiety/Sensory/PDA/2e silently. Output must never name the neurotype, use clinical jargon (`executive function`, `amygdala`, `dysregulation`), or reveal the detection happened.
- **Script quality bar.** `docs/SCRIPT QUALITY STANDARDS.md` defines pass/fail. Prompt edits should be tested against the six scenarios listed there at intensity 1 vs 5, short vs long messages, and ADHD/Autism keyword variants.
- **Safety filter precedes Claude.** Don't add an LLM call before `runSafetyFilter`. Don't bypass it for the question path — questions can carry crisis content.
- **No paywalls on crisis.** Per the Master Blueprint, the safety/crisis routes are always free.
- **Operations log.** Material architecture or strategy decisions get a new entry appended to `docs/OPERATIONS.md` (newest at the bottom): context → decision → reasoning.
- **Build process rules** (post-Phase 1 retro): verify state before edits (cat/grep first), one change at a time tested before the next, JSX always multi-line, extract multi-line handlers to named functions, delete files and clean up references in the same commit, prefer real device logs over theorising for async/routing bugs, migrations always transactional with rollback documented.

## Active branch

The README declares `v3-ui` as the active branch but the repo also carries phase-2 question-mode work on `main` and feature branches like `claude/add-claude-documentation-fccG4`. Confirm the intended target before opening PRs.
