# Session Handoff — Sturdy

**Last session date:** 2026-05-31 (UI/UX launch audit — Welcome screen complete)
**Purpose:** Paste into a new chat to resume exactly where we left off.
**How to use:** Open a new conversation, attach or paste this file, and say "resume from this handoff."

---

## How to work with me on this project

Acting as Fractional CPO + Lead Product Strategist for Sturdy. Operating contract:
- **Code is ground truth.** Verify against the shipped codebase, not the docs.
- **Ruthless prioritization.** Every feature earns its place toward the core promise, or goes to the V2 parking lot.
- **The 8 Product Principles are hard constraints.** Surface conflicts; never quietly override.
- **Protect against scope creep.** Solo first project; "park it" is a valid answer.
- **Honest pushback over agreeableness.**
- **Log material decisions** in OPERATIONS.md (context → decision → reasoning).
- **Step-by-step, one command at a time.** GitHub Codespace at /workspaces/sturdy, Chromebook, Deno for Edge Function evals. Don't assume CLI fluency.

---

## ▶ START HERE NEXT SESSION — audit the AUTH screen

We are mid-way through a **systematic screen-by-screen UI/UX launch audit**, locking each screen against one master lens: **does every element build trust and earn the subscription, without trading trust for conversion (Principle 7)?** Rhythm: audit → lock decisions → build → verify on-device → commit, one screen at a time.

**Welcome screen is DONE (audited, built, shipped, verified).** Next screen: **`apps/mobile/app/auth/index.tsx`** — the true front door now that signup-first is locked. Every new parent passes through it.

When auditing auth, specifically check: the post-signup state (is there an email-confirmation step?), where the **welcome-aboard moment** would attach (see below), and whether the "pending-child migration" comment there reflects working code or dead scaffolding.

---

## Two governing principles established this session (apply to EVERY screen)

1. **In-app = recognition + voice (long-walk register); web landing page = benefit + differentiation selling.** Hard-sell energy has a home, and it is NOT the app. Resolves future copy debates.
2. **Onboarding ENACTS the voice; it does not describe the product.** No "how smart we are" boasts in-app. Differentiators (exact-age specificity, your-child fit) are SHOWN via the first SOS script and setup flow, never claimed. Naming neurotype = Principle 1 violation.

---

## Open build items generated this session

| Item | Status | Priority | Notes |
|------|--------|----------|-------|
| Welcome carousel copy + layout | ✅ SHIPPED | — | Verified on-device |
| **Terms of Service reconciliation** | 📋 TODO | **BLOCKING** | ToS promises guest-without-account use the app doesn't deliver. Legal-honesty + Play Store policy risk. Fix ToS to describe actual signup-first free tier. |
| **Welcome-aboard moment** (post-signup) | 📋 TO BUILD | V1 | Where "how smart Sturdy is" signals land (exact age, your-child fit). Locked copy direction = Option B: "Glad you're here… what's their name?" Build AFTER auth audit (need the post-signup insertion point). |
| Gradient-token TODOs (Welcome) | 📋 Parked | LOW | 4× hardcoded rgba(13,11,8) → Deep Warm base. Part of theme migration; address separately. |
| Value-first guest flow | 📋 V1.1 | — | Top post-launch conversion experiment. Guest → first SOS → signup prompt after result. Scaffolding exists; entry point + tested migration needed. |

---

## ⚠ KNOWN LAUNCH BLOCKER — quota logic contradiction (decision deferred by Thai)

Three sources disagree on whether SOS counts toward the free 50/month quota:
- **Principle 6** (governance): SOS unlimited, excluded at DB level (`!= 'sos'`).
- **Launch Plan**: SOS counts toward 50 (all modes equal, $0.50/mo max).
- **Code**: migration 008 excluded SOS; migration 009 replaced it with DUAL buckets where the script quota counts SOS again (`!= 'question'`).

This is the economic + ethical core of the free tier and touches Principle 4 (crisis never paywalled) and Principle 6. Thai chose to finish the UI audit before deciding. **Must be resolved before launch.** Decision pending: SOS unlimited (Principle 6 as written) vs counts toward 50 (Launch Plan economics).

---

## Prior completed work (context)

- **Sentry error monitoring** on the Edge Function: built, deployed, verified end-to-end (induced-failure test confirmed a tagged event reaches the dashboard + email). Production healthy on a rotated Anthropic key.
- **Outstanding from Sentry work:** (a) disable IP-address capture in Sentry settings (privacy — it auto-logs client IPv6); (b) confirm old Anthropic key revoked + new key stored in a password manager (it lives only in the Supabase secret, nowhere in the Codespace).
- SOS prompt-refinement pass complete; eval green; voice holds in production.

---

## Fresh-Codespace rebuild checklist

1. `npx supabase login` (token doesn't persist).
2. Recreate `apps/mobile/.env` (both required or app throws): `EXPO_PUBLIC_SUPABASE_URL=https://lwmzfhigommayvmvqzvf.supabase.co` and `EXPO_PUBLIC_SUPABASE_ANON_KEY=<anon public key>`.
3. `cd apps/mobile && npm install`, then `npx expo start -c --tunnel` (bare `expo` fails — use `npx`).
4. Anthropic key for the eval is NOT in the Codespace — re-supply inline from your password manager.
- Live Supabase project: **"Sturdy" = `lwmzfhigommayvmvqzvf`** (hosts all 5 functions). NOT "Sturdy-Mobile".

---

## Key reference files

- `docs/STURDY_V1_LAUNCH_PLAN_v2.md` — authoritative launch scope (NOTE: dated May 27, several statuses now stale — e.g. Sentry is done; reconcile when convenient)
- `docs/PRODUCT_PRINCIPLES.md` — the 8 locked principles (master lens for the audit)
- `docs/FEATURE_INVENTORY.md` — ground-truth "what ships today" (dated May 21)
- `docs/STURDY_STRATEGY_notes.md` — voice-as-moat thesis (grounds the audit's copy philosophy)
- `docs/SCRIPT QUALITY STANDARDS.md` — SOS voice bar
- `docs/OPERATIONS.md` — decision log (newest: 2026-05-31 Welcome audit)
- `CLAUDE.md` — repo architecture guide
