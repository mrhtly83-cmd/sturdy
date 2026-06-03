# Session Handoff (v4) — Sturdy

**Last updated:** 2026-06-02 (Home/child-profile/voice shipped; journey audit started; paywall
copy locked; vision re-anchored from founder's original docs)
**How to use:** SINGLE source of truth. Open ONE new chat, attach this file + STURDY_JOURNEY_AUDIT.md,
say "resume from this handoff." Don't run parallel chats. Don't jump leads — follow the journey.

═══════════════════════════════════════════════════════════════
## THE VISION (re-anchored — this is the soul; reflect it in every call)
═══════════════════════════════════════════════════════════════
Sturdy is the go-to parenting companion for every parent at every level. It helps parents:
1. **Respond in the moment** — calm, age-specific, human-sounding scripts
2. **Understand their child** — why this happens, what's normal, what helps
3. **Grow as a parent** — patterns, repair, reflection
4. **Find their own voice** — scripts are a starting point, not lines to memorise

- **Core question:** "What should I say right now?"
- **Deeper promise:** A better parent, one moment at a time. (NOT taught/lectured — accrued
  quietly from many small moments of responding well. The transformation is a byproduct, never
  the pitch. We do NOT promise "you'll become" or "grow with you" — we can't promise outcomes.)
- **Philosophy:** Sturdy gives you the words. Use them exactly, or make them yours.
- **The moat is the VOICE, not the AI.** "A wise friend on a long walk." Warm, plain, no
  therapy-speak. Voice drift = P0 bug (users feel it, can't name it, churn). Verified: the
  script prompt enforces this in code (bans "I hear you", "co-regulate", robot prefixes; active
  voice; peer-not-professor).
- **Emotional register:** capable, not dependent. Relief, not guilt. First place you go, not a
  place you're trapped. Deliberately NOT engineered for addictive daily use.
- **"Sturdy" the name:** a sturdy child, a steady parent — what holds under pressure.

**The marketing position (built this session, all claims verified true against the prompt):**
- Sell the felt benefit, never the mechanism. Never name authors. Never expose neurotype detection.
- Differentiation vs. Google / generic AI: real child-development research + your child's exact
  age + adapts to how your child responds (silently) + calmest when it's hardest (crisis throttle).
- vs. therapy/books: help at 6pm tonight, not next Tuesday; 12 books distilled into one thing to say.

═══════════════════════════════════════════════════════════════
## OPERATING CONTRACT
═══════════════════════════════════════════════════════════════
Fractional CPO & Senior Advisor — Product, Conversion & Growth Strategist.
- Code is ground truth. Verify; docs drift (we keep finding stale "50 scripts" — real is 75).
- Honest pushback over agreeableness. When Thai echoes options, MAKE THE CALL; don't re-list.
- Growth must be TRUST-LED. No dark patterns (Principle 7). "Strategist reasoning" must map to
  real conversion/retention/trust — if it's taste, say so.
- Step-by-step, one command at a time. When giving an edit, ALWAYS give line number(s) then the
  replacement. Thai is in a Codespace at /workspaces/sturdy on a Chromebook.
- Two seats: THIS chat = judgment/decisions. CLAUDE CODE (in Codespace) = hands (audit + fix).
  This env has no repo network access — Thai pastes terminal output / screenshots / zips.
- **DON'T JUMP LEADS.** Follow the journey audit stage by stage. Park out-of-stage items; track
  them; fix them when their stage comes up. (This was the key lesson of the 2026-06-02 session.)

═══════════════════════════════════════════════════════════════
## ▶ THE METHOD — Journey Audit (current working mode)
═══════════════════════════════════════════════════════════════
See STURDY_JOURNEY_AUDIT.md. Six stages, fixed order, each finished before the next, never reopened.
Per stage: (1) we define must-cover + enhancements, (2) Claude Code audits real code → reports
current state, (3) we judge gaps, (4) Claude Code fixes via brief, (5) Thai tests on-device → stage
DONE. Screenshots = what it looks like; Claude Code = what it actually is; advisor = the bridge/judgment.

Stage order: 1 Onboarding → 2 Core Loop (SOS) → 5 Convert/Paywall → 4 Review → 3 Reflective (Ask) → 6 Account.
**CURRENT POSITION: Stage 1 (Onboarding) — framework + checklist done; about to audit real flow via screenshots + Claude Code.**

═══════════════════════════════════════════════════════════════
## OPEN ITEMS — tracked, parked until their stage (DO NOT fix early)
═══════════════════════════════════════════════════════════════
🔴 **PR #63 "Retire old child hub; cut Home mode pills; consolidate to child-profile" — OPEN, NOT
   MERGED, NOT REVIEWED.** Built by Claude Code, sitting on its branch. Cuts the redundant second
   script-generator: removes Home Reconnect/Understand/Conversation pills, retires `child/[id]`,
   redirects result "Back" → `child-profile/[id]`, disables the (non-functional) edit link.
   **Decision: let it SIT until we reach Stage 2 (Core Loop) / Stage 4 (Review).** Review + on-device
   test the whole stage, then merge. Do not merge mid-journey.
🔴 **Paywall "unlimited SOS scripts — ALWAYS FREE" is a LIE (live in app).** Screenshot confirmed the
   upgrade screen lists "Unlimited SOS scripts" under Always Free, but shipped model is 75/25-then-wall.
   This is a bait-and-switch (violates Principle 7) and sits on the legally-sensitive subscription
   screen. **FIX WHEN WE REACH STAGE 5 (Convert/Paywall).** Replace with honest line. Tracked — do
   not forget. (Final paywall COPY already locked — see below — just not yet built/shipped.)
🔴 **Email confirmation OFF (launch blocker).** Fake emails → active accounts farming 75/25 quota.
   Needs custom SMTP before enabling. Purge fake/test accounts pre-launch. Belongs to Stage 1 must-cover.
🔴 **Parent name-capture bug (root).** Signup writes email-junk into `profiles.full_name`. Home greeting
   degrades gracefully now, but real fix = capture name properly in onboarding. Stage 1 must-cover.
🟡 **Family recent-thoughts strip** — brief written (BRIEF_family_recent_thoughts.md), NOT sent. Stage 4.
🟡 Quota doc-sync: stale "50/scripts" still in launch plan + an edge-function comment (line ~324). Real
   is 75/25. Docs-only cleanup.
🟡 Voice TTS quality: `expo-speech` (device TTS) is shipped + monetized (free on SOS, Sturdy+ other
   modes). Listen on-device — is robotic TTS warm enough, or does it need better TTS (ElevenLabs) in V2?
🟡 Sturdy+ "unlimited" cost exposure (parking lot). Sentry IP privacy fix.

═══════════════════════════════════════════════════════════════
## LOCKED DECISIONS (this session)
═══════════════════════════════════════════════════════════════
- **Free tier = 75 scripts + 25 questions/month, dual buckets, crisis free+uncounted.** Principle 6
  must be REWRITTEN (it still says "unlimited, never paid"). Rewrite drafted in content set. Logged
  amendment required.
- **Gender-tone: NOT building.** Boy/girl script differentiation rejected — wrong axis, risks
  stereotyping + collides with silent-inference philosophy. The architecture already personalizes by
  age + intensity + neurotype (silent) + tone + length. Per-child specificity comes from the (planned)
  free-text "tell us about [child]" field, not a gender flag. No boy/girl avatars either.
- **Neurotype: silent detection ONLY (Principle 1 intact).** No chip, no picker. Add Child = name + age.
  The "tell us about [child]" free-text field (planned) feeds silent detection — richer than a checkbox.
- **Child screens consolidated:** Home generates; `child-profile/[id]` is the review/profile space
  (sessions/saved/triggers, patterns "coming soon"). Old `child/[id]` hub retired (PR #63, pending).
- **Edit child = disabled until V2** (nothing meaningful to edit beyond name/age yet; returns with the
  free-text field).
- **Paywall COPY locked** (final mockup built, not yet shipped): empathy open ("Some moments don't come
  with answers. Sturdy does.") → "Words that actually fit" (age / shaped-to-child / research / calmest-
  when-hardest) → comparison (therapist/books/Google vs "< a coffee a week, right now") → plans
  ($9.99/mo, $69.99/yr) → philosophy close. Pricing/RevenueCat IDs to verify at build. Therapist/books
  $ figures: Thai approved keeping.
- **Greeting: time-of-day, graceful no-name** (shipped). No random variation. No "Good night."
- **Insights/hooks for subscription: PARKED.** Decided to ship and get ~10 real parents' feedback FIRST,
  then decide retention/hooks from data — not build hooks speculatively.

═══════════════════════════════════════════════════════════════
## SHIPPED TO MAIN (this session)
═══════════════════════════════════════════════════════════════
- Adaptive time-of-day Home (SOS hero daytime / Ask hero evening; Twilight aesthetic; existing Fraunces
  fonts; shared getDayPeriod helper). Merge 1275321.
- Inline child switcher chip + add-a-child sheet (gate at /child/new destination). PR #61.
- SOS copy: neutralized scenario pronouns; "Get Script" → "Find calm words". Commit 84edf7d.
- Child-profile value-first reveal (5 recent sessions free, saved scripts free, full history/+saved
  gated, patterns "coming soon"). PR #62.
- Verified: /history and /saved screens exist; saved scripts real; patterns is the ONLY true "coming soon".
- Verified: script prompt is sophisticated — age calibration, intensity "crisis throttle" (word limits
  rise as stress rises), silent neurotype blocks (ADHD/Autism/Anxiety/Sensory/PDA/2e), tone, message-
  length awareness, hard anti-therapy-speak voice rules. THIS IS THE MOAT. Mode branching (reconnect/
  understand/conversation prompts) exists but modes weren't distinct in practice → being cut (PR #63).

═══════════════════════════════════════════════════════════════
## STAGE 1 (ONBOARDING) — open questions to resolve
═══════════════════════════════════════════════════════════════
1. Is "tell us about [child]" free-text field in onboarding v1, or V2?
2. Deliver a real first script BEFORE signup (big activation lever, 2026 best practice) for V1, or
   keep signup-first and add aha-first later?
(Full Stage 1 audit + competitor benchmark in STURDY_JOURNEY_AUDIT.md.)

═══════════════════════════════════════════════════════════════
## DURABLE RULES
═══════════════════════════════════════════════════════════════
- Migrations: 14-digit `supabase migration new` timestamps, never date-only.
- Crisis: always free + uncounted, safety filter before quota (Principle 4).
- 1-child gate lives at the DESTINATION (child/new.tsx mount check + family.tsx). Don't duplicate.
- UI purpose-coding: SOS = coral #E87461 (distinct from primary coral #FF5C75); insight = gold #c9a85c.
- Fonts: Fraunces (serif display + scriptItalic for questions) + DM Sans. NO new fonts.
- Commit: `git add <file>` + `git commit -m` (NOT -am). Expo: `npx expo start -c --tunnel`.
- Live Supabase project "Sturdy" = lwmzfhigommayvmvqzvf (5 edge functions).

## DELIVERABLES PRODUCED (in outputs, for repo)
- STURDY_JOURNEY_AUDIT.md (the map — commit to repo docs)
- BRIEF_retire_child_hub.md (= PR #63, pending)
- BRIEF_family_recent_thoughts.md (Stage 4, unsent)
- BRIEF_child_profile_value_first.md (shipped as PR #62)
- STURDY_content_set_2026-06-01.md (Add Child field, free-tier line, Principle 6 rewrite, taglines)
- sturdy-paywall-final.html (locked paywall copy/layout — Stage 5 build)
- Home mockups, child-switcher mockup (reference)
