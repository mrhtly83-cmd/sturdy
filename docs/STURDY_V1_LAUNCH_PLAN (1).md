# Sturdy V1 Launch Plan

**Target: June 15, 2026 (soft — can extend if needed)**
**Platform: Google Play first. Apple App Store follows.**
**Principle: Fix what's broken. Ship what works. Cut everything else.**

---

## V1 Product Definition

Sturdy V1 is the product as it exists today — four AI modes, safety filter, question mode, Golden Beam UI — with loose wires tightened and operational gaps closed.

### What V1 includes

- **Guest path stays.** New app, no brand recognition. Forcing auth before value kills conversion. The guest-to-auth migration already works. Update the Master Blueprint to reflect this.
- **SOS is unlimited and free.** No quota, no paywall, no exceptions. This is the hook, the differentiator, the word-of-mouth engine. Update the `check_monthly_quota` RPC to exclude SOS mode from the count.
- **50/month free quota** applies to Question, Reconnect, Understand, and Conversation modes only.
- **Sturdy+ at launch is simple:** unlimited scripts across all modes + tone selector (Soft/Direct). That's it. No weekly insights, no emerging patterns on the paywall pitch.
- **Crisis is always free.** Safety filter, crisis screen, hotlines — no paywall, no rate limit. Per Principle 4.
- **Family tab** shows a "Coming soon" message. Not empty, not pretending.

### What V1 does NOT include

- Weekly insights generation
- Emerging patterns detection
- Analytics backend (Sentry for crashes only)
- Push notification pipeline
- Help & FAQ content
- Contact form
- Multilingual support
- Any new AI features

These are V2. Don't touch them.

---

## Launch Strategy: Play Store First

**Why Play Store first:**
- Google Play review is typically 1–3 days (vs Apple's 1–7+ days with frequent rejections)
- No IAP review friction — Google approves products faster
- Get real users and data while preparing the Apple submission
- Live Play Store listing strengthens the Apple review submission

**Apple follows in V1.1** — submit to App Store once Play Store is live and stable. Use the first week of real Play Store data to fix any issues before Apple review.

---

## The Punch List

### Week 1 — Infrastructure + Store Setup (May 21–28)

| # | Task | Owner | Priority | Est. effort | Notes |
|---|------|-------|----------|-------------|-------|
| 1 | Wire Sentry into mobile app | Thai | BLOCKING | 2–4 hrs | Cannot launch blind. `npx expo install @sentry/react-native` + configure. |
| 2 | Resolve guest mode: update Master Blueprint to match shipped reality | Claude | BLOCKING | 30 min | Doc fix — code already works |
| 3 | Fix quota RPC: SOS unlimited, quota counts other modes only | Thai | BLOCKING | 1–2 hrs | `WHERE mode != 'sos'` in `check_monthly_quota` |
| 4 | Delete orphaned welcome files + vestigial OnboardingProvider | Thai | SHOULD DO | 30 min | `trial.tsx`, `trial-result.tsx`, `child-setup.tsx`, `signup.tsx` |
| 5 | Create Google Play developer account (if not done) | Thai | BLOCKING | 1 hr | $25 one-time fee. Approval can take 48 hrs for new accounts. |
| 6 | Set up RevenueCat products for Google Play | Thai | BLOCKING | 2–3 hrs | Products in Google Play Console → RevenueCat dashboard → `sturdy_plus` entitlement |
| 7 | Simplify `upgrade.tsx` paywall: only promise unlimited + tone | Claude | BLOCKING | 1 hr | Remove weekly insights / patterns from pitch |
| 8 | Write long-form legal docs (Privacy, ToS, AI Limitations, Medical Safety) | Claude | BLOCKING | 4–6 hrs | Draft full content for all 4 screens |
| 9 | Build web landing page (marketing + public privacy URL) | Claude | BLOCKING | 4–6 hrs | Next.js site at `apps/web/`. Needs `/privacy` route for store listing. |
| 10 | Write Play Store listing copy (title, descriptions, content rating) | Claude | BLOCKING | 2 hrs | Optimized for parenting keywords |

### Week 2 — Integration + Testing (May 28–June 4)

| # | Task | Owner | Priority | Est. effort | Notes |
|---|------|-------|----------|-------------|-------|
| 11 | Wire legal docs into `app/legal/` screens | Thai | BLOCKING | 1–2 hrs | Content from Claude → replace placeholders |
| 12 | Deploy privacy policy to public URL on web | Thai | BLOCKING | 1 hr | Play Store requires live URL |
| 13 | Fix lying toggles: persist or remove push notification + research consent | Thai | SHOULD DO | 1–2 hrs | Toggle that resets = lying to users |
| 14 | Add "Coming soon" to Family tab | Thai | SHOULD DO | 30 min | Honest placeholder |
| 15 | Add thumbs up/down after every script result | Thai | HIGH | 2–3 hrs | Log to `script_feedback`. Your only signal. |
| 16 | Test purchase/restore flow with Google Play sandbox | Thai | BLOCKING | 2–3 hrs | End-to-end: purchase, restore, cancel |
| 17 | Build EAS production build for Android | Thai | BLOCKING | 1–2 hrs | `eas build --platform android --profile production` |
| 18 | Internal testing track on Google Play | Thai | HIGH | 1 hr | Upload AAB, test on real devices |

### Week 3 — Submit + Beta (June 4–11)

| # | Task | Owner | Priority | Est. effort | Notes |
|---|------|-------|----------|-------------|-------|
| 19 | Open testing track — share with 5–10 real parents | Thai | HIGH | Ongoing | Even a few days of real feedback is gold |
| 20 | Submit to Google Play production review | Thai | BLOCKING | 1 hr | Usually approved in 1–3 days |
| 21 | Flip RevenueCat to production API key | Thai | BLOCKING | 30 min | Only after store products approved |
| 22 | Incorporate tester feedback — fix what's broken | Thai | HIGH | Variable | Note what's V2, don't scope-creep |

### Week 4 — Launch (June 11–15)

| # | Task | Owner | Priority | Est. effort | Notes |
|---|------|-------|----------|-------------|-------|
| 23 | Fix any Play Store review feedback | Thai | BLOCKING | Variable | Google is usually faster than Apple here |
| 24 | Go live on Google Play | Thai | — | — | 🚀 |
| 25 | Begin Apple App Store submission prep | Thai | NEXT | 3–4 hrs | Screenshots, listing, submit for review |

---

## Claude's Task List (What I Build For You)

These are the deliverables I produce. You review, adjust, and wire them into the codebase.

### Documents & Content

| # | Deliverable | Status | Notes |
|---|------------|--------|-------|
| C1 | Updated Master Blueprint — resolves guest mode + quota contradictions | TODO | Aligns Blueprint with shipped code + V1 decisions |
| C2 | Updated Roadmap — reflects V1/V2 split and Play Store first | TODO | Replaces current Phase 1 "remaining" section |
| C3 | Long-form Privacy Policy | TODO | Covers: data collected, AI processing, child data, safety events retention, deletion, third parties (Supabase, Anthropic, RevenueCat) |
| C4 | Long-form Terms of Service | TODO | Covers: acceptable use, AI limitations, not medical advice, account lifecycle, billing |
| C5 | Long-form AI Limitations disclosure | TODO | What the AI does and doesn't do. Honest about capabilities. |
| C6 | Long-form Medical Safety disclosure | TODO | Not a substitute for professional help. When to call a real professional. |
| C7 | Play Store listing copy | TODO | Title, short description, full description, content rating questionnaire guidance |
| C8 | Updated `upgrade.tsx` paywall copy | TODO | Only promises unlimited scripts + tone selector. No vaporware. |

### Web Landing Page

| # | Deliverable | Status | Notes |
|---|------------|--------|-------|
| C9 | Landing page design + code (`apps/web/`) | TODO | Marketing homepage + `/privacy` route. Matches Golden Beam identity. |
| C10 | Public-facing privacy policy page | TODO | Same content as C3, formatted for web |

### Codebase Cleanup (when repo connected)

| # | Deliverable | Status | Notes |
|---|------------|--------|-------|
| C11 | Delete orphaned welcome files + clean imports | TODO | Needs repo access |
| C12 | Family tab "Coming soon" screen | TODO | Needs repo access |
| C13 | Review + fix any doc contradictions across all docs/ files | TODO | Needs repo access |

---

## Key Decisions (locked for V1)

| Decision | Resolution | Rationale |
|----------|-----------|-----------|
| Launch platform | Google Play first | Faster review, no IAP friction, get real data before Apple |
| Guest mode | Keep it | New app, no brand. Let users feel value before signup. |
| SOS quota | Unlimited, free forever | Principle 6. Never paywall a parent mid-meltdown. |
| Sturdy+ at launch | Unlimited scripts + tone only | Don't promise what isn't built. |
| Weekly insights / patterns | Cut from V1 | Not built. Remove from paywall. V2. |
| Family tab | "Coming soon" placeholder | Honest > empty. |
| Dead welcome code | Delete before launch | Prevents navigation bugs. |
| Analytics | Sentry only for V1 | Full analytics is V2. |
| Web landing page | Marketing + privacy URL | Minimum viable web presence for store listing |
| Timeline | June 15 target, flexible | Ship right > ship fast. Can extend if needed. |

---

## V2 Priorities (post-launch, data-driven)

1. **Analytics backend** — funnel visibility before retention features
2. **Weekly insights** — strongest Sturdy+ value prop
3. **Script feedback analysis** — improve prompts from thumbs up/down data
4. **Apple App Store launch** — submit once Play Store is stable
5. **Push notifications** — retention lever
6. **Family tab / co-parent sharing** — Phase 2
7. **Emerging patterns** — needs data volume

---

## Risk Register

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Google Play rejects on first submission | LOW | 1–3 day delay | Clean listing, honest content rating, live privacy URL |
| Edge Function errors invisible in prod | HIGH without Sentry | Silent churn | Wire Sentry Week 1. Non-negotiable. |
| Quota RPC counts SOS toward limit | HIGH (current bug) | Violates Principle 6 | Fix Week 1. Filter by mode. |
| Real parents find scripts unhelpful | MEDIUM | PMF risk | Thumbs up/down + beta testers → fast iteration |
| RevenueCat test key left in prod | LOW | Billing broken | Checklist: flip key Week 4, after approval |
| Landing page not ready for store listing | MEDIUM | Blocks submission | Claude builds it Week 1 |

---

## Post-Launch Checklist (June 15–22)

- [ ] Monitor Sentry for crash spikes
- [ ] Check Edge Function error rates in Supabase dashboard
- [ ] Review first script feedback batch
- [ ] Watch RevenueCat for purchase/restore issues
- [ ] Respond to Play Store review feedback within 24 hrs
- [ ] Collect 3–5 user testimonials
- [ ] Begin Apple App Store submission

---

## The Standard

> If a stressed parent opens Sturdy in a hard moment, the product should feel:
> **Fast. Calm. Clear. Human. Useful within seconds.**

Everything on this list serves that. Nothing else ships until it does.
