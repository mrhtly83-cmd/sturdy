-- 20260429_003_account_deletion_lifecycle.sql
--
-- Adds the schema changes that support the account-deletion + pause + export feature.
-- All transactional. Rollback documented at the bottom of this file.
--
-- What this migration does:
--   1. Adds `profiles.paused_at` (nullable timestamptz) + partial index
--   2. Switches `safety_events.user_id` from `ON DELETE CASCADE` to `ON DELETE SET NULL`
--      so anonymized rows survive account deletion (per docs/PRODUCT_PRINCIPLES.md §8).
--   3. Defensively ensures `ON DELETE CASCADE` on `interaction_logs.user_id`,
--      `parent_thoughts.user_id`, and `usage_events.user_id` — these tables (the first
--      two especially) were created out-of-band via the SQL Editor and may not have
--      cascade behavior. The DO blocks no-op cleanly if a table doesn't exist.
--   4. Creates the `account-exports` Storage bucket (private) + RLS so a parent can
--      only read their own export. Service role uploads; signed URLs expire in 24h.

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
-- 2. safety_events.user_id  →  ON DELETE SET NULL (was CASCADE)
--
-- Per Product Principle 8 + privacy policy, safety events are retained
-- anonymously after user deletion. The user_id is NULLed; the content stays.
-- ─────────────────────────────────────────────────────────────────────────────

-- Drop NOT NULL so the column can be nullified
alter table public.safety_events
  alter column user_id drop not null;

-- Drop the existing CASCADE FK and add a SET NULL FK in its place.
-- Constraint name is the Postgres default; the DO block looks it up dynamically
-- in case it was renamed.
do $$
declare
  fk_name text;
begin
  select conname into fk_name
    from pg_constraint
    where conrelid = 'public.safety_events'::regclass
      and contype  = 'f'
      and pg_get_constraintdef(oid) like '%REFERENCES auth.users(id)%';

  if fk_name is not null then
    execute format('alter table public.safety_events drop constraint %I', fk_name);
  end if;
end $$;

alter table public.safety_events
  add constraint safety_events_user_id_fkey
  foreign key (user_id) references auth.users(id) on delete set null;

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. Ensure ON DELETE CASCADE on out-of-band tables
--
-- `interaction_logs` and `parent_thoughts` were created via SQL Editor and are
-- not in the migration history. Their FK behavior is unknown. These DO blocks
-- inspect each table at runtime and rebuild the FK with CASCADE if it isn't
-- already CASCADE. Tables that don't exist are skipped silently — operators on
-- a fresh environment will create them with CASCADE from the start.
-- `usage_events` is included as belt-and-suspenders (it already CASCADEs in
-- the MVP migration but we re-assert to keep the policy explicit).
-- ─────────────────────────────────────────────────────────────────────────────

do $$
declare
  t_name text;
  fk_name text;
begin
  foreach t_name in array array['interaction_logs', 'parent_thoughts', 'usage_events']
  loop
    if exists (
      select 1 from information_schema.tables
       where table_schema = 'public' and table_name = t_name
    ) then
      -- Find the FK that points at auth.users
      select conname into fk_name
        from pg_constraint
        where conrelid = ('public.' || t_name)::regclass
          and contype  = 'f'
          and pg_get_constraintdef(oid) like '%REFERENCES auth.users(id)%';

      if fk_name is not null then
        execute format('alter table public.%I drop constraint %I', t_name, fk_name);
      end if;

      execute format(
        'alter table public.%I add constraint %I_user_id_fkey foreign key (user_id) references auth.users(id) on delete cascade',
        t_name, t_name
      );
    end if;
  end loop;
end $$;

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. Storage bucket: account-exports
--
-- Private bucket. Service role uploads zips. The Edge Function generates 24-hour
-- signed URLs for the parent to download. The SELECT policy is defense in depth
-- — even if the bucket were ever made public, the policy would only allow a
-- user to list/read their own exports (path prefix `<user_id>/`).
-- ─────────────────────────────────────────────────────────────────────────────

insert into storage.buckets (id, name, public)
  values ('account-exports', 'account-exports', false)
  on conflict (id) do nothing;

-- Drop any prior policies (idempotent on re-run)
drop policy if exists "account_exports_read_own"   on storage.objects;
drop policy if exists "account_exports_write_own"  on storage.objects;
drop policy if exists "account_exports_delete_own" on storage.objects;

-- Read: only files inside <auth.uid()>/ folder
create policy "account_exports_read_own"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'account-exports'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Insert: only into own folder. Service role bypasses RLS so this is for
-- direct-upload scenarios only; in practice the Edge Function does the upload.
create policy "account_exports_write_own"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'account-exports'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Delete: own folder only
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
--   -- Reverse safety_events FK back to CASCADE + NOT NULL
--   alter table public.safety_events drop constraint safety_events_user_id_fkey;
--   -- Note: cannot easily set NOT NULL again if any rows were anonymized post-rollout.
--   -- Manually delete anonymized rows first or accept that user_id stays nullable.
--   alter table public.safety_events
--     add constraint safety_events_user_id_fkey
--     foreign key (user_id) references auth.users(id) on delete cascade;
--
--   -- Reverse paused_at
--   drop index if exists public.idx_profiles_paused_at;
--   alter table public.profiles drop column if exists paused_at;
--
--   -- The interaction_logs / parent_thoughts / usage_events FK rebuilds are not
--   -- reversed — they're re-asserting CASCADE which is the desired post-state.
-- commit;
