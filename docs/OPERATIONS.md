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
