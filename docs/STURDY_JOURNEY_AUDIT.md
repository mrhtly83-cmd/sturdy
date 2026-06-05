# Sturdy — Journey Audit Toward a Premium Parenting App

**Purpose:** A systematic, journey-based audit so we stop chasing isolated leads and instead
walk the parent's actual path end-to-end. Each stage is finished — must-cover + enhancements +
competitor benchmark — before moving to the next. Once a stage passes, we don't reopen it.

**The standard (every item measured against this):**
> If a stressed parent moves through this stage, is it *faster, calmer, clearer, more useful,*
> and does it build trust? Does it serve the core promise — "the right words, the moment you
> need them" — without trading trust for conversion (Principle 7)?

**The gate this audit serves:** ~10 real parents using SOS without a trust-breaking bug.
So priority = what a test parent hits first and most.

**2026 best-practice benchmarks (from current competitor research — Calm, Headspace, Duolingo,
Flo, Blinkist, Yazio, Washington Post, etc.):**
- First session loses 70–90% of users; median day-1 retention ~25%. Onboarding is make-or-break.
- Winning patterns: **a meaningful first action**, **progressive disclosure**, **an empty state
  that feels filled**, **delayed signup** (value before account), **personalization via smart
  questions**, **quick wins**, **let users explore before committing**, **well-timed social
  proof**, **risk-free trial framing**.
- Health/sensitive apps (Flo, Calm, Headspace) lead with empathy + a personalization quiz that
  makes the product feel "about me" before asking for anything.

---

## THE SIX STAGES (map)

1. **Onboarding / First Open** — welcome → value → personalize (child) → first win → account
2. **Core Loop (SOS)** — Home → SOS → script → result → back  *(P0 — every parent, most often)*
3. **Reflective Loop (Ask)** — Ask → thought → saved
4. **Review** — Family → child profile → sessions / saved / insights
5. **Convert** — hit a limit → paywall → subscribe
6. **Account** — settings, pause, delete, restore, legal

Priority order for the audit: **1 → 2 → 5 → 4 → 3 → 6** (first-impression + core loop + the
honest-paywall fix first, since those touch trust and the test-parent path most).

═══════════════════════════════════════════════════════════════
# STAGE 1 — ONBOARDING / FIRST OPEN  *(in progress)*
═══════════════════════════════════════════════════════════════

**Stage goal:** A stressed, skeptical parent goes from install to their *first useful script*
feeling "this gets me" — with the least friction and the most trust, and without being asked
to label or diagnose their child.

**Sturdy's north-star for this stage:** "first script by minute two" (from the blueprint) +
enact the voice, never describe it.

---

## 1A. MUST-COVER (correctness / trust / no-blockers)

These must be right before any real parent sees onboarding:

- [ ] **Name capture (KNOWN BUG):** signup writes email-derived junk into `profiles.full_name`
  → greeting showed "Good night, Mr." Home now degrades gracefully, but the ROOT — asking the
  parent's name properly — is unbuilt. Onboarding must capture a real first name (or capture
  none and greet without one). Never scrape the email local-part.
- [ ] **Email confirmation OFF (LAUNCH BLOCKER):** any fake email becomes an active account and
  farms the 75/25 quota. Needs custom SMTP before enabling. Purge test/fake accounts pre-launch.
- [ ] **Add Child = name + age only** (age exact, Principle 3 — drum picker, no bands). NO
  neurotype chip (Principle 1 — silent detection only). The "tell us about [child]" free-text
  field is planned but separate; confirm whether it's in onboarding v1 or deferred.
- [ ] **Account creation flow** works end-to-end: sign up, sign in, sign out, error states.
- [ ] **Crisis path reachable** even during onboarding (a parent could install mid-crisis).
- [ ] **No dead routes / white screens** anywhere in the flow.
- [ ] **Legal:** Terms + Privacy linked and current (75/25, crisis-free reconciled).
- [ ] **Welcome copy = locked thesis:** "You don't need to be a perfect parent. You just need
  the right words at the right time." Voice enacted, not explained.

---

## 1B. CURRENT-STATE CHECK (verify in code/on-device — fill in during walk-through)

Run/observe and record reality:
- [ ] What screens exist today? (Roadmap says: welcome line + live R/C/G preview → add child →
  account. Architecture-shift doc said 3 screens. Confirm actual shipped flow.)
- [ ] Is there a **live first-script preview** (the "aha" before signup), or does it ask for an
  account first? (Delaying signup until after value is a top-tier 2026 pattern.)
- [ ] Where does account creation sit — before or after the first win?
- [ ] Onboarding taglines currently shown? (We drafted improved ones — see content set.)
- [ ] Is the "tell us about [child]" field present, or deferred to V2?

---

## 1C. ENHANCEMENTS / IMPROVEMENTS (ranked by impact on activation + trust)

**P0 — fix before launch (trust / blocker):**
1. **Capture the parent's name properly** (or greet nameless). Kills the email-junk root.
   One warm screen: "What should Sturdy call you?" — optional, skippable, never scraped.
2. **Resolve email confirmation** (SMTP) so the flow can be trusted with real signups.

**P1 — high activation lift (the "aha" / first win):**
3. **Deliver a real first script BEFORE asking for an account.** 2026 best practice
   (delayed signup) + the blueprint's "first script by minute two." Let the parent type one
   real hard moment, get one real (or Regulate-only teaser) script, THEN create the account
   to save it. This is the single biggest activation lever — value before commitment.
4. **Personalize via one smart question, in-voice.** Like Flo/Calm: a single warm question
   ("What's the hardest part of your day with them right now?") that makes Sturdy feel
   about-me immediately AND seeds the first script. Not a long quiz — one question, quick win.
5. **Empty state that feels filled:** after onboarding, Home shouldn't feel blank. The
   adaptive Home + a seeded recent-thought/example makes the first post-onboarding screen feel
   alive, not empty (2026 pattern).

**P2 — trust amplifiers (later, not blocker):**
6. **Social proof, lightly:** one honest line or testimonial near the value screen (Calm/Craft
   pattern) — only when real (don't fake reviews). Defer until you have real parent quotes.
7. **Risk-free framing** when the paywall eventually appears in-flow (WaPo pattern) — but keep
   it honest (no "unlimited free" lie).

---

## 1D. COMPETITOR BENCHMARK — how the best do onboarding (2026)

| App | What they nail | What Sturdy should borrow |
|---|---|---|
| **Calm / Headspace** | Empathy-first, calm visuals, a personalization quiz that frames the product as "about you" before any ask | Lead with empathy ("parenting hands you moments no one prepared you for"); one smart question |
| **Flo** | Sensitive-topic onboarding; warm, non-clinical, personalization without judgment | The non-judgment model — Sturdy's "no diagnosis needed" is the same ethos; lean into it |
| **Duolingo** | Meaningful first action immediately; commitment via a quick win | First script before signup = Sturdy's "first lesson" equivalent |
| **Blinkist / Yazio** | Personalize with smart questions → quick win → THEN paywall after the aha | Order: value → personalize → win → (later) ask |
| **Washington Post** | Short, striking; risk-free trial framing after showing value | Keep it short; honest trial framing when paywall enters |
| **Craft** | Social proof (real reviews) builds trust early | Add real parent quotes once you have them — not before |

**Where Sturdy can BEAT them:** none of these is a parenting-crisis tool. Sturdy's unfair
advantage at onboarding is **immediate, real utility in a genuine hard moment** — most apps
onboard with abstract promises; Sturdy can hand a parent words that work *in the first 90
seconds.* No meditation app can do that. Lead with the live first script and you out-onboard
all of them on time-to-value.

---

## 1E. STAGE 1 PUNCH-LIST (what becomes briefs)

- [ ] **Brief: Welcome/onboarding rebuild** — capture name properly, one smart question,
  first-script-before-signup, improved taglines, empty-state-that-feels-filled.
- [ ] **Blocker (separate track): email confirmation + SMTP.**
- [ ] **Decision: is "tell us about [child]" free-text in onboarding v1 or V2?**
- [ ] Verify legal links + crisis reachability in-flow.

**Stage 1 exit criteria:** a new parent can install → feel "this gets me" → get one real script
→ create an account to keep it → land on a Home that feels alive — with a real name (or none,
never junk), no dead routes, crisis always reachable, and nothing that asks them to label their
child. When all 1A boxes pass on-device and the punch-list briefs are shipped, Stage 1 is DONE
and we don't reopen it.

═══════════════════════════════════════════════════════════════
# STAGES 2–6 — to be built when we reach them
═══════════════════════════════════════════════════════════════
(Framework above. We walk Stage 2 (Core Loop) next, same structure: must-cover / current-state /
enhancements / competitor benchmark / punch-list / exit criteria. Not started — finish Stage 1
first.)

---

## Stage 1 progress update — 2026-06-05

**COMPLETED this session:**
- [x] Welcome copy: all three beats replaced with Set C — The Understated register (locked)
- [x] Trust lines added to each beat (Style A — italic amber), sourced and verified from privacy policy + paywall
- [x] Verified on-device: all three beats clean, no regressions

**STILL OPEN (Stage 1 not complete):**
- [ ] Fixed-drawer layout refactor — buttons fall off viewport on small screens (next brief)
- [ ] Name capture — email-junk scrape root unresolved (SMTP dependency)
- [ ] First-script-before-signup — parked as post-test priority
- [ ] Email confirmation + SMTP — tracked launch blocker, separate session
- [ ] Crisis reachability during onboarding — not yet verified
- [ ] Legal links verified in-flow — not yet checked

**Next action:** Write and execute fixed-drawer layout brief. That is the structural Stage 1 blocker.

## Stage 1 progress update — 2026-06-05 (fixed-drawer)

**COMPLETED this session:**
- [x] Fixed-drawer layout — buttons pinned, visible from slide 1 on all screens

**Stage 1 structural work now COMPLETE.**

**Remaining open items (not blocking Stage 1 exit):**
- [ ] Spacing: gap between watercolor image and headline — minor polish,
      single paddingTop reduction on haloContainer, low risk
- [ ] Name capture — email-junk scrape root unresolved (SMTP dependency)
- [ ] First-script-before-signup — parked as post-test priority
- [ ] Email confirmation + SMTP — tracked launch blocker, separate session
- [ ] Crisis reachability during onboarding — not yet verified
- [ ] Legal links verified in-flow — not yet checked

**Next:** Decide — polish the image/headline spacing now, or move to Stage 2
(Core Loop / SOS).
