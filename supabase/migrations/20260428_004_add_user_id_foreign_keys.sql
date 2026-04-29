-- 20260428_004_add_user_id_foreign_keys.sql
--
-- Schema Hygiene Migration: ensures FK constraints from `user_id` columns to
-- `auth.users(id)` exist across the public schema with the documented
-- ON DELETE behaviour.
--
-- BACKGROUND
-- A pre-merge audit during PR review of the account-deletion-flow work
-- revealed that the live database had no FK constraints from public.* tables'
-- `user_id` columns to `auth.users(id)`, despite the original MVP migration
-- declaring some of them. Tables added later via the Supabase SQL Editor
-- (saved_scripts, script_feedback, subscriptions, user_preferences) never
-- had FKs at all. As a result, deleting an auth user did not cascade — rows
-- in those tables would orphan.
--
-- This migration normalises the post-state regardless of where each
-- environment started:
--   - If a FK already exists with the desired ON DELETE behaviour, it's
--     dropped and re-added under the standard name (no functional change).
--   - If a FK exists with different ON DELETE behaviour (e.g. NO ACTION),
--     it's replaced with CASCADE.
--   - If no FK exists, one is added.
--   - If the table itself doesn't exist on a given environment, the table
--     is skipped with a NOTICE — the missing-table case will be caught by
--     post-migration verification, not by this migration crashing.
--
-- A pre-migration audit confirmed the live database has zero rows where
-- `user_id` references a non-existent auth user, so applying CASCADE FKs
-- requires no row cleanup.
--
-- DELETE BEHAVIOUR
-- All ten tables get `ON DELETE CASCADE`. The `safety_events` table will be
-- flipped to `ON DELETE SET NULL` in the next migration
-- (account-deletion-flow), per Product Principle 8 (anonymized retention of
-- safety logs after account deletion).

begin;

do $$
declare
  t_name  text;
  fk_name text;
begin
  foreach t_name in array array[
    'child_profiles',
    'conversations',
    'interaction_logs',
    'parent_thoughts',
    'saved_scripts',
    'script_feedback',
    'subscriptions',
    'usage_events',
    'user_preferences',
    'safety_events'
  ]
  loop
    -- Skip tables that don't exist on this environment. A missing table is
    -- caught by post-migration verification (the audit query in
    -- docs/OPERATIONS.md), not by this migration failing partway through.
    if not exists (
      select 1
        from information_schema.tables
       where table_schema = 'public'
         and table_name   = t_name
    ) then
      raise notice 'skipping public.% — table does not exist on this environment', t_name;
      continue;
    end if;

    -- Drop any existing FK from this table's user_id column to auth.users(id),
    -- regardless of the constraint's name or its current ON DELETE behaviour.
    select c.conname
      into fk_name
      from pg_constraint c
     where c.conrelid = format('public.%I', t_name)::regclass
       and c.contype  = 'f'
       and pg_get_constraintdef(c.oid) like '%REFERENCES auth.users(id)%';

    if fk_name is not null then
      execute format(
        'alter table public.%I drop constraint %I',
        t_name, fk_name
      );
    end if;

    -- Add the canonical FK with ON DELETE CASCADE.
    execute format(
      'alter table public.%I '
      'add constraint %I_user_id_fkey '
      'foreign key (user_id) references auth.users(id) on delete cascade',
      t_name, t_name
    );
  end loop;
end $$;

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
--
-- Note: the rollback above leaves these tables without any FK to auth.users.
-- That matches the audited pre-migration state. If you need to restore the
-- prior MVP-migration constraints (which were CASCADE), re-run the relevant
-- ADD CONSTRAINT statements from supabase/migrations/20260312_001_mvp_core.sql.
