# Sturdy — Technical Inventory

> Generated 2026-06-04. A physical snapshot of what exists in the repository — source files, dependencies, views, and schemas as written, not as documented.

## 1. Tech Stack & Dependencies

**Monorepo** — 3 independent workspaces, no root build tool. Root `package.json` carries only `supabase` CLI (`^2.78.1`) + two Deno eval scripts (`eval:sos`, `eval:question`).

**`apps/mobile/` — Expo / React Native (the product)**
- Runtime: `expo ^54.0.33`, `react 19.1.0`, `react-native 0.81.5`, `expo-router ~6.0.3` (file-based routing)
- UI/animation: `react-native-reanimated ~4.1.1`, `react-native-worklets 0.5.1`, `react-native-gesture-handler`, `expo-blur`, `expo-linear-gradient`, `expo-haptics`, `expo-speech`
- Fonts: `@expo-google-fonts/` — fraunces, dm-sans, plus unused-in-config crimson-pro, cormorant-garamond, manrope, plus-jakarta-sans
- Data/auth: `@supabase/supabase-js ^2.99.1`, `@react-native-async-storage/async-storage 2.2.0`
- Billing: `react-native-purchases ^10.1.0` (RevenueCat)
- Clipboard: `@react-native-clipboard/clipboard`, `expo-clipboard`
- Tooling: TypeScript `~5.9.2`, Jest `^29.7.0` + `jest-expo ~54.0.0`

**`apps/web/` — Next.js marketing site**
- `next 16.1.6`, `react 19.2.3`, `react-dom 19.2.3`, `framer-motion ^12.35.2`
- Tailwind v4 via `@tailwindcss/postcss`, ESLint `^9` + `eslint-config-next`

**`supabase/` — Edge Functions (Deno) + SQL migrations**
- 5 Edge Functions (TypeScript/Deno), Anthropic Claude as the LLM (model hardcoded in function code)
- 12 timestamped SQL migrations; Deno test suite under `functions/_tests/` and prompt eval harnesses under `_shared/prompts/__tests__/`

---

## 2. Complete Directory Map

```
sturdy/
├── package.json                         # supabase CLI + eval scripts only
├── apps/
│   ├── mobile/                          # Expo / React Native app
│   │   ├── app/                         # expo-router routes
│   │   │   ├── _layout.tsx              # root stack, providers, fonts, RevenueCat init
│   │   │   ├── +not-found.tsx
│   │   │   ├── (tabs)/
│   │   │   │   ├── _layout.tsx          # tab bar: index | family | settings
│   │   │   │   ├── index.tsx            # Home
│   │   │   │   ├── family.tsx
│   │   │   │   └── settings.tsx
│   │   │   ├── auth/
│   │   │   │   ├── index.tsx            # sign-in / sign-up (?mode=)
│   │   │   │   ├── forgot-password.tsx
│   │   │   │   └── reset-password.tsx
│   │   │   ├── welcome/
│   │   │   │   ├── _layout.tsx          # OnboardingProvider wrapper
│   │   │   │   └── index.tsx            # paged onboarding flow
│   │   │   ├── child/new.tsx            # child creation
│   │   │   ├── child-profile/[id].tsx   # per-child profile
│   │   │   ├── thought/[id].tsx         # Question-mode result
│   │   │   ├── account/
│   │   │   │   ├── _layout.tsx
│   │   │   │   ├── delete.tsx
│   │   │   │   ├── export.tsx
│   │   │   │   └── pause.tsx
│   │   │   ├── legal/
│   │   │   │   ├── ai-limitations.tsx
│   │   │   │   ├── medical-safety.tsx
│   │   │   │   ├── privacy-policy.tsx
│   │   │   │   └── terms-of-service.tsx
│   │   │   ├── result.tsx               # SOS script result
│   │   │   ├── history.tsx / saved.tsx
│   │   │   ├── crisis.tsx               # safety-support screen
│   │   │   └── upgrade.tsx              # Sturdy+ paywall
│   │   └── src/
│   │       ├── components/
│   │       │   ├── ui/   Card, GlassCard, PaywallSheet, QuotaBar, Screen, ScriptCard, TrafficDots
│   │       │   ├── features/  Stars, TypingDemo
│   │       │   └── welcome/  ProgressDots
│   │       ├── context/  AuthContext, ChildProfileContext
│   │       ├── hooks/  useCrisisMode, useQuota, useSubscription
│   │       ├── lib/  api, accountApi, supabase, saveScript, loadSavedScripts, loadChildInsights
│   │       ├── data/  crisisPhrases, scenarios
│   │       ├── theme/  colors, index
│   │       ├── types/  parentingScript
│   │       ├── utils/  analytics, dayPeriod, onboarding, profileNudge, tone
│   │       └── __tests__/  AuthContext, api, dayPeriod, loadSavedScripts, normalizeAuthError, saveScript
│   └── web/                             # Next.js site
│       ├── next.config.ts
│       └── src/
│           ├── app/  layout.tsx, page.tsx, privacy/page.tsx, globals.css
│           └── components/landing/  Hero, HowItWorks, Nav, Pricing, Script, Footer
└── supabase/
    ├── config.toml
    ├── functions/
    │   ├── chat-parenting-assistant/index.ts   # main SOS + Question endpoint
    │   ├── account-delete/index.ts
    │   ├── account-export/index.ts
    │   ├── account-pause/index.ts
    │   ├── scheduled-pause-cleanup/index.ts
    │   ├── _shared/  buildPrompt, safetyFilter, triggerClassifier, validateResponse,
    │   │             validateQuestionResponse, requestHelpers, rateLimit, accountAuth
    │   │   └── prompts/
    │   │       ├── question.ts
    │   │       ├── categories/  aggression, meltdown, refusal, shutdown, transition, index
    │   │       └── tones/  soft, direct, index
    │   └── _tests/  validateInput, validateResponse, buildPrompt, extractContent, _smoke
    └── migrations/  (12 timestamped .sql files)
```

---

## 3. Views & Features Built

**Onboarding (explicit)**
- **`welcome/index.tsx`** — horizontal paged `ScrollView` onboarding driven by three content "beats" (`beat1`, `beat2`, `beat3`) with a `ProgressDots` / progress-line indicator tracking `page` state. CTAs: **Get started → `/auth?mode=signup`**, **Sign in → `/auth?mode=signin`**, and a guest path that `router.replace('/(tabs)')`.
- **`welcome/_layout.tsx`** — wraps the flow in `OnboardingProvider`.
- **`src/components/welcome/ProgressDots.tsx`** — onboarding page-dot component.
- **`src/utils/onboarding.ts`** — onboarding-complete flag helpers (AsyncStorage).

**Auth views**
- `auth/index.tsx` — unified sign-in / sign-up (`?mode=`)
- `auth/forgot-password.tsx` — reset-link request
- `auth/reset-password.tsx` — deep-link password reset

**Main tabs (`(tabs)/_layout.tsx` → `index | family | settings`)**
- `index.tsx` — Home dashboard + "Ask Sturdy" entry
- `family.tsx` — Family screen
- `settings.tsx` — Settings

**Child & content views**
- `child/new.tsx` — new child creation
- `child-profile/[id].tsx` — per-child profile (triggers / insights)
- `result.tsx` — SOS / directed-mode script result
- `thought/[id].tsx` — Question-mode result
- `history.tsx` — interaction history
- `saved.tsx` — saved scripts library

**Account & legal**
- `account/delete.tsx`, `account/export.tsx`, `account/pause.tsx` (+ `account/_layout.tsx`)
- `legal/`: `ai-limitations.tsx`, `medical-safety.tsx`, `privacy-policy.tsx`, `terms-of-service.tsx`

**Monetization & safety**
- `upgrade.tsx` — Sturdy+ paywall
- `crisis.tsx` — crisis / safety-support screen
- `+not-found.tsx` — 404 route

**Reusable UI components**
- `ui/`: `Card`, `GlassCard`, `PaywallSheet`, `QuotaBar`, `Screen`, `ScriptCard`, `TrafficDots`
- `features/`: `Stars`, `TypingDemo`

**Web (Next.js landing site)**
- Pages: `app/page.tsx` (landing), `app/privacy/page.tsx`, root `layout.tsx`
- Landing components: `Hero`, `HowItWorks`, `Nav`, `Pricing`, `Script`, `Footer`

---

## 4. Data Models & Schemas

### A. Tables physically defined in migration DDL (`20260312_001_mvp_core.sql`)

Only **6 tables** are created via committed migration files; the rest of the schema referenced by code was created outside the repo (see §C).

| Table | Key columns |
|---|---|
| **profiles** | `id uuid PK → auth.users(id) CASCADE`, `full_name text`, `created_at`, `updated_at` |
| **child_profiles** | `id uuid PK`, `user_id → auth.users CASCADE`, `name text`, `age_band text CHECK ('2-4'\|'5-7'\|'8-12')`, `neurotype text[] default []`, `preferences jsonb default {}`, timestamps |
| **conversations** | `id`, `user_id CASCADE`, `child_profile_id → child_profiles CASCADE`, `mode text CHECK (= 'hard_moment')`, `title`, `summary`, `archived bool`, timestamps |
| **messages** | `id`, `conversation_id → conversations CASCADE`, `role text CHECK (user\|assistant\|system)`, `content text`, `structured jsonb`, `risk_level text`, `policy_route text`, `created_at` |
| **safety_events** | `id`, `user_id CASCADE`, `child_profile_id SET NULL`, `conversation_id SET NULL`, `message_id SET NULL`, `message_excerpt`, `risk_level text`, `policy_route text`, `classifier_version`, `resolved_with`, `created_at` |
| **usage_events** | `id`, `user_id CASCADE`, `child_profile_id SET NULL`, `conversation_id SET NULL`, `event_type text`, `event_meta jsonb`, `created_at` |

### B. Schema evolution captured in later migrations
- **`20260327_002`** — adds `child_profiles.child_age integer CHECK (between 2 and 17)`, backfilled from `age_band` (exact age now coexists with the legacy band column).
- **`20260428_004`** — retroactively adds `user_id` FK constraints to `auth.users(id)` for: `child_profiles, conversations, interaction_logs, parent_thoughts, safety_events, saved_scripts, script_feedback, subscriptions, usage_events, user_preferences`.
- **`20260429_003`** — account-deletion lifecycle.
- **`20260506_005` / `20260516_001`** — scheduled pause-cleanup cron + auth fix.
- **`20260507_001`** — safety-event Slack alert.
- **`20260517_006`** — `check_monthly_quota(target_user_id uuid)` RPC + cascade hygiene; **`20260520_007`** adds `interaction_logs.situation_summary`; **`20260521000800` / `...000900` / `20260531000010`** — quota: exclude SOS, dual quota buckets, 75/25 caps.

### C. Tables referenced by code but **not** created in committed migrations
(Columns inferred from insert/select call-sites in `apps/mobile/src/lib/` and `supabase/functions/`.)

- **interaction_logs** — `user_id`, `child_profile_id`, `mode` (default `'sos'`), `trigger_category`, `situation_summary`. Aggregated by `loadChildInsights.ts` on `trigger_category` per `child_profile_id`.
- **parent_thoughts** — inserted via REST from the Edge Function: `user_id`, `child_profile_id`, (`prompt`/`response`), returns `thought_id`.
- **saved_scripts** — `user_id`, `child_profile_id`, `conversation_id`, `title` (summary slice), `trigger_label`, `structured jsonb` (`{situation_summary, regulate, connect, guide, avoid}`), `notes`.
- Also FK-referenced: **script_feedback, subscriptions, user_preferences** (plus `child_insights, incident_events, trial_usage` referenced elsewhere in code).

### D. Client-side type schemas (`apps/mobile/src/types/parentingScript.ts`)

```ts
ScriptStep              = { parent_action: string; script: string }
ParentingScriptRequest  = { childName, childAge:number, message, userId?, childProfileId?,
                            intensity?:number|null, isFollowUp?:bool,
                            followUpType?: 'refused'|'escalated'|'worked'|'other',
                            originalScript?: { situation_summary, regulate, connect, guide } }
ParentingScriptResponse = { situation_summary, regulate:ScriptStep, connect:ScriptStep,
                            guide:ScriptStep, avoid: string[] }
SavedScriptInput        = ParentingScriptResponse-shape + childAge?:number|null
SavedScript             = SavedScriptInput + { id:string, createdAt:string }
```

The SOS response contract is the three-step **regulate / connect / guide** structure (each a `{parent_action, script}` pair) plus a `situation_summary` and an `avoid: string[]` — validated server-side in `_shared/validateResponse.ts` and mirrored by the client guards in `lib/api.ts`.

**State stores (client):** `AuthContext` (Supabase session), `ChildProfileContext` (child_profiles + guest AsyncStorage fallback); AsyncStorage-backed utils for onboarding flag, per-child profile nudge counter, and Sturdy+ tone preference (`soft`/`gentle`/`direct`).

---

## Notable facts about what's physically present

1. The mobile route tree contains `child/new.tsx` and `child-profile/[id].tsx` but **no** `child/[id].tsx` hub file.
2. The database is only **partially version-controlled** — just 6 of the ~14 tables the code reads/writes exist as committed migration DDL; the remainder appear only as FK-constraint and column patches.
