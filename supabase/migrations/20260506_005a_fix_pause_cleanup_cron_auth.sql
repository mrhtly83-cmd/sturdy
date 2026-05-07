-- 20260506_005a_fix_pause_cleanup_cron_auth.sql
--
-- Corrective migration for 20260506_005_schedule_pause_cleanup_cron.sql.
--
-- Two issues with the original:
--
-- 1. Auth header mismatch. The original sent `Authorization: Bearer <secret>`,
--    but _shared/accountAuth.ts:requireSystemCaller only accepts the bearer
--    pattern when the value equals SUPABASE_SERVICE_ROLE_KEY (lines 85-88).
--    For a dedicated cron secret, the function expects an `X-Cron-Secret`
--    header (lines 82, 90-91). As wired pre-fix, every cron tick failed 401
--    so paused accounts never auto-deleted at the 30-day mark — breaking
--    the privacy-policy promise.
--
-- 2. The original used `current_setting('app.cron_secret')` which requires
--    `ALTER DATABASE postgres SET app.cron_secret = '...'`. That SQL kept
--    failing with paste artifacts in the Supabase SQL Editor. We pivot to
--    Supabase Vault — the recommended pattern for storing cron secrets on
--    Supabase Cloud.
--
-- This migration:
--   - Reads the secret from `vault.decrypted_secrets` instead of GUCs.
--   - Hardcodes the functions URL (not sensitive — appears in mobile app
--     bundle as EXPO_PUBLIC_SUPABASE_URL).
--   - Sends X-Cron-Secret header instead of Authorization: Bearer.
--
-- cron.schedule() with the same job name replaces the prior schedule, so
-- this migration is idempotent and supersedes 20260506_005.
--
-- ─────────────────────────────────────────────────────────────────────────
-- OPERATOR SETUP (must be in place BEFORE applying this migration):
-- ─────────────────────────────────────────────────────────────────────────
--
-- 1. Set the Edge Function secret CRON_SHARED_SECRET in the Supabase
--    Dashboard → Project Settings → Edge Functions → Secrets.
--    Use a 64-char hex value: `select encode(gen_random_bytes(32), 'hex');`
--
-- 2. Store the SAME hex value in Supabase Vault. Run in SQL Editor (type
--    the SQL by hand — pasting can introduce non-breaking-space artifacts):
--
--      select vault.create_secret(
--        'PASTE_THE_64_CHAR_HEX_HERE',
--        'cron_shared_secret',
--        'Matches CRON_SHARED_SECRET Edge Function env. Used by scheduled-pause-cleanup cron.'
--      );
--
-- 3. Verify before applying this migration:
--
--      select name, length(decrypted_secret) as secret_len
--        from vault.decrypted_secrets
--        where name = 'cron_shared_secret';
--
--    Expect 1 row, secret_len = 64.
--
-- ─────────────────────────────────────────────────────────────────────────

begin;

-- Ensure required extensions are present. Idempotent — safe on environments
-- where the original 20260506_005 migration was already applied or rolled
-- back. supabase_vault is asserted defensively; on managed Supabase it
-- is normally present out of the box.
create extension if not exists pg_cron;
create extension if not exists pg_net;
create extension if not exists "supabase_vault";

-- Re-register the cron job with the corrected auth header and Vault-based
-- secret read. Same job name → replaces the prior schedule from 20260506_005.
select cron.schedule(
  'scheduled-pause-cleanup',
  '0 3 * * *',
  $$
  select net.http_post(
    url     := 'https://lwmzfhigommayvmvqzvf.supabase.co/functions/v1/scheduled-pause-cleanup',
    headers := jsonb_build_object(
      'X-Cron-Secret', (select decrypted_secret from vault.decrypted_secrets where name = 'cron_shared_secret'),
      'Content-Type',  'application/json'
    ),
    body    := '{}'::jsonb
  );
  $$
);

commit;

-- ─────────────────────────────────────────────────────────────────────────
-- VERIFICATION (run after applying):
-- ─────────────────────────────────────────────────────────────────────────
--
-- 1. Confirm the schedule is using the new pattern:
--      select jobname, schedule, active, command
--        from cron.job
--        where jobname = 'scheduled-pause-cleanup';
--    Command should contain both 'X-Cron-Secret' and 'vault.decrypted_secrets'.
--
-- 2. Live smoke test — invoke the same call the cron will make:
--      select net.http_post(
--        url     := 'https://lwmzfhigommayvmvqzvf.supabase.co/functions/v1/scheduled-pause-cleanup',
--        headers := jsonb_build_object(
--          'X-Cron-Secret', (select decrypted_secret from vault.decrypted_secrets where name = 'cron_shared_secret'),
--          'Content-Type',  'application/json'
--        ),
--        body    := '{}'::jsonb
--      );
--
--      -- read the response:
--      select id, status_code, content::text
--        from net._http_response
--        order by id desc
--        limit 1;
--
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
-- (Re-applying 20260506_005 would re-introduce the 401 auth bug — don't.)
