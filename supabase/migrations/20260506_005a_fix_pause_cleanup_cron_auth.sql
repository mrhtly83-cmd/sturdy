-- 20260506_005a_fix_pause_cleanup_cron_auth.sql
--
-- Corrective migration for 20260506_005_schedule_pause_cleanup_cron.sql.
--
-- The original migration sent the cron secret in the Authorization header
-- as `Bearer <secret>`. But _shared/accountAuth.ts:requireSystemCaller only
-- accepts that bearer pattern when the value equals SUPABASE_SERVICE_ROLE_KEY
-- (lines 85-88). For a dedicated cron secret, the function expects the
-- value in an `X-Cron-Secret` header (lines 82, 90-91).
--
-- As wired pre-fix, every cron tick would have failed 401, so paused
-- accounts would never be auto-deleted at the 30-day mark — breaking
-- the privacy-policy promise.
--
-- This migration re-issues cron.schedule() with the corrected header.
-- cron.schedule replaces any existing job with the same name, so this
-- is idempotent and supersedes the original schedule.
--
-- ─────────────────────────────────────────────────────────────────────────
-- OPERATOR SETUP (must be in place before this migration takes effect):
-- ─────────────────────────────────────────────────────────────────────────
--
-- 1. Generate a random secret value:
--      select encode(gen_random_bytes(32), 'hex');
--
-- 2. Add that exact value as Edge Function secret in the Supabase Dashboard
--    (Project Settings → Edge Functions → Secrets) with name CRON_SHARED_SECRET.
--
-- 3. Set the matching DB settings:
--      alter database postgres
--        set app.functions_url = 'https://<project-ref>.supabase.co/functions/v1';
--      alter database postgres
--        set app.cron_secret   = '<the-hex-value-from-step-1>';
--
-- The two values (Edge Function secret + DB setting) MUST match exactly.
-- ─────────────────────────────────────────────────────────────────────────

begin;

-- Extensions are already installed by the original migration; we re-assert
-- with `if not exists` so this migration is safe to apply on environments
-- where the original was rolled back.
create extension if not exists pg_cron;
create extension if not exists pg_net;

-- Re-register the cron job with the corrected auth header.
-- Same job name → replaces the prior schedule.
select cron.schedule(
  'scheduled-pause-cleanup',
  '0 3 * * *',
  $$
  select net.http_post(
    url     := current_setting('app.functions_url') || '/scheduled-pause-cleanup',
    headers := jsonb_build_object(
      'X-Cron-Secret', current_setting('app.cron_secret'),
      'Content-Type',  'application/json'
    ),
    body    := '{}'::jsonb
  );
  $$
);

commit;

-- ─────────────────────────────────────────────────────────────────────────
-- VERIFICATION:
-- ─────────────────────────────────────────────────────────────────────────
--
-- 1. Confirm the schedule is using the new header:
--      select jobname, schedule, active, command
--        from cron.job
--        where jobname = 'scheduled-pause-cleanup';
--    The `command` column should contain the string 'X-Cron-Secret'.
--
-- 2. Confirm DB settings are populated:
--      select current_setting('app.functions_url')      as url,
--             length(current_setting('app.cron_secret')) as secret_len;
--    Expect a URL ending in /functions/v1 and secret_len = 64
--    (32 random bytes hex-encoded).
--
-- 3. Live smoke test — invoke the same call the cron will make:
--      select net.http_post(
--        url     := current_setting('app.functions_url') || '/scheduled-pause-cleanup',
--        headers := jsonb_build_object(
--          'X-Cron-Secret', current_setting('app.cron_secret'),
--          'Content-Type',  'application/json'
--        ),
--        body    := '{}'::jsonb
--      );
--      -- then read the response:
--      select id, status_code, content::text
--        from net._http_response
--        order by id desc
--        limit 1;
--    Expect status_code = 200. Pre-fix this returned 401.
--
-- ─────────────────────────────────────────────────────────────────────────
-- ROLLBACK:
-- ─────────────────────────────────────────────────────────────────────────
--
--   begin;
--     select cron.unschedule('scheduled-pause-cleanup');
--   commit;
--
-- (To revert to the broken pre-fix state, re-apply 20260506_005 — but there
-- is no good reason to do this; the original migration's auth header was
-- a bug, not a deliberate design choice.)
