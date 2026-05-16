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

## Phase 1 — Foundation (largely complete)

**Goal:** A working, trustworthy SOS tool that sounds human and adapts to the child.

### ✅ Shipped and working
- Authentication — sign up, sign in, sign out (email + password)
- Forgot password flow — email reset link + deep-link reset-password screen
- Confirm-email state after sign-up (shown when Supabase requires confirmation)
- Child profiles — exact age (2–17), name, optional personality notes
- Per-child hub (`child/[id].tsx`) — SOS / Reconnect / Understand / Conversation modes
- Regulate → Connect → Guide script generation (all four modes)
- Output schema: `situation_summary` + `regulate` / `connect` / `guide` + `avoid`
- Intensity selector (SOS only), tone selector (Soft / Gentle / Direct — Sturdy+ gated)
- Question mode — home screen textarea → prose response → `thought/[id]`
- Safety filter — 8 crisis categories, phrase-based detection, before every AI call
- Crisis screen — adaptive content per crisis type, real phone numbers + deep links
- Safety event logging to Supabase
- Rate limiting — per-user cap on Edge Function calls (`checkAnthropicRateLimit`)
- Neurotype auto-detection from message (silent, never surfaced in output)
- Welcome — v12 native: 5-page paged ScrollView, photo-identity, guest path
- Result screen — collapsible regulate/connect/guide cards, avoid section, voice, profile nudge, save script
- Voice playback — `expo-speech` (platform TTS), free on SOS, Sturdy+-gated on other modes
- Saved scripts library (`saved.tsx`, reads from `saved_scripts` table)
- Interaction history (`history.tsx`, reads from `interaction_logs`)
- Child profile screen (`child-profile/[id].tsx`) — triggers, what works, patterns teaser
- Settings screen — account, subscription, children, notifications, legal, account lifecycle
- Account lifecycle — pause / delete / export Edge Functions + mobile UI
- Sturdy+ paywall screen (`upgrade.tsx`) — Monthly $9.99 / Annual $69.99
- Legal screens — privacy policy, ToS, AI limitations, medical safety (placeholder text)
- Schema integrity — 14 tables, all FK constraints with explicit ON DELETE behaviour

### 🟡 Built but stubbed / incomplete
- **Subscription / billing** — `useSubscription` is a mock (`isPremium: false` always). RevenueCat/StoreKit not wired.
- **Restore purchase** — Settings row exists, does nothing. Required for App Store §3.1.1.
- **Push notifications** — toggle in Settings is UI-only, not persisted or wired to APNs/FCM.
- **Research consent** — toggle in Settings is UI-only, not saved to database.
- **Help & FAQ / Contact us** — Settings rows are dead tap targets.
- **Weekly insight** — locked teaser UI exists, no generation code.
- **Emerging patterns** — placeholder + lock icon, no detection logic.
- **Legal docs** — long-form drafts written, not yet committed or wired into in-app screens.
- **Analytics** — `analytics.ts` stub logs in dev, no-op in prod. No backend.

### ⬜ Remaining for App Store submission
1. **Real subscription via RevenueCat** — swap `useSubscription.ts` body
2. **Restore purchase wiring** — required for App Store §3.1.1
3. **Wire long-form legal docs** into in-app legal screens
4. **Privacy policy public URL** — App Store listing requires a live URL
5. **App Store assets** — screenshots, listing copy, age rating
6. **Error monitoring** — Sentry or equivalent; production crashes are invisible today
7. **Email verification flow** — App Store may flag account creation without email confirmation

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

