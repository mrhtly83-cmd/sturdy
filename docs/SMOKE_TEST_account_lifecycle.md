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

-- safety_events FK is SET NULL
select pg_get_constraintdef(oid)
  from pg_constraint
 where conrelid = 'public.safety_events'::regclass
   and contype  = 'f';
-- expect: ... ON DELETE SET NULL

-- interaction_logs / parent_thoughts / usage_events FKs are CASCADE
-- (skip rows where the table doesn't exist on this environment)
select c.conrelid::regclass::text as table_name,
       pg_get_constraintdef(c.oid) as definition
  from pg_constraint c
 where c.conrelid::regclass::text in (
         'public.interaction_logs',
         'public.parent_thoughts',
         'public.usage_events'
       )
   and c.contype = 'f';
-- expect: every row's definition contains ON DELETE CASCADE

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

```sql
-- The user is gone from auth.users
select id from auth.users where id = '<USER_ID>';
-- expect: 0 rows

-- All cascading public.* rows are gone
select 'profiles'        as t, count(*) from profiles        where id      = '<USER_ID>'
union all
select 'child_profiles',         count(*) from child_profiles  where user_id = '<USER_ID>'
union all
select 'conversations',          count(*) from conversations   where user_id = '<USER_ID>'
union all
select 'usage_events',            count(*) from usage_events    where user_id = '<USER_ID>';
-- expect: every row count = 0

-- Safety events are NOT deleted — user_id is NULLed instead
-- (Pre-create at least one safety_events row for this user before pausing
-- so this assertion has data to check.)
select count(*) as anonymized
  from safety_events
 where user_id is null
   and created_at > now() - interval '1 hour';
-- expect: count > 0 (and matches the number of safety rows the test user had)
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

Sign in as a fresh test user. Pre-create some data: one child profile,
one conversation, one parent_thought.

```bash
curl -X POST "$PROJECT_URL/functions/v1/account-export" \
  -H "Authorization: Bearer $USER_JWT4" \
  -H "Content-Type: application/json" -d '{}'
# expect: 200 { "ok": true, "url": "https://...", "expiresInSeconds": 86400 }
```

Open the signed URL — it should download a ~few-KB zip. Unzip:

```bash
unzip sturdy-export-*.zip
# expect two files:
#   sturdy-export.json  — every row from the user's data
#   sturdy-export.md    — readable summary with sections for account /
#                         children / saved scripts / Question conversations
```

Verify:

- The JSON contains the test user's profile, child_profiles, conversations,
  messages, parent_thoughts, interaction_logs, usage_events.
- The JSON does **not** contain `safety_events` or any other user's data.
- The Markdown opens cleanly in a text editor and includes the test data.
- The signed URL stops working after 24 hours (or after re-signing fails).

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
