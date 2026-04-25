# Sturdy Operations Log

Decision log. Each entry captures what happened, what was chosen, and why.
Newest entries at the bottom. Oldest at the top. Read forward in time.


## April 2026 — Security pass (Layer 1 foundational)
**Context:** Pre-launch security audit before building further.
**Decision:** Verified RLS on all 14 tables, untracked apps/mobile/.env,
updated .gitignore to catch plain .env files (was only catching .env*.local
variants). No secrets found in client code or git history.
**Reasoning:** Data posture needs to match product posture. Foundational
security now, escalate as scale demands. Revisit at 100 users (rate
limiting, audit logs) and 1000 users (2FA, content violation tracking).

## April 2026 — Phase 1 architecture shift complete
**Context:** Sturdy was an SOS-only app — every parent action started at
a single `/now` screen, with child context loosely attached. The
"thinking partner" pivot required restructuring around the child as the
primary unit.

**Decision:** Built per-child hubs at `/child/[id]`, made Home a child
selector for multi-child accounts (single-child passthrough), killed
the standalone `now.tsx` SOS screen, and removed the old `(tabs)/child.tsx`
shared screen.

**Files shipped:**
- `(tabs)/_layout.tsx` — 2-tab structure (Home + Settings)
- `(tabs)/index.tsx` — new Home with rotating greeting + child selector
- `child/[id].tsx` — per-child hub with SOS scoped to that child
- `result.tsx` — back nav routes to originating child's hub
- Deleted `now.tsx` and `(tabs)/child.tsx`

**Reasoning:** Removed an entire failure mode (wrong-child SOS sends),
created a natural home for Phase 2 Question mode (the reserved card on
Home), and cleaned up 1,021 lines of legacy code in the process.
Phase 2 (Question mode + auto-detection of child from message text) is
the next major build.
