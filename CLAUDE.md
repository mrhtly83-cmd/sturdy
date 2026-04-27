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
npm test                      # Jest (jest-expo preset)
```
TypeScript is strict (`tsconfig.json` extends `expo/tsconfig.base`). Type-check via `npx tsc --noEmit`.

Web (`apps/web/`):
```bash
npm install
npm run dev
npm run build
npm run lint
```

Supabase Edge Function (run from repo root):
```bash
npx supabase functions deploy chat-parenting-assistant
```
Local secrets live in `supabase/functions/.env` (see `.env.example`): `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `ANTHROPIC_API_KEY`. The `OPENAI_API_KEY` slot in the example is unused — the live model is Anthropic Claude.

Database migrations are plain SQL under `supabase/migrations/` (timestamped). Apply via the Supabase CLI; every migration must be transactional with a documented rollback (see Operations rules below).

CI: `.github/workflows/test.yml` runs Deno tests (Edge Function) and Jest tests (mobile) on every push and PR.

## Mobile app architecture

Routing is Expo Router with the file tree under `apps/mobile/app/`:
- `_layout.tsx` mounts `AuthProvider` → `ChildProfileProvider` → `<Stack>`. Loads Fraunces (4 weights) + DM Sans (4 weights). `AuthGate` routes:
  - signed in → `/(tabs)`
  - no session + onboarding-flag set in `AsyncStorage` (`@sturdy/onboarding-complete`) → `/auth/sign-in`
  - no session + first-time → `/welcome`
- `(tabs)/` is a 2-tab structure: `index.tsx` (Home / child selector + outcome cards) and `settings.tsx`. The legacy `(tabs)/child.tsx` and root `now.tsx` were removed in the Phase 1 architecture shift — do not reintroduce a single shared SOS screen.
- `welcome/index.tsx` is the **v12 native photo-identity welcome flow** (the shipped onboarding):
  - 5-page horizontal paged `ScrollView` (real swipe + page dots)
  - Page 0: splash — full-bleed `welcome-family.jpg` + "Sturdy" wordmark + tagline *"The bridge between chaos and calm."* Auto-advances to page 1 after 3s.
  - Pages 1–3: feature slides — full-bleed `welcome-horizon.jpg` + `BlurView` glass card anchored to bottom edge. Three slides cover: SOS scripts, Question mode, per-child personalization.
  - Page 4: final CTA — full-bleed `welcome-family.jpg` + `BlurView` card with "Get started" → `/child-setup`, "Try without account" → sets `sturdy_guest_seen_v1` in AsyncStorage and routes to `/(tabs)`, "Sign in" → `/auth/sign-in`.
  - **No trial flow, no live AI preview, no blurred-preview cards.** That earlier flow is replaced.
  - **Caveat:** the welcome dir still contains orphaned files from a prior funnel (`trial.tsx`, `trial-result.tsx`, `child-setup.tsx`, `signup.tsx`) and `welcome/_layout.tsx` still wraps the stack in `OnboardingProvider`. None of those are reachable from v12; they're vestigial.
- `child/[id].tsx` is the per-child hub. Reads `?mode=…` from the URL (one of `sos` / `reconnect` / `understand` / `conversation`) and adapts placeholder + CTA copy. SOS flows are scoped to a specific child here and route to `result.tsx`. `result.tsx` back-navigates to the originating child hub.
- `child-profile/[id].tsx` is the Your Child profile screen — triggers / what's helped / locked weekly insight + emerging patterns. Reachable from the child hub's profile-link card.
- `thought/[id].tsx` is the Question-mode result screen.
- `upgrade.tsx` is the Sturdy+ paywall.
- `crisis.tsx` is the safety-support screen reached when the Edge Function returns `response_type: "crisis"`.

State:
- `src/context/AuthContext.tsx` wraps Supabase auth; `src/context/ChildProfileContext.tsx` loads `child_profiles` for signed-in users and falls back to `AsyncStorage` (`sturdy_guest_child` key) for guests. Guest data migrates on sign-up.
- `src/context/OnboardingContext.tsx` exists but is **vestigial** — used by the orphaned welcome funnel files only.
- `src/lib/supabase.ts` reads `EXPO_PUBLIC_SUPABASE_URL` / `EXPO_PUBLIC_SUPABASE_ANON_KEY` and throws at import if missing.
- `src/lib/api.ts` is the only call-site to the Edge Function. Exposes `getParentingScript()` (SOS-style flows) and `getQuestionResponse()` (Question mode). A `crisis` `response_type` becomes a thrown `CrisisDetectedError` so callers can route to `/crisis`.
- `src/hooks/useSubscription.ts` is a **mock** subscription hook returning `{ isPremium: false, plan: 'free', purchase, restore }`. `purchase()` and `restore()` log a `[BILLING]` line. Single swap-point — replacing this file's body with the real RevenueCat client unlocks every gated feature automatically.
- `src/utils/onboarding.ts` — `hasCompletedOnboarding()` / `markOnboardingComplete()` / `resetOnboarding()` (dev-only) wrap `@sturdy/onboarding-complete`. v12 welcome uses a separate `sturdy_guest_seen_v1` key for the guest path.
- `src/utils/profileNudge.ts` — per-child script counter + "shown" flag. The result screen surfaces a one-time-per-child profile nudge after the 3rd script.
- `src/utils/tone.ts` — AsyncStorage-backed Sturdy+ tone preference (`soft` / `gentle` / `direct`). Default `gentle`.
- `src/utils/analytics.ts` — `track(event, props)` stub. Logs in `__DEV__`, no-op in prod until a tracking backend is wired.

Theme + fonts (v5 — partial, in transition):
- `src/theme/colors.ts` is the single source of truth for tokens. Defines `background: '#1A1614'` (warm dark) plus brand: `coral #FF5C75`, `amber #F79566`, `steel #5778A3`, `sage #8AA060`, `sos #E87461`. Backwards-compat aliases (`rose`, `base`, `subtle`, `raised`, `peach`, `blue`, `textSub`, `cardGlass*`) retained because many screens still reference them.
- **Reality check on backgrounds:** several screens deliberately override the theme's `background`:
  - `welcome/index.tsx` uses `welcome-family.jpg` and `welcome-horizon.jpg` photo backgrounds (asset path: `apps/mobile/assets/images/welcome/`).
  - `(tabs)/index.tsx` and `child/[id].tsx` also use `welcome-horizon.jpg` with `rgba(15,10,18,0.45 → 0.82)` LinearGradient overlays.
  - `upgrade.tsx` hardcodes a solid `#0e0a10` base (no photo) with the v3 dark identity tokens.
- **Brand colours in shipped use today:**
  - Primary CTA gradient: `#C8883A → #E8A855` (left-to-right amber). Used on `upgrade.tsx`. Settings upgrade chip: `#C8883A`.
  - Selected-state amber accent: `#D4944A` (active plan card border, settings upgrade label).
  - SOS / crisis: `#E87461` (and only there — coral is reserved for SOS).
  - Sage `#8DB89A` for success, checkmarks, and the savings badge on the paywall.
  - Steel `#A8C4E2` / `#5778A3` for trust accents (Question feature slide).
- Fonts loaded in `app/_layout.tsx` via `@expo-google-fonts/fraunces` + `@expo-google-fonts/dm-sans`:
  - Fraunces: `_600SemiBold`, `_600SemiBold_Italic`, `_700Bold`, `_700Bold_Italic`
  - DM Sans: `_400Regular`, `_500Medium`, `_600SemiBold`, `_700Bold`
  - `fonts.heading` / `fonts.script` → Fraunces; `fonts.body` / `fonts.label` / `fonts.subheading` → DM Sans. Components use the family-name string directly: `<Text style={{ fontFamily: fonts.body }}>`.
- `Card.tsx` (re-exported as `GlassCard`) is a glass-on-dark surface — `surface` fill, `border` border, no `borderTopWidth` (it creates a visible highlight line bug on dark surfaces). `Screen.tsx` wraps children in the warm-dark gradient.
- `PaywallSheet.tsx` is the reusable bottom-sheet shown when free users tap a Sturdy+ feature. Calls `useSubscription().purchase()` on the CTA.

## Edge Function pipeline

`supabase/functions/chat-parenting-assistant/index.ts` is the single endpoint for both SOS and Question modes. The pipeline is:

1. `validateInput()` (`_shared/requestHelpers.ts`) — parses the POST body. SOS requires `childName` + `childAge` (2–17); Question mode (`mode === 'question'`) doesn't. Also extracts `tone` (`soft` / `gentle` / `direct` only — anything else → null).
2. `runSafetyFilter()` (`_shared/safetyFilter.ts`) — keyword scan over 8 categories ordered by priority: medical emergency → suicidal parent → suicidal child → violence toward child → parent losing control → violence toward parent → child self-harm → abuse indicator. First match wins; non-safe results return a `{ response_type: "crisis", crisis_type, risk_level, policy_route }` 200 response and are logged to `safety_events`. Both SOS and question paths are gated.
3. Prompt assembly (`_shared/buildPrompt.ts`):
   - SOS / Reconnect / Understand / Conversation: composes age guidance, neurotype auto-detection (`detectNeurotype` — explicit labels first, then behavioural patterns), trigger category sections from `_shared/prompts/categories/`, the **tone block** from `_shared/prompts/tones/`, and global `COACHING_INSTRUCTIONS`. The "stealth protocol" is load-bearing: never surface neurotype labels or clinical terms in output.
   - Question mode: uses `_shared/prompts/question.ts` (`buildQuestionPrompt`).
4. Anthropic call — model is hardcoded to `claude-sonnet-4-20250514`. Strict-JSON system prompt; the response is unwrapped from optional ```json fences before `JSON.parse`.
5. Response validation — `validateResponse` (SOS) requires `situation_summary`, three `ScriptStep`s (`regulate`/`connect`/`guide`, each with `parent_action` + `script`; `coaching` and `strategies` optional), and a string `avoid[]`. `validateQuestionResponse` requires a non-empty `response` string. Invalid shapes throw, returning a 500 with `"Couldn't generate a script right now."` — do not leak Anthropic errors to clients.
6. Logging — `logUsageEvent` (quota), `logInteractionEvent` (child profile + classified trigger from `triggerClassifier.ts`), `logParentThought` (Question mode persists prompt+response and returns `thought_id`), `logSafetyEvent` (crisis paths). All log calls are fire-and-forget; failures are warned, not thrown.

When changing the response shape, update both `supabase/functions/_shared/validateResponse.ts` and the matching `isValidStep` / `isParentingScriptResponse` guards in `apps/mobile/src/lib/api.ts` — they are not generated and drift silently.

### Tone system (Sturdy+)

Mirrors the `categories/` prompt-pattern. Three options:

- `soft` → `_shared/prompts/tones/soft.ts` — extra gentle, validating, slower pacing
- `gentle` → no-op; canonical Sturdy voice; default for free users
- `direct` → `_shared/prompts/tones/direct.ts` — confident, action-first, no sugarcoating

`getToneBlock(tone)` in `_shared/prompts/tones/index.ts` returns the guidance string or `''` for `gentle` / null / unknown. Empty strings drop out of the prompt via `.filter(Boolean)`, so a default-tone request produces the exact same prompt as before this feature shipped. Wired end-to-end: mobile UI (`child/[id].tsx`) → AsyncStorage (`src/utils/tone.ts`) → API request body → `validateInput` → `buildPrompt` → tone block injected high in every mode prompt (SOS / Reconnect / Understand / Conversation / Follow-up).

## Sturdy+ pricing (locked)

Defined in `apps/mobile/app/upgrade.tsx`:

- **Monthly** — $9.99/month, 3-day free trial
- **Annual** — $69.99/year ($5.83/mo), 7-day free trial, "5 months free vs monthly"

Free tier (always free, never paywalled): unlimited SOS scripts, voice playback on SOS mode, Regulate → Connect → Guide structure. Crisis routing is always free per Master Blueprint.

Billing is **not yet wired** — `useSubscription` is a mock (`isPremium: false`). When real RevenueCat / StoreKit lands, swap that file's body and every gated feature unlocks: tone Soft/Direct chips, voice on non-SOS modes, weekly insight, full child-profile insights.

## Database

Schema lives entirely in `supabase/migrations/`. Core tables (RLS enabled on every one — verified in the April 2026 security pass): `profiles`, `child_profiles`, `conversations`, `messages`, `safety_events`, `usage_events`, plus `interaction_logs` and `parent_thoughts` written by the Edge Function. Notes:

- `child_profiles` historically used `age_band` (`'2-4' | '5-7' | '8-12'`); migration `20260327_002_add_child_age.sql` added an exact `child_age` integer (2–17) and backfilled. The product uses exact age — never reintroduce age bands in new code.
- `conversations` has an `enforce_conversation_child_ownership` trigger ensuring `child_profile_id.user_id = conversations.user_id`. Preserve this when adding new tables that reference `child_profiles`.
- `handle_new_user()` (auth trigger) auto-inserts a `profiles` row on signup.

## Conventions to follow

These rules come from the Operations log and are non-obvious:

- **Exact age, not age bands.** Prompts, validators, and UI all key off integer age.
- **Neurotype is invisible.** `buildPrompt.ts` detects ADHD/Autism/Anxiety/Sensory/PDA/2e silently. Output must never name the neurotype, use clinical jargon (`executive function`, `amygdala`, `dysregulation`), or reveal the detection happened.
- **Tone is a modulation, not a voice swap.** `soft` / `direct` blocks explicitly preserve every existing voice rule (banned phrases, age calibration, Connect = feeling + limit).
- **Script quality bar.** `docs/SCRIPT QUALITY STANDARDS.md` defines pass/fail. Prompt edits should be tested against the six scenarios listed there at intensity 1 vs 5, short vs long messages, and ADHD/Autism keyword variants.
- **Safety filter precedes Claude.** Don't add an LLM call before `runSafetyFilter`. Don't bypass it for the question path — questions can carry crisis content.
- **No paywalls on crisis.** The safety/crisis routes are always free. The voice player is also free for SOS mode (paywalled for the other 3 modes only).
- **Coral is for SOS only.** `#E87461` and the rose aliases are reserved for crisis / safety affordances. CTAs use the amber gradient (`#C8883A → #E8A855`); upgrade accents use `#D4944A`.
- **Operations log.** Material architecture or strategy decisions get a new entry appended to `docs/OPERATIONS.md` (newest at the bottom): context → decision → reasoning.
- **Build process rules** (post-Phase 1 retro): verify state before edits, one change at a time tested before the next, JSX always multi-line, extract multi-line handlers to named functions, delete files and clean up references in the same commit, prefer real device logs over theorising for async/routing bugs, migrations always transactional with rollback documented.

## Active branch

Default integration branch is `main`. Feature work goes on `claude/<topic>` branches and merges via squash PR (CI must be green: Deno + Jest jobs).
