# Sturdy V1 Launch Plan

**Last updated: May 27, 2026**
**Target: June 15, 2026 (soft — can extend if needed)**
**Platform: Google Play first. Apple App Store follows.**
**Principle: Fix what's broken. Ship what works. Cut everything else.**

---

## V1 Product Definition

Sturdy V1 is a fully restructured freemium parenting companion. Four AI modes, safety filter, question mode, Golden Beam UI — with a deliberate conversion architecture built on top.

### What V1 includes

- **SOS is the hero.** Lives on the home screen. One input, one tap, result. No child hub middle step. The feature no other parenting app has.
- **Question Zone is child-anchored.** "Ask about [name]" — not generic AI querying. Three mode chips (Reconnect / Understand / Conversation) surface directly below the input, routing to the child hub with the correct mode.
- **50 scripts/month across all modes.** SOS, Question, Reconnect, Understand, Conversation — all count toward 50. Crisis (safety filter `response_type: 'crisis'`) is the only exemption. At $0.01/script, max cost is $0.50/month per free user.
- **25 questions/month** — separate quota bucket tracked by `useQuota`.
- **Crisis is always free.** Safety filter, crisis screen, hotlines — no paywall, no rate limit, never counted. Per Principle 4.
- **1 child profile for free users.** The real conversion lever. Parents with 2+ kids upgrade naturally. Gate fires in `family.tsx` and `child/new.tsx`.
- **Family tab routes to child profile screen.** Not the child hub. The profile screen is the insight and history layer — the place parents feel Sturdy knows their child.
- **Child profile is the premium conversion hub.** Triggers (top 1 free / all 5 premium), session history (locked), saved scripts (locked), patterns (V2 placeholder for all). Tapping locked sections fires `PaywallSheet`.
- **Sturdy+ at launch:** unlimited scripts + questions, unlimited children, tone selector (Soft/Direct), full child profile, session history, saved scripts library, voice on all modes.
- **Guest path stays.** Auth-optional. Guest data migrates on sign-up. New app, no brand recognition — let parents feel value before signup.
- **TrafficDots** — live quota indicator in header. Green → amber → red. Tap to expand with numbers and progress bars.

### What V1 does NOT include

- Weekly insights generation — V2
- Emerging patterns detection — V2 (placeholder shown in profile, informational only)
- Analytics backend (Sentry for crashes only)
- Push notification pipeline
- Help & FAQ content
- Contact form
- Multilingual support
- Any new AI features
- Apple App Store submission (follows Play Store)

These are V2. Don't touch them.

---

## Home Screen Architecture (locked)

```
GREETING — "Good evening, [Name]."
TRAFFIC DOTS — quota indicator (top right)

ZONE 1 — ASK ABOUT [CHILD]
  Label: "Ask about [name]" / fallback: "Ask Sturdy"
  Tagline: "What's on your mind about [name]?" / fallback: "The quiet questions matter too."
  Input → getQuestionResponse → /thought/[id]
  [ Reconnect ] [ Understand ] [ Conversation ] ← chips route to /child/[id]?mode=

DIVIDER — "From chaos to connection"

ZONE 2 — SOS (primary action)
  Child pills
  "What's happening with [name] right now?"
  Input → getParentingScript → /result (direct, no child hub step)
  Tone selector (Gentle free / Soft + Direct locked)
  "Always free · No paywall"
```

---

## Family Tab Architecture (locked)

```
FAMILY TAB
  "Your family"
  [ Tyler · Age 6 · Meltdown ]  → /child-profile/[id]
  [ Emma · Age 5 ]              → /child-profile/[id]
  [ + Add a child ]             → free + 1 child = PaywallSheet
                                → premium or 0 children = /child/new
```

---

## Child Profile Screen (locked — premium conversion hub)

```
HEADER — avatar, name, age, session count

TRIGGERS
  Free:    Top 1 trigger + "+N more — unlock with Sturdy+" row
  Premium: All 5 triggers with bar chart

SESSION HISTORY
  Free:    Locked card → PaywallSheet
  Premium: Last 5 sessions (mode badge, date, situation summary)

SAVED SCRIPTS
  Free:    Locked card → PaywallSheet
  Premium: Up to 3 scripts + "See all →"

PATTERNS
  All users: "Coming soon" — informational, no PaywallSheet

Edit [name]'s profile → /child/[id]?edit=1
```

---

## Launch Strategy: Play Store First

**Why Play Store first:**
- Google Play review is typically 1–3 days vs Apple's 1–7+ days
- No IAP review friction — Google approves products faster
- Get real users and data while preparing the Apple submission
- Live Play Store listing strengthens the Apple review submission

**Apple follows in V1.1** — submit to App Store once Play Store is live and stable.

---

## The Punch List

### Week 1 — Conversion Architecture + Infrastructure (May 21–28)

| # | Task | Owner | Status | Priority | Notes |
|---|------|-------|--------|----------|-------|
| 1 | PR #42: vaporware removal, dead code, doc fixes | Thai | ✅ Merged | BLOCKING | Clean baseline |
| 2 | PR #54: Question Zone restructure + mode chips | Thai | 🔄 CI running | BLOCKING | Awaiting Jest + Deno |
| 3 | Family tab: reroute to profile + 1-child gate | Claude Code | 📋 Brief ready | BLOCKING | `family.tsx` + `child/new.tsx` |
| 4 | Child profile redesign: premium gating hub | Claude Code | 📋 Brief ready | BLOCKING | `child-profile/[id].tsx` |
| 5 | PaywallSheet copy fix: remove vaporware | Claude Code | 📋 In brief #4 | BLOCKING | Remove "weekly insights" from body |
| 6 | Revert `check_monthly_quota` RPC: all modes count, crisis-only exemption | Thai | 📋 TODO | BLOCKING | Remove `mode != 'sos'` filter |
| 7 | Wire Sentry into mobile app | Thai | 📋 TODO | BLOCKING | Cannot launch blind |
| 8 | Create Google Play developer account | Thai | 📋 TODO | BLOCKING | $25 one-time fee, 48hr approval |

### Week 2 — Store Prep + Testing (May 28–June 4)

| # | Task | Owner | Status | Priority | Notes |
|---|------|-------|--------|----------|-------|
| 9 | Set up RevenueCat products for Google Play | Thai | 📋 TODO | BLOCKING | Play Console → RevenueCat → `sturdy_plus` |
| 10 | Deploy privacy policy to public URL | Thai | 📋 TODO | BLOCKING | Play Store requires live URL |
| 11 | Play Store listing: screenshots, age rating, content advisory | Thai | 📋 TODO | BLOCKING | |
| 12 | Test purchase/restore flow with Play sandbox | Thai | 📋 TODO | BLOCKING | End-to-end: purchase, restore, cancel |
| 13 | Fix lying toggles: persist or remove push/research consent | Thai | 📋 TODO | SHOULD DO | Toggle that resets = lying to users |
| 14 | Add thumbs up/down after every script result | Thai | 📋 TODO | HIGH | Log to `script_feedback`. Your only signal. |
| 15 | EAS production build for Android | Thai | 📋 TODO | BLOCKING | `eas build --platform android --profile production` |
| 16 | Internal testing track on Google Play | Thai | 📋 TODO | HIGH | Upload AAB, test on real devices |

### Week 3 — Submit + Beta (June 4–11)

| # | Task | Owner | Status | Priority | Notes |
|---|------|-------|--------|----------|-------|
| 17 | Open testing: 5–10 real parents | Thai | 📋 TODO | HIGH | Even a few days of feedback is gold |
| 18 | Submit to Google Play production review | Thai | 📋 TODO | BLOCKING | Usually 1–3 days |
| 19 | Flip RevenueCat to production API key | Thai | 📋 TODO | BLOCKING | Only after store products approved |
| 20 | Incorporate tester feedback | Thai | 📋 TODO | HIGH | Note what's V2, don't scope-creep |

### Week 4 — Launch (June 11–15)

| # | Task | Owner | Status | Priority | Notes |
|---|------|-------|--------|----------|-------|
| 21 | Fix any Play Store review feedback | Thai | 📋 TODO | BLOCKING | Variable |
| 22 | Go live on Google Play | Thai | 📋 TODO | — | 🚀 |
| 23 | Begin Apple App Store submission prep | Thai | 📋 TODO | NEXT | Screenshots, listing, submit |

---

## Claude's Task List

### Documents & Content

| # | Deliverable | Status | Notes |
|---|------------|--------|-------|
| C1 | Updated Master Blueprint | ✅ Done | v7 — child limit, quota counter, new free tier |
| C2 | Updated Roadmap | ✅ Done | V1/V2 split, Play Store first |
| C3 | Long-form Privacy Policy | ✅ Done | Wired into all 4 in-app legal screens |
| C4 | Long-form Terms of Service | ✅ Done | Wired into in-app screens |
| C5 | Long-form AI Limitations disclosure | ✅ Done | Wired into in-app screens |
| C6 | Long-form Medical Safety disclosure | ✅ Done | Wired into in-app screens |
| C7 | Play Store listing copy | 📋 TODO | Title, short desc, full desc, content rating |
| C8 | Updated `upgrade.tsx` paywall copy | ✅ Done (PR #42) | Vaporware removed, child limit added |
| C9 | Updated Product Principles | ✅ Done | Principle 6 rewritten for new model |
| C10 | Updated CLAUDE.md Patch Notes | ✅ Done | New quota + child limit |

### Claude Code Briefs

| # | Deliverable | Status | Notes |
|---|------------|--------|-------|
| B1 | Question Zone restructure + mode chips | ✅ Done → PR #54 | CI running |
| B2 | Family tab reroute + 1-child gate | ✅ Brief written | Ready to run after #54 |
| B3 | Child profile redesign — premium hub | ✅ Brief written | Ready to run after B2 |

### Web Landing Page

| # | Deliverable | Status | Notes |
|---|------------|--------|-------|
| C11 | Landing page design + code (`apps/web/`) | 📋 TODO | Marketing homepage + `/privacy` route |
| C12 | Public-facing privacy policy page | 📋 TODO | Same content as C3, formatted for web |

---

## Key Decisions (locked for V1)

| Decision | Resolution | Rationale |
|----------|-----------|-----------|
| Launch platform | Google Play first | Faster review, no IAP friction |
| Guest mode | Keep it | New app, no brand. Value before signup. |
| SOS position | Hero on home screen, direct to result | No child hub step — fastest path to value |
| Question Zone | Child-anchored, mode chips below | Not generic AI — specific to your child |
| SOS quota | Counts toward 50 (all modes equal) | $0.50/month max. Child limit is the real lever. |
| Crisis exemption | Always free, never counted | Safety filter handles before quota check |
| Child limit | 1 free, unlimited Sturdy+ | Strongest conversion lever |
| Family tab | Routes to child profile, not child hub | Profile = insight layer = conversion |
| Child profile | Premium hub with gated sections | Triggers/history/scripts locked for free |
| Patterns | V2 placeholder — informational for all | Not built, honest about it |
| Sturdy+ at launch | Unlimited scripts + children + tone + full profile | Only what's built |
| Weekly insights / patterns | Cut from V1 paywall | Not built. V2. |
| PaywallSheet copy | Updated — no vaporware | "weekly insights" removed |
| Analytics | Sentry only for V1 | Full analytics is V2 |
| Web landing page | Marketing + privacy URL | Minimum viable web presence |
| Timeline | June 15 target, flexible | Ship right > ship fast |

---

## V2 Priorities (post-launch, data-driven)

1. **Analytics backend** — funnel visibility before retention features
2. **Weekly insights** — strongest Sturdy+ value prop, needs data volume
3. **Emerging patterns** — needs interaction_logs volume to be meaningful
4. **Script feedback analysis** — thumbs up/down → prompt improvement
5. **Apple App Store launch** — submit once Play Store is stable
6. **Push notifications** — retention lever, understand organic return first
7. **Family tab co-parent sharing** — Phase 2 social layer

---

## Risk Register

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| PR #54 CI fails | LOW | 1 day delay | Monitor — fix and re-run |
| Family tab brief causes regression in home screen | LOW | Navigation broken | Sequential PRs — don't run in parallel |
| Google Play rejects on first submission | LOW | 1–3 day delay | Clean listing, honest content rating, live privacy URL |
| Edge Function errors invisible in prod | HIGH without Sentry | Silent churn | Wire Sentry Week 1. Non-negotiable. |
| Child profile locks feel punitive | LOW | Negative reviews | Free tier still shows top trigger + empty states with warm copy |
| RevenueCat test key left in prod | LOW | Billing broken | Checklist: flip key Week 4 after approval |
| 1-child limit surprises users | MEDIUM | Negative reviews | Visible in paywall feature list before they hit the wall |
| Landing page not ready for store listing | MEDIUM | Blocks submission | Claude builds it this week |

---

## Post-Launch Checklist (June 15–22)

- [ ] Monitor Sentry for crash spikes
- [ ] Check Edge Function error rates in Supabase dashboard
- [ ] Review first script feedback batch (thumbs up/down)
- [ ] Watch RevenueCat for purchase/restore issues
- [ ] Respond to Play Store review feedback within 24 hrs
- [ ] Collect 3–5 user testimonials
- [ ] Begin Apple App Store submission prep

---

## The Standard

> If a stressed parent opens Sturdy in a hard moment, the product should feel:
> **Fast. Calm. Clear. Human. Useful within seconds.**

Everything on this list serves that. Nothing else ships until it does.
