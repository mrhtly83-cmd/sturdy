# Session Handoff (v2) — Sturdy

**Last updated:** 2026-05-31 (end of a long session: quota, migration reconciliation, legal, auth copy, palette handoff)
**How to use:** This is the SINGLE source of truth. Open ONE new chat, paste/attach this whole file, say "resume from this handoff." Do not run parallel chats — it forks the record.

═══════════════════════════════════════════════════════════════
## YOUR ROLE & OPERATING CONTRACT (read first — this defines how to work)
═══════════════════════════════════════════════════════════════
You are **Fractional CPO & Senior Advisor — Product, Conversion & Growth Strategist (all aspects)** for Sturdy.

Hard contract:
- **Code is ground truth.** Verify against the shipped codebase, never assume from docs (they drift).
- **Ruthless prioritization** toward the core promise: a parent's daily thinking partner.
- **The 8 Product Principles are HARD constraints.** Surface conflicts; never quietly override.
- **Honest pushback over agreeableness.** Tell Thai when something's wrong. Flag scope creep against V1 launch.
- **Growth must be TRUST-LED** — never violate Principle 7, no dark patterns. Convert by removing fear, not manufacturing urgency.
- **Log material decisions** in OPERATIONS.md (context → decision → reasoning).
- **Step-by-step, one command at a time.** State what each command does + expected output. Don't assume CLI fluency. Thai works in a GitHub Codespace at /workspaces/sturdy, on a Chromebook, Deno for Edge Function evals.
- Two governing COPY principles (locked): in-app = recognition + voice (long-walk register) / web landing page = the hard sell. Onboarding ENACTS the voice, never describes the product.
- Working method that's served well: verify before acting; commit verified work separately from unverified; one authoritative home per fact.

═══════════════════════════════════════════════════════════════
## ▶ START HERE — review & merge the warm-palette branch
═══════════════════════════════════════════════════════════════
A warm-palette shift is built + isolated on branch **`claude/warm-palette-shift-v1-AHuI3`** (commit 85d6aa9). NOT on main, NOT verified on-device. Do in order:
1. **Code review** (advisor): `git show 85d6aa9 --stat`, then `git show 85d6aa9 -- apps/mobile/src/theme/colors.ts`. Verify: warmed gradient tokens (#020202→#1a1206 top etc.), gold accent UNTOUCHED, 9 hardcoded screens repointed to tokens, no copy changed.
2. **On-device** (Thai): load the branch via `npx expo start -c --tunnel`. Test that GLOOMY screens (auth, Family) improved WITHOUT the GOOD screens (script result, child profile) going muddy. Check `textMuted` readability on warm areas.
3. **Tweaks if needed:** too warm/subtle → one-line change to the three `gradientTop` stops + `backgroundWarm`. `textMuted` too dim → bump opacity 0.55→~0.62 (do NOT re-darken the background).
4. Merge to main only after BOTH code-review + on-device pass.
CONTEXT: warming colors.ts alone did NOT propagate — 9 screens hardcoded the gradient/#020202; Claude Code repointed them. (Recurring "truth hardcoded in screens, not tokens" drift.) Typecheck clean; CI green.

═══════════════════════════════════════════════════════════════
## WELCOME SCREEN — RESOLVED (no contradiction; read this to avoid re-confusing it)
═══════════════════════════════════════════════════════════════
There are TWO different things; one HTML file caused confusion by serving two purposes:

**1. The SHIPPED Welcome = the real, only Welcome for V1.** `apps/mobile/app/welcome/index.tsx`, the photo-scrim 3-BEAT carousel. Audited, copy LOCKED, shipped, verified today. Final copy:
- Beat 1: "For the moment right before you lose it." / "The right words, while it still matters."
- Beat 2: "The questions you'd never say out loud." / "Ask anything. No judgment, no jargon."
- Beat 3: "From chaos. To connection." / "One hard moment at a time."

**2. `sturdy-welcome-mockup.html` = PALETTE REFERENCE ONLY.** The only thing locked from it is the warm-brown gradient (#1a1206→black), now built on the palette branch. Its 3-slide layout + copy are OLD/REJECTED ("before you lose it", "Calmer moments. Starting today") — NOT a build target, do NOT resurrect that copy. **No onboarding rebuild is scoped for V1.** (Rename the file to `palette-reference-only.html` so it can't masquerade as a spec.) The gold-gradient CTA pattern in it CAN be a visual reference for fixing the dim auth Sign-in button.

═══════════════════════════════════════════════════════════════
## SCREEN AUDIT STATUS
═══════════════════════════════════════════════════════════════
Systematic screen-by-screen UI/UX launch audit. Master lens: does every element build trust + earn the subscription, without trading trust for conversion?
- ✅ **Welcome** — copy locked, shipped, verified.
- ✅ **Auth** — copy locked + shipped (headline "Let's get you set up" / subhead "Free to start. No trial, no card — just your scripts, saved." / CTA "Create my free account" / free-tier note "75 free scripts and 25 questions every month. Upgrade only if you want more."). Logged-not-fixed bugs: stale `age_band` in pending-child migration (auth/index.tsx ~lines 79-80, contradicts exact-age Principle 3, doesn't cover teens); markOnboardingComplete fires before email confirm.
- ⏳ **Next: Home/Dashboard** (`(tabs)/index.tsx`) — heart of the daily-thinking-partner experience. (Or do the palette merge first.)

═══════════════════════════════════════════════════════════════
## OPEN ITEMS / BLOCKERS
═══════════════════════════════════════════════════════════════
🔴 **Email-confirmation OFF (launch blocker, own session):** any fake email → active account; farms the 75/25 free quota. Fix = Supabase dashboard setting BUT requires custom SMTP first (built-in = 2 emails/hr, best-effort; enabling without SMTP BREAKS signups at launch). Also purge existing fake/test accounts before launch.
🟡 **Sturdy+ cost exposure (parking lot):** marketed "unlimited scripts." If unlimited free would bankrupt, unlimited PAID is also a cost risk. Consider whether "unlimited" should be a high cap.
🟡 **Welcome-aboard moment (build, V1):** post-signup screen, Option B copy ("Glad you're here… what's their name?"). Where "how smart Sturdy is" signals (exact age) land. Build after understanding the post-signup/confirm-email flow.
🟡 **Intensity-4 voice question (eval-gated):** Thai feels the 6-word cap "can sound choppy." LOCKED-CORE — resolve ONLY by running the SOS eval at intensity 4 and reading actual output. Loosen to 7 only with logged decision + eval re-run. Do NOT decide by gut.
🟢 Sentry IP-capture privacy fix (disable IP storage in Sentry settings). Non-blocking.
🟢 Anthropic key cleanup: confirm OLD key revoked; new (rotated) key lives only in Supabase secret — store in a password manager.
🟢 Deno editor noise: false `Cannot find name 'Deno'` in VS Code on supabase/functions tests. Cosmetic. Fix = install Deno VS Code extension + enable for supabase/functions. Trust `deno test`, not the Problems panel.

═══════════════════════════════════════════════════════════════
## DURABLE RULES (established this session)
═══════════════════════════════════════════════════════════════
- **Migrations:** ALL new migrations use full 14-digit timestamp versions (`supabase migration new`, never hand-name date-only). 8-digit date versions collide same-day — that bug was fixed + history reconciled this session. The 10 healthy 8-digit migrations were left alone deliberately.
- **Quota (locked, shipped, verified on-device):** 75 scripts + 25 questions/month free, DUAL buckets. Crisis detection free + uncounted (Principle 4; safety filter runs before quota check).
- **Legal:** ToS reconciled to reality in 2 passes (guest claim + trial language removed; free-plan now "75 scripts + 25 questions, crisis always free"). Both the .md and the in-app screen are hardcoded separately — fix both when ToS changes.

═══════════════════════════════════════════════════════════════
## GIT STATE
═══════════════════════════════════════════════════════════════
- **main:** today's work committed (quota+migration; auth+Terms+test fix = 6000d26; session log+handoff). PUSH if not already (`git push`) to back up.
- **palette branch** `claude/warm-palette-shift-v1-AHuI3`: pushed, awaiting review/merge.
- Habit note: use `git add <file>` + `git commit -m` (NOT `git commit -am`) when committing specific files — `-a` sweeps up unrelated tracked changes (happened twice this session).

═══════════════════════════════════════════════════════════════
## CODESPACE REBUILD CHECKLIST
═══════════════════════════════════════════════════════════════
1. `npx supabase login` 2. recreate `apps/mobile/.env` (EXPO_PUBLIC_SUPABASE_URL=https://lwmzfhigommayvmvqzvf.supabase.co + anon key) 3. `cd apps/mobile && npm install` then `npx expo start -c --tunnel` 4. Anthropic eval key not in Codespace — supply inline from password manager.
- Live project: "Sturdy" = `lwmzfhigommayvmvqzvf` (all 5 functions). NOT "Sturdy-Mobile".

## KEY REFERENCE FILES
docs/OPERATIONS.md (decision log) · docs/PRODUCT_PRINCIPLES.md (8 principles) · docs/SCRIPT QUALITY STANDARDS.md (SOS voice bar) · docs/STURDY_STRATEGY_notes.md (voice-as-moat) · docs/FEATURE_INVENTORY.md · CLAUDE.md
