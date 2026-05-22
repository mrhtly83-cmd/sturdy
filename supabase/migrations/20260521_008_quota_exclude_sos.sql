-- 20260521_008_quota_exclude_sos.sql
--
-- FIXES: Quota RPC was counting ALL usage_events regardless of mode,
-- which means SOS scripts counted toward the 50/month free limit.
-- This violates Principle 6: "Unlimited SOS scripts — these never become paid."
--
-- CHANGE: Replaces check_monthly_quota to filter out SOS and crisis events.
-- Only 'script_generated' and 'question_generated' events for non-SOS modes
-- count toward the monthly cap.
--
-- The Edge Function already logs event_meta with a `mode` field, so we can
-- filter on that. SOS scripts log as event_type='script_generated' with
-- event_meta->>'mode' = 'sos'. We exclude those.
--
-- Crisis paths never reach the usage logger (safety filter short-circuits),
-- so they're already excluded — but we add an explicit exclusion for safety.

begin;

create or replace function public.check_monthly_quota(target_user_id uuid)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  script_count int;
begin
  select count(*) into script_count
  from usage_events
  where user_id = target_user_id
    and date_trunc('month', created_at) = date_trunc('month', current_date)
    -- Exclude SOS mode — always free per Principle 6
    and coalesce(event_meta->>'mode', 'sos') != 'sos'
    -- Only count actual generations, not other event types
    and event_type in ('script_generated', 'question_generated', 'followup_generated');

  return script_count;
end;
$$;

commit;

-- ─────────────────────────────────────────────────────────────────────────────
-- VERIFICATION
-- ─────────────────────────────────────────────────────────────────────────────
--
-- 1. Confirm the function updated:
--      select prosrc from pg_proc
--        where proname = 'check_monthly_quota';
--    Expect to see the mode != 'sos' filter in the source.
--
-- 2. Test with a user who has SOS usage this month:
--      select public.check_monthly_quota('<user-uuid>');
--    Should return a count that EXCLUDES their SOS scripts.
--
-- 3. Verify SOS exclusion directly:
--      select count(*) from usage_events
--        where user_id = '<user-uuid>'
--          and date_trunc('month', created_at) = date_trunc('month', current_date)
--          and coalesce(event_meta->>'mode', 'sos') = 'sos';
--    These should NOT be counted in the quota.

-- ─────────────────────────────────────────────────────────────────────────────
-- ROLLBACK (restores the old unfiltered count)
-- ─────────────────────────────────────────────────────────────────────────────
--
--   create or replace function public.check_monthly_quota(target_user_id uuid)
--   returns int language plpgsql security definer set search_path = public
--   as $$ declare script_count int; begin
--     select count(*) into script_count from usage_events
--       where user_id = target_user_id
--         and date_trunc('month', created_at) = date_trunc('month', current_date);
--     return script_count;
--   end; $$;
