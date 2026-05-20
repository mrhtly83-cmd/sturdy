-- 20260520_007_add_situation_summary_fix_interaction_logs.sql
--
-- Two fixes to interaction_logs:
--
-- 1. Add situation_summary TEXT column.
--    The edge function (chat-parenting-assistant) extracts situation_summary
--    from the Claude response and stores it here. The home screen Last Session
--    card displays it as a fallback when no trigger_category is classified.
--
-- 2. Remove hardcoded UUID defaults on user_id and child_profile_id.
--    The table was created via the SQL Editor with a specific user's UUIDs
--    baked in as column defaults — a privacy bug and a data correctness bug.
--    The edge function always provides these values explicitly; defaults are
--    not needed and must not contain real user data.
--
-- ROLLBACK
--   ALTER TABLE public.interaction_logs DROP COLUMN IF EXISTS situation_summary;
--   -- (column defaults cannot be re-added without knowing the original values;
--   --  do not restore them — they were wrong)

BEGIN;

ALTER TABLE public.interaction_logs
  ADD COLUMN IF NOT EXISTS situation_summary TEXT;

ALTER TABLE public.interaction_logs
  ALTER COLUMN user_id DROP DEFAULT;

ALTER TABLE public.interaction_logs
  ALTER COLUMN child_profile_id DROP DEFAULT;

COMMIT;
