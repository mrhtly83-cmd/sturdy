# Smoke test: account lifecycle backend (PR 1)

This is the manual smoke-test plan for the backend half of the
account-deletion + pause + export feature. PR 2 (the mobile UI) does
**not** start until every step here passes against a real Supabase
project.

The checks are written to be runnable from `psql` + `curl`. They
exercise the destructive paths end-to-end: pause → cron tick →
auto-delete → safety_events anonymization. Run against a staging
project first, never production.

---

## 0. Prerequisites

Apply the migration and deploy the four Edge Functions:

```bash
# Apply the migration
npx supabase db push

# Deploy the Edge Functions
npx supabase functions deploy account-export account-pause account-delete scheduled-pause-cleanup

# Set the system-caller secret for the scheduled function
# (alternative to passing the service role key)
npx supabase secrets set CRON_SHARED_SECRET=<random-32-bytes-hex>
```

Capture for reuse:

```bash
PROJECT_URL="https://<project-ref>.supabase.co"
SERVICE_ROLE_KEY="<service_role_key>"
ANON_KEY="<anon_key>"
```

## 1. Verify schema state

```sql
-- profiles.paused_at exists and is nullable
select column_name, is_nullable, data_type
  from information_schema.columns
 where table_schema = 'public'
   and table_name   = 'profiles'
   and column_name  = 'paused_at';
-- expect: paused_at | YES | timestamp with time zone

-- safety_events.user_id is now nullable
select is_nullable
  from information_schema.columns
 where table_schema = 'public'
   and table_name   = 'safety_events'
   and column_name  = 'user_id';
-- expect: YES

-- safety_events FK is SET NULL (was CASCADE under PR 19; flipped by this migration)
select pg_get_constraintdef(oid)
  from pg_constraint
 where conrelid = 'public.safety_events'::regclass
   and contype  = 'f';
-- expect: a row matching ... REFERENCES auth.users(id) ON DELETE SET NULL

-- All 10 user-scoped tables have user_id FKs (CASCADE except safety_events SET NULL).
-- This is the same audit query from PR 19's smoke test, run again to confirm
-- nothing regressed.
select
  tc.table_name,
  rc.delete_rule
from information_schema.table_constraints tc
join information_schema.key_column_usage kcu
  on tc.constraint_name = kcu.constraint_name
join information_schema.constraint_column_usage ccu
  on ccu.constraint_name = tc.constraint_name
join information_schema.referential_constraints rc
  on tc.constraint_name = rc.constraint_name
where tc.constraint_type = 'FOREIGN KEY'
  and ccu.table_schema = 'auth'
  and ccu.table_name   = 'users'
  and tc.table_schema  = 'public'
  and kcu.column_name  = 'user_id'
order by tc.table_name;
-- expect 10 rows:
--   child_profiles      | CASCADE
--   conversations       | CASCADE
--   interaction_logs    | CASCADE
--   parent_thoughts     | CASCADE
--   safety_events       | SET NULL   ← flipped by this migration
--   saved_scripts       | CASCADE
--   script_feedback     | CASCADE
--   subscriptions       | CASCADE
--   usage_events        | CASCADE
--   user_preferences    | CASCADE

-- Storage bucket exists and is private
select id, name, public from storage.buckets where id = 'account-exports';
-- expect: account-exports | account-exports | f

-- Storage RLS policies exist
select policyname from pg_policies
 where schemaname = 'storage' and tablename = 'objects'
   and policyname like 'account_exports_%';
-- expect: account_exports_read_own / write_own / delete_own
```

## 2. Pause flow

Sign in as a test user, capture their JWT (`USER_JWT`) and `USER_ID`.

```bash
curl -X POST "$PROJECT_URL/functions/v1/account-pause" \
  -H "Authorization: Bearer $USER_JWT" \
  -H "Content-Type: application/json" -d '{}'
# expect: 200 { "ok": true, "pausedAt": "..." }
```

Verify in DB:

```sql
select id, paused_at from profiles where id = '<USER_ID>';
-- expect: paused_at non-null, ~now()
```

Confirm the user is signed out: subsequent calls with the old JWT
should return 401 (the refresh token was revoked).

## 3. Trigger the cron manually

The cron schedule itself is configured per environment (dashboard or
pg_cron — see `supabase/config.toml`). For the smoke test we hit the
function directly with the system-caller credential.

First, simulate that the paused_at is older than 30 days:

```sql
update profiles
   set paused_at = now() - interval '31 days'
 where id = '<USER_ID>';
```

Then call the cleanup function:

```bash
curl -X POST "$PROJECT_URL/functions/v1/scheduled-pause-cleanup" \
  -H "Authorization: Bearer $SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" -d '{}'
# expect: 200
# {
#   "ok": true,
#   "candidates": 1,
#   "deleted": 1,
#   "failed": 0,
#   "details": [{ "userId": "<USER_ID>", "status": "deleted" }]
# }
```

## 4. Verify the auto-delete

Before triggering the cleanup, populate the test user with realistic data
across the full schema so the cascade has something to cascade through.
Recommended seed:

```sql
-- 1 child profile
insert into child_profiles (user_id, name, child_age) values ('<USER_ID>', 'Test Child', 5);
-- 1 saved script (most important user-saved content)
insert into saved_scripts (user_id, child_profile_id, title, trigger_label, structured)
  values ('<USER_ID>', (select id from child_profiles where user_id = '<USER_ID>' limit 1),
          'Bedtime meltdown', 'transitions', '{"regulate":{"script":"…"}}'::jsonb);
-- 1 piece of script feedback
insert into script_feedback (user_id, ...) values ('<USER_ID>', ...);
-- 1 user_preferences row
insert into user_preferences (user_id, ...) values ('<USER_ID>', ...);
-- Trigger one Question response in the app, or insert directly:
insert into parent_thoughts (user_id, prompt_text, response_text)
  values ('<USER_ID>', 'test question', 'test response');
-- Trigger the safety filter, or insert directly:
insert into safety_events (user_id, message_excerpt, risk_level, policy_route, classifier_version)
  values ('<USER_ID>', 'test', 'ELEVATED_RISK', 'safety_support', 'v1-keyword');
```

After running the cleanup function from step 3, verify:

```sql
-- The user is gone from auth.users
select id from auth.users where id = '<USER_ID>';
-- expect: 0 rows

-- All 10 user-scoped tables cascaded (count = 0 for each)
select 'profiles'         as t, count(*) from profiles         where id      = '<USER_ID>'
union all select 'child_profiles',   count(*) from child_profiles    where user_id = '<USER_ID>'
union all select 'conversations',    count(*) from conversations     where user_id = '<USER_ID>'
union all select 'interaction_logs', count(*) from interaction_logs  where user_id = '<USER_ID>'
union all select 'parent_thoughts',  count(*) from parent_thoughts   where user_id = '<USER_ID>'
union all select 'saved_scripts',    count(*) from saved_scripts     where user_id = '<USER_ID>'
union all select 'script_feedback',  count(*) from script_feedback   where user_id = '<USER_ID>'
union all select 'subscriptions',    count(*) from subscriptions     where user_id = '<USER_ID>'
union all select 'usage_events',     count(*) from usage_events      where user_id = '<USER_ID>'
union all select 'user_preferences', count(*) from user_preferences  where user_id = '<USER_ID>';
-- expect: every row count = 0

-- Safety events are NOT deleted — user_id is NULLed instead
-- (the safety_events row inserted above should now be anonymized)
select count(*) as anonymized
  from safety_events
 where user_id is null
   and created_at > now() - interval '1 hour';
-- expect: count > 0 (and matches the number of safety rows the test user had).
-- The message_excerpt and other fields stay intact — only user_id is NULLed.
```

## 5. Direct delete flow (no pause)

Sign in as a *different* test user with a fresh `USER_JWT2` / `USER_ID2`.

```bash
# Pre-create one safety_events row for this user (insert directly via SQL
# or trigger the safety filter in the app).
```

Delete:

```bash
curl -X POST "$PROJECT_URL/functions/v1/account-delete" \
  -H "Authorization: Bearer $USER_JWT2" \
  -H "Content-Type: application/json" \
  -d '{"confirmationText":"DELETE"}'
# expect: 200 { "ok": true, "deletedUserId": "<USER_ID2>", "reason": "DELETE" }
```

Re-run the assertion queries from step 4 with `<USER_ID2>` substituted.
Same expectations: cascade deletion of public.* rows, safety_events
preserved with `user_id = null`.

## 6. Confirmation guard rails

```bash
# Wrong confirmation string is rejected
curl -X POST "$PROJECT_URL/functions/v1/account-delete" \
  -H "Authorization: Bearer $USER_JWT3" \
  -H "Content-Type: application/json" \
  -d '{"confirmationText":"delete"}'
# expect: 400

# PAUSE_EXPIRED requires system caller, not user JWT
curl -X POST "$PROJECT_URL/functions/v1/account-delete" \
  -H "Authorization: Bearer $USER_JWT3" \
  -H "Content-Type: application/json" \
  -d '{"confirmationText":"PAUSE_EXPIRED","targetUserId":"<some_id>"}'
# expect: 401

# scheduled-pause-cleanup requires service role / cron secret
curl -X POST "$PROJECT_URL/functions/v1/scheduled-pause-cleanup" \
  -H "Authorization: Bearer $ANON_KEY" -d '{}'
# expect: 401
```

## 7. Export flow

Sign in as a fresh test user. Populate with the same seed as step 4 so the
export has data across all the user-relevant tables: 1 child profile,
1 saved script, 1 script_feedback row, 1 user_preferences row, 1
parent_thought (trigger via the app or insert directly).

```bash
curl -X POST "$PROJECT_URL/functions/v1/account-export" \
  -H "Authorization: Bearer $USER_JWT4" \
  -H "Content-Type: application/json" -d '{}'
# expect: 200 { "ok": true, "url": "https://...", "expiresInSeconds": 86400 }
```

Open the signed URL — it should download a zip. Unzip:

```bash
unzip sturdy-export-*.zip
# expect two files:
#   sturdy-export.json  — every row from the user's data
#   sturdy-export.md    — readable summary
```

Verify the JSON contains data from these 12 user-relevant tables:

- profile (single object)
- childProfiles, conversations, messages, parentThoughts,
  interactionLogs, usageEvents, savedScripts, scriptFeedback,
  userPreferences, childInsights, incidentEvents (arrays)

The JSON does **not** contain `safety_events`, `subscriptions`, or
`trial_usage` (operational/anonymous data; not user content).

Verify the Markdown has these sections in order:

1. Header + account info
2. Your children
3. **Your saved scripts** — must be present and prominent. The seeded
   "Bedtime meltdown" entry should appear here with its trigger label,
   created_at, and the structured JSON.
4. Your conversations (with messages nested)
5. Your Question conversations (parent_thoughts)
6. Your script feedback
7. Your insights (child_insights, marked auto-generated)
8. Your incidents (incident_events)
9. Your preferences (user_preferences as JSON)
10. Notes on this export (Anthropic disclosure)

The signed URL stops working after 24 hours (or after re-signing fails).

## 8. RLS verification

Try to read another user's export with the wrong JWT:

```bash
# As USER_JWT4, attempt to read USER_ID2's export folder via the REST API
curl "$PROJECT_URL/storage/v1/object/list/account-exports?prefix=$USER_ID2/" \
  -H "Authorization: Bearer $USER_JWT4"
# expect: empty list (RLS hides other users' folders)
```

---

## Sign-off

PR 2 (mobile UI) is unblocked once **every** assertion above passes
against staging. Paste the full test log into the PR 1 review thread
before merging to main.
