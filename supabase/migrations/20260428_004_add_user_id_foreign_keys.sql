-- 20260428_004_add_user_id_foreign_keys.sql
--
-- Schema Hygiene Migration: ensures FK constraints from `user_id` columns to
-- `auth.users(id)` exist across the public schema with the documented
-- ON DELETE behaviour.
--
-- BACKGROUND
-- A pre-merge audit revealed that the live database had inconsistent FK
-- constraints from public.* tables' `user_id` columns to `auth.users(id)`.
-- Some tables had CASCADE FKs (from the original MVP migration). Others
-- (saved_scripts, script_feedback, subscriptions, user_preferences,
-- interaction_logs) had no FK at all — they were added via the Supabase
-- SQL Editor without constraints. As a result, deleting an auth user did
-- not cascade — rows in those tables would orphan.
--
-- IMPLEMENTATION
-- Each table gets an explicit DROP IF EXISTS + ADD CONSTRAINT pair. The
-- DROP IF EXISTS handles all three states: no FK, FK with wrong delete
-- behaviour, FK with correct delete behaviour. The subsequent ADD
-- creates the canonical FK with ON DELETE CASCADE.
--
-- An earlier draft of this migration used a DO-block to iterate the table
-- list. When applied via the Supabase dashboard SQL Editor, the DO-block
-- partially failed: it correctly updated tables that already had a FK,
-- but added FKs to the SQL-Editor-created tables without the CASCADE
-- clause. The explicit ALTER pattern below applies reliably regardless
-- of starting state.
--
-- A pre-migration audit confirmed the live database has zero rows where
-- `user_id` references a non-existent auth user, so applying CASCADE FKs
-- requires no row cleanup.
--
-- DELETE BEHAVIOUR
-- All ten tables get `ON DELETE CASCADE`. The `safety_events` table will
-- be flipped to `ON DELETE SET NULL` in the next migration
-- (account-deletion-flow), per Product Principle 8 (anonymized retention
-- of safety logs after account deletion).

begin;

-- ─────────────────────────────────────────────────────────────────────────────
-- User-scoped tables. CASCADE on auth.users delete.
-- ─────────────────────────────────────────────────────────────────────────────

alter table public.child_profiles drop constraint if exists child_profiles_user_id_fkey;
alter table public.child_profiles
  add constraint child_profiles_user_id_fkey
  foreign key (user_id) references auth.users(id) on delete cascade;

alter table public.conversations drop constraint if exists conversations_user_id_fkey;
alter table public.conversations
  add constraint conversations_user_id_fkey
  foreign key (user_id) references auth.users(id) on delete cascade;

alter table public.interaction_logs drop constraint if exists interaction_logs_user_id_fkey;
alter table public.interaction_logs
  add constraint interaction_logs_user_id_fkey
  foreign key (user_id) references auth.users(id) on delete cascade;

alter table public.parent_thoughts drop constraint if exists parent_thoughts_user_id_fkey;
alter table public.parent_thoughts
  add constraint parent_thoughts_user_id_fkey
  foreign key (user_id) references auth.users(id) on delete cascade;

alter table public.saved_scripts drop constraint if exists saved_scripts_user_id_fkey;
alter table public.saved_scripts
  add constraint saved_scripts_user_id_fkey
  foreign key (user_id) references auth.users(id) on delete cascade;

alter table public.script_feedback drop constraint if exists script_feedback_user_id_fkey;
alter table public.script_feedback
  add constraint script_feedback_user_id_fkey
  foreign key (user_id) references auth.users(id) on delete cascade;

alter table public.subscriptions drop constraint if exists subscriptions_user_id_fkey;
alter table public.subscriptions
  add constraint subscriptions_user_id_fkey
  foreign key (user_id) references auth.users(id) on delete cascade;

alter table public.usage_events drop constraint if exists usage_events_user_id_fkey;
alter table public.usage_events
  add constraint usage_events_user_id_fkey
  foreign key (user_id) references auth.users(id) on delete cascade;

alter table public.user_preferences drop constraint if exists user_preferences_user_id_fkey;
alter table public.user_preferences
  add constraint user_preferences_user_id_fkey
  foreign key (user_id) references auth.users(id) on delete cascade;

-- safety_events: CASCADE today, will become SET NULL in the next migration
-- per Product Principle 8 (anonymized retention of safety logs).
alter table public.safety_events drop constraint if exists safety_events_user_id_fkey;
alter table public.safety_events
  add constraint safety_events_user_id_fkey
  foreign key (user_id) references auth.users(id) on delete cascade;

commit;

-- ─────────────────────────────────────────────────────────────────────────────
-- ROLLBACK
-- ─────────────────────────────────────────────────────────────────────────────
--
-- begin;
--   alter table public.user_preferences  drop constraint if exists user_preferences_user_id_fkey;
--   alter table public.usage_events      drop constraint if exists usage_events_user_id_fkey;
--   alter table public.subscriptions     drop constraint if exists subscriptions_user_id_fkey;
--   alter table public.script_feedback   drop constraint if exists script_feedback_user_id_fkey;
--   alter table public.saved_scripts     drop constraint if exists saved_scripts_user_id_fkey;
--   alter table public.parent_thoughts   drop constraint if exists parent_thoughts_user_id_fkey;
--   alter table public.interaction_logs  drop constraint if exists interaction_logs_user_id_fkey;
--   alter table public.conversations     drop constraint if exists conversations_user_id_fkey;
--   alter table public.child_profiles    drop constraint if exists child_profiles_user_id_fkey;
--   alter table public.safety_events     drop constraint if exists safety_events_user_id_fkey;
-- commit;
