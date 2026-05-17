-- 20260517_006_freemium_quota_and_cascade.sql
--
-- Implements the freemium quota RPC and locks in "Zero Trace" CASCADE deletion
-- for safety_events, aligned with the v5 Master Blueprint.
--
-- CONTEXT
-- The Blueprint mandates two hard rules:
--   1. Quota — Free users are capped at 50 script generations per calendar
--      month, enforced server-side via `check_monthly_quota`. The Edge Function
--      must call this before any Anthropic request (except crisis paths).
--   2. Zero Trace — Account deletion must leave no data behind, including
--      safety_events. Migration 20260428_004 already set safety_events to
--      CASCADE; migration 20260429_003 proposed flipping it to SET NULL per
--      an older "anonymized retention" principle. That plan is now reversed:
--      the v5 Blueprint explicitly states "no anonymized traces remain."
--      This migration re-asserts CASCADE and closes the door on SET NULL.
--
-- IMPLEMENTATION
--
-- 1. check_monthly_quota(target_user_id UUID) → INT
--    SECURITY DEFINER function. Counts usage_events rows for the given user
--    in the current calendar month using date_trunc so the window resets
--    cleanly on the 1st of each month regardless of timezone offset at the
--    DB server level (Supabase runs UTC).
--    Called from the Edge Function (service role key), which passes
--    auth.uid() from the validated JWT. Not intended for direct client calls.
--
-- 2. safety_events FK → ON DELETE CASCADE
--    Idempotent drop+add pattern (same as migration 004). Re-asserting CASCADE
--    ensures any intermediate SQL Editor edits that may have changed the
--    behaviour cannot persist silently.

begin;

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. Quota RPC
-- ─────────────────────────────────────────────────────────────────────────────

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
    and date_trunc('month', created_at) = date_trunc('month', current_date);

  return script_count;
end;
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. Zero Trace: safety_events strict CASCADE
-- ─────────────────────────────────────────────────────────────────────────────

alter table public.safety_events
  drop constraint if exists safety_events_user_id_fkey;

alter table public.safety_events
  add constraint safety_events_user_id_fkey
  foreign key (user_id)
  references auth.users(id)
  on delete cascade;

commit;

-- ─────────────────────────────────────────────────────────────────────────────
-- VERIFICATION (run after applying)
-- ─────────────────────────────────────────────────────────────────────────────
--
-- 1. Confirm the function exists:
--      select proname, prosecdef, prosrc
--        from pg_proc
--        where proname = 'check_monthly_quota'
--          and pronamespace = 'public'::regnamespace;
--    Expect 1 row, prosecdef = true.
--
-- 2. Smoke-test the quota counter (replace with a real user UUID):
--      select public.check_monthly_quota('<user-uuid>');
--    Expect an integer (0 if no usage_events this month for that user).
--
-- 3. Confirm safety_events FK is CASCADE:
--      select tc.constraint_name, rc.delete_rule
--        from information_schema.table_constraints tc
--        join information_schema.referential_constraints rc
--          on rc.constraint_name = tc.constraint_name
--        where tc.table_name = 'safety_events'
--          and tc.constraint_type = 'FOREIGN KEY';
--    Expect delete_rule = 'CASCADE'.

-- ─────────────────────────────────────────────────────────────────────────────
-- ROLLBACK
-- ─────────────────────────────────────────────────────────────────────────────
--
--   begin;
--     drop function if exists public.check_monthly_quota(uuid);
--     -- Restore the FK that was in place before this migration.
--     -- If you want SET NULL (old Principle 8 behaviour), use ON DELETE SET NULL.
--     alter table public.safety_events
--       drop constraint if exists safety_events_user_id_fkey;
--     alter table public.safety_events
--       add constraint safety_events_user_id_fkey
--       foreign key (user_id)
--       references auth.users(id)
--       on delete cascade;
--   commit;
