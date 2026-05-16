# Sturdy Roadmap

**Last updated: 2026-05-16**

> Phase 1 section reflects actual shipped state as of May 2026. See `docs/FEATURE_INVENTORY.md` for the full ground-truth audit (last run 2026-04-30).

## Vision

Sturdy is the go-to parenting companion for every parent at every level — built on the collective wisdom of the world's best parenting research, delivered in plain human language exactly when parents need it.

---

## Guiding Priorities

Every decision should serve at least one of these:

- Faster support in hard moments
- More natural, human-sounding scripts
- Stronger safety without clinical coldness
- Better personalisation to the actual child
- Daily usefulness — not just emergency use
- Parent growth over time

---

## Phase 1 — Foundation (complete)

**Goal:** A working, trustworthy SOS tool that sounds human and adapts to the child.

### ✅ Shipped and working

**Authentication**
- Sign up / sign in / sign out — email + password (`app/auth/index.tsx`)
- Forgot password — email reset link, "check your inbox" confirm state (`app/auth/forgot-password.tsx`)
- Password reset — deep link handler in `_layout.tsx`, new password screen (`app/auth/reset-password.tsx`)
- Confirm-email state shown after sign-up when Supabase requires email confirmation
- `handle_new_user()` Postgres trigger auto-creates `profiles` row on signup

**Child profiles**
- Add child — name + exact age 2–17, optional personality notes (`child-setup.tsx`, `child/new.tsx`)
- Multi-child support — home screen handles 0/1/many children with avatar picker
- Guest path — child stored to AsyncStorage (`sturdy_guest_child`), migrates on sign-up

**AI script generation — all four modes**
- Per-child hub (`child/[id].tsx?mode=...`) serves SOS / Reconnect / Understand / Conversation
- Edge Function: `chat-parenting-assistant` — Anthropic Claude `claude-sonnet-4-20250514`
- Prompt assembly in `buildPrompt.ts`: age calibration, silent neurotype detection, 5 trigger-category guidance blocks (meltdown / refusal / shutdown / aggression / transition), tone injection
- Output: `situation_summary` + `regulate` / `connect` / `guide` steps + `avoid[]`
- `coaching` + `strategies[]` optional per step
- Result screen (`result.tsx`) — collapsible cards, avoid section, "what happened next?" feedback, save, share, voice player, profile nudge after 3rd script

**Question mode**
- Home screen textarea → Edge Function `mode: 'question'` → prose response
- Result at `thought/[id].tsx` — persisted to `parent_thoughts` table
- Pin / delete / ask-another actions

**Safety**
- Safety filter (`_shared/safetyFilter.ts`) — 8 crisis categories, phrase-based detection, runs before every AI call on both SOS and question paths
- Crisis screen (`crisis.tsx`) — adaptive content per crisis_type, real hotlines (988, Crisis Text Line, Poison Control), `tel:` / `sms:` deep links
- Safety events logged to `safety_events` table (SET NULL on deletion — anonymized row retained per Principle 8)
- Rate limiting — per-user burst + daily cap (`_shared/rateLimit.ts`); crisis paths always bypass

**Tone system**
- Three tones: Soft / Gentle / Direct — end-to-end wired
- AsyncStorage-backed (`src/utils/tone.ts`) → API request body → `validateInput` → `getToneBlock()` injects into all four mode prompts
- Gentle is the default free-tier voice (no-op — prompt unchanged); Soft + Direct are Sturdy+ gated

**Trigger classification**
- `_shared/triggerClassifier.ts` — 15 categories (homework, bedtime, screen_time, leaving_places, mealtime, morning_routine, sharing, sibling, separation, public_meltdown, getting_dressed, bath_time, sport_activity, social_conflict, + fallback)
- Logged silently to `interaction_logs.trigger_category` — feeds child profile screen

**Subscription / billing**
- RevenueCat fully wired in `useSubscription.ts` — real purchase / restore / entitlement checks via `react-native-purchases`
- `Purchases.configure({ apiKey: RC_API_KEY })` runs at app launch in `_layout.tsx`
- Entitlement ID: `sturdy_plus`; plan detection: free / monthly / annual from `productIdentifier`
- `purchase(packageType)` and `restore()` call RevenueCat SDK — not mocks
- Requires `EXPO_PUBLIC_REVENUECAT_API_KEY` env var; logs a warning and skips if missing

**Paywall + gating**
- `upgrade.tsx` — Monthly $9.99 (3-day trial) / Annual $69.99 (7-day trial)
- `PaywallSheet.tsx` — reusable bottom-sheet shown when free user taps locked feature
- All Sturdy+ gates read from `useSubscription().isPremium`

**Account lifecycle**
- Pause account (30-day reversible) — `account-pause` Edge Function + `app/account/pause.tsx`
- Permanent deletion — "DELETE" confirmation required — `account-delete` Edge Function + `app/account/delete.tsx`
- Data export — signed 24-hour URL → zip with JSON + Markdown — `account-export` Edge Function + `app/account/export.tsx`
- Daily cron (`scheduled-pause-cleanup`) auto-deletes accounts paused > 30 days

**Content screens**
- Saved scripts library (`saved.tsx`) — grouped by child, swipe-to-delete
- Interaction history (`history.tsx`) — filterable by mode + trigger category
- Child profile / "Your Child" (`child-profile/[id].tsx`) — common triggers, what works, patterns teaser, weekly insight teaser
- Settings — real wiring: RevenueCat status, tone, legal, account lifecycle, sign out

**Welcome / onboarding**
- v12 native flow (`welcome/index.tsx`) — 5-page paged ScrollView, photo-identity (`welcome-family.jpg`, `welcome-horizon.jpg`), spring animations, haptics
- Three CTA paths: Get started → `child-setup`, Try without account → guest flag, Sign in → auth
- `TypingDemo.tsx` — live animated demo of Regulate/Connect/Guide output during onboarding

**Legal**
- Four in-app screens: privacy-policy, terms-of-service, ai-limitations, medical-safety (`app/legal/`)

**Database**
- 14 tables, all with FK constraints + explicit ON DELETE behaviour
- Migration `20260428_004` retroactively added missing FKs
- `enforce_conversation_child_ownership` trigger maintains cross-table user_id consistency

---

### 🟡 Built but incomplete

| Area | What exists | What's missing |
|---|---|---|
| Push notifications | Toggle in Settings (React state only) | Not persisted to DB; no APNs/FCM wiring; no Expo push token |
| Research consent | Toggle in Settings (React state only) | Not persisted to DB |
| Help & FAQ / Contact us | Settings rows exist | Tap targets are empty handlers; no FAQ content; no contact form |
| Weekly insight | Locked teaser UI on child-profile screen | No generation code; `child_insights` table exists but unpopulated |
| Emerging patterns | Placeholder + lock UI | No detection logic; `incident_events` table exists but unused |
| Legal docs (long-form) | Short placeholder text in legal screens | Long-form drafts not yet committed or wired |
| Analytics backend | `analytics.ts` event stubs (logs in dev, no-op in prod) | No backend wired; no funnel visibility |
| Error monitoring | Nothing | No Sentry / Bugsnag; production crashes invisible |
| Welcome dead code | `welcome/` has orphaned files: `trial.tsx`, `trial-result.tsx`, `child-setup.tsx`, `signup.tsx` | These are unreachable from v12 but not deleted; `OnboardingProvider` is vestigial |

---

### ⬜ Remaining for App Store submission

1. **Wire long-form legal docs** into in-app legal screens (drafts exist, not committed)
2. **Privacy policy public URL** — App Store listing requires a live public URL (`apps/web/` exists, needs `/privacy` route)
3. **App Store assets** — screenshots, listing copy, age rating, content advisory
4. **Error monitoring** — Sentry or equivalent before going live
5. **Email verification flow** — Supabase supports it; app needs a "check your inbox" state post-sign-up (partially done: confirm-email state added, but email confirmation not yet enabled on Supabase project)
6. **RevenueCat products config** — SDK is wired; products must be created in App Store Connect / Google Play and added to RevenueCat dashboard before billing works in production

---

## Phase 2 — Quality & Retention

**Goal:** Scripts that feel unmistakably better. Daily habits that keep parents coming back.

### Script Quality
- Claude API fully integrated
- Prompt rebuilt around 12 source books with concrete examples
- Age calibration tested across all ages 2-17
- Neurotype detection accuracy improved with expanded keyword lists
- Follow-up scripts tested and tuned

### Parent Wellbeing Layer
- Replace clinical crisis routing with parent support
- When safety triggers: script for child + quiet support for parent below
- Repair guide — what to say after you lost your temper
- "You're not alone" — normalise the hard moments

### Daily Habit Features
- Daily reflection — one question per day
- Streak tracking — gentle, not gamified
- Script library — saved scripts organised by child and situation
- Pattern recognition — "You've described 6 transition situations this month"

---

## Phase 3 — Understand Your Child

**Goal:** Help parents understand why, not just what to say.

### Age Guide
- What's developmentally normal at every exact age 2-17
- Common behaviours at each age + why they happen
- What approaches work at each stage
- Based on Siegel, Markham, Kennedy, Faber & Mazlish

### Behaviour Decoder
- Parent describes a recurring pattern
- Sturdy explains the developmental or emotional driver
- Suggests approaches from relevant books
- Not a diagnosis — a framework for understanding

### Child Profile Insights
- Based on saved scripts and situations over time
- Proactive — "Based on what you've shared, Tyler often struggles with transitions"
- Quiet, not intrusive

---

## Phase 4 — Grow as a Parent

**Goal:** Long-term parent development. Break cycles. Build awareness.

### Reflection
- Daily or weekly prompts
- "What went well?" "What would you do differently?"
- Builds self-awareness over time

### Book Insights
- Bite-sized principles from the 12 source books
- Delivered contextually — after a relevant SOS, not as a library
- One insight, when it matters

### Parent Style Mirror
- Based on described situations over time
- Shows patterns in how the parent responds
- Not a label — a mirror
- "You tend to lead with connection. Here's how to balance that with clearer limits."

### Repair Guide
- You lost your temper. You said something you regret.
- What do you say now to your child?
- How do you repair it?
- From Philippa Perry + Becky Kennedy

---

## Phase 5 — Platform

**Goal:** Sturdy as a platform, not just an app.

### Multilingual
- App UI and scripts in multiple languages
- Priority order: English → Spanish → French → Mandarin → Arabic
- Scripts must maintain warmth and naturalness in translation

### Family Sharing
- Multiple parents / caregivers on one child profile
- Shared script library
- Co-parenting support (separate parents, shared child)

### Professional Version
- Therapists, educators, and social workers use Sturdy with families
- Different access model
- Annotation and notes layer

---

## What Not to Build Too Early

- Generic open-ended chatbot behaviour
- Heavy dashboards with lots of data
- Too much customisation before usefulness is proven
- Deep analytics before daily habit is established
- Community features before trust is earned

---

## The Standard

Every feature earns its place by answering yes to:

> If a stressed parent opens Sturdy right now, does this make the experience faster, calmer, clearer, or more useful?

