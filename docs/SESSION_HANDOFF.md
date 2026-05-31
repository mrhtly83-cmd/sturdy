# Session Handoff — Sturdy

**Last session date:** 2026-05-30 (evening, session 2)
**Purpose:** Paste this into a new chat to resume exactly where the previous session ended.
**How to use:** Open a new conversation, attach or paste this file, and say "resume from this handoff."

---

## How to work with me on this project

I am acting as your Fractional CPO and Launch/ASO specialist for Sturdy. The operating contract:

- **Code is ground truth.** Verify against the shipped codebase, not the docs, which drift.
- **Ruthless prioritization.** Every feature must serve the core promise and earn its complexity now, or it goes to the V2 parking lot.
- **The 8 Product Principles are hard constraints**, not suggestions. Surface conflicts; do not quietly override.
- **Protect against scope creep.** This is a solo first project; "park it" and "ship what's real" are valid answers.
- **Honest pushback over agreeableness.** Tell me when I am wrong.
- **Log material decisions** in OPERATIONS.md (context → decision → reasoning).
- **For step-by-step technical instructions, go slow, one command at a time**, state what each command does and what output to expect, and do not assume prior command-line fluency. I work in a GitHub Codespace at `/workspaces/sturdy`, on a Chromebook, using Deno for Edge Function evals.

---

## Where the project stands

Sturdy is in fine-tuning for a V1 Google Play launch (target was June 15, treated as flexible — ship-right over ship-fast). A feature freeze is in effect, documented in `docs/V1_FREEZE.md`. The freeze-audit finding stands: **the code is generally ahead of the docs**, so most remaining work is correcting docs to match shipped reality, not building features.

The ship gate: the SOS voice clears a measured bar (eval green), the freeze fix-list is closed, and ~10 real parents have used the app without a trust-breaking bug. The date moves to meet that, not a calendar.

---

## ▶ START HERE NEXT SESSION — two outstanding follow-ups

The Sentry error-monitoring work is COMPLETE and verified end-to-end (see below). Two non-blocking follow-ups remain from it:

1. **Sentry IP-capture privacy fix.** The verification event auto-captured the client's full IPv6 address (`user: ip:...`). Our `reportError` code does not send this — Sentry inferred it from request headers. For an app handling sensitive family situations, client IP is personal data that should not be logged against every error. Fix: disable IP storage in the Sentry project settings (Project → Security & Privacy, "Prevent Storing of IP Addresses"), and/or confirm `reportError` sends no request context. Quick, worth doing for the product's values.

2. **Key rotation cleanup.** A new Anthropic key was generated and set live this session. Confirm the OLD key is revoked in the Anthropic Console, and store the NEW key in a password manager (NOT a repo file). The key currently lives only in the Supabase secret — it is nowhere in the Codespace, so the eval will have no key after any rebuild until you re-supply it.

After those: resume the **documentation migration (steps 2–7)** — see watch list.

---

## What was accomplished (sessions 1 + 2, 2026-05-30)

**Error monitoring (Sentry) — built, deployed, VERIFIED:**
- Added `reportError` to `chat-parenting-assistant` (lightweight direct POST, not the SDK). Sends only error message + safe tags (`service`, `mode`, `model`) — never user content. Wired into the two parent-facing catch sites (question + SOS); the `generateScript` retry `console.warn` sites left uninstrumented (normal retry, not an incident).
- Created Sentry project (Deno, alert-on-high-priority, email on). Stored `SENTRY_DSN` as a Supabase secret on the live project.
- **Verified end-to-end via deliberate induced-failure test:** set an invalid Anthropic key, confirmed the app failed gracefully AND a correctly-tagged event reached Sentry within seconds (`mode: sos`, `model: claude-sonnet-4-6`), then restored a working key. Production confirmed healthy with a real script afterward. The silent-outage gap is closed and proven.

**Confirmed earlier (session 1):** production happy path works — live SOS request returns a real, well-formed script; the corrected model string and voice hold in production against Script Quality Standards.

**Anomaly investigated & resolved:** an overnight redeploy of all five functions (identical timestamp) was NOT a deploy pipeline — `.github/workflows/test.yml` is CI tests only (Deno + Jest), no deploy. Likely a benign Supabase platform re-host. Redeployed local source before testing to remove the uncertainty.

**Live Supabase project (unambiguous):** "Sturdy" = `lwmzfhigommayvmvqzvf` (hosts all five deployed functions). "Sturdy-Mobile" and "Mr-Cat25's Project" are NOT production.

---

## ⚠ Git state — uncommitted by choice

The `chat-parenting-assistant/index.ts` Sentry change and the OPERATIONS.md + SESSION_HANDOFF.md updates are UNCOMMITTED. The live function is ahead of git (code-drift-from-git). Commit when ready. Suggested message:
`Add + verify Sentry error monitoring on Edge Function; log + handoff`

---

## Watch list (after the two follow-ups)

1. **Documentation migration steps 2–7** (the agreed DOCUMENTATION MODEL): reconceive CLAUDE.md into the five-section navigation tier; planning-doc hierarchy; date-stamp Feature Inventory; archive smoke test + strategy notes; amend SESSION_END_CHECKLIST; apply five-field headers to stable-core files. Step 1 (Blueprint harvest + archive) done.
2. **Extend eval coverage** to Reconnect, Understand, Conversation modes (currently unmeasured). Lower priority; arguably V2-quality.

The SOS prompt-refinement pass is COMPLETE (session 1) and the voice held in production.

---

## Fresh-Codespace rebuild checklist

A rebuild wipes non-persistent state. In order:
1. `npx supabase login` (token does not persist).
2. Recreate `apps/mobile/.env` (both vars required or the app throws on startup):
   - `EXPO_PUBLIC_SUPABASE_URL=https://lwmzfhigommayvmvqzvf.supabase.co`
   - `EXPO_PUBLIC_SUPABASE_ANON_KEY=<anon public key from dashboard → Project Settings → API>`
3. `cd apps/mobile && npm install`, then `npx expo start -c --tunnel` (bare `expo` fails — must use `npx`).
4. The Anthropic key for the eval is NOT in the Codespace — re-supply it inline from your password manager when running `npm run eval:sos`.

Notes:
- Edge Function secrets are server-side, separate from the app `.env`. Live function reads `ANTHROPIC_API_KEY`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, and now `SENTRY_DSN` from Supabase secrets.
- Eval reads its key inline from the command; eval reports land in `eval-outputs/` (git-ignored).
- Supabase CLI upgrade notice (2.78.1 → 2.102.0) deliberately ignored mid-task; future housekeeping only.

---

## Key reference files

- `docs/V1_FREEZE.md` — active feature freeze and fix-list
- `docs/OPERATIONS.md` — decision log (newest: 2026-05-30 evening, Sentry verified + key rotation)
- `docs/PRODUCT_PRINCIPLES.md` — the 8 locked principles
- `docs/SCRIPT QUALITY STANDARDS.md` — the SOS voice bar the eval grades against
- `docs/SESSION_END_CHECKLIST.md` — run before closing any session
- `CLAUDE.md` — repo architecture guide