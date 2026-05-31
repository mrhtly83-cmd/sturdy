-- 20260531_010_quota_caps_75_25.sql
--
-- Updates the free-tier script cap from 50 → 75 (questions stay at 25),
-- locking the V1 freemium model: 100 free generations/month, split as
-- 75 scripts (SOS + Reconnect + Understand + Conversation + follow-ups)
-- and 25 questions, tracked in two independent buckets.
--
-- Crisis-detected messages remain free and uncounted (enforced in the
-- Edge Function: safety filter runs BEFORE the quota check — Principle 4).
--
-- Only get_quota_counts hardcodes a cap value, so only it needs re-creating.
-- check_script_quota / check_question_quota only COUNT; the enforced cap
-- lives in the Edge Function constants (SCRIPT_QUOTA_LIMIT / QUESTION_QUOTA_LIMIT),
-- which must be updated in lockstep with this migration.
--
-- Rollback: re-create get_quota_counts with 'scripts_cap', 50.

begin;

create or replace function public.get_quota_counts(target_user_id uuid)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  s_count int;
  q_count int;
begin
  select count(*) into s_count
  from usage_events
  where user_id = target_user_id
    and date_trunc('month', created_at) = date_trunc('month', current_date)
    and event_type in ('script_generated', 'followup_generated')
    and coalesce(event_meta->>'mode', 'sos') != 'question';

  select count(*) into q_count
  from usage_events
  where user_id = target_user_id
    and date_trunc('month', created_at) = date_trunc('month', current_date)
    and event_type = 'question_generated';

  return json_build_object(
    'scripts_used',   s_count,
    'scripts_cap',    75,
    'questions_used', q_count,
    'questions_cap',  25
  );
end;
$$;

commit;