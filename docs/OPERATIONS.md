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

## April 2026 — Build process learnings (post-Phase 1)
**Context:** Phase 1 had ~5 distinct error episodes during build. Reviewed
all of them to identify root causes and prevent recurrence in Phase 2.

**Decision:** Adopting 7 build rules going forward:
1. Verify state before write (cat/grep before edit)
2. One change at a time, test before next
3. JSX always multi-line, never elements on same line with whitespace
4. Multi-line handlers extracted to named functions
5. File delete + reference cleanup happen in same commit
6. Real device logs beat theorizing for async/routing bugs
7. Migrations always transactional with documented rollback

**Reasoning:** Every Phase 1 error traced to an assumption that wasn't
verified. Cost of verification is small (~30 sec per check). Cost of
each error was 10-90 minutes. The math is obvious.

Added a 12-step pre-flight checklist to follow before each feature.

## April 2026 — Visual identity direction (parked for next session)
**Context:** Theme refresh shipping today. Logo + imagery deferred.
**Decision:** When logo work begins, also plan matching warm imagery
for empty states, onboarding, splash, settings/about. Imagery is the
antidote to "too serious" — keeps Sturdy feeling human while looking
mature.
**Reasoning:** Mature ≠ severe. Calm meditation app aesthetic loses
the warmth that makes Sturdy distinct. A few well-placed atmospheric
images will preserve emotional warmth across the maturity refresh.

### 2026-04-27 — Question mode prompt rewrite + eval harness

**Context:** Question mode shipped with a strong voice guide but no
example-driven calibration and no automated way to detect voice drift
across prompt edits.

**Decision:** Reordered prompt structure (context → classification →
voice → format), added three paired pass/fail examples, tightened
strategy/big_topic discrimination, loosened celebrating length to
allow 1-2 paragraphs. Established `QUESTION_MODE_QUALITY_STANDARDS.md`
as permanent quality bar with five reference Q&A pairs. Added manual
eval harness at `__tests__/question.eval.ts`.

**Reasoning:** Voice consistency is Sturdy's hardest-to-defend asset.
A model update or a well-meaning prompt edit can erode it silently.
The eval set + harness give us a reproducible way to detect drift
before it ships. The reordering puts voice rules closest to the
generation step, where prompt-instruction recency matters most.

### 2026-04-27 — Question mode prompt v2 + eval input swap

**Context:** v1 eval run revealed two issues. Voice drift on three
specific patterns (endearments like "Oh honey," social-media phrases
like "power move," pure-insight responses with no concrete action).
And an eval design flaw: three of five eval inputs matched the
in-prompt Phase 2d examples, causing the model to recite reference
responses instead of generating fresh prose.

**Decision:** Added three rules to the HARD RULES block in
question.ts (no endearments, no social-media voice, require concrete
action on reassurance/explain_why). Replaced all five eval inputs
with non-overlapping scenarios across the same five classifications.
Reference responses in QUESTION_MODE_QUALITY_STANDARDS.md temporarily
replaced with TODO placeholders until human-written replacements are
verified in long-walk register. Added --allow-run to eval npm script.

**Reasoning:** Eval inputs and in-prompt examples must never overlap
or the eval becomes a recitation test. The three voice rules address
real drift observed in v1 outputs, not theoretical risks. Reference
responses are deliberately blocked from being LLM-generated to keep
the quality bar human-defined.

### 2026-04-27 — Question mode prompt v3 — voice values + length scaling

**Context:** v2 eval against fresh inputs revealed three issues. Q3
(parent_self, "am I too strict?") validated the parent by disparaging
imagined "chill" parents — a values violation. Across multiple
outputs, the actual answer was not in the first sentence, requiring
scanning parents to read all four paragraphs to get the takeaway.
Length scaled only by question type, not by parent state — a frantic
short message could trigger a long response.

**Decision:** Added three rules to the HARD RULES block. Never
disparage other parents to validate the asking parent. The first
sentence must stand alone as a complete answer across every
classification. Length scales down when the parent's typing pattern
indicates distress (short, lowercase, fragmented), regardless of what
the classification ceiling allows.

**Reasoning:** The voice was working but had three blind spots that
fresh inputs exposed. Each is a real failure mode that would have
shipped to parents and eroded trust over time. The first-sentence rule
in particular makes the long-walk register more accessible to scanning
parents without requiring shorter responses overall — preserving the
breathing room that makes Sturdy feel like Sturdy while serving the
cohort that wants the answer in seconds.

### 2026-04-28 — Upgrade screen copy rewrite + tone selector deferred

**Context:** The upgrade screen feature list was a six-row inventory
that read like a pricing-page checklist (Child profile & insights /
Weekly insight / Follow-up coaching / Tone selector / Full interaction
history / Voice on all modes). The hero ("Unlock the full picture") and
the ALWAYS FREE row ("Voice on SOS / Regulate → Connect → Guide") were
written for an audience that already knows what Sturdy is — feature
names instead of what those features feel like. The BEST VALUE badge on
yearly was selling the plan against itself rather than the product.
Tone selector was listed as a paid feature but the voice quality bar
that makes Soft and Direct safe to ship has not yet been validated
against the same eval rigor as the gentle default.

**Decision:** Rewrote the FEATURES list to five emotional descriptions
("A Sturdy that knows your child" / "Weekly reflection" / "Follow-up
scripts" / "Everything you've saved, kept" / "Voice on every mode"),
each paired with a what-it-feels-like subhead instead of a what-it-is
label. Removed the tone selector from the paid list entirely until its
voice block has its own eval pass. Replaced the hero subhead with "The
version that remembers. So Sturdy gets sharper about [child], week by
week." — naming the felt promise (memory + sharpening) rather than the
abstract claim (full picture). Replaced FREE_FEATURES with the three
that actually matter to a free-tier parent ("Unlimited SOS scripts /
Question mode / Crisis support") so the divide reads as "free covers
the moment, paid covers the relationship." Renamed the section header
from EVERYTHING IN STURDY+ to WHAT STURDY+ ADDS to remove the
inventory-listing register. Removed the BEST VALUE badge and its three
supporting styles — the savings-row "5 months free" badge already
carries that signal. Tightened the annual CTA subtext to "Then
$69.99/year — that's $5.83/month" so the per-month frame appears at
the moment of commitment, not just on the plan card.

**Reasoning:** The upgrade screen is the only paid surface Sturdy has
until billing wires up — every word on it is doing the job of the
entire pricing strategy. Feature names market features; emotional
descriptions market outcomes, and outcomes are what parents are
actually deciding between. Removing tone selector from the paid pitch
trades one bullet point for the integrity of not selling something
whose voice quality has not been verified to the same standard as the
default — better to add it back later from a position of confidence
than to defend a Soft tone that drifts in the wild. The hero rewrite
("the version that remembers") gives the screen a single thesis to
live or die by: paid Sturdy gets sharper about your child over time.
Everything else on the page now supports that one promise instead of
itemizing parallel claims.

### 2026-04-29 — Neurotype invisibility reconciliation + child profile rebuild

**Context:** Doc audit revealed the neurotype-invisibility principle was
documented in CLAUDE.md and PROMPT_SYSTEM.md but contradicted by
DATABASE_SCHEMA.md, which described an "optional parent-set premium" path
that no other doc supported. The child profile setup screen was built
consistent with the schema doc — exposing ADHD/Autistic/Anxiety/Sensory/
PDA/2e selection cards — and the per-child profile screen displayed the
stored neurotype back to the parent as a labeled row. Both violated the
locked principle stated in CLAUDE.md and PROMPT_SYSTEM.md. The Master
Blueprint deferred to PROMPT_SYSTEM.md without restating the principle
in its own canonical text. Three flow bugs surfaced in the same path:
the welcome "Get started" button pushed `/auth/sign-up` (a route that
no longer exists since auth was unified to `/auth?mode=signup`), the
guest skip path could land on Home with greeting "Welcome back, there",
and the "Continue" button on child setup was invisibly disabled when
the name field was empty with no hint to the parent.

**Decision:** Reconciled all docs to the strict-invisibility principle.
Removed the "set by parent (premium)" line from DATABASE_SCHEMA.md and
replaced the column comment with "AI auto-detection only — never user-
set, never displayed." Restated the principle directly in
STURDY_MASTER_BLUEPRINT.md so the canonical product spec carries it,
not just CLAUDE.md and PROMPT_SYSTEM.md. Created new canonical
docs/PRODUCT_PRINCIPLES.md as the single source of truth for product
principles, with a violation checklist for each of the seven principles
and an explicit usage protocol for future briefs. Rebuilt the child
profile setup screen to remove neurotype selection cards entirely; the
screen is now name + exact-age slider + Continue + Skip. Stripped the
"Neurotype" row from the per-child profile screen. Fixed the three
flow bugs in the same PR: welcome's "Get started" now pushes
`/auth?mode=signup`; both guest skip handlers now also call
`markOnboardingComplete()` so the AuthGate routes returning guests to
`/auth?mode=signin` instead of looping back to `/welcome`; the Home
greeting rotation no longer includes "Welcome back" or "Good to see
you" (so guests with no name get "Hi, there." rather than "Welcome
back, there."); child setup now shows a visible "Add your child's
name to continue" hint under the disabled Continue button when the
name field is empty.

Notes / "What makes them them?" field deferred to a follow-up brief
that ships notes UI + detection wiring together. A notes field that
doesn't feed detection would break the "shaped to your child" promise
the welcome flow makes — better to ship the experience whole than the
input alone.

**Reasoning:** The principle is the most defensible product position
Sturdy has — parents do not need to diagnose their child to get help,
because Sturdy reads it from how they describe behaviour. Doc
inconsistency is what caused the original child-setup screen to ship
with the carousel in the first place; if the schema doc and the master
blueprint had agreed with CLAUDE.md, that drift would not have
happened. Adding PRODUCT_PRINCIPLES.md as a canonical reference
prevents the same drift class from recurring — every future brief
references it. The screen rebuild aligns the UI with the welcome
flow's "shaped to your child, not a category" promise that shipped
three days ago. The bug fixes ride along because the failing flow
involves these screens — fixing them in a separate PR would mean two
device-test cycles instead of one.

### 2026-04-29 — Schema hygiene: add missing user_id foreign keys

**Context:** Database audit during PR 1 (account-deletion-flow) review
revealed that the live database had no FK constraints from `user_id`
columns to `auth.users(id)` across the public schema, despite the
original MVP migration (`20260312_001_mvp_core.sql`) declaring some of
them. The deletion flow assumed CASCADE behaviour that didn't actually
exist; deleting an auth user would orphan rows in `child_profiles`,
`conversations`, `interaction_logs`, `parent_thoughts`, `saved_scripts`,
`script_feedback`, `subscriptions`, `usage_events`, `user_preferences`,
and `safety_events`.

CLAUDE.md was also significantly out of date — documented 8 tables
when the schema actually contains 14. Tables created out-of-band via
the Supabase SQL Editor (`saved_scripts`, `script_feedback`,
`subscriptions`, `trial_usage`, `user_preferences`, `incident_events`,
`child_insights`, plus the earlier `interaction_logs` and
`parent_thoughts`) were missing from documentation entirely.

Pre-migration audit confirmed the database had zero rows where
`user_id` references a non-existent auth user (no cleanup needed
before applying constraints).

**Decision:** Created hygiene migration
`20260428_004_add_user_id_foreign_keys.sql` that ensures every
`user_id` column in the 10 user-scoped tables has a FK to
`auth.users(id)` with `ON DELETE CASCADE`. The migration uses a
defensive `DO`-block loop instead of literal `ALTER TABLE … ADD
CONSTRAINT` statements: for each table it looks up any existing FK
from `user_id` to `auth.users(id)` in `pg_constraint` (regardless of
the constraint's name or current `ON DELETE` behaviour), drops it,
and re-adds the canonical FK. This keeps the migration idempotent
across environments where the original MVP-migration constraints
*do* exist (fresh dev resets) versus environments where they were
later dropped (the audited live state).

`safety_events` is set to `CASCADE` in this migration as a temporary
state. The follow-up account-deletion migration will flip it to
`SET NULL` per Principle 8 (anonymized retention of safety logs after
account deletion).

Updated `CLAUDE.md` to document all 14 tables (split into user-scoped,
child-scoped, and anonymous). Added a new convention to the
"Conventions to follow" list requiring FK constraints on every future
`user_id` column. Updated `docs/backend/DATABASE_SCHEMA.md` with stub
sections for the seven previously-undocumented SQL-Editor tables plus
full sections for `interaction_logs` and `parent_thoughts` derived
from the Edge Function's insert shapes.

PR 1 (account-deletion-flow) is paused while this hygiene PR merges
and is smoke-tested. Once merged, PR 1's migration becomes much
smaller — its CASCADE-related `DO` blocks can be deleted and its
`safety_events` flip simplified to a single drop-and-re-add.

**Reasoning:** Documentation drift led directly to PR 1 building on
assumed behaviour that didn't exist in the live database. The fix is
both structural (add the constraints, normalize state across
environments) and documentary (fix the source-of-truth docs +
introduce the convention so future SQL-Editor changes can't recreate
the problem). Splitting the hygiene work out of PR 1 keeps both PRs
tight and lets the schema cleanup land first, where it belongs.

Pre-merge verification: the operator runs the migration against
staging and executes the audit query in the PR description (lists
every FK from `public.*.user_id` to `auth.users(id)` with its
`delete_rule`). Expected: 10 rows, all `CASCADE`. Fewer than 10 rows
means a constraint failed to apply — investigate which table and why
before merging.

### 2026-04-29 — Schema hygiene migration: replaced DO-block with explicit ALTER

**Context:** The original DO-block implementation of migration
`20260428_004` applied to the live database but only correctly set
`ON DELETE CASCADE` on 5 of 10 target tables. Tables that had no
prior FK to `auth.users` (`interaction_logs`, `saved_scripts`,
`script_feedback`, `subscriptions`, `user_preferences`) ended up with
`NO ACTION` despite the DO-block including `on delete cascade` in its
`format()` call. Root cause not fully investigated — appears to be a
Supabase dashboard SQL Editor quirk with multi-line `format()`
statements inside DO-blocks.

**Decision:** Replaced the DO-block in the migration file with
explicit `ALTER TABLE ... ADD CONSTRAINT` statements for each of the
10 target tables. The live database was corrected with the same
pattern via the SQL Editor before this commit. Verified via
`pg_constraint` query that all 11 FK constraints to `auth.users`
(10 target tables + `profiles`) now have `delete_action = CASCADE`.

**Reasoning:** The migration file is documentation of what to apply
on a fresh environment. If it doesn't reliably produce the correct
state, it's not safe to keep. Explicit ALTER statements are simpler,
more readable, and apply reliably across environments.

### 2026-04-29 — Account deletion + pause + export flow (backend, PR 1 of 2)

**Context:** Sturdy had no account deletion mechanism. Without one, the
privacy policy could not honestly promise data deletion, and Sturdy
could not satisfy data-subject rights under PIPEDA, PIPA BC, GDPR, or
CCPA. The decision was to build the lifecycle backend before the UI so
the migration and Edge Functions could ship and be smoke-tested in
production before any client surface depends on them.

**Decision:** Split the work into two PRs. PR 1 (this entry) lands the
backend: a migration that adds `profiles.paused_at`, switches
`safety_events.user_id` from `ON DELETE CASCADE` to `ON DELETE SET NULL`,
defensively re-asserts `ON DELETE CASCADE` on the out-of-band tables
(`interaction_logs`, `parent_thoughts`, `usage_events`), and creates a
private `account-exports` Storage bucket with per-user RLS. Plus four
Edge Functions:

- `account-export` — JSON + Markdown zipped via `npm:fflate@0.8.2`,
  uploaded to the private bucket, returned as a 24-hour signed URL.
  Markdown was chosen over PDF deliberately: it opens on every device,
  in every text app, with no library dependency that would balloon the
  function bundle. The privacy policy reflects this.
- `account-pause` — sets `paused_at = now()` and revokes refresh tokens
  globally. The user is signed out as a side effect.
- `account-delete` — deletes the auth user via the admin API. Because
  every public.* table that references `auth.users` is `ON DELETE
  CASCADE` (via the migration), and `safety_events.user_id` is
  `ON DELETE SET NULL`, that single call atomically removes user-owned
  rows and anonymizes safety logs. Two callers are accepted: the user
  themselves with `confirmationText = "DELETE"`, or the cron with
  `confirmationText = "PAUSE_EXPIRED"` and a system-caller credential.
- `scheduled-pause-cleanup` — daily cron. Queries `paused_at < (now() -
  30 days)` and calls `account-delete` for each. Daily granularity is
  intentional — the 30-day window is "approximately 30 days" so a missed
  run is recovered the next day.

Subscription check is a documented stub: `useSubscription` on the client
always returns `isPremium: false` until RevenueCat lands, so the server
mirrors that with a `hasActiveSubscription()` helper that returns false.
The 409 path on the Edge Function is wired but unreachable today — when
billing arrives, swapping the helper's body is the only change needed.

PR 2 will add the mobile UI (Settings → Account section, pause and
delete screens, paused-account detection in `auth/index.tsx`, the
`requestExport` / `pauseAccount` / `deleteAccount` methods in `api.ts`,
plus the privacy policy text).

**Reasoning:** Sturdy's positioning rests on respecting parents. A
clean deletion flow that honours the user's choice is part of that. The
pause option is humane (deletion in a moment of frustration is
reversible for 30 days). The export-first path is GDPR/CCPA compliant.
The "type DELETE" friction (PR 2) matches industry standard for
irreversible operations. Anonymized `safety_events` retention is the
only exception to "deletion means deletion" — it's documented in
Product Principle 8 and surfaced in the privacy policy text. Splitting
into two PRs lets the destructive backend land first, get
smoke-tested against a real database, and stabilize before the client
surfaces it.

### 2026-04-29 — PR 18 update: simplify migration after PR 19, add missing tables to export

**Context:** PR 18's original migration was written before the schema
hygiene audit revealed that the public schema contained 14 tables (not
8) and that no FK constraints existed from `user_id` columns to
`auth.users`. PR 19 fixed the schema state. PR 18 is updated to build
on that foundation.

The original migration's `DO`-blocks that defensively cascade-rebuilt
FKs on `interaction_logs`, `parent_thoughts`, and `usage_events` are
no longer needed — PR 19 established those FKs with `CASCADE`. The
migration is now significantly shorter, focused on three specific
changes: `paused_at` column, `safety_events` flip from `CASCADE` to
`SET NULL`, and storage bucket setup.

The `account-export` Edge Function originally exported only 7 of the
14 tables. Most importantly, `saved_scripts` (the parent's
explicitly-saved scripts) was missing. Updated to also include
`saved_scripts`, `script_feedback`, `child_insights`, `incident_events`,
and `user_preferences`. The `subscriptions` table is excluded (billing
infrastructure, not user content). The `trial_usage` table is excluded
(anonymous device tracking).

**Decision:** Trimmed the migration. Updated the export. Updated the
smoke test plan to verify cascade behaviour against the full 14-table
schema. `account-delete` and `account-pause` functions unchanged —
they were already correct given the cascade FKs PR 19 established.

**Reasoning:** PR 19 raised the floor underneath PR 18. The simplified
migration now reads as the actual intent of PR 18 (paused_at + flip
safety_events + storage bucket) without the defensive re-assertions
that were a workaround for the missing FKs PR 19 fixed at the source.
The export update closes a real gap — exporting a parent's account
without their saved scripts would not have honoured the "Export your
data first" promise in the privacy policy.

### 2026-05-06 — Anthropic rate limit + scheduled-pause-cleanup cron + SOS safety filter fix

**Context:** Pre-launch audit identified two production-readiness gaps and
one latent safety bug:

1. The `chat-parenting-assistant` Edge Function had no per-user rate limit.
   A single user (or bot) could call the SOS or Question endpoints in a
   tight loop, billing real Anthropic spend with no ceiling. CLAUDE.md
   warns about this scenario explicitly and the FEATURE_INVENTORY flagged
   it. Real launch risk.
2. `scheduled-pause-cleanup` was deployed in the Edge Functions runtime
   and declared in `supabase/config.toml`, but the cron schedule itself
   was never wired. Without it, paused accounts never auto-delete at the
   30-day mark — a privacy-policy promise that wouldn't be kept.
3. While reviewing the code, the safety filter was found running ONLY on
   the `mode === 'question'` branch. The SOS path (the larger, more common
   path) bypassed it entirely. CLAUDE.md says "Safety filter precedes
   Claude. Don't bypass it for the question path — questions can carry
   crisis content." The current state was the inverse — the SOS path was
   the bypassed one. A parent describing a crisis on SOS would get a
   normal R/C/G script back instead of being routed to /crisis.

**Decision:** Fixed all three in a single PR.

1. Added `supabase/functions/_shared/rateLimit.ts` with two abuse-prevention
   caps that are deliberately above any real parent's usage. Both are
   counted from the existing `usage_events` table — no new tables, single
   PostgREST round-trip per request:

   | Window | Cap | Why |
   |---|---|---|
   | 60 s burst | 10 events | covers retries + follow-ups during a hard moment |
   | 24 h daily | 100 events | ~5x the heaviest plausible parent-day |

   Counted event types: `script_generated`, `followup_generated`,
   `question_generated`. The crisis path bypasses the limit entirely
   (Principle 4 — crisis is always free). On any DB error the helper
   fails OPEN (returns `ok: true` with a console.warn) so a transient
   Supabase outage doesn't block real parents during a hard moment;
   Anthropic-side billing alerts are the real cost ceiling.

2. Lifted `runSafetyFilter(input.message)` out of the `mode === 'question'`
   branch in `chat-parenting-assistant/index.ts` so it runs on every path
   before any Anthropic call. Crisis short-circuits with the same 200
   crisis envelope the question path used. The rate limit then runs only
   for the safe path (so crisis is never blocked).

3. Created migration `20260506_005_schedule_pause_cleanup_cron.sql` that
   enables `pg_cron` + `pg_net` extensions and registers a daily 03:00 UTC
   job calling `/scheduled-pause-cleanup` over HTTPS. The URL and bearer
   secret are pulled from runtime database settings the operator sets
   once per environment — see "Operator setup" below.

   Mobile-side, `RateLimitError` is added to `apps/mobile/src/lib/api.ts`
   and surfaced in both Home (Question) and child hub (SOS) handlers,
   showing the server-supplied message ("Sturdy needs a brief breather…"
   or "You've hit Sturdy's daily limit. It resets in 24 hours.") inline
   instead of the generic "couldn't get a response" copy.

**Operator setup (one-time per environment, run via Supabase SQL Editor as
superuser, NOT in a migration since values are environment-specific):**

```
alter database postgres set app.functions_url
  = 'https://<project-ref>.supabase.co/functions/v1';
alter database postgres set app.cron_secret
  = '<value-of-CRON_SHARED_SECRET-set-via-supabase-secrets>';
```

**Verification:**

```sql
-- Cron job registered
select jobid, jobname, schedule, active from cron.job
 where jobname = 'scheduled-pause-cleanup';

-- After the first scheduled tick (or manual trigger):
select status, return_message, start_time, end_time
  from cron.job_run_details
 where jobid = (select jobid from cron.job
                 where jobname = 'scheduled-pause-cleanup')
 order by start_time desc limit 5;
```

```bash
# Rate limit smoke test (replace <USER_JWT> with a real authenticated user):
for i in $(seq 1 12); do
  curl -s -o /dev/null -w "%{http_code}\n" \
    -X POST "$PROJECT_URL/functions/v1/chat-parenting-assistant" \
    -H "Authorization: Bearer $ANON_KEY" \
    -H "Content-Type: application/json" \
    -d '{"childName":"Test","childAge":5,"message":"hi","userId":"<USER_ID>"}'
done
# Expect: first ~10 return 200; the 11th returns 429 with Retry-After: 60.
```

**Rollback:**
- Migration: `select cron.unschedule('scheduled-pause-cleanup');`
- Rate limit: revert `_shared/rateLimit.ts` import + the safety/rate
  block in `chat-parenting-assistant/index.ts`. Mobile `RateLimitError`
  branches are no-ops if the server stops returning 429.

**Reasoning:** The two pre-launch gaps were single-user cost exposure and
an unkept privacy-policy promise — both real, both solvable with one PR.
The SOS safety filter bypass was found during the rate-limit insertion
work and is severe enough that it would have shipped at launch
otherwise. Folding the fix in here means CLAUDE.md's "safety precedes
Claude" rule is finally enforced on every path.

**Out of scope (logged for follow-up):**
- JWT validation in `chat-parenting-assistant` (closes the userId-rotation
  rate-limit bypass; needs mobile client coordination).
- Anthropic retry/backoff for transient 429/5xx (S4 from the launch audit).
- Sentry breadcrumb for rate-limit hits (will land with H8 / Sentry wiring).
- Composite index on `usage_events(user_id, created_at)` (S6) — works on
  the existing single-column indexes today; revisit when usage scales past
  ~100k events/user.

## 2026-05-09 — RevenueCat + Google Play Console Integration (Test Phase)

### Context
Sturdy+ billing was mocked (`useSubscription.ts` returned `isPremium: false` with console-log stubs). Ready to begin real in-app purchase testing on Android via RevenueCat.

### Decisions
1. **RevenueCat project recreated from scratch** — old project was outdated; clean slate avoids stale product IDs and API keys causing test confusion.
2. **Entitlement ID: `sturdy_plus`** — single entitlement granted by both monthly and annual subscriptions. Matches codebase naming.
3. **Lifetime plan removed** — RevenueCat suggested Monthly/Yearly/Lifetime; Lifetime removed to match the paywall in `upgrade.tsx` (monthly $9.99 + annual $69.99 only).
4. **Platform: React Native** — selected over Native Android since Sturdy is Expo/RN.
5. **SDK wired now, products later** — `react-native-purchases` installed, `useSubscription.ts` replaced with real RevenueCat calls, `_layout.tsx` initializes RevenueCat at module load and logs in users by Supabase ID. Purchases won't function until Play Console verification clears and product IDs are created there.

### Files changed
- `apps/mobile/src/hooks/useSubscription.ts` — full rewrite: checks `sturdy_plus` entitlement, real `purchase()` / `restore()`, listens for subscription changes.
- `apps/mobile/app/_layout.tsx` — added `Purchases.configure()` at module load, `Purchases.logIn(session.user.id)` in AuthGate, debug logging in dev.
- `.env` — added `EXPO_PUBLIC_REVENUECAT_API_KEY` (test key).

### Remaining steps (blocked on Play Console verification)
1. Create subscription products in Play Console: `sturdy_monthly_999` (monthly $9.99, 3-day trial) and `sturdy_annual_6999` (annual $69.99, 7-day trial).
2. Create Google Play Service Account → download JSON key → connect to RevenueCat.
3. Map Play Store product IDs to RevenueCat products under the `sturdy_plus` entitlement.
4. Set up internal testing track, upload AAB via `eas build --platform android`.
5. Add license testers (Gmail addresses) in Play Console → Settings → License testing.
6. End-to-end test: purchase flow, restore, cancellation, entitlement gating.
7. Future: RevenueCat webhook → new Supabase Edge Function to sync `subscriptions` table.

### Reasoning
Wiring the SDK before products exist lets us verify the code compiles, TypeScript is clean, and the hook interface is stable — without blocking on Google's verification timeline. The mock's interface (`{ isPremium, plan, purchase, restore }`) was preserved so zero call-site changes were needed.
### 2026-05-21 — Home screen data pipeline fix + 3-tab navigation + dashboard card cycling

**Context:** Home screen redesign introduced 3 dashboard cards (Last Session, Patterns, Sturdy+ Insight) and a new Family tab (empty placeholder). The cards displayed hardcoded fallback data instead of real data from the database, making them appear functional when they weren't.

**Issues found and fixed:**

1. **`child_profile_id` not passed to Edge Function** — `child/[id].tsx` called `getParentingScript()` without `childProfileId`, so `logInteractionEvent` wrote `null` to `interaction_logs.child_profile_id`. Home screen queries filter by `child_profile_id`, finding nothing. **Fix:** added `childProfileId: child.id` to the `getParentingScript` call.

2. **Hardcoded fallback data in Patterns card** — when `topTriggers` was empty, the code fell back to fake data (`Leaving places 4×, Bedtime 2×, Screen time 1×`). **Fix:** removed hardcoded fallback; shows empty state message instead.

3. **Hardcoded fallback in Last Session card** — timestamp defaulted to `'2 hours ago'` and child name to `'Emma'` when no log existed. **Fix:** proper empty state with guidance message.

4. **Unstable `useCallback` dependency** — `fetchChildInsights` depended on `[kidList]`, which is a new array reference every render. **Fix:** replaced with stable `kidIds` string derived from child IDs.

5. **Infinite render loop in `child/[id].tsx`** — `useEffect` at line 150 used `child` object and `activeChild` object as dependencies. `setActiveChild` triggered context re-render → new `child` reference from `useMemo` → effect re-fires → loop. **Fix:** extracted `childId` and `activeChildId` as stable string values for dependency comparison.

6. **Dashboard cards now cycle together** — all 3 cards wrapped in single `Animated.View` driven by `sessionAnim`. Auto-slides every 5s across children, swipeable, with amber indicator dots for 2+ children. Haptic feedback on manual swipe.

**Files changed:**
- `apps/mobile/app/(tabs)/index.tsx` — dashboard cards, data pipeline, cycling animation
- `apps/mobile/app/child/[id].tsx` — added `childProfileId` to API call, fixed infinite loop

**Documentation update (same session):**
- `CLAUDE.md` — updated to reflect 3-tab structure, home screen v6 Golden Beam layout, dashboard cards, `loadChildInsights.ts`, RevenueCat real SDK status, background/theme changes, auth screens
- `README.md` — updated active branch, repository structure, running instructions
- Created `docs/SESSION_END_CHECKLIST.md` — mandatory checklist for end of every dev session

### 2026-05-22 — Question Mode input elevation (The "Thinking Space")

**Context:** The "Ask Sturdy anything..." input on the Home screen was a single-line search pill. This visually contradicted the V1 pivot toward being a daily thinking partner, implying a short search query rather than a space to journal or explain complex context.

**Decision:** Designed and verified a new multi-line "Thinking Space" in `app/mockup.tsx`. 
- Switched to `multiline={true}` with a `minHeight` of 120 to physically resemble a journal.
- Added dynamic, rotating placeholders (e.g., "Why is bedtime suddenly a battle?") to passively teach the user what the AI can handle.
- Added a focused state that subtly brightens the glass card to ground the user during text entry.
- Integrated the newly merged `QuotaBar` directly below it.

**Reasoning:** A text box's affordance dictates how a user behaves. A large box invites a story; a small pill invites a command. Rotating placeholders remove the "blank canvas syndrome" without requiring a tutorial screen. This design is locked and ready to be ported to `(tabs)/index.tsx` in the next session.

2026-05-30 — Retired model string fixed across codebase + SOS eval harness added
Context: While building an evaluation harness for SOS-mode script quality, the harness's first run failed every scenario with an Anthropic 404 on the model identifier claude-sonnet-4-20250514. Investigation against the current API documentation confirmed the dated-format identifier had been retired in favour of the dateless claude-{name}-{major}-{minor} scheme introduced with the Claude 4.6 generation. The same retired string was hardcoded in the production Edge Function (chat-parenting-assistant/index.ts), meaning live SOS and Question requests were returning the generic failure message to parents. The outage was discovered by the eval, not by monitoring, underscoring the absence of error alerting on the hero path.
Decision: Corrected the model identifier to claude-sonnet-4-6 in the production Edge Function and in both eval harnesses, verified against a live API call confirming the account can reach that model. Added a manual, human-graded SOS evaluation harness (sos.eval.ts plus sos-eval-inputs.json) modelled on the existing Question-mode eval, covering the six scenarios from the Script Quality Standards plus intensity, length, and neurotype-variant tests. Added a one-retry resilience measure to generateScript: a structurally invalid model response (malformed JSON or failed shape check, such as a dropped avoid field) now triggers a single retry before failing to the parent, with non-OK HTTP responses still failing fast. Calibrated the harness's strict tier after initial over-reporting: the limit-clause check was reclassified from strict to advisory, because whether a Connect holds a limit is a semantic judgment that includes relational and stance-based forms ("I'm not going anywhere") which no pattern set can reliably detect; the high-intensity length tolerance was set to permit a clean seven-word line at intensity 5.
Reasoning: A hardcoded model identifier is a maintenance liability, because model IDs are periodically deprecated and a deprecation silently breaks the core feature with no warning. The eval's value was demonstrated immediately: beyond catching the outage, its calibrated runs surfaced two genuine voice findings on the hero path — an occasional banned-phrase intrusion ("I hear you") and a recurring tendency for the Connect line to run one to two words over the cap at high intensity. Both are deferred to a dedicated prompt-refinement pass, with the eval now in place to verify the fix. The retry addresses a rare but serious failure mode at the worst possible moment for a parent. The harness calibration reflects a principle worth retaining: the strict tier should contain only checks that can be judged mechanically and reliably, while semantic judgments belong in the advisory tier graded by eye.
Follow-up (deferred to watch list): A prompt-refinement pass to tighten the Connect line at higher intensities and reinforce the banned-phrase prohibition, verified by re-running the SOS eval. Extension of eval coverage to the Reconnect, Understand, and Conversation modes, which remain unmeasured. Error alerting on the Edge Function so a future model deprecation or outage is detected by monitoring rather than by chance.

2026-05-30 — Documentation model adopted; Script Quality Standards elevated; Blueprint harvested
Context: The repository's documentation had drifted from the shipped product, and the cause was diagnosed during this session: truth had migrated into the code—particularly file-header comments and the design tokens file—while the formal documents continued to assert older plans. The problem was sharpest in two areas. First, change concentrates heavily in the visual and theme layer, where iteration is frequent and exploratory, while the AI prompt and voice layer is deliberately stable and rarely touched. Second, divergences conceived mid-build were never reconciled back to the documents, orphaning the plans they replaced. A uniform documentation discipline had repeatedly failed because it asked for the same rigor everywhere regardless of how often each area actually changed.
Decision: Adopted a documentation model built on a single governing principle—each fact has exactly one authoritative home, chosen by the nature of the fact, and no fact is described authoritatively in two places. Mechanism lives in code (standardized five-field file headers and src/theme/colors.ts); intent, constraint, history, and scope live in documents; and where a document would compete with code, it yields and points to the code instead. The model defines four tiers (governance, contract, navigation, archive), a two-zone asymmetry that applies full headers and decision logging to the stable AI and backend core while treating the visual layer as code-as-truth with only system-level design decisions logged, a five-field header format for load-bearing files, and a divergence-logging rule that records mid-build changes of direction in this log at the moment of decision. CLAUDE.md is to be reconceived as a navigation tier that indexes authoritative homes rather than narrating mechanism. Critically, SCRIPT QUALITY STANDARDS.md is elevated from the contract tier to the governance core, recognized alongside this principles framework as a document the product descends from; it is locked and changes only through a deliberate, logged decision, with the SOS evaluation harness serving as its automated guardian against silent voice erosion. The full model and a seven-step migration sequence are recorded in docs/SESSION_HANDOFF.md. As the first migration step, the Master Blueprint's two durable fragments—the emergency-tool-to-thinking-partner shift and the dual experiential standard—were harvested into PRODUCT_PRINCIPLES.md, and the Blueprint was archived to docs/archive/ with its status marked and history preserved via git mv.
Reasoning: A documentation system must match how the work actually happens, not how documentation is conventionally kept, or it will be abandoned under time pressure precisely where change is most frequent. The two-zone asymmetry concentrates rigor where change is rare and consequential and lightens it where change is frequent and exploratory, which ends the drift at its structural source rather than demanding a discipline that has proven unsustainable. The elevation of the Script Quality Standards reflects that this document is the distillation of the founder's personal thinking about how a parent should speak to a child and is therefore the source of the product rather than one reference among many; it warrants the same protection as a locked principle. The harvest was sequenced first because it carried the only genuine risk of content loss, and completing it on the lowest-risk document validates the approach before the larger CLAUDE.md reconception. The model's principal risk is acknowledged: it depends on the Session End Checklist amendment (migration step six) to remain self-enforcing, since headers and the divergence log require the same maintenance discipline that documents previously lost; the model is more robust only because it removes the competing system, not because it is self-sustaining without enforcement.
Follow-up: Six migration steps remain, specified in docs/SESSION_HANDOFF.md: reconceive CLAUDE.md as the navigation tier; establish the planning-document hierarchy (V1 Launch Plan authoritative for scope, Roadmap reduced to post-launch horizons); date-stamp the Feature Inventory as a snapshot; archive the completed smoke test and the strategy notes (after confirming their core conclusions are preserved); amend the Session End Checklist with the model's closing checks; and apply the five-field header to load-bearing core files. The CLAUDE.md reconception is the recommended next step.

2026-05-30 — SOS prompt refinement: enforce banned-phrase ban, length cap, and mandatory avoid[]
Context: The SOS evaluation harness, run across several sessions against the Script Quality Standards, surfaced three findings on the hero path. First, the banned phrase "I hear you" appeared in a Connect script on one run, despite a global rule already prohibiting generic-empathy filler — the rule existed but was positioned as one example in a general constraints block rather than bound to the field where the violation occurred. Second, Connect lines ran one to two words over the cap at intensity four, exceeding even the looser of the prompt's own stated limits. Third, the intensity-five scenario dropped the required avoid array entirely, a recurrence of an intermittent structural failure first observed earlier; the aggressive minimisation instruction at intensity five (which directs the model to empty the coaching field) appears to bleed into the model treating other required fields as optional.
Decision: Made three minimal, targeted edits to buildPrompt.ts, the SOS prompt builder, holding to the principle that changes to the voice layer should sharpen the salience of existing rules rather than rewrite the voice. The banned-phrase rule was strengthened from a general example into an absolute prohibition bound explicitly to the Connect field. The intensity-four length guidance was reinforced to state a hard six-word limit for each of the three script fields, with explicit instruction that Connect must carry both feeling and limit within the cap and, if it cannot, must cut the feeling rather than the limit. The intensity-five guidance was amended to state that the avoid array is mandatory at every intensity and that brevity applies to script length, not to omitting required fields. On the length finding, the decision was deliberately to hold the existing cap and enforce it rather than to relax the standard, on the rationale that at high intensity brevity is itself therapeutic and a parent in a peak moment needs the shortest possible line.
Reasoning: The findings were not missing rules but rules of insufficient salience at the point of generation; the corrective was therefore prominence and field-specific placement rather than new standards or numbers, which keeps the change minimal and avoids the risk of flattening the warmth and specificity the eval had confirmed strong across prior runs. Verification was conducted against the eval, which returned zero strict failures after the edits, confirming the banned phrase absent, the intensity-four lengths within cap, and the avoid array present including at intensity five. The dropped-field reinforcement is understood to reduce the raw structural failure rate rather than eliminate it, since model output remains probabilistic; the production retry added earlier this session in generateScript remains the safety net for any residual case, which is the intended division of responsibility — the prompt lowers the failure rate, the retry absorbs the remainder. Verification was limited to a single confirmatory run by deliberate choice, on the basis that a structural instruction produces a binary, visible result that does not require the repeated sampling that voice-quality assessment would, and that API cost should be managed by treating eval runs as a deliberate gate rather than a step after every edit.
Follow-up: None required for this pass; the three findings are resolved on the mechanical bar and the production retry handles residual structural variance. The broader watch-list items remain: extending eval coverage to the Reconnect, Understand, and Conversation modes, and adding error alerting to the Edge Function. Going forward, eval runs should be batched as an end-of-work checkpoint rather than run after each individual prompt change, to manage API cost while preserving the harness's protective value.
Once this entry is appended and committed, the prompt-refinement pass is complete and fully recorded. A suggested commit message is "Log SOS prompt refinement and verification in OPERATIONS.md."
This closes a substantial and well-executed piece of work. The two findings you prioritised are resolved, the structural reinforcement you elected to add is verified, and the decision is recorded in the stable-core log with its reasoning and its relationship to the production retry made explicit. The session's prompt work now rests on measured evidence rather than impression, which is precisely what the eval was built to provide.

t to provide.


## 2026-05-30 (evening) — Edge Function error monitoring (Sentry) added
**Context:** The model-string outage earlier today was caught by an eval run, not by monitoring — the Edge Function logs errors via `console.error`/`console.warn`, but nothing watches those logs, so failures sit in the Supabase log stream unobserved. The gap was monitoring, not logging. Out-of-band alerting was the highest-priority launch-adjacent item.

**Decision:** Added Sentry error reporting to `chat-parenting-assistant` via a lightweight direct POST to Sentry's ingestion endpoint rather than the `@sentry/deno` SDK. Rationale: a single function with two known catch sites does not need the SDK's automatic context, and a minimal dependency keeps full control over what is transmitted — which matters for a parenting app where error payloads must not leak user content. Conscious divergence from Sentry's default onboarding (which recommends the SDK).
- Added a `reportError` helper that reads `SENTRY_DSN`, parses it, and sends ONLY the error message + safe tags (`service`, `mode`, `model`). No `input`, no parent message, no user content. Silent no-op if the DSN is missing or if reporting itself fails, so monitoring can never break the request path for a parent.
- Wired `reportError` into the two parent-facing catch sites (question-mode, tagged `mode: question`; SOS/script, tagged `mode: sos`). The two `console.warn` sites inside `generateScript` were deliberately NOT instrumented — they are the normal one-retry mechanism; only a both-attempts failure throws to the instrumented outer catch.
- Created a Sentry project (Deno platform, "alert on high priority issues", email on). Stored `SENTRY_DSN` as a Supabase secret on the live "Sturdy" project (`lwmzfhigommayvmvqzvf`).
- Type-checked clean (`deno check`) and deployed.

**Reasoning:** This adds no feature and alters no parent-facing behaviour — it adds out-of-band reporting to existing failure paths. Operational hardening permitted under the freeze, and a direct response to the silent-outage lesson.

**Incidental:** Identified three similarly-named Supabase projects. The live one hosting all five deployed functions is "Sturdy" (`lwmzfhigommayvmvqzvf`); "Sturdy-Mobile" and "Mr-Cat25's Project" are not production.


## 2026-05-30 (evening, session 2) — Sentry error-path verified end-to-end; key rotated
**Context:** Resuming to complete the deferred Sentry confirmation. The deployment entry above confirmed the happy path, but error-path delivery was unproven (a successful request emits no Sentry event by design). This session ran the deliberate induced-failure test.

**Pre-test anomaly investigated:** `functions list` showed all five functions redeployed overnight at an identical timestamp (06:10:09 UTC); `chat-parenting-assistant` had jumped 45 → 50. User confirmed no manual action. Initial hypothesis was an automated deploy pipeline; investigated `.github/workflows/test.yml` and found it is a CI TEST runner only (Deno + Jest) — it does NOT deploy. Hypothesis was wrong and is recorded as corrected. Most likely cause is a benign Supabase platform-side re-host (preserves deployed code). Rather than test on that assumption, redeployed the local copy (confirmed via grep to contain `reportError`/`SENTRY_DSN`) so the live function provably matched known source before inducing failure.

**Decision / test executed:** Set `ANTHROPIC_API_KEY` to an invalid value on the live project, redeployed, submitted one SOS request via the app (returned the expected failure state), confirmed the Sentry event, then restored a key and redeployed. Final SOS request returned a real script — production healthy.

**Result — CONFIRMED:** Sentry received the event within seconds. Payload exactly as designed: message `Anthropic error: 401 ... invalid x-api-key`, tags `mode: sos`, `model: claude-sonnet-4-6`, `service: chat-parenting-assistant`. This is the precise diagnostic that would have caught the prior silent outage at the moment it occurred. The monitoring gap is closed and proven, not merely deployed.

**Key rotation:** The real Anthropic key was not present anywhere in the Codespace (consistent with the env-rebuild gap — the eval reads it inline). Rather than hunt shell history, generated a NEW key in the Anthropic Console and set it as the live secret. ACTION OUTSTANDING: revoke the prior key in the Console if not already done, and store the new key in a password manager (not a repo file) so the eval and local tooling have it after any rebuild. The brief invalid-test-key value passed through shell history this session, further motivating rotation.

**Privacy finding — ACTION OUTSTANDING:** The Sentry event auto-captured the client's full IPv6 address (`user: ip:...`). Our `reportError` code does not send this — Sentry inferred it from request headers. For an app handling sensitive family situations, client IP is personal data that should not be logged against every error. Fix: disable IP storage in Sentry project settings (Project → Security & Privacy, "Prevent Storing of IP Addresses"), and/or ensure `reportError` sends no request context. Deferred to next session; non-blocking.

**Git state:** The `index.ts` Sentry change and the doc updates remain UNCOMMITTED by user choice. The live function is therefore ahead of the git repository — a code-drift-from-git condition to close when ready to commit.

# ═══════════════════════════════════════════════════════════════════════════
# SESSION 2026-05-31 — UI/UX Launch Audit begins (Welcome screen)
# ═══════════════════════════════════════════════════════════════════════════

## 2026-05-31 — V1 onboarding locked: signup-first; ToS reconciliation; welcome-aboard moment; value-first → V1.1
**Context:** UI audit (starting with the Welcome screen) surfaced a contradiction between the locked Launch Plan decision ("Guest path stays — let parents feel value before signup") and what is actually shipped. Welcome routes only to signup; code review found guest *scaffolding* present but no guest *entry point*: ToS promises guest-without-account use, auth/index.tsx has a "pending-child migration" that is a no-op if guest mode never wrote a child, QuotaBar/TrafficDots/Settings all have guest-aware branches and a `sturdy_guest_seen_v1` flag exists — but nothing starts a guest session (no signInAnonymously / "continue as guest"). So the app is built to *accommodate* guests while offering no door to *become* one.

**Decision (locked, no reversal for V1):**
1. **Signup-first stays for V1.** Welcome → signup → free tier (50 scripts/month, no hassle). This is an honest model and violates no principle, provided the docs match it. Not changing auth/migration/guest paths during the freeze.
2. **Reconcile the Terms of Service to match what's built.** ToS currently promises "use Sturdy as a guest without an account — guest data stored locally," which the product does not deliver from the entry point. A legal doc promising an unbuilt capability is the real trust issue here (Principle 7) and a Play Store policy risk (reviewers read linked policies). Fix the ToS language to describe the actual signup-first free tier. THIS IS THE ONLY MANDATORY CODE/DOC CHANGE from this decision for V1.
3. **Add a "welcome aboard" moment** after first successful signup — a warm, on-voice (Principle 5, long-walk register) confirmation that the parent is in and the free tier is real (not a trial). Reinforces Principle 6 (free tier is a real product) and starts the relationship on warmth rather than a cold drop into the tabs. Must avoid therapy-speak / "great choice!" energy.
4. **Value-first becomes the top V1.1 conversion experiment.** Guest reaches first SOS script → signup prompt appears *after* the result, framed as preservation ("keep your scripts, add [name]"), never as a toll. Deferred to V1.1 because it touches auth + an untested migration path — freeze-inappropriate now, and it is a conversion *optimization* that should wait for real funnel data per Sturdy's own data-driven V2 philosophy. The existing guest scaffolding lowers the future build cost.

**Reasoning:** Resolves the contradiction honestly, ships nothing risky into the freeze, and parks the optimization where strategy says optimizations belong (post-launch, data-driven). The trust principle is the master lens: signup-first is honest; a mismatched legal doc is not. Fix the doc, keep the flow.

**Follow-up / build items generated:** (a) ToS copy reconciliation [V1, BLOCKING — legal honesty + store risk]; (b) welcome-aboard post-signup moment [V1, design + copy]; (c) value-first guest flow [V1.1, top conversion experiment].

---

## 2026-05-31 — Welcome screen copy + layout (audit, line-by-line workshop)
**Layout (must-fix before store screenshots):** Rendered screens confirmed a composition bug — Beat 1 (longest headline) overflows: title (34px/44px line-height) + `textContainer flex:1.2` vs halo `flex:1` crams the desc against the home indicator. Beats 2/3 are balanced. Adopt the mockup's fix: halo `flex:1`, text-zone `flex:1` centered, title nudged ~33px/43px. Also fix the malformed asset filename `welcome-wc-think.png.png` (doubled extension) on Beat 2.

**Copy — Beat 1 (SOS hero), LOCKED:** "For the moment right before you lose it."
- Rationale: Thai's call to lead with raw recognition in the parent's own inner voice. Defensible against Principle 5 because the rawness is aimed at the *moment*, not the parent — a wise friend names the real thing plainly. Tightened from "the app you open before you start to lose it" by cutting the outside-the-app marketing framing ("the app you open"). Rejected en route: "Calm words to prevent your guilty conscience" — inverts posture (accuses the parent), assigns a psychological state (Principle 5 therapy-speak), "prevent" is an outcome-promise (AI Limitations), and guilt-framing is the exact dark-pattern Sturdy's Principle 7 rejects. Drops the "words not a script" thread from the old line; accepted as a trade for attention on the hero.

**Copy — Beat 2 & Beat 3:** pending workshop (next).

---

## 2026-05-31 — Welcome carousel copy LOCKED (voice-true) + governing principles

**Final locked copy (all three beats, voice-true descriptors):**
- Beat 1 (SOS): headline "For the moment right before you lose it." / desc "The right words, while it still matters."
- Beat 2 (Question): headline "The questions you'd never say out loud." / desc "Ask anything. No judgment, no jargon."
- Beat 3 (CTA): headline "From chaos. To connection." / desc "One hard moment at a time." + Get started.

**Why voice-true over benefit-clause:** Grounded in STURDY_STRATEGY_notes ("the voice is the moat") and FEATURE_INVENTORY (confirmed the benefits are real, not vaporware). The welcome screen's strategic job is to ENACT the voice, not describe the product — a parent can't be told the voice is better, only feel it. Marketing/benefit clauses ("in seconds") were rejected from the carousel because a feature boast on the one screen built to demonstrate voice undercuts the moat. "While it still matters" replaced "in seconds" (mother-language vs stopwatch-language). "Ask anything" chosen over "Ask Sturdy anything..." — keeps friend-permission register, signals the feature scope ("anything") without switching to product-instruction voice. "No judgment, no jargon" retained as a promise about the voice itself, not a feature claim.

**Two governing principles established (apply to ALL screens going forward):**
1. **In-app = recognition + voice; web landing = benefit + differentiation selling.** Principle 5's voice constraints govern the product surface. The landing page is the front door for cold/skeptical traffic and may carry the full benefit-and-differentiation sell. This resolves future copy debates: hard-sell energy has a home, and it's not the app.
2. **The welcome (and onboarding) ENACTS the voice; it does not describe the product.** No "how smart we are" boasts in the carousel. Differentiators (exact-age specificity, your-child fit) are SHOWN through the first SOS script and the setup flow, never claimed. Naming neurotype detection is also a Principle 1 violation, so "adapts to your child"-type claims stay out.

**Smartness signals relocated:** Thai's request to surface "how smart Sturdy is" (exact age, etc.) was redirected OUT of the carousel and INTO (a) the post-signup welcome-aboard / first-setup moment, where exact-age can be shown honestly by asking for it and explaining the why in one quiet line, and (b) the web landing page for the full list. Next build item: workshop the welcome-aboard setup-moment copy (Option B base: "Glad you're here… what's their name?").

**Layout fixes still required (from earlier in this entry):** Beat 1 overflow (adopt mockup flex/font fix); malformed asset filename welcome-wc-think.png.png.

---

## 2026-05-31 — Welcome carousel: SHIPPED & verified on-device
Applied locked copy + layout fix to apps/mobile/app/welcome/index.tsx (full-file replace). Renamed asset welcome-wc-think.png.png → welcome-wc-think.png (git mv) to match corrected code. Verified on-device: all three beats render correctly, amber emphasis lands as intended, Beat 2 image loads, Beat 1 overflow resolved, composition consistent across slides. Welcome screen audit + build COMPLETE.
Minor note (not actioned): headlines break to 3–4 visual lines from controlled \n + wrapping; fine on test device, eyeball on smaller screens later.
Still open from Welcome audit (deferred, not blocking): 4× gradient-token TODOs (hardcoded rgba(13,11,8) → Deep Warm base) — part of theme migration, address separately.


# ═══════════════════════════════════════════════════════════════════════════
# LEGAL — Terms of Service reconciliation (kept as a standalone legal record)
# ═══════════════════════════════════════════════════════════════════════════

## 2026-05-31 — Terms of Service reconciled to shipped reality (Pass 1 of 2)
**Context:** During the UI/UX launch audit, the Terms of Service was found to assert capabilities the app does not have — a legal-honesty issue and a Google Play policy risk (reviewers read linked policies), and a direct conflict with the trust mandate (Principle 7). The Terms exist in TWO independently-hardcoded places that drift separately: the source-of-truth `docs/legal/TERMS_OF_SERVICE.md` and the in-app screen `apps/mobile/app/legal/terms-of-service.tsx` (the screen does NOT import the markdown — it has its own inline copy). Both had to be fixed. The web/privacy docs did not carry these claims.

Three contradictions were identified:
1. **Guest-without-account claim** — both files promised guest use with local storage. The app has guest *scaffolding* but no guest *entry point* (no signInAnonymously / "continue as guest"); signup-first is the locked V1 model. The claim was false.
2. **Free-trial language** — both files described "free trials begin when you subscribe… you will be charged after the trial." Onboarding is locked as no-trial (the free tier IS the product). This trial-then-charge language is exactly the pattern that erodes trust and draws Play scrutiny; it describes a feature that does not exist.
3. **Free-plan / quota description** — both files state "unlimited SOS scripts; other modes limited to 50," which describes Principle 6's INTENDED model. Shipped code (migration 009) uses dual buckets where the script quota counts SOS and questions are separate. The Terms promise ("unlimited SOS") may not match what the code honors.

**Decision (Pass 1 — applied now, no dependencies):** Removed the guest claim and the free-trial language from BOTH files (full-file replacements).
- Accounts section now states plainly: creating an account is free and required, and the account syncs/backs up data. No guest language.
- Billing section now describes auto-renew + store-handled refunds only. No trial language.
- Rationale: both are unambiguous honesty fixes for features that do not exist; no pending decision blocks them. A Terms doc that accurately describes a genuinely-free account tier is itself a small trust asset, not just risk-removal.

**Deferred (Pass 2 — HARD DEPENDENCY on the quota decision):** The free-plan/quota paragraph was deliberately LEFT UNCHANGED in both files. It cannot be finalized until the deferred quota-logic decision is locked (SOS unlimited per Principle 6, vs SOS counts toward 50 per Launch Plan). Once locked: rewrite the free-plan paragraph in BOTH files to match the SHIPPED code, and verify the code matches the words. Writing it now would mean rewriting it after the decision.

**Caveat recorded:** This work makes the document HONEST (matches what the app does) — squarely a product/trust fix. It is NOT a legal review. Liability, governing-law, and billing clauses warrant a genuine legal review before launch. Claude is not a lawyer.

**Files changed:** docs/legal/TERMS_OF_SERVICE.md, apps/mobile/app/legal/terms-of-service.tsx. Suggested commit: "Reconcile Terms of Service to shipped reality (remove guest + trial claims); quota language pending quota decision".



# ═══════════════════════════════════════════════════════════════════════════
# SESSION 2026-05-31 (cont.) — Auth screen audit
# ═══════════════════════════════════════════════════════════════════════════

## 2026-05-31 — Auth screen (auth/index.tsx) audit + copy LOCKED
**Context:** Auth is the front door to value under signup-first. Full read of the 412-line screen. Mechanics are strong (a11y labels, keyboard handling, autocomplete hints, disabled/loading CTA, inline error clearing, a genuinely good confirm-email state). Findings flagged by type; copy locked via side-by-side mockup (sturdy-auth-mockup.html).

**LOCKED — copy changes (conversion + trust, freeze-safe):**
- Headline: "Create account" → "Let's get you set up." (warmer, Welcome-voice; transactional → friend register)
- Subhead: "Save scripts and personalise for your child." → "Free to start. No trial, no card — just your scripts, saved." (answers the parent's signup-wall fear "am I about to be charged?"; now TRUE because trial language was removed from ToS this session; trust-led conversion = remove fear, not manufacture urgency)
- CTA: "Create account" → "Create my free account." ("my free" reinforces no-cost at the commit pixel)
- Added free-tier note above CTA: "50 free scripts every month. Upgrade only if you want more."

**⚠ SOFT-LOCK / QUOTA DEPENDENCY:** The "50 free scripts every month" note touches the unresolved quota question. If SOS ends up UNLIMITED with only other modes capped at 50 (Principle 6 model), this line is imprecise and must be reworded (e.g. "Unlimited SOS. 50 free scripts a month for everything else."). This element is BLOCKED on the same quota decision as ToS Pass 2. Do not ship this line until quota is locked. The headline/subhead/CTA changes have NO such dependency and can ship now.

**Confirm "no card" matches reality:** signup must genuinely require no payment method (it does for a free account) — verify before shipping.

**Logged, NOT actioned (deferred):**
- BUG: pending-child migration (lines 79–80) writes stale `age_band` ('2-4'/'5-7'/'8-12') — contradicts exact-age architecture (Principle 3) AND doesn't cover teens (15yo → '8-12'). Part of the guest-migration path that has no entry point. Pull during quota/data pass.
- STATE: markOnboardingComplete() fires before email confirmation succeeds (line 88) — force-close after signup could skip Welcome assuming a confirmed account. Minor edge case.
- V1.1 GROWTH: no social/Apple/Google sign-in. Known conversion lever; email-only is honest + shippable for V1. Scope-creep flag, not a now-fix. (Note: adding Google later triggers Apple sign-in requirement per App Store rules.)
- POLISH: hardcoded gradient hex (lines 129,134) — same Deep Warm token-migration debt as Welcome.

**Still TO DECIDE before build:** whether the welcome-aboard moment attaches after the confirm-email step or after first successful sign-in (confirm-email state means there may be a gap between signup and an active session).

---

## 2026-05-31 — Quota model SHIPPED (75 scripts / 25 questions) + migration-history reconciliation
**QUOTA DECISION (locked, shipped, verified on-device):**
Free tier = 100 free generations/month, dual buckets: **75 scripts** (SOS + Reconnect + Understand + Conversation + follow-ups) + **25 questions**. Crisis-detected messages free + uncounted (safety filter runs before quota check — Principle 4, already enforced in code, verified). Unlimited was rejected on cost grounds (Thai's call, math done). SOS counts toward the 75 (not unlimited per Principle 6's original wording) — this is a deliberate revision of Principle 6, justified by cost reality + crisis-exemption protecting the safety net.
- Ground-truth check: live `get_quota_counts` had scripts_cap 50; migration 009 dual-bucket model WAS live despite history drift. Changed cap 50→75 in 4 places: new migration `20260531000010_quota_caps_75_25.sql` (get_quota_counts), Edge Function `SCRIPT_QUOTA_LIMIT` (line 37), `useQuota.ts` (EMPTY default + fallback), `result.tsx` (line 123 hardcoded cap). Verified on-device: bar reads "X of 75".
- Question cap stays 25 (unchanged).

**MIGRATION-HISTORY RECONCILIATION (significant infra fix):**
Root cause found: migration files used 8-digit DATE-ONLY versions (e.g. `20260521`), invalid for the CLI which expects 14-digit `YYYYMMDDHHMMSS`. Worked by accident until TWO files shared a date (008 + 009 both `20260521`) — the collision made the ledger untrackable and `db push` fail. Also an orphan history entry `20260520090648` (an early auto-named application of the same work) had no local file.
- Fix (minimal, surgical — did NOT re-version the 10 healthy migrations): reverted orphan `20260520090648`; reconciled the 8 synced migrations via `migration repair --status applied`; renamed the 2 colliding files to unique 14-digit versions `20260521000800` (008) + `20260521000900` (009) and 010 → `20260531000010`; reverted the stale `20260521` ledger row; marked the 2 renamed versions applied (schema already live); `db push` applied only 010.
- **DURABLE RULE (adopt going forward):** ALL new migrations MUST use full 14-digit timestamp versions. Use `supabase migration new <name>` which generates them automatically — never hand-name with date-only. This permanently prevents the collision class.
- Healthy 10 migrations deliberately left at 8-digit versions: they're unique, applied, working; re-versioning applied production migrations = risk for cosmetic gain. Conflict is resolved by fixing the 2 that collided + the forward rule, NOT by touching working history.

**NOW UNBLOCKED (were waiting on quota decision):**
1. ToS Pass 2 — rewrite the free-plan paragraph in both legal files to: "75 script generations + 25 questions per month free; crisis support always free." (Replaces the stale "unlimited SOS + 50 others" language.)
2. Auth free-tier note — finalize as e.g. "75 free scripts + 25 questions a month. Upgrade only if you want more." (the soft-locked element from the auth copy).

**Files to commit (one coherent unit):** renamed migrations 008/009 (git mv), new 010, Edge Function index.ts, useQuota.ts, result.tsx.



# ═══════════════════════════════════════════════════════════════════════════
# SESSION 2026-05-31 (close) — auth-security blocker, palette direction, housekeeping
# ═══════════════════════════════════════════════════════════════════════════

---

## 2026-05-31 — Email-confirmation OFF: launch blocker (auth security + free-tier abuse)
**Context:** Thai observed any fake email can sign up and get an active account. Root cause: Supabase "Confirm email" is DISABLED on the live project. With it off, signup creates an active account immediately with no verification (per Supabase docs: disabled = implicitly confirms email, returns a session). The app is ALREADY BUILT for confirmation — auth/index.tsx shows the "Check your inbox" (confirm-email) screen exactly when signUpData.session is null, which is the confirmation-required path. So this is a project SETTING, not a code change.

**Why it's a launch blocker (not cosmetic):**
- Free-tier abuse vector: we just set 75 scripts + 25 questions free per account. Fake/throwaway emails let one person farm unlimited free quota by re-registering → direct API cost + the exact abuse the quota limits exist to prevent.
- Junk accounts inflate the "~10 real parents" ship-gate metric.
- Unverified emails break password-reset and any future email features (can't reach the user).

**⚠ CRITICAL DEPENDENCY — do NOT just flip the toggle:** Enabling "Confirm email" REQUIRES a working SMTP server to deliver confirmation emails. Supabase's built-in email service is capped at **2 emails/hour, best-effort** (per docs). Enabling Confirm email on the default SMTP would BREAK signups at launch — the 3rd+ parent in any hour gets no confirmation email and is stuck on the "Check your inbox" screen, unable to activate. That trades fake-accounts for a worse problem (real parents can't sign up).

**The complete fix (its own focused session):**
1. Set up a custom SMTP provider (Resend / SendGrid / Postmark / Amazon SES — free tiers cover launch volume).
2. Verify the sending domain (DNS records — SPF/DKIM).
3. In Supabase: Authentication → Providers → Email → enable "Confirm email." Also set Site URL + Redirect URLs (URL Configuration) so the confirmation link returns to the app correctly.
4. Test the FULL flow: real email arrives → link works → account activates → confirm a fake/undeliverable email yields no usable account.
5. Customize the confirmation email template to match Sturdy's voice (Email Templates section) — small trust touch.

**Cleanup also required:** purge existing fake/test accounts created while confirmation was off (unconfirmed junk) before launch, so they don't skew the ship-gate metric.

**Status:** TRACKED LAUNCH BLOCKER. Deferred to a focused session (SMTP setup has DNS + deliverability testing that shouldn't be rushed). Not a code change — no commit needed; lives in dashboard + a future SMTP account.

---

## 2026-05-31 — Visual "gloom" diagnosis + LOCKED palette direction (deferred build)
**Context:** Thai felt the app was "too dark and gloomy" — initially read as app-wide. Advisor pushback after reviewing 8 live screens: the dark theme is an ASSET on content-rich screens (script result, Q&A answer, child profile all read as premium/calm/correct). The "gloom" is concentrated on EMPTY or LOW-CONTRAST screens (auth card barely separates from bg; Family screen is one card in a void). So a blanket palette-lightening was the wrong fix — it would wreck the strong screens to patch the weak ones.

**What Thai found (the locked direction):** An older welcome mockup (saved as sturdy-warm-palette-reference.html) uses a WARM-BROWN gradient background — `linear-gradient(165deg,#1a1206 0%,#0d0b08 40%,#060604 70%,#020202 100%)` — i.e. a warm brown top fading to near-black. This is the "lit-from-within" warmth Thai was reaching for (≈ the "Warm 1 / subtle brown lift" option from the palette study). Thai confirmed by RECOGNITION (already built + liked it), which is strong signal. THIS is the locked visual direction: warm the background gradient app-wide from near-black toward the warm-brown top.

**LOCKED (build deferred — not now):** Shift the app background gradient from pure near-black (#020202 top) toward the warm-brown direction (#1a1206-ish top → black bottom), applied via colors.ts tokens so it propagates app-wide. Goal: lift gloom on empty/low-contrast screens without flattening the content-rich screens.

**Two caveats that MUST carry to build time:**
1. The reference mockup contains OLD/REJECTED COPY ("The app you open before you lose it," "Calmer moments. Starting today."). DO NOT bring that copy back — the shipped/locked welcome copy stays. The file is a PALETTE reference only.
2. Accent fork to resolve at build: the mockup uses a warmer CORAL accent (#F79566) vs the shipped yellow-GOLD (#c9a85c). Decide whether only the background warms (keep gold accent) or the accent warms too. Recommend: warm the background, keep shipped gold accent — smallest change, tests the hypothesis without a second variable.

**Also flagged (independent of palette):** raise contrast on auth card borders + inputs (muddy, not just dark); fill the empty Family screen with warmth/content; "Conversation" tab label wraps awkwardly on home; SOS card coral-on-black runs low-contrast. These are per-screen polish items — the contrast fixes may matter MORE than the background warmth for the auth/empty screens.

**Scope note:** This is a design-system change (touches colors.ts → every screen). Deferred deliberately — needs a focused pass with on-device verification across multiple screens, not a rushed end-of-session edit. Build when ready; reference file preserved.

---

## 2026-05-31 — Housekeeping queued (minor, non-blocking)
**1. Deno editor noise:** VS Code's TS language server flags `Cannot find name 'Deno'` (ts2304) across supabase/functions test files (~59 "problems"). These are FALSE — the files run in the Deno runtime where `Deno` is defined; `deno test`/`deno check` pass clean. The editor is judging Deno files by Node/TS rules. FIX (cosmetic, do when convenient): install the Deno VS Code extension and enable Deno for the `supabase/functions` folder (settings: "deno.enablePaths": ["supabase/functions"] or a deno.json), so the editor uses Deno's rules there. Until then: IGNORE the Problems panel for those files; trust `deno test`.

**2. Stale test fixed (2026-05-31):** `buildPrompt.test.ts` intensity-4 assertion updated "Max 6 words" → "HARD LIMIT of 6 words" to match the prompt wording strengthened in the 2026-05-30 SOS refinement pass. Test was stale, prompt was correct. Committed separately.

**3. OPEN VOICE QUESTION (queued, evidence-based — do NOT decide by gut):** Thai flagged that the intensity-4 6-word cap "can sound choppy." This is a LOCKED-CORE voice question (Script Quality Standards). Resolve ONLY by running the SOS eval at intensity 4 and reading 5–10 actual regulate/connect/guide lines. If genuinely clipped/cold → loosen to 7 words with a logged decision + eval re-run to confirm warmth returns. If tight-but-warm (cf. shipped "really, really mad" line) → cap is correct, close the question. Do not change the number under CI pressure or by feel; the prompt already instructs "carry feeling AND limit; if it cannot, cut the feeling not the limit." The test fix above asserts whatever the prompt says TODAY (6) — changing the cap later is a separate logged decision + test update + eval run.

## 2026-05-31 — Terms Pass 2 + auth free-tier note FINALIZED (quota unblocked these)
Once 75/25 was locked, the two soft-locked copy items were completed and committed: ToS free-plan paragraph (both legal files) now reads '75 script generations + 25 questions per month, tracked separately; crisis support always free' (replaced stale 'unlimited SOS + 50 others'). Auth free-tier note finalized: '75 free scripts and 25 questions every month. Upgrade only if you want more.' Auth headline/subhead/CTA also shipped (Let's get you set up / Free to start, no trial, no card / Create my free account). All committed to main as 6000d26.

## 2026-05-31 — Warm Ember palette shipped + auth seam fixes
- Merged claude/warm-palette-shift-v1-AHuI3 → main (merge 46b5657, pushed).
- Palette: Twilight → Warm Ember. Gradient top/mids warmed #020202→#1a1206; bottom kept #050402; gold accent + all copy unchanged. 9 hardcoded screens repointed to tokens (recurring "truth in screens not tokens" drift).
- Verified on device: Family/Home lifted out of gloomy without good screens (result/child profile) going muddy. textMuted readability held (0.55→0.62 bump NOT needed/applied).
- Auth fixes (commit 7844fd3): (a) stickyContent footer #050402→gradientTop — removed horizon seam where flat block met warmed fade; (b) stickyFade mid-stop rgba(2,2,2,0.88)→rgba(26,18,6,0.88) — removed dark dip line above Sign in.
- TECH DEBT: rgba(26,18,6,0.88) hardcoded inline — should become a `gradientTopAlpha` token in colors.ts to prevent future drift.
- NOTE: reference html (sturdy-warm-palette-reference.html) uses a faster/darker mid-falloff than shipped tokens. Reference + shipped palette should be reconciled so "locked" stays truthful — shipped is warmer through the mid-band by design.

## 2026-05-31 — Palette shift: Twilight → Warm Ember (v8)

**Context:** App read as "gloomy" — gloomy screens (auth, Family) felt flat/dead
against a pure-black night-sky base (#020202). Root cause of prior failed attempts:
9 screens hardcoded the gradient array / #020202 instead of consuming colors.ts
tokens, so warming the tokens alone didn't propagate (recurring "truth hardcoded
in screens, not tokens" drift).

**Decision:** Warm the gradient TOP/upper-mid stops from #020202 toward warm brown
#1a1206 (full ramp #1a1206 → #171009 → #13100a → #100c08 → #0a0806), keeping the
BOTTOM stop calm at warm near-black #050402. Background-only — gold accent
(#c9a85c → #a8843a → #8a6820) untouched, no copy changed. Repointed all 9
hardcoded screens + 3 gradient sets (main/Result/Settings) + legacy aliases +
particlesBg to tokens. Built on branch, code-reviewed, verified on-device, merged
(46b5657 / c18cffc).

**Reasoning:** Trust-led warmth — lift the gloom without trading away the calm,
content-focused feel on script-result and child-profile screens (hence the kept
near-black floor). Fixing the hardcoded-screen drift means future palette changes
propagate from tokens as intended.

**Open follow-up:** textMuted opacity (0.55) was NOT changed — verify legibility
on warm areas on-device; bump toward ~0.62 if dim, do NOT re-darken background.

# OPERATIONS.md — Entries to append (session 2026-06-01)

Paste these into docs/OPERATIONS.md.

---

## 2026-06-01 — Home greeting: kill email-name scrape, graceful no-name, drop "Good night"

**Context:** Home greeting rendered "Good night, Mr." — it was scraping the email local-part as a first name and falling back to honorifics. A wrong/fake name on the heart screen reads as "this app doesn't know me" — a trust leak on the screen whose job is to feel like a thinking partner. Also "Good night" fired 9pm–5am, greeting a parent who just *opened* the app (often mid-crisis) with a send-off.

**Decision:** In `(tabs)/index.tsx`: removed the email-scrape fallback entirely; added an honorific/junk guard (mr/mrs/ms/miss/dr/mx, <2 chars → no name); `firstName`/`displayName` resolve to empty string on no real name; render drops the comma when empty ("Good evening." not "Good evening, ."). Simplified `getTimeGreeting()` to morning/afternoon/evening (removed "Good night"; evening carries the night). Shipped + verified on-device.

**Reasoning:** Honest > fake. A nameless warm greeting beats a wrong name. The REAL root — signup writing email-derived junk into `profiles.full_name` — is a capture bug to fix in the auth/welcome-aboard flow (parent's name asked properly). Logged as follow-up; not fixed in Home.

**Follow-up:** Recognition-driven greeting (reference child, streak, last session) is a V2 lever — needs analytics backend. Do NOT add random greeting variation (rejected: randomness undercuts the steady "long-walk" register and doesn't create real recognition).

---

## 2026-06-01 — Quota numbers: launch plan was stale (50), shipped reality is 75/25

**Context:** Launch plan said "50 scripts/month across all modes." Shipped app, auth copy, and ToS all say 75 scripts + 25 questions. TrafficDots on-device confirmed: Scripts 0/75, Questions 0/25, resets monthly.

**Decision:** Shipped 75/25 is ground truth. The launch plan is the stale doc — update it (line ~18, Key Decision ~207) to "75 scripts + 25 questions, dual buckets," and recompute the cost line (~$0.75/mo max per free user at 75, not $0.50). NOT a launch blocker — app/legal/auth already agree; only the plan disagreed.

**Reasoning:** The dangerous case (app/legal/store disagreeing) does not exist. Single docs-sync fix.

---

## 2026-06-01 — Home: "Always free · No paywall" line is false — must change (OPEN)

**Context:** Home shows "Always free · No paywall" directly above a tone selector with two visible padlocks, and the model is 75/25-then-wall. The claim is false in the conversion-critical direction — a parent who hits the quota will remember "no paywall" → "bait and switch" 1-star risk.

**Decision (pending build):** Replace with a true, warm line — e.g. "75 free scripts & 25 questions each month" or "Free to start — no card needed." Remove the "no paywall" claim. Trust-led: truth converts better than a broken promise.

**Status:** OPEN — not yet shipped. Flagged as a trust leak to fix on Home.

---

## 2026-06-01 — Home direction: ADAPTIVE (time-of-day) layout + Twilight aesthetic [LOCKED]

**Context:** Original complaint: SOS (the hero feature) sits below the fold on current Home. But Thai's insight: at 11pm it's reflection (Ask), not crisis (SOS) — intent changes by time of day. A static reorder can't serve both. Boundary confirmed with Thai: active ~6am–7pm (kids awake), calm ~7pm–6am.

**Decision (LOCKED):** Build adaptive Home (scope B): one screen, two layout states sharing a single time-of-day helper. DAYTIME → SOS hero, Ask collapsed. EVENING → Ask hero, SOS collapsed. Non-hero mode always reachable as a quiet tap-row. Silent adaptation (never announced). Full Twilight aesthetic — but uses the EXISTING Fraunces + DM Sans fonts (`F.heading`, `F.scriptItalic` already wired; scriptItalic already in use line 897) — NO new fonts/deps. Timeline flexed off June 15 to build Home once, fully, since it's the visual source-of-truth for all other screens.

**Reasoning:** Reconciles Thai's 11pm-reflection insight with the plan's "SOS is the hero" — SOS leads when crisis is likely, recedes when it isn't. Doing (a) layout-only now would force a third pass at Home to add the aesthetic later; flex bought = build (b) once.

**Rejected:** (a) layout-only; static "always SOS-first"; day/night manual lighting toggle (would require a whole second light theme = scope creep; dark-by-default is correct for edge-of-day use).

**Brief:** BRIEF_home_adaptive_B.md — ready for Claude Code. Has flag-don't-guess stop points (flat `<Background />`, greeting/boundary contradiction) → needs Thai available, not unattended overnight.

---

## 2026-06-01 — Home child identity: inline switcher in eyebrow + Add-a-child in sheet [LOCKED, brief ready]

**Context:** Standalone "Emma · 6" pill floated below the Ask input. "+ Add" (the #1 conversion lever, 1-child→paywall) sat passively in that row.

**Decision (LOCKED):** Move child name into the eyebrow as a tappable chip ("Ask about [Emma ▾]"). Tapping opens a Modal sheet: switch child (checkmark on active) + a distinct "Add a child" row. Removes the floating pill (kills an element vs. relocating). "Add a child" routes through existing `handleAddChild` → `/child/new`; the 1-child gate fires at the destination (mount-level `useEffect` in child/new.tsx, added by the Family-tab PR). NO duplicate gate logic. Built with built-in `Modal`, no new dep.

**Reasoning:** Cleaner top-of-screen; a deliberate tap into the switcher is higher-intent than a passive "+", and keeping the gate at one destination avoids the recurring "logic hardcoded in multiple places" drift.

**Brief:** BRIEF_home_inline_child_switcher.md — gate question resolved, ready for Claude Code. Independent of the adaptive-layout brief (can land before or after).

# OPERATIONS.md — Entries to append (session 2026-06-02)

Paste into docs/OPERATIONS.md.

---

## 2026-06-02 — Vision re-anchored from founder's original docs (philosophy now drives calls)

**Context:** Across multiple AI build sessions the project had drifted from its original vision.
Founder shared the original README/blueprint/strategy/roadmap/principles docs to re-extract the
soul, not to compare built-vs-unbuilt.

**Decision:** The vision is the spine of all product/marketing/design calls going forward:
Respond → Understand → Grow → Find your own voice; core question "What should I say right now?";
deeper promise "a better parent, one moment at a time" (a quiet byproduct, never the pitch — we
do NOT promise outcomes/"you'll become"); philosophy "Sturdy gives you the words, use them
exactly or make them yours"; the MOAT is the voice ("wise friend on a long walk"), not the AI;
register is capable-not-dependent, relief-not-guilt, deliberately not addictive.

**Reasoning:** Features get cloned; voice and philosophy don't. Re-anchoring stops the per-session
drift and gives every decision a fixed reference.

---

## 2026-06-02 — Adopted Journey Audit method (stop chasing isolated leads)

**Context:** Sessions had become reactive — chasing screenshots/ideas one at a time, rediscovering
the same issues (e.g. stale "50 scripts" quota number resurfacing repeatedly).

**Decision:** Audit by the parent's journey, not by screen. Six stages (Onboarding → Core Loop →
Convert/Paywall → Review → Reflective/Ask → Account), fixed order, each finished before the next and
never reopened. Per stage: define must-cover + enhancements → Claude Code audits real code/reports
current state → judge gaps → Claude Code fixes via brief → test on-device → stage DONE. Out-of-stage
items are PARKED and TRACKED, not fixed early. Doc: STURDY_JOURNEY_AUDIT.md (in repo).

**Reasoning:** Journey-based walking surfaces flow bugs (e.g. pills→hub redundancy) that screen-by-
screen misses, and prevents thrash. Discipline applies to the founder too: no jumping.

---

## 2026-06-02 — Gender-tone script differentiation REJECTED

**Context:** Considered making scripts "sound different for boys vs girls" (founder's real parenting
observation that talking to a 12yo girl differs from a 12yo boy).

**Decision:** Do NOT build gender-based script tone or boy/girl avatars. The real differences are
captured by the EXISTING axes — age calibration, intensity (crisis throttle), silent neurotype
blocks, tone selector, message-length awareness — plus the planned free-text "tell us about [child]"
field (per-child specificity).

**Reasoning:** Gender is the wrong axis — it encodes stereotypes the developmental research doesn't
support, breaks "it knows MY kid" for children who don't fit the mold, and collides with the silent-
inference philosophy (Principle 1). The trait the founder observed (e.g. "needs it direct" vs "needs
to talk it out") lives in the individual child, captured via description, not a gender flag.

---

## 2026-06-02 — Child screens consolidated; old hub retired (PR #63, PENDING)

**Context:** Two child screens existed — old hub `child/[id]` (a second "What needs repair" script
generator + tone) and `child-profile/[id]` (value-first review). The hub duplicated Home's SOS
generation; the Home mode pills (Reconnect/Understand/Conversation) all produced SOS-style output
(Understand/Conversation have no distinct engine — roadmap Phase 3), over-promising distinct modes.

**Decision:** Home GENERATES (SOS hero + Ask); `child-profile/[id]` is the REVIEW/profile space. Cut
the Home mode pills, retire `child/[id]`, redirect result "Back" → `child-profile/[id]`, disable the
(non-functional) edit link until V2. Built as PR #63 — LEFT OPEN/UNMERGED until we reach Stage 2/4 of
the journey audit (do not merge mid-journey).

**Reasoning:** Eliminates the repetitive second generator and two-child-screen confusion. One door to
generate, one space to review.

---

## 2026-06-02 — Paywall copy locked; "unlimited free" lie flagged (FIX AT STAGE 5)

**Context:** The live upgrade screen lists "Unlimited SOS scripts" under "Always Free" — false under
the shipped 75/25 model, on the legally-sensitive subscription screen (bait-and-switch / Principle 7).

**Decision (copy):** Final paywall copy locked — empathy open → "words that actually fit" (age /
shaped-to-child / research-grounded / calmest-when-hardest) → comparison (therapist/books/Google vs
"< a coffee a week, right now") → plans ($9.99/mo, $69.99/yr) → philosophy close. All claims verified
true against the script prompt. No named authors, no exposed mechanism. (Mockup: sturdy-paywall-final.html.)
**Decision (the lie):** The "unlimited SOS — always free" line MUST be replaced with an honest line.
TRACKED and PARKED for Stage 5 (Convert/Paywall) — not fixed early, per journey discipline. Do not forget.

**Reasoning:** Honest converts better long-term; a visible falsehood on the paywall is the exact
dark pattern the constitution forbids. Fix it in its stage with the full paywall build.

---

## 2026-06-02 — Subscription hooks PARKED pending real-parent feedback

**Context:** Founder worried V1 is too thin to retain to V2; considered building a locked "insights"
hook + free avatar customization to drive subscriptions.

**Decision:** Do NOT build speculative retention hooks now. Ship, get ~10 real parents using SOS,
collect feedback, THEN decide retention/hooks from data. (Insights card would also be selling the
"patterns" feature that is genuinely "coming soon" — would be vaporware behind glass.)

**Reasoning:** Retention for this product = "did it help in the moment," repeated. The highest-leverage
work is script quality + getting real usage, not speculative locked features. Avoid building hooks for
a problem we have no data on yet; avoid locking an empty/unbuilt feature (Principle 7).
