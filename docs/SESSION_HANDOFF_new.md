# Session Handoff — Sturdy

**Last session:** 2026-05-31 (long session — quota, migration reconciliation, legal, auth copy, palette handoff)
**Role:** Fractional CPO & Senior Advisor — Product, Conversion & Growth Strategist (all aspects).
**How to use:** New chat → attach/paste this → "resume from this handoff."

---

## Operating contract
- Code is ground truth (verify against the codebase, not docs).
- Ruthless prioritization toward the core promise (parent's daily thinking partner).
- The 8 Product Principles are HARD constraints; surface conflicts, never quietly override.
- Honest pushback over agreeableness; flag scope creep against V1 launch.
- Growth must be TRUST-LED (never violate Principle 7 / no dark patterns).
- Log material decisions in OPERATIONS.md; go step-by-step, one command at a time.
- Codespace at /workspaces/sturdy, Chromebook, Deno for Edge Function evals.
- Two governing copy principles (locked): in-app = recognition + voice / web landing = the hard sell; onboarding ENACTS the voice, never describes the product.

---

## ▶ START HERE NEXT SESSION — review & merge the palette branch

A warm-palette shift is built and isolated on branch **`claude/warm-palette-shift-v1-AHuI3`** (commit 85d6aa9), NOT yet on main, NOT yet verified. Do this, in order:
1. **Code review the diff** (advisor): `git show 85d6aa9 --stat` then `git show 85d6aa9 -- apps/mobile/src/theme/colors.ts`. Confirm it warmed the gradient tokens (#020202→#1a1206 top, etc.), kept the gold accent untouched, repointed the 9 hardcoded screens to tokens, and changed no copy.
2. **On-device** (Thai): load the branch via `npx expo start -c --tunnel`. Test that the GLOOMY screens (auth, Family) improved WITHOUT the GOOD screens (script result, child profile) going muddy. Check `textMuted` readability on warm areas.
3. **Decision:** right → merge to main. Too warm/subtle → one-line tweak to the three `gradientTop` stops + `backgroundWarm` in colors.ts. textMuted too dim → bump opacity 0.55→~0.62 (Claude Code's flagged fix; do NOT re-darken the background).
4. Merge only after both code review + on-device pass.

CONTEXT: warming colors.ts alone did NOT propagate — 9 screens hardcoded the gradient/`#020202`. Claude Code repointed them to tokens. (Another instance of the recurring "truth hardcoded in screens, not tokens" drift in this codebase.) Typecheck was clean; CI green after the stale-test fix.

---

## Where the screen audit stands
Systematic screen-by-screen UI/UX launch audit. Master lens: does every element build trust + earn the subscription, without trading trust for conversion?
- ✅ **Welcome** — audited, copy locked, shipped, verified.
- ✅ **Auth** — audited, copy locked + shipped (headline/subhead/CTA/free-tier note). Bugs logged-not-fixed: stale `age_band` in pending-child migration (lines 79-80, contradicts exact-age Principle 3); markOnboardingComplete fires before email confirm.
- ⏳ **Next unaudited screen: Home/Dashboard** (`(tabs)/index.tsx`) — the heart of the daily-thinking-partner experience. (Or do the palette merge first.)

---

## OPEN ITEMS / BLOCKERS

**🔴 Email-confirmation OFF (launch blocker, its own session):** Any fake email can sign up → active account. Free-tier abuse vector (farms the 75/25 quota). Fix is a Supabase dashboard setting BUT requires a custom SMTP provider first (built-in is 2 emails/hr, best-effort — enabling without SMTP BREAKS signups at launch). Full plan in OPERATIONS. Also purge existing fake/test accounts before launch.

**🟡 Quota → Sturdy+ cost exposure (parking lot):** Sturdy+ is marketed "unlimited scripts." If unlimited free would bankrupt, unlimited PAID is also a cost risk — a heavy subscriber could cost more than they pay. Worth a deliberate look at whether "unlimited" should be a high cap.

**🟡 Welcome-aboard moment (to build, V1):** post-signup screen, Option B copy ("Glad you're here… what's their name?"). Where the "how smart Sturdy is" signals (exact age) land. Build after understanding the post-signup/confirm-email flow.

**🟡 Intensity-4 voice question (eval-gated):** Thai feels the 6-word cap "can sound choppy." LOCKED-CORE — resolve ONLY by running the SOS eval at intensity 4 and reading actual output. Loosen to 7 only with logged decision + eval re-run. Don't decide by gut.

**🟢 Sentry IP-capture privacy fix:** disable IP storage in Sentry settings (auto-logs client IPv6). Non-blocking.
**🟢 Anthropic key cleanup:** confirm old key revoked; new key (rotated this session) lives only in Supabase secret — store in a password manager.
**🟢 Deno editor noise:** VS Code shows false `Cannot find name 'Deno'` errors on supabase/functions tests. Cosmetic. Fix when convenient: install Deno VS Code extension + enable for supabase/functions. Trust `deno test`, not the Problems panel.
**🟢 Theme-migration TODOs:** a few hardcoded gradient values flagged across screens (mostly resolved by the palette work; verify after merge).

---

## DURABLE RULES established
- **Migrations:** ALL new migrations use full 14-digit timestamp versions (use `supabase migration new`, never hand-name with date-only). 8-digit date versions collide when two land same-day — that bug was fixed this session (history reconciled). The 10 healthy 8-digit migrations were deliberately left alone.
- **Quota model (locked, shipped, verified):** 75 scripts + 25 questions/month free, dual buckets. Crisis detection free + uncounted (Principle 4, enforced: safety filter runs before quota check).

---

## Git state
- **main:** 2 commits ahead of origin, UNPUSHED at session end (push to back up). Latest = 6000d26 (auth+Terms+test fix). Plus the quota/migration commit.
- **palette branch** `claude/warm-palette-shift-v1-AHuI3`: pushed, awaiting review/merge.

---

## Codespace rebuild checklist
1. `npx supabase login`  2. recreate `apps/mobile/.env` (EXPO_PUBLIC_SUPABASE_URL=https://lwmzfhigommayvmvqzvf.supabase.co + anon key)  3. `cd apps/mobile && npm install` then `npx expo start -c --tunnel`  4. Anthropic key for eval not in Codespace — supply inline from password manager.
- Live project: "Sturdy" = `lwmzfhigommayvmvqzvf` (all 5 functions). NOT "Sturdy-Mobile".

## Key reference files
docs/OPERATIONS.md (decision log) · docs/PRODUCT_PRINCIPLES.md (8 principles) · docs/SCRIPT QUALITY STANDARDS.md (SOS voice bar) · docs/STURDY_STRATEGY_notes.md (voice-as-moat) · docs/FEATURE_INVENTORY.md · CLAUDE.md
