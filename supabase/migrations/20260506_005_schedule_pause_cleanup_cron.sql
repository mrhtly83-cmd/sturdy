-- 20260506_005_schedule_pause_cleanup_cron.sql
--
-- Schedules the daily cron job that triggers the scheduled-pause-cleanup
-- Edge Function. Without this migration, paused accounts never get
-- automatically deleted at the 30-day mark — which means the privacy
-- policy promise ("auto-deleted after 30 days") would not be kept.
--
-- The Edge Function itself was shipped in PR #18 (account-deletion-flow)
-- and re-asserted in OPERATIONS.md. This migration only wires the schedule.
--
-- ─────────────────────────────────────────────────────────────────────────
-- OPERATOR SETUP (must run once per environment, NOT in this migration —
-- the values are environment-specific and should not be checked into git):
-- ─────────────────────────────────────────────────────────────────────────
--
--   alter database postgres set app.functions_url
--     = 'https://<project-ref>.supabase.co/functions/v1';
--   alter database postgres set app.cron_secret
--     = '<value-of-CRON_SHARED_SECRET-set-via-supabase-secrets>';
--
-- The `app.cron_secret` value must match `CRON_SHARED_SECRET` set on the
-- Edge Function (used by `_shared/accountAuth.ts:requireSystemCaller`).
-- ─────────────────────────────────────────────────────────────────────────

begin;

-- ─────────────────────────────────────────────────────────────────────────
-- 1. Extensions
-- ─────────────────────────────────────────────────────────────────────────
-- pg_cron schedules SQL statements at fixed cron expressions.
-- pg_net lets us invoke the Edge Function over HTTPS from inside SQL.
-- Both ship with managed Supabase. On self-hosted Postgres these may need
-- to be installed manually.

create extension if not exists pg_cron;
create extension if not exists pg_net;

-- ─────────────────────────────────────────────────────────────────────────
-- 2. Schedule
-- ─────────────────────────────────────────────────────────────────────────
-- Runs daily at 03:00 UTC — a low-traffic window. The job calls
-- /scheduled-pause-cleanup which queries for paused_at < (now - 30 days),
-- iterates each, and calls account-delete with confirmationText
-- "PAUSE_EXPIRED".
--
-- The cron job is idempotent: re-running this migration is safe because
-- cron.schedule replaces an existing job with the same name.

select cron.schedule(
  'scheduled-pause-cleanup',
  '0 3 * * *',
  $$
  select net.http_post(
    url     := current_setting('app.functions_url') || '/scheduled-pause-cleanup',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || current_setting('app.cron_secret'),
      'Content-Type',  'application/json'
    ),
    body    := '{}'::jsonb
  );
  $$
);

commit;

-- ─────────────────────────────────────────────────────────────────────────
-- VERIFICATION (run after the operator setup commands above):
-- ─────────────────────────────────────────────────────────────────────────
--
--   -- The job should appear:
--   select jobid, jobname, schedule, active, command
--     from cron.job where jobname = 'scheduled-pause-cleanup';
--
--   -- Recent runs (after the first scheduled tick):
--   select jobid, status, return_message, start_time, end_time
--     from cron.job_run_details
--     where jobid = (select jobid from cron.job where jobname = 'scheduled-pause-cleanup')
--     order by start_time desc limit 5;
--
-- ─────────────────────────────────────────────────────────────────────────
-- ROLLBACK
-- ─────────────────────────────────────────────────────────────────────────
--
--   begin;
--     select cron.unschedule('scheduled-pause-cleanup');
--   commit;
--
-- (Extensions are left installed — other migrations may rely on them.)
