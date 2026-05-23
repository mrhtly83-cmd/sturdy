# Sturdy Roadmap

**Last updated: 2026-05-21**

> This roadmap reflects the V1 launch plan. Phase 1 is split into "shipped" and "V1 launch fixes". Everything else is V2+, prioritized by real user data post-launch.

---

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

## V1 Launch — Play Store First (Target: June 15, 2026)

**Goal:** Ship a working, trustworthy product on Google Play. Fix what's broken. Don't add features.

**Platform:** Google Play first. Apple App Store follows once Play Store is live and stable.

### ✅ Shipped and working

**Authentication**
- Sign up / sign in / sign out — email + password
- Forgot password — email reset link, confirm state
- Password reset — deep link handler, new password screen
- Confirm-email state shown after sign-up
- `handle_new_user()` trigger auto-creates `profiles` row

**Child profiles**
- Add child — name + exact age 2–17, optional personality notes
- Multi-child support — home screen handles 0/1/many children
- Guest path — child stored to AsyncStorage, migrates on sign-up

**AI script generation — all four modes**
- Per-child hub serves SOS / Reconnect / Understand / Conversation
- Edge Function: `chat-parenting-assistant` — Claude `claude-sonnet-4-20250514`
- Prompt assembly: age calibration, silent neurotype detection, trigger guidance, tone injection
- Result screen — collapsible cards, avoid section, feedback, save, share, voice

**Question mode**
- Home screen textarea → prose response → persisted to `parent_thoughts`
- Pin / delete / ask-another actions

**Safety**
- Safety filter — 8 crisis categories, runs before every AI call
- Crisis screen — adaptive content, real hotlines, deep links
- Safety events logged (CASCADE on deletion)
- Rate limiting — per-user burst + daily cap; crisis always bypasses

**Tone system**
- Three tones: Soft / Gentle / Direct — end-to-end wired
- Gentle is free-tier default; Soft + Direct are Sturdy+ gated

**Trigger classification**
- 15 categories logged to `interaction_logs.trigger_category`

**Subscription / billing (SDK wired)**
- `react-native-purchases` installed, `Purchases.configure()` called
- `useSubscription.ts` has real purchase / restore / entitlement logic
- Entitlement: `sturdy_plus`

**Paywall + gating**
- `upgrade.tsx` — Monthly $9.99 / Annual $69.99
- `PaywallSheet.tsx` — reusable bottom-sheet for locked features

**Account lifecycle**
- Pause (30-day reversible), permanent deletion, data export
- Daily cron auto-deletes accounts paused > 30 days

**Content screens**
- Saved scripts library, interaction history, child profile, settings

**Home screen dashboard (Golden Beam v6)**
- 3 dashboard cards: Last Session, Patterns, Sturdy+ Insight
- Auto-cycling, particles, parallax, child avatar selector

**Navigation**
- 3-tab bar: Home, Family, Settings

**Database**
- 14 tables, all with FK constraints + CASCADE deletion

---

### ✅ V1 launch fixes (completed)

| Fix | Status |
|-----|--------|
| Legal docs: full content in all 4 in-app screens | ✅ Done |
| Legal docs: full content in `docs/legal/*.md` | ✅ Done |
| Paywall copy: remove unbuilt features (weekly insights, patterns) | ✅ Done (PR #42) |
| Contact email: `sturdymobile@gmail.com` in legal screens | ✅ Done |
| Settings: removed lying toggles, wired dead tap targets to email | ✅ Done |
| Dead code deleted: `getScriptUsage.ts`, `sessionTimeout.ts`, `child-setup.tsx` | ✅ Done (PR #42) |
| Vaporware removed: home screen Sturdy+ card, child profile locked sections | ✅ Done (PR #42) |
| Feature Inventory updated: legal, schema integrity, architectural notes | ✅ Done (PR #42) |
| Dual quota system: `check_script_quota` (50), `check_question_quota` (25), `get_quota_counts` | ✅ Done |
| QuotaBar: two progress bars below Ask Sturdy pill, CTA at 80% | ✅ Done |
| QuotaResultFooter: remaining count on result screen, CTA at ≤10 remaining | ✅ Done |
| Voice gating: SOS free, all modes for Sturdy+ | ✅ Done |
| QuotaExceededError: routes to `/upgrade` on 402 (scripts or questions) | ✅ Done |
| All docs updated: Blueprint v8, Principles, Roadmap, Launch Plan | ✅ Done |

---

### 🔧 V1 remaining before submission

| # | Task | Priority | Owner | Notes |
|---|------|----------|-------|-------|
| 1 | Implement 1-child limit for free users | BLOCKING | Thai | Gate in `ChildProfileContext` or `child/new.tsx`, trigger PaywallSheet |
| 2 | Update `upgrade.tsx`: add "unlimited children" to feature list | BLOCKING | Thai | Child limit is key conversion lever — paywall must reflect it |
| 3 | Wire Sentry into mobile app | BLOCKING | Thai | Cannot launch blind |
| 4 | Google Play developer account setup | BLOCKING | Thai | $25 one-time fee, approval can take 48hrs |
| 5 | RevenueCat: production API key + create store products | BLOCKING | Thai | Products in Play Console → RevenueCat → `sturdy_plus` entitlement |
| 6 | Privacy policy public URL (needs domain + web deploy) | BLOCKING | Thai | Play Store requires live public URL |
| 7 | Play Store listing: screenshots, age rating, content advisory | BLOCKING | Thai | Use Play Store listing copy doc |
| 8 | Test full purchase/restore flow with Play sandbox | BLOCKING | Thai | End-to-end: purchase, restore, cancel |
| 9 | EAS production build for Android | BLOCKING | Thai | `eas build --platform android --profile production` |
| 10 | Submit to Google Play | BLOCKING | Thai | |
| 11 | Add thumbs up/down feedback after script results | HIGH | Thai | Log to `script_feedback` — your only quality signal |
| 12 | Home screen new-user state | HIGH | Thai | Show mode cards instead of empty dashboard for new users |

---

### 🚫 Explicitly NOT in V1

These are cut. Don't build, don't promise, don't touch:

- Weekly insights generation
- Emerging patterns detection
- Analytics backend (Sentry for crashes is enough)
- Push notification pipeline
- Help & FAQ content
- Contact form
- Multilingual support
- Any new AI features
- Apple App Store submission (follows after Play Store is stable)

---

## V2 — Post-Launch (data-driven priorities)

**Goal:** Learn from real users. Build what matters. Earn Sturdy+ value.

Priorities ordered by likely impact, subject to change based on V1 user data:

1. **Analytics backend** — funnel visibility before building retention features
2. **Apple App Store submission** — second platform once Play Store is stable
3. **Weekly insights** — strongest Sturdy+ value prop after unlimited scripts
4. **Script feedback analysis** — use thumbs up/down data to improve prompts
5. **Push notifications** — retention lever, only after organic return rate understood
6. **Emerging patterns** — needs data volume to be meaningful

---

## Phase 2 — Quality & Retention

**Goal:** Scripts that feel unmistakably better. Daily habits that keep parents coming back.

### Script Quality
- Prompt rebuilt around 12 source books with concrete examples
- Age calibration tested across all ages 2-17
- Neurotype detection accuracy improved
- Follow-up scripts tested and tuned

### Parent Wellbeing Layer
- Replace clinical crisis routing with parent support
- Repair guide — what to say after you lost your temper
- "You're not alone" — normalise the hard moments

### Daily Habit Features
- Daily reflection — one question per day
- Streak tracking — gentle, not gamified
- Pattern recognition — "You've described 6 transition situations this month"

---

## Phase 3 — Understand Your Child

**Goal:** Help parents understand why, not just what to say.

- Age Guide: what's developmentally normal at every exact age
- Behaviour Decoder: explain the driver behind recurring patterns
- Child Profile Insights: proactive, quiet observations over time

---

## Phase 4 — Grow as a Parent

**Goal:** Long-term parent development. Break cycles. Build awareness.

- Reflection prompts
- Book insights delivered contextually
- Parent Style Mirror
- Repair Guide (from Philippa Perry + Becky Kennedy)

---

## Phase 5 — Platform

**Goal:** Sturdy as a platform, not just an app.

- Multilingual (English → Spanish → French → Mandarin → Arabic)
- Family sharing / co-parent support
- Professional version for therapists and educators

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
