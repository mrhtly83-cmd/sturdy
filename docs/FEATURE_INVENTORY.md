# Sturdy Feature Inventory

**Last audited:** April 30, 2026
**Audit basis:** Ground-truth read of `main` branch at commit `3da1fe7` (PR 20 merged)
**Method:** Cross-referenced Master Blueprint + ROADMAP + CLAUDE.md + PRODUCT_PRINCIPLES.md against actual codebase (`apps/mobile/`, `supabase/functions/`, `supabase/migrations/`)

This document is the answer to: **what does Sturdy actually do today?** Not what we planned. Not what the docs say. What ships.

The four categories below are:
- ✅ **Built and working** — exists in code, behaves correctly, ships in current build
- 🟡 **Built but partial / stubbed** — code exists, behavior is fake, hardcoded, or incomplete
- 📐 **Specced but not built** — design exists in Blueprint or Roadmap, no code
- ❌ **Missing entirely** — gap not yet recognized in any document

---

## ✅ Built and working

### Authentication
- Sign up + sign in via Supabase Auth (`apps/mobile/app/auth/index.tsx`, unified screen with `?mode=` param)
- Session management via `AuthContext` (`apps/mobile/src/context/AuthContext.tsx`)
- AuthGate routing: signed-in → `/(tabs)`, returning unauthenticated → `/auth?mode=signin`, first-time → `/welcome`
- `handle_new_user()` Postgres trigger auto-creates `profiles` row on signup

### Welcome / onboarding (v12)
- 5-page paged ScrollView (splash → 3 feature slides → final CTA)
- Photo-identity backgrounds (`welcome-family.jpg`, `welcome-horizon.jpg`)
- Three CTA paths: Get started → child-setup, Try without account → guest flag, Sign in → auth
- BlurView glass cards + spring entrance animation + haptic feedback
- Onboarding flag in AsyncStorage (`@sturdy/onboarding-complete`)
- Guest path flag in AsyncStorage (`sturdy_guest_seen_v1`)

### Child profiles
- Add child screen (`child-setup.tsx`) — name + exact age (2-17)
- Edit child screen (`child/new.tsx`) — name + age, no neurotype UI per Principle 1
- Per-device guest fallback to AsyncStorage (`sturdy_guest_child` key) for unauthenticated users
- Guest data migrates on sign-up
- `child_profiles` table with `child_age` integer (post-migration `20260327_002`)

### AI script generation (SOS / Reconnect / Understand / Conversation)
- Single Edge Function endpoint: `chat-parenting-assistant`
- Four mode prompts in `buildPrompt.ts`: `getSOSPrompt`, `getReconnectPrompt`, `getUnderstandPrompt`, `getConversationPrompt`
- Anthropic Claude `claude-sonnet-4-20250514` model
- Strict JSON output with `situation_summary`, `regulate`, `connect`, `guide`, `avoid` fields
- Response validation (`validateResponse.ts`)
- Per-child hub at `child/[id].tsx?mode=...` — same screen serves all four modes
- Routes to `result.tsx` for display

### Question mode
- Free-form input on Home screen
- Returns prose response (not R/C/G structure)
- Persists to `parent_thoughts` table
- Result screen at `thought/[id].tsx`
- Pin / delete actions

### Tone selector (end-to-end wired)
- Three tones: Soft / Gentle / Direct
- AsyncStorage-backed via `src/utils/tone.ts`
- Sent in API request body
- `validateInput` accepts and forwards
- `getToneBlock(tone)` injects guidance into all four mode prompts
- Free users default to Gentle; Soft + Direct gated behind PaywallSheet

### Safety filter (8-category keyword scan)
- Runs before any AI call
- Categories priority-ordered: medical emergency → suicidal parent → suicidal child → violence toward child → parent losing control → violence toward parent → child self-harm → abuse indicator
- First match wins; returns `{ response_type: "crisis", crisis_type, risk_level, policy_route }`
- Logs to `safety_events` table
- Mobile catches `CrisisDetectedError` and routes to `/crisis`

### Crisis screen
- Adaptive content per `crisis_type` URL param
- Eight crisis types covered (medical_emergency, suicidal_parent, suicidal_child, etc.)
- Real phone numbers and crisis lines (988, Crisis Text Line, Poison Control)
- Direct `tel:` and `sms:` deep links
- Per Principle 4: never paywalled

### Result screen
- Collapsible `regulate` / `connect` / `guide` cards
- "Avoid saying" expandable section
- Voice playback (see local-only voice note below)
- "What happened next?" feedback (helpful / outcome cards)
- Save script action
- Profile nudge after 3rd script (one-time per child via AsyncStorage)

### Voice playback (local TTS only)
- Uses `expo-speech` (platform-native TTS, not OpenAI/ElevenLabs)
- Pacing: queue regulate → connect → guide with 1.2s gaps
- Free for SOS mode; gated for other modes (mock `isPremium` check)
- Pulsing dot indicator during playback
- **Note:** Master Blueprint specced remote TTS API; local TTS shipped instead. Quality difference matters for premium feature framing.

### Saved scripts library
- `saved.tsx` — grouped by child
- Reads from `saved_scripts` table (jsonb `structured` column)
- Pull-to-refresh, swipe-to-delete

### Conversation history
- `history.tsx` — list of all interactions
- Reads from `interaction_logs` joined to `child_profiles` for child names
- Filters by mode and trigger category

### Child profile screen ("Your Child")
- `child-profile/[id].tsx`
- Sections: header / common triggers (from `interaction_logs.trigger_category`) / what works (saved scripts proxy) / emerging patterns (placeholder + lock) / weekly insight (locked teaser)
- Empty state for < 5 interactions

### Account lifecycle (PR 18 + PR 20)
- **Pause:** `account-pause` Edge Function — sets `profiles.paused_at`, revokes sessions
- **Delete:** `account-delete` Edge Function — exact-match "DELETE" confirmation, cascade delete via foreign keys
- **Export:** `account-export` Edge Function — generates 24-hour signed URL pointing at zip in `account-exports` Storage bucket
- **Cron cleanup:** `scheduled-pause-cleanup` deletes accounts paused > 30 days (system-caller authenticated)
- Mobile UI: Settings → MANAGE ACCOUNT section with three rows
- All three flows tested end-to-end against live database (PR 18 smoke test confirmed)

### Schema integrity
- 14 tables, all user-scoped tables have FK to `auth.users(id)` with explicit ON DELETE behavior
- `safety_events` uses SET NULL (preserves anonymized rows post-deletion per Principle 8)
- All other user-scoped tables use CASCADE
- Migration `20260428_004` fixed historical FK gaps
- `enforce_conversation_child_ownership` trigger ensures cross-table user_id consistency

### Settings screen
- Sections: ACCOUNT (profile card) / SUBSCRIPTION / CHILDREN / GENERAL / PRIVACY / SUPPORT / MANAGE ACCOUNT / Sign out
- Real wiring: child management, upgrade screen, legal docs, sign out, account lifecycle
- Push notifications + research consent toggles are React state only (see Built but Partial)

### Visual design system (v3 dark + photo-identity hybrid)
- Theme tokens in `src/theme/colors.ts`: amber `#D4944A`, sage `#8DB89A`, steel `#5778A3`, coral `#E87461`
- Fraunces (4 weights) + DM Sans (4 weights) loaded
- v3 dark identity tokens (`#0e0a10` bg, glass cards, amber gradient CTAs) used in: upgrade, auth, account screens
- Photo-identity backgrounds (welcome photos with gradient overlays) used in: welcome, home, child hub
- `Card.tsx` (GlassCard), `Screen.tsx`, `PaywallSheet.tsx` reusable components

### Sturdy+ paywall screen
- `upgrade.tsx`
- Locked pricing: Monthly $9.99 (3-day trial), Annual $69.99 (7-day trial)
- Five premium features listed: child knowledge, weekly reflection, follow-up scripts, saved everything, voice on every mode
- Three free-tier callouts

### Legal screens (in-app rendering)
- Four screens at `apps/mobile/app/legal/` — privacy-policy, terms-of-service, ai-limitations, medical-safety
- **Note:** All four hardcode short placeholder text (~50 lines each). Long-form drafts written this week are NOT yet wired.

---

## 🟡 Built but partial / stubbed

### Subscription / billing (NOT WIRED)
- `useSubscription.ts` is a **mock** — always returns `{ isPremium: false, plan: 'free' }`
- `purchase()` just logs `[BILLING] purchase()`
- `restore()` just logs `[BILLING] restore()`
- `subscriptions` table exists but is unused
- Comment in code states: "single-file swap to wire RevenueCat"
- **Result:** every "premium" gate in the app currently blocks all users equally

### Free tier quota enforcement (DEAD CODE)
- `getScriptUsage.ts` defines `FREE_TOTAL = 5` and reads from `usage_events`
- **Function is never imported anywhere**
- Free users have no enforced limit — the function is unreachable
- Master Blueprint says "Free Tier (unlimited)" with "Unlimited SOS scripts" — so the dead code may be intentional residue from an older quota model

### Push notifications toggle
- Settings screen `<Switch>` toggles local React state
- Not persisted to database
- No notification system wired (no Expo push token, no APNs/FCM)
- Toggle does nothing on next app open

### Research consent toggle
- Settings screen `<Switch>` toggles local React state
- Not persisted to database
- Roadmap Phase 1 lists "Research consent → save to DB" as remaining

### Help & FAQ + Contact us rows
- Settings rows exist with `onPress={() => {}}` (empty handlers)
- Tappable but do nothing
- No FAQ content authored, no contact form built

### Restore purchase
- Settings row with `onPress={() => {}}`
- Required for App Store approval (iOS Section 3.1.1)
- Will be wired when RevenueCat lands

### Weekly insight (placeholder UI, no generation)
- "Locked teaser" UI exists on child-profile screen
- No code generates insights
- No table populates `child_insights`
- Master Blueprint section spec is detailed; implementation is decorative

### Emerging patterns (placeholder UI, no detection)
- Empty placeholder + lock icon on child-profile screen
- `incident_events` table exists but no aggregation logic
- Spec describes "Worst moments: 4-6pm" / "Responds to repair quickly" type insights — none implemented

### Voice on non-SOS modes
- `useVoicePlayer` works for any script
- Gating logic: `voiceLocked = mode !== 'sos' && !isPremium`
- Since `isPremium` is always `false`, all non-SOS voice is locked
- Tap-to-play opens PaywallSheet (which doesn't actually purchase)

### Long-form legal docs
- Drafts written this week (Privacy Policy 12 sections, ToS 14 sections, AI Limitations, Medical Safety)
- Saved locally on Thai's Chromebook
- Not committed to `docs/legal/*.md` (those still hold older versions)
- Not wired into in-app screens (those still hardcode short placeholder text)
- Awaiting lawyer review before commit + wiring

---

## 📐 Specced but not built

### Three-tab navigation (Home / Your Child / You)
- Master Blueprint specifies 3 tabs
- Codebase has 2 tabs (Home / Settings)
- "Your Child" exists as `/child-profile/[id]` modal — not a tab
- CLAUDE.md acknowledges: "post-Phase-1 architecture: Home + Settings"
- This is a deliberate divergence from the Blueprint, not a forgotten feature

### Single-input outcome selector flow (Master Blueprint Section 1)
- Blueprint specifies: parent types message → selects outcome card → routes internally
- Actual flow: Home shows outcome cards as four "tap to start" entries, each routes to per-child hub at `child/[id]?mode=...`
- The single-screen flow with outcome buttons below a textarea (Blueprint mock) does NOT exist
- Question mode IS a single-input flow, but it's separate from the outcome selector

### Sturdy Family ($14.99 tier)
- Master Blueprint section 3 lists three tiers: Free / Sturdy+ ($9.99) / Sturdy Family ($14.99)
- Codebase has two tiers in `upgrade.tsx`: Free / Sturdy+
- Family tier (co-parent seats, multiple children, share script cards) not built
- Multiple child profiles already work for individual users — but co-parent sharing doesn't

### Co-parent sharing
- Specced under Sturdy Family
- No data model for shared accounts
- No invitation flow
- No share-card-to-partner UI

### Conversation mode message detection
- Master Blueprint: "Conversation mode triggers when Sturdy detects the message is about a future conversation"
- Implementation: Conversation mode is a manually-selected outcome card, not auto-detected
- The detection step is missing — parent picks it explicitly

### Daily reflection feature (Phase 2)
- Roadmap Phase 2: "Daily reflection — one question per day"
- Not built

### Streak tracking (Phase 2)
- Roadmap Phase 2: "Streak tracking — gentle, not gamified"
- Not built

### Pattern recognition prompts (Phase 2)
- Roadmap: "You've described 6 transition situations this month"
- No code generates these

### Age guide (Phase 3)
- Roadmap: "What's developmentally normal at every exact age 2-17"
- Not built

### Behaviour decoder (Phase 3)
- Roadmap: parent describes pattern → developmental explanation
- Not built; could be a Question mode use case but no specific UI

### Repair guide (Phase 4)
- Roadmap: "You lost your temper. What do you say?"
- Not built — Reconnect mode is similar but specced separately

### Multilingual (Phase 5)
- Specced; not built. English only.

### Professional version (Phase 5)
- Specced; not built.

### Remote TTS (OpenAI / ElevenLabs)
- Master Blueprint specifies external TTS API with audio caching
- Implementation uses `expo-speech` (platform TTS)
- Voice quality difference is real — local TTS is robotic; the spec assumed a polished voice as a premium-justifying feature
- Not flagged as a TODO anywhere; treated as good-enough

### Result screen voice bar with "organic sound wave animation"
- Spec: top-of-screen voice bar with playing animation
- Implementation: simple play button + pulsing dot
- Visual gap from spec, functional substance is present

---

## ❌ Missing entirely (gaps not in any doc)

### Email verification
- Sign-up creates session immediately; no email verification step
- Supabase has built-in email confirmation but it's disabled
- App Store review may flag if account creation doesn't verify control of email
- Privacy implications: someone could sign up with another person's email

### Forgot password / password reset
- No "forgot password" link in auth screen
- No reset flow built
- Users who forget can't recover account

### Email change / account email management
- No way to change account email after signup
- Critical for users who lose access to original email

### Session timeout policy
- `src/lib/sessionTimeout.ts` exists — needs to be checked but not surfaced in docs anywhere
- Whether it's wired and what it does is undocumented

### Per-device sign-out / "Sign out all devices"
- Not built
- Privacy concern: lost phone with active session

### App-level analytics tracking
- `src/utils/analytics.ts` is a stub — `track()` logs in dev, no-op in prod
- No backend wired
- Means: launch metrics, retention, conversion funnels are all unmeasurable today
- Not in the roadmap as a Phase 1 item; no urgency flagged

### Error monitoring / crash reporting
- No Sentry, no Bugsnag, no Crashlytics
- Privacy policy mentions "service providers we may contract with" — but none currently exist
- Production crashes invisible to Thai

### Customer support workflow
- `sturdymobile@gmail.com` email exists
- No ticketing system, no auto-responder, no FAQ
- "Contact us" Settings row is dead

### Account locked / banned states
- ToS says "We reserve the right to suspend or terminate accounts that violate these Terms"
- No mechanism to actually ban an account
- No `is_banned` flag, no enforcement code

### Rate limiting (per-user)
- No rate limit on Edge Function calls
- A single user could hammer the Anthropic API at full speed
- Cost exposure is real — Anthropic API pricing applied at the user level via Supabase Edge Function

### Child age update flow
- Once a child profile is created, can age be edited?
- `child/new.tsx` is "add new"; `child-profile/[id]` is read-only
- The product needs annual age updates as kids grow; no flow exists

### Multiple child profile management
- `child_profiles` table supports multiple children per user
- Home screen handles 0 / 1 / 2+ children
- But: no "delete child" UI, no "archive child" for grown-up children, no child reordering

### Data export format documentation
- `account-export` returns a zip
- What's in the zip? Code reads schema and exports JSON + readable text
- Privacy policy section 8 lists what's exported, but actual file structure is undocumented
- Lawyer may ask: what's in the zip exactly?

### Backup of saved scripts before deletion
- Account export captures saved scripts
- But: no individual script export
- No "send saved script to email" option
- No "share" intent on iOS/Android

### Voice playback for guest users
- Guest users can use SOS mode (Principle 4: crisis is free)
- Voice gating logic checks `isPremium`, which mocks to false for everyone
- For guests, voice on SOS shouldn't even show paywall — but it does (via `voiceLocked` check)
- This is a subtle Principle 4 violation worth confirming

### Splash screen / app icon
- `welcome/splash.tsx` exists as a file
- Whether it's used at launch (vs. Expo's default) is undocumented
- App icon set status undocumented
- App Store requires both

### App Store assets
- Screenshots, store listing copy, age rating, content rating
- None mentioned in any doc
- Required for submission

### Privacy Policy URL hosting
- App Store requires a publicly-accessible privacy policy URL
- `apps/web/` exists (Next.js landing site)
- Whether it has a /privacy route serving the policy is uninvestigated
- Long-form drafts saved on Chromebook are not yet on a public URL

---

## Summary table

| Category | Count |
|---|---|
| ✅ Built and working | 14 feature areas |
| 🟡 Built but partial / stubbed | 9 feature areas |
| 📐 Specced but not built | 13 feature areas |
| ❌ Missing entirely | 14 feature gaps |

**Total: 50 feature areas tracked**

---

## Highest-priority gaps for App Store submission

These are the items that block App Store submission, not the items that would make Sturdy a more complete product:

1. **Email verification flow** — App Store may flag account creation without email confirmation
2. **Forgot password / password reset** — required UX baseline
3. **Restore purchase wiring** — App Store §3.1.1 requires this for any subscription app
4. **Real subscription via RevenueCat** — `useSubscription` mock blocks all premium UX testing
5. **Wire long-form legal docs into in-app screens** — current short placeholders won't pass review when paired with the long-form public privacy policy
6. **Privacy policy public URL** — App Store listing requires a privacy policy URL, currently no host
7. **App Store assets** — screenshots, listing copy, age rating
8. **Error monitoring** — production debugging without Sentry-equivalent is dangerous
9. **Account ban / suspension mechanism** — ToS promises something the code can't deliver

## Highest-priority gaps for product completeness

If launch is the goal, these are nice-to-have. If long-term retention is the goal, these become priority:

1. **Real free-tier quota OR explicit removal of `getScriptUsage.ts` dead code**
2. **Push notifications wired end-to-end** — currently a UI lie
3. **Research consent persistence** — UI lie
4. **Child age update flow** — kids age every year
5. **Weekly insight generation** — major paywall justification, currently fake
6. **Emerging patterns generation** — same
7. **Conversation mode auto-detection** — matches Blueprint's intended UX
8. **Sturdy Family tier** — revenue ceiling without it
9. **Analytics tracking backend** — can't measure what isn't tracked

## Architectural observations

- **Documentation drift is significant.** Master Blueprint says 3 tabs, app has 2. Blueprint says external TTS, app uses local. Blueprint says single-input outcome selector flow, app uses card grid. Each divergence is intentional but not all are documented.
- **Mock-driven gating throughout.** Every Sturdy+ feature is gated on `useSubscription().isPremium` which always returns `false`. This means premium UX is untested in practice — when RevenueCat lands and `isPremium` flips for real subscribers, multiple gating boundaries will be exercised for the first time.
- **Welcome flow has dead code.** `welcome/` directory contains `trial.tsx`, `trial-result.tsx`, `child-setup.tsx`, `signup.tsx` that are unreachable from the v12 flow. CLAUDE.md acknowledges this. Worth a cleanup PR.
- **`OnboardingProvider` context is vestigial.** Used only by the dead welcome files. Wraps the welcome stack but does nothing reachable.
- **Settings screen has 3 dead tap targets** (Help & FAQ, Contact us, Restore purchase) plus 2 fake toggles (push, research consent). At App Store review, this risks "broken UI" rejection.

---

## What this audit doesn't cover

- **Quality of AI output.** This is a separate evaluation against `SCRIPT QUALITY STANDARDS.md` — eval suite needed.
- **Performance / load testing.** No API call benchmarks, no Edge Function cold-start measurements.
- **Accessibility audit.** Screen reader, font scaling, color contrast — all uninvestigated.
- **Internationalization readiness.** Codebase has hardcoded strings everywhere; localization scaffolding doesn't exist.
- **Security audit.** RLS policies, JWT validation in Edge Functions, Storage bucket access — done piecemeal in PRs but no end-to-end review.

These would each be their own dedicated audit. This document covers feature inventory only.
