# Session Handoff (v3) — Sturdy

**Last updated:** 2026-06-01 (Home audit + adaptive redesign decision; greeting fix shipped; two Claude Code briefs ready)
**How to use:** SINGLE source of truth. Open ONE new chat, attach this whole file, say "resume from this handoff." Don't run parallel chats.

═══════════════════════════════════════════════════════════════
## YOUR ROLE & OPERATING CONTRACT (read first)
═══════════════════════════════════════════════════════════════
**Fractional CPO & Senior Advisor — Product, Conversion & Growth Strategist** for Sturdy.
- **Code is ground truth.** Verify against the shipped codebase; docs drift.
- **Ruthless prioritization** toward the core promise: a parent's daily thinking partner.
- **8 Product Principles are HARD constraints.** Surface conflicts; never quietly override.
- **Honest pushback over agreeableness.** When Thai echoes options back, MAKE THE CALL and let Thai confirm — don't re-list. Flag scope creep against launch.
- **Follow the plan, but stay open to a better version mid-process** (Thai's explicit steer). Propose deviations only when genuinely better AND in-scope; log them.
- **Growth must be TRUST-LED** — no dark patterns (Principle 7). Convert by removing fear, not manufacturing urgency. "Strategist reasoning" must map to real conversion/retention/trust — if it's taste, say so.
- **Log material decisions** in OPERATIONS.md.
- **Step-by-step, one command at a time.** When giving an edit, ALWAYS give the line number(s) to find, then the replacement (Thai's explicit ask). Thai works in a GitHub Codespace at /workspaces/sturdy on a Chromebook.
- This advisor chat = decisions seat. Claude Code (in the Codespace) = hands-on-code seat. Don't collapse them. This environment has NO repo network access — Thai pastes terminal output / uploads zips; advisor reads those.
- COPY principles (locked): in-app = recognition + voice (long-walk register); web landing = hard sell. Onboarding ENACTS voice, never describes.

═══════════════════════════════════════════════════════════════
## ▶ START HERE TOMORROW — two briefs ready for Claude Code
═══════════════════════════════════════════════════════════════
Both grounded in the real `(tabs)/index.tsx`. NOT to be run fully unattended — both have flag-don't-guess stop points; Thai should be available to answer 1–2 flags, then review + on-device test before merge. Neither lands on main without Thai's review.

1. **BRIEF_home_adaptive_B.md** — THE big one. Adaptive time-of-day Home (LOCKED decision). Daytime → SOS hero; Evening → Ask hero; non-hero collapses to a tap-row; silent adaptation. Full Twilight aesthetic using EXISTING Fraunces + DM Sans (`F.scriptItalic` already wired, line 897 — NO new fonts). Shared `getDayPeriod` helper feeds both greeting + layout (boundary: active 6am–7pm, calm 7pm–6am). Flag points: flat `<Background />`, greeting/boundary contradiction.

2. **BRIEF_home_inline_child_switcher.md** — child name → tappable chip in eyebrow ("Ask about [Emma ▾]"); Modal sheet to switch/add child. Gate RESOLVED: route "Add a child" → `handleAddChild` → `/child/new`; mount-gate there fires (no duplicate logic). Built-in Modal, no dep. Independent of #1.

Suggested order: run the adaptive layout (#1) first since it reshapes the screen, then land the switcher (#2) into the new layout. Or switcher first if Thai wants a quick win. Either works.

═══════════════════════════════════════════════════════════════
## HOME SCREEN — STATUS
═══════════════════════════════════════════════════════════════
Full conversion/UX teardown done this session. Master lens: does every element earn the subscription without trading trust for conversion? Home's job = trust + time-to-value (selling happens on child profile + paywall, NOT Home).

SHIPPED + verified:
- ✅ Greeting fixed: killed email-name scrape, honorific guard, graceful "Good evening." with no name, dropped "Good night." (5 edits in index.tsx — done.)
- ✅ Pronoun he→she (profile-driven, working).

DECIDED, briefs ready (see START HERE):
- 📋 Adaptive Home (B) — LOCKED.
- 📋 Inline child switcher — LOCKED.

OPEN Home items (not yet briefed):
- 🔴 **"Always free · No paywall" is FALSE** — model is 75/25-then-wall + visible padlocks. Trust leak / 1-star "bait & switch" risk. Replace with honest line ("75 free scripts & 25 questions each month"). Fix this — it's the only true trust-leak left on Home. (Can fold into the adaptive brief's free-tier note, or do standalone.)
- 🟡 TrafficDots: cryptic "S Q" dots + expanded popover overlaps the Ask zone. Make it read "X left" at a glance; fix the overlap. Lower priority (child limit is the real lever, not quota).
- 🟡 Launch-plan quota doc-sync: plan says 50, reality is 75/25. Docs-only fix.

═══════════════════════════════════════════════════════════════
## DESIGN DIRECTION (established this session)
═══════════════════════════════════════════════════════════════
- **Twilight × Obsidian Gold / Warm Ember** is the aesthetic. Real fonts already in code: **Fraunces** (serif display + italic) + **DM Sans** (body). The italic-serif question (`F.scriptItalic`) as centerpiece — "a thought, not a form field" — is the single biggest craft upgrade. Carry it to every screen.
- **Home is the visual source-of-truth.** Other screens (child profile, family, result) branch off Home's finished language — that's why we build Home fully now.
- **Hierarchy:** exactly ONE hero per screen; everything else recedes. Kill boxes — float elements on the gradient; space separates, not borders. The old Home failed by making everything equal-weight.
- Mockups produced this session (in outputs): sturdy-home-final.html (A serene vs B adaptive), sturdy-child-switcher.html (inline vs pill). Reference only.

═══════════════════════════════════════════════════════════════
## OPEN ITEMS / BLOCKERS (carried + new)
═══════════════════════════════════════════════════════════════
🔴 **Email-confirmation OFF (launch blocker, own session):** any fake email → active account, farms the 75/25 quota. Fix needs custom SMTP first (built-in = 2/hr, breaks signups if enabled without SMTP). Purge fake/test accounts before launch.
🔴 **Parent name capture bug (root of the greeting issue):** signup writes email-derived junk into `profiles.full_name`. Home now degrades gracefully, but the REAL fix is asking the parent's name properly in the auth/welcome-aboard flow. Tie to the "welcome-aboard moment" build.
🟡 **"Always free" false line** (see Home items).
🟡 Sturdy+ "unlimited" cost exposure (parking lot): consider a high cap vs. true unlimited.
🟡 Welcome-aboard moment (build, V1): post-signup, Option B copy; where exact-age "smart" signal lands; where name capture is fixed.
🟡 Intensity-4 voice question (eval-gated): resolve ONLY by running the SOS eval at intensity 4. Don't decide by gut.
🟢 Sentry IP-capture privacy fix. Anthropic key cleanup (old revoked, new in Supabase secret only). Deno editor noise (cosmetic).

═══════════════════════════════════════════════════════════════
## DURABLE RULES
═══════════════════════════════════════════════════════════════
- Migrations: full 14-digit timestamp versions (`supabase migration new`), never hand-named date-only.
- Quota (locked, shipped, verified): 75 scripts + 25 questions/month free, DUAL buckets. Crisis free + uncounted (Principle 4, safety filter before quota).
- Legal: ToS reconciled to 75/25 + crisis-always-free. The .md and the in-app screen are hardcoded separately — fix both when ToS changes.
- 1-child gate: lives at the DESTINATION (`child/new.tsx` mount-level useEffect + family.tsx). Don't duplicate per entry point.
- UI purpose-coding: urgent/tactile (SOS) = coral `#E87461`; insight/growth = cooler amber/gold `#c9a85c`. (Note SOS red is DISTINCT from primary coral #FF5C75.)
- Commit specific files: `git add <file>` + `git commit -m` (NOT `-am`).
- Expo: `npx expo start -c --tunnel`.

═══════════════════════════════════════════════════════════════
## GIT STATE
═══════════════════════════════════════════════════════════════
- main: Warm Ember palette merged (46b5657/c18cffc). Greeting fix applied to index.tsx (confirm committed/pushed). Family-tab reroute + 1-child gate PR merged (family.tsx + child/new.tsx).
- Pending branches (tomorrow): adaptive Home, inline switcher — both off main, both gated on review + on-device.

## KEY REFERENCE FILES
docs/OPERATIONS.md · docs/PRODUCT_PRINCIPLES.md (8) · docs/SCRIPT QUALITY STANDARDS.md · docs/STURDY_STRATEGY_notes.md · STURDY_V1_LAUNCH_PLAN (note: quota line stale at 50, real is 75/25) · CLAUDE.md
- Live Supabase project: "Sturdy" = lwmzfhigommayvmvqzvf (5 functions). NOT "Sturdy-Mobile".