-- 20260429_003_account_deletion_lifecycle.sql
--
-- Schema changes for the account deletion + pause + export feature.
--
-- This migration assumes PR 19's schema hygiene migration (20260428_004) has
-- already run, establishing CASCADE foreign keys from every user_id column
-- to auth.users(id) including safety_events.
--
-- What this migration does:
--   1. Adds `profiles.paused_at` (nullable timestamptz) + partial index for
--      the scheduled-pause-cleanup query.
--   2. Drops NOT NULL on `safety_events.user_id` so the column can be nulled.
--   3. Drops the existing CASCADE FK on safety_events.user_id and replaces
--      it with SET NULL behaviour, per Product Principle 8 (anonymized
--      retention of safety logs after account deletion).
--   4. Creates the `account-exports` Storage bucket (private) + RLS so a
--      parent can only read their own export. Service role uploads;
--      Edge Function generates 24-hour signed URLs.

begin;

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. profiles.paused_at
-- ─────────────────────────────────────────────────────────────────────────────

alter table public.profiles
  add column if not exists paused_at timestamptz null;

create index if not exists idx_profiles_paused_at
  on public.profiles (paused_at)
  where paused_at is not null;

comment on column public.profiles.paused_at is
  'Timestamp when user paused their account. NULL = active. If non-NULL and older than 30 days, the scheduled-pause-cleanup function deletes the account.';

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. safety_events.user_id  →  ON DELETE SET NULL
--
-- The CASCADE FK was established by 20260428_004. Flip it to SET NULL so
-- account deletion anonymizes safety events instead of deleting them.
-- ─────────────────────────────────────────────────────────────────────────────

-- Drop NOT NULL so the column can be nullified on user delete
alter table public.safety_events
  alter column user_id drop not null;

-- Drop the CASCADE constraint (established by 20260428_004) and replace with SET NULL
alter table public.safety_events
  drop constraint if exists safety_events_user_id_fkey;

alter table public.safety_events
  add constraint safety_events_user_id_fkey
  foreign key (user_id) references auth.users(id) on delete set null;

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. Storage bucket: account-exports
--
-- Private bucket. Service role uploads zips. The Edge Function generates
-- 24-hour signed URLs for the parent to download. The SELECT policy is
-- defense in depth — even if the bucket were ever made public, the policy
-- would only allow a user to list/read their own exports (path prefix
-- `<user_id>/`).
-- ─────────────────────────────────────────────────────────────────────────────

insert into storage.buckets (id, name, public)
  values ('account-exports', 'account-exports', false)
  on conflict (id) do nothing;

drop policy if exists "account_exports_read_own"   on storage.objects;
drop policy if exists "account_exports_write_own"  on storage.objects;
drop policy if exists "account_exports_delete_own" on storage.objects;

create policy "account_exports_read_own"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'account-exports'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "account_exports_write_own"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'account-exports'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "account_exports_delete_own"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'account-exports'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

commit;

-- ─────────────────────────────────────────────────────────────────────────────
-- ROLLBACK
-- ─────────────────────────────────────────────────────────────────────────────
--
-- begin;
--   -- Reverse storage bucket policies + bucket
--   drop policy if exists "account_exports_read_own"   on storage.objects;
--   drop policy if exists "account_exports_write_own"  on storage.objects;
--   drop policy if exists "account_exports_delete_own" on storage.objects;
--   delete from storage.buckets where id = 'account-exports';
--
--   -- Reverse safety_events FK back to CASCADE
--   alter table public.safety_events drop constraint safety_events_user_id_fkey;
--   alter table public.safety_events
--     add constraint safety_events_user_id_fkey
--     foreign key (user_id) references auth.users(id) on delete cascade;
--   -- Note: cannot trivially restore NOT NULL if rows were anonymized
--   -- post-rollout. Manually delete null-user_id rows first or accept that
--   -- user_id stays nullable.
--
--   -- Reverse paused_at
--   drop index if exists public.idx_profiles_paused_at;
--   alter table public.profiles drop column if exists paused_at;
-- commit;
