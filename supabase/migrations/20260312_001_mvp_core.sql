-- Sturdy MVP Core Schema (cleaned)
-- Focused on:
-- profiles
-- child_profiles
-- conversations
-- messages
-- safety_events
-- usage_events
--
-- Current MVP is hard_moment-first.
-- Reflection / coach can be added in later migrations.

create extension if not exists pgcrypto;

-- --------------------------------------------------
-- helper: updated_at
-- --------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
    return new;
    end;
    $$;

    -- --------------------------------------------------
    -- helper: auto-create profile on signup
    -- --------------------------------------------------
    create or replace function public.handle_new_user()
    returns trigger
    language plpgsql
    security definer
    set search_path = public
    as $$
    begin
      insert into public.profiles (id)
        values (new.id)
          on conflict (id) do nothing;

            return new;
            end;
            $$;

            -- --------------------------------------------------
            -- profiles
            -- --------------------------------------------------
            create table if not exists public.profiles (
              id uuid primary key references auth.users(id) on delete cascade,
                full_name text,
                  created_at timestamptz not null default now(),
                    updated_at timestamptz not null default now()
                    );

                    -- --------------------------------------------------
                    -- child_profiles
                    -- --------------------------------------------------
                    create table if not exists public.child_profiles (
                      id uuid primary key default gen_random_uuid(),
                        user_id uuid not null references auth.users(id) on delete cascade,
                          name text,
                            age_band text not null check (age_band in ('2-4', '5-7', '8-12')),
                              neurotype text[] not null default array[]::text[],
                                preferences jsonb not null default '{}'::jsonb,
                                  created_at timestamptz not null default now(),
                                    updated_at timestamptz not null default now()
                                    );

                                    -- --------------------------------------------------
                                    -- conversations
                                    -- hard_moment only for MVP
                                    -- --------------------------------------------------
                                    create table if not exists public.conversations (
                                      id uuid primary key default gen_random_uuid(),
                                        user_id uuid not null references auth.users(id) on delete cascade,
                                          child_profile_id uuid not null references public.child_profiles(id) on delete cascade,
                                            mode text not null check (mode = 'hard_moment'),
                                              title text,
                                                summary text,
                                                  archived boolean not null default false,
                                                    created_at timestamptz not null default now(),
                                                      updated_at timestamptz not null default now()
                                                      );

                                                      -- --------------------------------------------------
                                                      -- messages
                                                      -- content stores raw text
                                                      -- structured stores normalized AI JSON payload
                                                      -- --------------------------------------------------
                                                      create table if not exists public.messages (
                                                        id uuid primary key default gen_random_uuid(),
                                                          conversation_id uuid not null references public.conversations(id) on delete cascade,
                                                            role text not null check (role in ('user', 'assistant', 'system')),
                                                              content text not null,
                                                                structured jsonb,
                                                                  risk_level text check (
                                                                      risk_level in ('SAFE', 'ELEVATED_RISK', 'CRISIS_RISK', 'MEDICAL_EMERGENCY')
                                                                        ),
                                                                          policy_route text check (
                                                                              policy_route in (
                                                                                    'normal_parenting',
                                                                                          'safety_support',
                                                                                                'violence_escalation',
                                                                                                      'medical_emergency',
                                                                                                            'fallback_response'
                                                                                                                )
                                                                                                                  ),
                                                                                                                    created_at timestamptz not null default now(),
                                                                                                                      constraint assistant_structured_required check (
                                                                                                                          role <> 'assistant' or structured is not null
                                                                                                                            )
                                                                                                                            );

                                                                                                                            -- --------------------------------------------------
                                                                                                                            -- safety_events
                                                                                                                            -- --------------------------------------------------
                                                                                                                            create table if not exists public.safety_events (
                                                                                                                              id uuid primary key default gen_random_uuid(),
                                                                                                                                user_id uuid not null references auth.users(id) on delete cascade,
                                                                                                                                  child_profile_id uuid references public.child_profiles(id) on delete set null,
                                                                                                                                    conversation_id uuid references public.conversations(id) on delete set null,
                                                                                                                                      message_id uuid references public.messages(id) on delete set null,
                                                                                                                                        message_excerpt text,
                                                                                                                                          risk_level text not null check (
                                                                                                                                              risk_level in ('SAFE', 'ELEVATED_RISK', 'CRISIS_RISK', 'MEDICAL_EMERGENCY')
                                                                                                                                                ),
                                                                                                                                                  policy_route text not null check (
                                                                                                                                                      policy_route in (
                                                                                                                                                            'normal_parenting',
                                                                                                                                                                  'safety_support',
                                                                                                                                                                        'violence_escalation',
                                                                                                                                                                              'medical_emergency',
                                                                                                                                                                                    'fallback_response'
                                                                                                                                                                                        )
                                                                                                                                                                                          ),
                                                                                                                                                                                            classifier_version text,
                                                                                                                                                                                              resolved_with text,
                                                                                                                                                                                                created_at timestamptz not null default now()
                                                                                                                                                                                                );

                                                                                                                                                                                                -- --------------------------------------------------
                                                                                                                                                                                                -- usage_events
                                                                                                                                                                                                -- lightweight analytics / usage hooks
                                                                                                                                                                                                -- --------------------------------------------------
                                                                                                                                                                                                create table if not exists public.usage_events (
                                                                                                                                                                                                  id uuid primary key default gen_random_uuid(),
                                                                                                                                                                                                    user_id uuid not null references auth.users(id) on delete cascade,
                                                                                                                                                                                                      child_profile_id uuid references public.child_profiles(id) on delete set null,
                                                                                                                                                                                                        conversation_id uuid references public.conversations(id) on delete set null,
                                                                                                                                                                                                          event_type text not null,
                                                                                                                                                                                                            event_meta jsonb not null default '{}'::jsonb,
                                                                                                                                                                                                              created_at timestamptz not null default now()
                                                                                                                                                                                                              );

                                                                                                                                                                                                              -- --------------------------------------------------
                                                                                                                                                                                                              -- indexes
                                                                                                                                                                                                              -- --------------------------------------------------
                                                                                                                                                                                                              create index if not exists idx_child_profiles_user_id
                                                                                                                                                                                                                on public.child_profiles(user_id);

                                                                                                                                                                                                                create index if not exists idx_conversations_user_id
                                                                                                                                                                                                                  on public.conversations(user_id);

                                                                                                                                                                                                                  create index if not exists idx_conversations_child_profile_id
                                                                                                                                                                                                                    on public.conversations(child_profile_id);

                                                                                                                                                                                                                    create index if not exists idx_conversations_updated_at
                                                                                                                                                                                                                      on public.conversations(updated_at desc);

                                                                                                                                                                                                                      create index if not exists idx_messages_conversation_id
                                                                                                                                                                                                                        on public.messages(conversation_id);

                                                                                                                                                                                                                        create index if not exists idx_messages_created_at
                                                                                                                                                                                                                          on public.messages(created_at);

                                                                                                                                                                                                                          create index if not exists idx_messages_risk_level
                                                                                                                                                                                                                            on public.messages(risk_level);

                                                                                                                                                                                                                            create index if not exists idx_safety_events_user_id
                                                                                                                                                                                                                              on public.safety_events(user_id);

                                                                                                                                                                                                                              create index if not exists idx_safety_events_risk_level
                                                                                                                                                                                                                                on public.safety_events(risk_level);

                                                                                                                                                                                                                                create index if not exists idx_safety_events_created_at
                                                                                                                                                                                                                                  on public.safety_events(created_at desc);

                                                                                                                                                                                                                                  create index if not exists idx_usage_events_user_id
                                                                                                                                                                                                                                    on public.usage_events(user_id);

                                                                                                                                                                                                                                    create index if not exists idx_usage_events_event_type
                                                                                                                                                                                                                                      on public.usage_events(event_type);

                                                                                                                                                                                                                                      create index if not exists idx_usage_events_created_at
                                                                                                                                                                                                                                        on public.usage_events(created_at desc);

                                                                                                                                                                                                                                        -- --------------------------------------------------
                                                                                                                                                                                                                                        -- updated_at triggers
                                                                                                                                                                                                                                        -- --------------------------------------------------
                                                                                                                                                                                                                                        drop trigger if exists set_profiles_updated_at on public.profiles;
                                                                                                                                                                                                                                        create trigger set_profiles_updated_at
                                                                                                                                                                                                                                        before update on public.profiles
                                                                                                                                                                                                                                        for each row execute function public.set_updated_at();

                                                                                                                                                                                                                                        drop trigger if exists set_child_profiles_updated_at on public.child_profiles;
                                                                                                                                                                                                                                        create trigger set_child_profiles_updated_at
                                                                                                                                                                                                                                        before update on public.child_profiles
                                                                                                                                                                                                                                        for each row execute function public.set_updated_at();

                                                                                                                                                                                                                                        drop trigger if exists set_conversations_updated_at on public.conversations;
                                                                                                                                                                                                                                        create trigger set_conversations_updated_at
                                                                                                                                                                                                                                        before update on public.conversations
                                                                                                                                                                                                                                        for each row execute function public.set_updated_at();

                                                                                                                                                                                                                                        -- --------------------------------------------------
                                                                                                                                                                                                                                        -- auto-create profile trigger
                                                                                                                                                                                                                                        -- --------------------------------------------------
                                                                                                                                                                                                                                        drop trigger if exists on_auth_user_created on auth.users;
                                                                                                                                                                                                                                        create trigger on_auth_user_created
                                                                                                                                                                                                                                        after insert on auth.users
                                                                                                                                                                                                                                        for each row execute function public.handle_new_user();

                                                                                                                                                                                                                                        -- --------------------------------------------------
                                                                                                                                                                                                                                        -- ownership guard:
                                                                                                                                                                                                                                        -- a conversation's child_profile must belong to the same user
                                                                                                                                                                                                                                        -- --------------------------------------------------
                                                                                                                                                                                                                                        create or replace function public.enforce_conversation_child_ownership()
                                                                                                                                                                                                                                        returns trigger
                                                                                                                                                                                                                                        language plpgsql
                                                                                                                                                                                                                                        as $$
                                                                                                                                                                                                                                        begin
                                                                                                                                                                                                                                          if not exists (
                                                                                                                                                                                                                                              select 1
                                                                                                                                                                                                                                                  from public.child_profiles cp
                                                                                                                                                                                                                                                      where cp.id = new.child_profile_id
                                                                                                                                                                                                                                                            and cp.user_id = new.user_id
                                                                                                                                                                                                                                                              ) then
                                                                                                                                                                                                                                                                  raise exception 'child_profile_id does not belong to user_id';
                                                                                                                                                                                                                                                                    end if;

                                                                                                                                                                                                                                                                      return new;
                                                                                                                                                                                                                                                                      end;
                                                                                                                                                                                                                                                                      $$;

                                                                                                                                                                                                                                                                      drop trigger if exists enforce_conversation_child_ownership_trigger
                                                                                                                                                                                                                                                                      on public.conversations;

                                                                                                                                                                                                                                                                      create trigger enforce_conversation_child_ownership_trigger
                                                                                                                                                                                                                                                                      before insert or update on public.conversations
                                                                                                                                                                                                                                                                      for each row execute function public.enforce_conversation_child_ownership();

                                                                                                                                                                                                                                                                      -- --------------------------------------------------
                                                                                                                                                                                                                                                                      -- row-level security
                                                                                                                                                                                                                                                                      -- --------------------------------------------------
                                                                                                                                                                                                                                                                      alter table public.profiles enable row level security;
                                                                                                                                                                                                                                                                      alter table public.child_profiles enable row level security;
                                                                                                                                                                                                                                                                      alter table public.conversations enable row level security;
                                                                                                                                                                                                                                                                      alter table public.messages enable row level security;
                                                                                                                                                                                                                                                                      alter table public.safety_events enable row level security;
                                                                                                                                                                                                                                                                      alter table public.usage_events enable row level security;

                                                                                                                                                                                                                                                                      -- profiles
                                                                                                                                                                                                                                                                      drop policy if exists profiles_select_own on public.profiles;
                                                                                                                                                                                                                                                                      create policy profiles_select_own
                                                                                                                                                                                                                                                                      on public.profiles
                                                                                                                                                                                                                                                                      for select
                                                                                                                                                                                                                                                                      using (auth.uid() = id);

                                                                                                                                                                                                                                                                      drop policy if exists profiles_update_own on public.profiles;
                                                                                                                                                                                                                                                                      create policy profiles_update_own
                                                                                                                                                                                                                                                                      on public.profiles
                                                                                                                                                                                                                                                                      for update
                                                                                                                                                                                                                                                                      using (auth.uid() = id);

                                                                                                                                                                                                                                                                      -- child_profiles
                                                                                                                                                                                                                                                                      drop policy if exists child_profiles_select_own on public.child_profiles;
                                                                                                                                                                                                                                                                      create policy child_profiles_select_own
                                                                                                                                                                                                                                                                      on public.child_profiles
                                                                                                                                                                                                                                                                      for select
                                                                                                                                                                                                                                                                      using (auth.uid() = user_id);

                                                                                                                                                                                                                                                                      drop policy if exists child_profiles_insert_own on public.child_profiles;
                                                                                                                                                                                                                                                                      create policy child_profiles_insert_own
                                                                                                                                                                                                                                                                      on public.child_profiles
                                                                                                                                                                                                                                                                      for insert
                                                                                                                                                                                                                                                                      with check (auth.uid() = user_id);

                                                                                                                                                                                                                                                                      drop policy if exists child_profiles_update_own on public.child_profiles;
                                                                                                                                                                                                                                                                      create policy child_profiles_update_own
                                                                                                                                                                                                                                                                      on public.child_profiles
                                                                                                                                                                                                                                                                      for update
                                                                                                                                                                                                                                                                      using (auth.uid() = user_id)
                                                                                                                                                                                                                                                                      with check (auth.uid() = user_id);

                                                                                                                                                                                                                                                                      drop policy if exists child_profiles_delete_own on public.child_profiles;
                                                                                                                                                                                                                                                                      create policy child_profiles_delete_own
                                                                                                                                                                                                                                                                      on public.child_profiles
                                                                                                                                                                                                                                                                      for delete
                                                                                                                                                                                                                                                                      using (auth.uid() = user_id);

                                                                                                                                                                                                                                                                      -- conversations
                                                                                                                                                                                                                                                                      drop policy if exists conversations_select_own on public.conversations;
                                                                                                                                                                                                                                                                      create policy conversations_select_own
                                                                                                                                                                                                                                                                      on public.conversations
                                                                                                                                                                                                                                                                      for select
                                                                                                                                                                                                                                                                      using (auth.uid() = user_id);

                                                                                                                                                                                                                                                                      drop policy if exists conversations_insert_own on public.conversations;
                                                                                                                                                                                                                                                                      create policy conversations_insert_own
                                                                                                                                                                                                                                                                      on public.conversations
                                                                                                                                                                                                                                                                      for insert
                                                                                                                                                                                                                                                                      with check (
                                                                                                                                                                                                                                                                        auth.uid() = user_id
                                                                                                                                                                                                                                                                          and exists (
                                                                                                                                                                                                                                                                              select 1
                                                                                                                                                                                                                                                                                  from public.child_profiles cp
                                                                                                                                                                                                                                                                                      where cp.id = child_profile_id
                                                                                                                                                                                                                                                                                            and cp.user_id = auth.uid()
                                                                                                                                                                                                                                                                                              )
                                                                                                                                                                                                                                                                                              );

                                                                                                                                                                                                                                                                                              drop policy if exists conversations_update_own on public.conversations;
                                                                                                                                                                                                                                                                                              create policy conversations_update_own
                                                                                                                                                                                                                                                                                              on public.conversations
                                                                                                                                                                                                                                                                                              for update
                                                                                                                                                                                                                                                                                              using (auth.uid() = user_id)
                                                                                                                                                                                                                                                                                              with check (
                                                                                                                                                                                                                                                                                                auth.uid() = user_id
                                                                                                                                                                                                                                                                                                  and exists (
                                                                                                                                                                                                                                                                                                      select 1
                                                                                                                                                                                                                                                                                                          from public.child_profiles cp
                                                                                                                                                                                                                                                                                                              where cp.id = child_profile_id
                                                                                                                                                                                                                                                                                                                    and cp.user_id = auth.uid()
                                                                                                                                                                                                                                                                                                                      )
                                                                                                                                                                                                                                                                                                                      );

                                                                                                                                                                                                                                                                                                                      drop policy if exists conversations_delete_own on public.conversations;
                                                                                                                                                                                                                                                                                                                      create policy conversations_delete_own
                                                                                                                                                                                                                                                                                                                      on public.conversations
                                                                                                                                                                                                                                                                                                                      for delete
                                                                                                                                                                                                                                                                                                                      using (auth.uid() = user_id);

                                                                                                                                                                                                                                                                                                                      -- messages
                                                                                                                                                                                                                                                                                                                      drop policy if exists messages_select_own on public.messages;
                                                                                                                                                                                                                                                                                                                      create policy messages_select_own
                                                                                                                                                                                                                                                                                                                      on public.messages
                                                                                                                                                                                                                                                                                                                      for select
                                                                                                                                                                                                                                                                                                                      using (
                                                                                                                                                                                                                                                                                                                        exists (
                                                                                                                                                                                                                                                                                                                            select 1
                                                                                                                                                                                                                                                                                                                                from public.conversations c
                                                                                                                                                                                                                                                                                                                                    where c.id = messages.conversation_id
                                                                                                                                                                                                                                                                                                                                          and c.user_id = auth.uid()
                                                                                                                                                                                                                                                                                                                                            )
                                                                                                                                                                                                                                                                                                                                            );

                                                                                                                                                                                                                                                                                                                                            drop policy if exists messages_insert_own on public.messages;
                                                                                                                                                                                                                                                                                                                                            create policy messages_insert_own
                                                                                                                                                                                                                                                                                                                                            on public.messages
                                                                                                                                                                                                                                                                                                                                            for insert
                                                                                                                                                                                                                                                                                                                                            with check (
                                                                                                                                                                                                                                                                                                                                              exists (
                                                                                                                                                                                                                                                                                                                                                  select 1
                                                                                                                                                                                                                                                                                                                                                      from public.conversations c
                                                                                                                                                                                                                                                                                                                                                          where c.id = messages.conversation_id
                                                                                                                                                                                                                                                                                                                                                                and c.user_id = auth.uid()
                                                                                                                                                                                                                                                                                                                                                                  )
                                                                                                                                                                                                                                                                                                                                                                  );

                                                                                                                                                                                                                                                                                                                                                                  -- no direct client updates/deletes for messages in MVP

                                                                                                                                                                                                                                                                                                                                                                  -- safety_events
                                                                                                                                                                                                                                                                                                                                                                  drop policy if exists safety_events_select_own on public.safety_events;
                                                                                                                                                                                                                                                                                                                                                                  create policy safety_events_select_own
                                                                                                                                                                                                                                                                                                                                                                  on public.safety_events
                                                                                                                                                                                                                                                                                                                                                                  for select
                                                                                                                                                                                                                                                                                                                                                                  using (auth.uid() = user_id);

                                                                                                                                                                                                                                                                                                                                                                  drop policy if exists safety_events_insert_own on public.safety_events;
                                                                                                                                                                                                                                                                                                                                                                  create policy safety_events_insert_own
                                                                                                                                                                                                                                                                                                                                                                  on public.safety_events
                                                                                                                                                                                                                                                                                                                                                                  for insert
                                                                                                                                                                                                                                                                                                                                                                  with check (auth.uid() = user_id);

                                                                                                                                                                                                                                                                                                                                                                  -- usage_events
                                                                                                                                                                                                                                                                                                                                                                  drop policy if exists usage_events_select_own on public.usage_events;
                                                                                                                                                                                                                                                                                                                                                                  create policy usage_events_select_own
                                                                                                                                                                                                                                                                                                                                                                  on public.usage_events
                                                                                                                                                                                                                                                                                                                                                                  for select
                                                                                                                                                                                                                                                                                                                                                                  using (auth.uid() = user_id);

                                                                                                                                                                                                                                                                                                                                                                  drop policy if exists usage_events_insert_own on public.usage_events;
                                                                                                                                                                                                                                                                                                                                                                  create policy usage_events_insert_own
                                                                                                                                                                                                                                                                                                                                                                  on public.usage_events
                                                                                                                                                                                                                                                                                                                                                                  for insert
                                                                                                                                                                                                                                                                                                                                                                  with check (auth.uid() = user_id);