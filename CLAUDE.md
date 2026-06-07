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
- `_layout.tsx` mounts `AuthProvider` → `ChildProfileProvider` → `<Stack>`. Loads Fraunces (4 weights) + DM Sans (4 weights). Initializes RevenueCat SDK. `AuthGate` routes:
  - signed in → `/(tabs)`
  - no session + onboarding-flag set in `AsyncStorage` (`@sturdy/onboarding-complete`) → `/auth/sign-in`
  - no session + first-time → `/welcome`
- Auth screens: `auth/index.tsx` (sign-in/sign-up, unified with `?mode=` param), `auth/forgot-password.tsx` (email reset link + "check your inbox" confirm state), `auth/reset-password.tsx` (deep link handler for password reset). Confirm-email state shown after sign-up when Supabase requires email confirmation.
- `(tabs)/` is a 3-tab structure: `index.tsx` (Home — dashboard cards + Ask Sturdy input), `family.tsx` (Family — placeholder, planned for co-parent/sharing features), and `settings.tsx`. The legacy `(tabs)/child.tsx` and root `now.tsx` were removed in the Phase 1 architecture shift — do not reintroduce a single shared SOS screen.
- **Home screen (`(tabs)/index.tsx` v6 — "Golden Beam"):**
  - Warm brown gradient background with `golden-particles-bg.png` parallax image + 40 animated floating golden particles across 4 distribution zones
  - Greeting section + child avatar selector chips (horizontal scroll, amber glow on active, dashed "Add" button)
  - "Ask Sturdy anything…" pill input → Question mode via `getQuestionResponse()`
  - Three dashboard cards that auto-cycle together across children (crossfade animation, 5s auto-slide interval, swipeable left/right, amber indicator dots for 2+ children):
    - **Last Session** — most recent `interaction_logs` entry per child (keyed on `child_profile_id`), shows child name, color-coded mode badge, timestamp via `formatTimeAgo()`, situation summary, "View full script →" link
    - **Patterns** — top 3 trigger categories from `loadChildInsights()` (aggregates `interaction_logs.trigger_category` per child), colored horizontal bar chart (amber / sage / steel)
    - **Sturdy+** — locked weekly insight teaser (personalized quote if triggers exist), taps to `/upgrade`
  - All three cards show proper empty states when no data exists — no hardcoded fallback data
  - `src/lib/loadChildInsights.ts` — aggregates `interaction_logs` by `child_profile_id` to produce `topTriggers[]` (category + label + count, sorted desc, top 5) and `totalInteractions` count. Used by both home screen and child-profile screen.
  - Outcome mode cards removed from home — modes are accessed via child hub at `/child/[id]?mode=...`
- `welcome/index.tsx` is the **v12 native photo-identity welcome flow** (the shipped onboarding):
  - 5-page horizontal paged `ScrollView` (real swipe + page dots)
  - Page 0: splash — full-bleed `welcome-family.jpg` + "Sturdy" wordmark + tagline *"The bridge between chaos and calm."* Auto-advances to page 1 after 3s.
  - Pages 1–3: feature slides — full-bleed `welcome-horizon.jpg` + `BlurView` glass card anchored to bottom edge. Three slides cover: SOS scripts, Question mode, per-child personalization.
  - Page 4: final CTA — full-bleed `welcome-family.jpg` + `BlurView` card with "Get started" → `/child-setup`, "Try without account" → sets `sturdy_guest_seen_v1` in AsyncStorage and routes to `/(tabs)`, "Sign in" → `/auth/sign-in`.
  - **No trial flow, no live AI preview, no blurred-preview cards.** That earlier flow is replaced.
 - **Note:** `welcome/_layout.tsx` wraps the stack in `OnboardingProvider` which is vestigial from a prior funnel. The welcome dir only contains `_layout.tsx` and `index.tsx` — both active.
- `child/[id].tsx` is the per-child hub. Reads `?mode=…` from the URL (one of `sos` / `reconnect` / `understand` / `conversation`) and adapts placeholder + CTA copy. SOS flows are scoped to a specific child here and route to `result.tsx`. `result.tsx` back-navigates to the originating child hub.
- `child-profile/[id].tsx` is the Your Child profile screen — triggers / what's helped / locked weekly insight + emerging patterns. Reachable from the child hub's profile-link card.
- `thought/[id].tsx` is the Question-mode result screen.
- `upgrade.tsx` is the Sturdy+ paywall. V1 feature list: unlimited scripts, follow-up scripts, tone selector, saved library, voice on all modes. Weekly insights and patterns removed (not built).
- `crisis.tsx` is the safety-support screen reached when the Edge Function returns `response_type: "crisis"`.

State:
- `src/context/AuthContext.tsx` wraps Supabase auth; `src/context/ChildProfileContext.tsx` loads `child_profiles` for signed-in users and falls back to `AsyncStorage` (`sturdy_guest_child` key) for guests. Guest data migrates on sign-up.
- `src/context/OnboardingContext.tsx` exists but is **vestigial** — used by the orphaned welcome funnel files only.
- `src/lib/supabase.ts` reads `EXPO_PUBLIC_SUPABASE_URL` / `EXPO_PUBLIC_SUPABASE_ANON_KEY` and throws at import if missing.
- `src/lib/api.ts` is the only call-site to the Edge Function. Exposes `getParentingScript()` (SOS-style flows) and `getQuestionResponse()` (Question mode). A `crisis` `response_type` becomes a thrown `CrisisDetectedError` so callers can route to `/crisis`.
- `src/hooks/useSubscription.ts` — real RevenueCat SDK integration (`react-native-purchases`). `initRevenueCat()` in `_layout.tsx` calls `Purchases.configure()` at module load and `Purchases.logIn(session.user.id)` on auth. Checks `sturdy_plus` entitlement via `getCustomerInfo()`, exposes `purchase()` / `restore()` / `isPremium` / `plan`. **Not yet activated in production** — `EXPO_PUBLIC_REVENUECAT_API_KEY` is set to a test key; products not yet created in App Store Connect / Google Play. To activate: set production API key, create subscription products (`sturdy_monthly_999`, `sturdy_annual_6999`), map to RevenueCat `sturdy_plus` entitlement.
- `src/utils/onboarding.ts` — `hasCompletedOnboarding()` / `markOnboardingComplete()` / `resetOnboarding()` (dev-only) wrap `@sturdy/onboarding-complete`. v12 welcome uses a separate `sturdy_guest_seen_v1` key for the guest path.
- `src/utils/profileNudge.ts` — per-child script counter + "shown" flag. The result screen surfaces a one-time-per-child profile nudge after the 3rd script.
- `src/utils/tone.ts` — AsyncStorage-backed Sturdy+ tone preference (`soft` / `gentle` / `direct`). Default `gentle`.
- `src/utils/analytics.ts` — `track(event, props)` stub. Logs in `__DEV__`, no-op in prod until a tracking backend is wired.

Theme + fonts (v9 — Deep Ember):
- `src/theme/colors.ts` is the single source of truth for tokens. Defines `background: '#261408'` (warm ember base) plus brand: `coral #FF5C75`, `amber #F79566`, `steel #5778A3`, `sage #8AA060`, `sos #D4705A`. Backwards-compat aliases (`rose`, `base`, `subtle`, `raised`, `peach`, `blue`, `textSub`, `cardGlass*`) retained because many screens still reference them.
- **Reality check on backgrounds:** several screens deliberately override the theme's `background`:
  - `welcome/index.tsx` uses `welcome-family.jpg` and `welcome-horizon.jpg` photo backgrounds (asset path: `apps/mobile/assets/images/welcome/`).
  - `(tabs)/index.tsx` uses `golden-particles-bg.png` with parallax animation + an 8-stop hardcoded warm-ember gradient. Root background: `#1a1206`.
  - `child/[id].tsx` uses the same `golden-particles-bg.png` background.
  - `upgrade.tsx` hardcodes a solid `#0e0a10` base (no photo) with the v3 dark identity tokens.
- **Brand colours in shipped use today:**
  - Primary CTA gradient: `#C8883A → #E8A855` (left-to-right amber). Used on `upgrade.tsx`. Settings upgrade chip: `#C8883A`.
  - Selected-state amber accent: `#D4944A` (active plan card border, settings upgrade label).
  - SOS / crisis: `#D4705A` (and only there — coral is reserved for SOS).
  - Sage `#8DB89A` for success, checkmarks, and the savings badge on the paywall.
  - Steel `#A8C4E2` / `#5778A3` for trust accents (Question feature slide).
- Fonts loaded in `app/_layout.tsx` via `@expo-google-fonts/fraunces` + `@expo-google-fonts/dm-sans` + `@expo-google-fonts/cormorant-garamond` + `@expo-google-fonts/crimson-pro`:
  - Cormorant Garamond: `_300Light`, `_300Light_Italic`, `_400Regular`, `_400Regular_Italic` — headings, greetings, screen titles
  - Crimson Pro: `_300Light`, `_300Light_Italic`, `_400Regular` — editorial italic detail (placeholder text, subtitles)
  - Fraunces: `_600SemiBold`, `_600SemiBold_Italic`, `_700Bold`, `_700Bold_Italic` — AI script text the parent reads aloud only
  - DM Sans: `_400Regular`, `_500Medium`, `_600SemiBold`, `_700Bold` — UI body, labels, subheadings
  - `fonts.heading` → Cormorant Garamond Regular; `fonts.serif` → Crimson Pro Light Italic; `fonts.script`/`scriptMedium` → Fraunces; `fonts.body` / `fonts.label` / `fonts.subheading` → DM Sans. Components use the family-name string directly: `<Text style={{ fontFamily: fonts.body }}>`.
- `Card.tsx` (re-exported as `GlassCard`) is a glass-on-dark surface — `surface` fill, `border` border, no `borderTopWidth` (it creates a visible highlight line bug on dark surfaces). `Screen.tsx` wraps children in the warm-dark gradient.
- `PaywallSheet.tsx` is the reusable bottom-sheet shown when free users tap a Sturdy+ feature. Calls `useSubscription().purchase()` on the CTA.

## Edge Function pipeline

`supabase/functions/chat-parenting-assistant/index.ts` is the single endpoint for both SOS and Question modes. The pipeline is:

1. `validateInput()` (`_shared/requestHelpers.ts`) — parses the POST body. SOS requires `childName` + `childAge` (2–17); Question mode (`mode === 'question'`) doesn't. Also extracts `tone` (`soft` / `gentle` / `direct` only — anything else → null).
2. `runSafetyFilter()` (`_shared/safetyFilter.ts`) — keyword scan over 8 categories ordered by priority: medical emergency → suicidal parent → suicidal child → violence toward child → parent losing control → violence toward parent → child self-harm → abuse indicator. First match wins; non-safe results return a `{ response_type: "crisis", crisis_type, risk_level, policy_route }` 200 response and are logged to `safety_events`. Both SOS and question paths are gated.
3. Prompt assembly (`_shared/buildPrompt.ts`):
   - SOS / Reconnect / Understand / Conversation: composes age guidance, neurotype auto-detection (`detectNeurotype` — explicit labels first, then behavioural patterns), trigger category sections from `_shared/prompts/categories/`, the **tone block** from `_shared/prompts/tones/`, and global `COACHING_INSTRUCTIONS`. The "stealth protocol" is load-bearing: never surface neurotype labels or clinical terms in output.
   - Question mode: uses `_shared/prompts/question.ts` (`buildQuestionPrompt`).
4. Anthropic call — model is hardcoded to `claude-sonnet-4-6`. Strict-JSON system prompt; the response is unwrapped from optional ```json fences before `JSON.parse`. `generateScript` (SOS/directed modes) retries the call once if the response is structurally invalid (malformed JSON or a failed `validateResponse` shape check, e.g. a dropped `avoid` field) before failing to the parent; non-OK HTTP responses fail fast and are not retried. `generateQuestionResponse` does not yet retry.
Note: the model identifier is a dateless ID (`claude-{name}-{major}-{minor}`) and will eventually be deprecated. If the Edge Function begins returning the generic failure message across all requests, verify the model ID against current Anthropic docs before investigating further — a retired model returns a 404 and was the cause of a silent SOS outage in May 2026.
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

Free tier (always free, never paywalled): unlimited SOS scripts (excluded from quota by `check_monthly_quota` RPC), Question mode, crisis support. 50/month quota applies to Reconnect, Understand, and Conversation modes only. Crisis routing is always free per Master Blueprint.

Billing is **not yet wired** — `useSubscription` calls the RevenueCat SDK but `EXPO_PUBLIC_REVENUECAT_API_KEY` is not set, so RevenueCat never initializes and `isPremium` is always `false`. All Sturdy+ gates are effectively open-but-blocked. To activate: set the API key, create products in App Store Connect / Google Play, and configure the `sturdy_plus` entitlement in the RevenueCat dashboard.

## Database

Schema lives across `supabase/migrations/` and historical SQL Editor changes. As of April 2026, the public schema contains 14 tables. RLS is enabled on every table with user-scoped data.

**Core user-scoped tables** (FK to `auth.users(id)` with appropriate cascade behaviour after migration `20260428_004`):
- `profiles` — authenticated parent accounts (`id` = `auth.users.id`, CASCADE)
- `child_profiles` — child context (CASCADE on user delete)
- `conversations` — hard moment threads (CASCADE)
- `interaction_logs` — script generation logs (CASCADE)
- `parent_thoughts` — Question mode entries (CASCADE)
- `saved_scripts` — user-saved scripts (CASCADE)
- `script_feedback` — outcome feedback (CASCADE)
- `subscriptions` — billing records (CASCADE; currently dormant — RevenueCat not yet activated)
- `usage_events` — usage tracking (CASCADE)
- `user_preferences` — settings, tone, notifications (CASCADE)
- `safety_events` — risk-flagged events (CASCADE — no anonymized retention per updated Principle 8)

**Child-scoped tables** (FK to `child_profiles`, no direct FK to `auth.users`):
- `messages` — conversation turns
- `child_insights` — derived insights about children
- `incident_events` — incident-level patterns

**Anonymous tables** (no user FK):
- `trial_usage` — anonymous device-level trial tracking

Notes:
- `child_profiles` historically used `age_band` (`'2-4' | '5-7' | '8-12'`); migration `20260327_002_add_child_age.sql` added an exact `child_age` integer (2–17) and backfilled. The product uses exact age — never reintroduce age bands in new code.
- `conversations` has an `enforce_conversation_child_ownership` trigger ensuring `child_profile_id.user_id = conversations.user_id`. Preserve this when adding new tables that reference `child_profiles`.
- `handle_new_user()` (auth trigger) auto-inserts a `profiles` row on signup.
- When adding a new table with a `user_id` column, **always** include the FK constraint with explicit `ON DELETE` behaviour. Constraints added via SQL Editor without FKs broke the deletion cascade once already; this is now caught in PR review (see `20260428_004_add_user_id_foreign_keys.sql`).

## Conventions to follow

These rules come from the Operations log and are non-obvious:

- **Exact age, not age bands.** Prompts, validators, and UI all key off integer age.
- **Neurotype is invisible.** `buildPrompt.ts` detects ADHD/Autism/Anxiety/Sensory/PDA/2e silently. Output must never name the neurotype, use clinical jargon (`executive function`, `amygdala`, `dysregulation`), or reveal the detection happened.
- **Tone is a modulation, not a voice swap.** `soft` / `direct` blocks explicitly preserve every existing voice rule (banned phrases, age calibration, Connect = feeling + limit).
- **Script quality bar.** `docs/SCRIPT QUALITY STANDARDS.md` defines pass/fail. Prompt edits should be tested against the six scenarios listed there at intensity 1 vs 5, short vs long messages, and ADHD/Autism keyword variants.
- **Safety filter precedes Claude.** Don't add an LLM call before `runSafetyFilter`. Don't bypass it for the question path — questions can carry crisis content.
- **No paywalls on crisis.** The safety/crisis routes are always free. The voice player is also free for SOS mode (paywalled for the other 3 modes only).
- **SOS red is for SOS only.** `#D4705A` (v9, was `#E87461` in v8) and the rose aliases are reserved for crisis / safety affordances. CTAs use the amber gradient (`#C8883A → #E8A855`); upgrade accents use `#D4944A`.
- **Operations log.** Material architecture or strategy decisions get a new entry appended to `docs/OPERATIONS.md` (newest at the bottom): context → decision → reasoning.
- **Build process rules** (post-Phase 1 retro): verify state before edits, one change at a time tested before the next, JSX always multi-line, extract multi-line handlers to named functions, delete files and clean up references in the same commit, prefer real device logs over theorising for async/routing bugs, migrations always transactional with rollback documented.
- **Schema FKs are mandatory.** Any table with a `user_id` column must have a FK constraint to `auth.users(id)` with explicit `ON DELETE` behaviour (typically `CASCADE`; `SET NULL` only for tables that retain anonymized data like `safety_events`). Tables created via the Supabase SQL Editor that omit the FK will break the deletion cascade — see migration `20260428_004` for the schema hygiene fix that retroactively added missing constraints.

## Active branch

Default integration branch is `main`. Feature work goes on `claude/<topic>` branches and merges via squash PR (CI must be green: Deno + Jest jobs).