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
