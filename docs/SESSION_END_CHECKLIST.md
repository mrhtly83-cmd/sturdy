# Session End Checklist

**Rule: Do not close a dev session without running through this list.**

This takes 5 minutes. Skipping it costs hours of confusion in the next session.

---

## Before committing

- [ ] **OPERATIONS.md** — If you made any architecture, strategy, or data-flow changes, append a new entry (context → decision → reasoning). One paragraph minimum.
- [ ] **CLAUDE.md** — If you changed screens, navigation, state, hooks, or theme, update the relevant section. This is what Claude Code reads — stale info here = wrong code suggestions.
- [ ] **Test on device** — Run the change on a real device or emulator. Don't commit untested UI changes.

## If you changed navigation or tabs

- [ ] Update the tab count and screen list in CLAUDE.md (line ~52)
- [ ] Update README.md repository structure if new files were added
- [ ] Update ROADMAP.md Phase 1 section if the change is significant

## If you changed the home screen

- [ ] Update the home screen description block in CLAUDE.md
- [ ] Note any new data sources (hooks, queries, lib files)

## If you changed the Edge Function or API

- [ ] Update the Edge Function pipeline section in CLAUDE.md
- [ ] If the request/response shape changed, note it in CLAUDE.md's warning about `validateResponse.ts` / `api.ts` drift
- [ ] Update FEATURE_INVENTORY.md if a "built but partial" item became "built and working"

## If you changed subscription/billing

- [ ] Update the useSubscription section in CLAUDE.md
- [ ] Update FEATURE_INVENTORY.md subscription status
- [ ] Update ROADMAP.md "built but incomplete" table

## If you changed the database

- [ ] Update the Database section in CLAUDE.md
- [ ] Ensure migration has rollback documented
- [ ] Update FEATURE_INVENTORY.md if relevant

## If you added or removed a file

- [ ] Update README.md repository structure
- [ ] Clean up dead imports in the same commit
- [ ] Note in CLAUDE.md if the file is architecturally significant

## Weekly (pick one session per week)

- [ ] Skim FEATURE_INVENTORY.md — move any items that shipped from "partial/stubbed" to "built and working"
- [ ] Check ROADMAP.md "built but incomplete" table — remove items that are now complete

---

## Quick reference: which doc covers what

| Doc | Purpose | Update frequency |
|---|---|---|
| CLAUDE.md | Repo architecture for Claude Code | Every session that changes code structure |
| OPERATIONS.md | Decision log | Every session with material decisions |
| README.md | Repo overview for humans | When files/structure change |
| FEATURE_INVENTORY.md | Ground-truth audit | Weekly or after major features |
| ROADMAP.md | What's shipped vs planned | After shipping features |
| MASTER_BLUEPRINT.md | Canonical product spec | After product-level pivots |
| PRODUCT_PRINCIPLES.md | Locked principles | Rarely (needs OPERATIONS.md entry) |
| SCRIPT/QUESTION QUALITY STANDARDS | Voice bar | When prompt rules change |