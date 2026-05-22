-- 20260521_009_dual_quota_buckets.sql
--
-- Replaces check_monthly_quota with two separate quota RPCs:
--   check_script_quota   — SOS, Reconnect, Understand, Conversation, follow-ups (cap: 50)
--   check_question_quota — Question mode only (cap: 25)
--
-- Also adds get_quota_counts — returns both counts in one call for the mobile UI.
--
-- Rollback: re-apply check_monthly_quota from migration 20260521_008 and
-- drop check_script_quota, check_question_quota, get_quota_counts.

begin;

-- ─── Script quota (all directed modes including SOS) ───
create or replace function public.check_script_quota(target_user_id uuid)
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
    and event_type in ('script_generated', 'followup_generated')
    and coalesce(event_meta->>'mode', 'sos') != 'question';
  return script_count;
end;
$$;

-- ─── Question quota ───
create or replace function public.check_question_quota(target_user_id uuid)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  question_count int;
begin
  select count(*) into question_count
  from usage_events
  where user_id = target_user_id
    and date_trunc('month', created_at) = date_trunc('month', current_date)
    and event_type = 'question_generated';
  return question_count;
end;
$$;

-- ─── Combined counts for mobile UI (one DB round-trip) ───
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
    'scripts_cap',    50,
    'questions_used', q_count,
    'questions_cap',  25
  );
end;
$$;

commit;
