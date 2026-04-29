# Sturdy Database Schema

## Core Principle

The database supports one outcome above all:

> When a parent describes a hard moment, Sturdy returns a calm, human, developmentally appropriate script that feels specific to their child.

---

## Tables

### `profiles`
One row per authenticated user. Auto-created on signup.

```sql
id          uuid primary key references auth.users(id)
full_name   text nullable
created_at  timestamptz
updated_at  timestamptz
```

---

### `child_profiles`
Child context used for script personalisation.

```sql
id          uuid primary key
user_id     uuid references auth.users(id)
name        text nullable
child_age   integer check (child_age between 2 and 17)  -- exact age, required
age_band    text check (age_band in ('2-4', '5-7', '8-12'))  -- legacy, kept for compat
neurotype   text[] default '{}'  -- AI auto-detection only — never user-set, never displayed
preferences jsonb default '{}'
created_at  timestamptz
updated_at  timestamptz
```

**Key design decisions:**
- `child_age` is exact integer — not a band. A 4-year-old and 2-year-old are completely different.
- `neurotype` is an array — future support for multiple. Currently uses first element.
- Neurotype is set ONLY by silent auto-detection from parent messages (see PROMPT_SYSTEM.md).
- The column is invisible AI infrastructure. It is never exposed in UI, never set by parent,
  and never named in output. Any future code that exposes this field to the user is a
  product principle violation — see PRODUCT_PRINCIPLES.md.

---

### `conversations`
One hard moment thread per interaction.

```sql
id               uuid primary key
user_id          uuid references auth.users(id)
child_profile_id uuid references child_profiles(id)
mode             text check (mode = 'hard_moment')
title            text nullable
summary          text nullable
archived         boolean default false
created_at       timestamptz
updated_at       timestamptz
```

---

### `messages`
Individual turns. Stores both raw text and structured JSON.

```sql
id              uuid primary key
conversation_id uuid references conversations(id)
role            text check (role in ('user', 'assistant', 'system'))
content         text  -- raw text / readable
structured      jsonb -- structured AI output for rendering
risk_level      text check (risk_level in ('SAFE', 'ELEVATED_RISK', 'CRISIS_RISK', 'MEDICAL_EMERGENCY'))
policy_route    text check (policy_route in ('normal_parenting', 'safety_support', 'violence_escalation', 'medical_emergency', 'fallback_response'))
created_at      timestamptz
```

**Structured shape for assistant messages:**
```json
{
  "situation_summary": "string",
  "regulate": { "parent_action": "string", "script": "string" },
  "connect":  { "parent_action": "string", "script": "string" },
  "guide":    { "parent_action": "string", "script": "string" },
  "avoid":    ["string", "string", "string"]
}
```

---

### `safety_events`
Logs every safety filter trigger. Sensitive — minimum data stored.

```sql
id               uuid primary key
user_id          uuid references auth.users(id)
child_profile_id uuid references child_profiles(id) nullable
conversation_id  uuid references conversations(id) nullable
message_id       uuid references messages(id) nullable
message_excerpt  text  -- first 120 characters only
risk_level       text
policy_route     text
classifier_version text  -- 'v1-keyword'
resolved_with    text  -- crisis_type string
created_at       timestamptz
```

---

### `usage_events`
Lightweight usage tracking. Powers the free quota counter.

```sql
id               uuid primary key
user_id          uuid references auth.users(id)
child_profile_id uuid nullable
conversation_id  uuid nullable
event_type       text  -- 'script_generated' | 'followup_generated'
event_meta       jsonb -- { intensity, child_age, follow_up_type }
created_at       timestamptz
```

**Free quota logic:**
```sql
select count(*) from usage_events
where user_id = $1
and event_type = 'script_generated'
```

`followup_generated` events do NOT count against the free quota.

---

### `interaction_logs`
Per-script log emitted by the Edge Function. Powers Your Child profile triggers + outcome dashboards. Created out-of-band via the Supabase SQL Editor; column list below reflects the shape the Edge Function writes (see `supabase/functions/chat-parenting-assistant/index.ts:72`).

```sql
id                 uuid primary key
user_id            uuid references auth.users(id) on delete cascade  -- added by 20260428_004
child_profile_id   uuid references child_profiles(id) nullable
conversation_id    uuid nullable
mode               text  -- 'sos' | 'reconnect' | 'understand' | 'conversation'
trigger_category   text nullable
intensity_inferred integer nullable
is_followup        boolean
followup_type      text nullable
situation_summary  text
message_length     integer
created_at         timestamptz
```

---

### `parent_thoughts`
Question-mode prompt + response pairs. Created out-of-band via the SQL Editor; column list below reflects the shape the Edge Function writes (`supabase/functions/chat-parenting-assistant/index.ts:104`).

```sql
id               uuid primary key
user_id          uuid references auth.users(id) on delete cascade  -- added by 20260428_004
child_profile_id uuid references child_profiles(id) nullable
prompt_text      text
response_text    text
created_at       timestamptz
```

---

### `saved_scripts`
Parent-bookmarked scripts. Created out-of-band via the SQL Editor — full column list pending an audit against production. Known: `user_id uuid references auth.users(id) on delete cascade` (added by `20260428_004`).

---

### `script_feedback`
Outcome feedback on scripts (did it land, did it not, etc.). Created out-of-band via the SQL Editor — full column list pending an audit against production. Known: `user_id uuid references auth.users(id) on delete cascade` (added by `20260428_004`).

---

### `subscriptions`
Billing records. Currently dormant — no rows until RevenueCat / StoreKit wires up. Created out-of-band via the SQL Editor — full column list pending an audit against production. Known: `user_id uuid references auth.users(id) on delete cascade` (added by `20260428_004`).

---

### `usage_events`
Already documented above. Cascade FK re-asserted by `20260428_004`.

---

### `user_preferences`
Per-user settings (tone selector, notification opt-ins, etc.). Created out-of-band via the SQL Editor — full column list pending an audit against production. Known: `user_id uuid references auth.users(id) on delete cascade` (added by `20260428_004`).

---

### `child_insights`
Derived insights about a specific child (patterns, what's helped, etc.). Child-scoped — FK to `child_profiles`, no direct FK to `auth.users`. Created out-of-band via the SQL Editor — full column list pending an audit against production.

---

### `incident_events`
Incident-level patterns extracted from interactions. Child-scoped — FK to `child_profiles`, no direct FK to `auth.users`. Created out-of-band via the SQL Editor — full column list pending an audit against production.

---

### `trial_usage`
Anonymous device-level trial counters. **No `user_id`** — the table tracks device-scoped trial state, not user-scoped. No FK to `auth.users` and no constraint added by `20260428_004`. Created out-of-band via the SQL Editor — full column list pending an audit against production.

---

## Row Level Security

All tables have RLS enabled. Each user can only access their own data.

```
profiles         — select/update own row
child_profiles   — select/insert/update/delete own rows
conversations    — select/insert/update/delete own rows
messages         — select/insert own rows (via conversation ownership)
safety_events    — select/insert own rows
usage_events     — select/insert own rows
```

**Ownership rule:** A conversation's `child_profile_id` must belong to the same `user_id`. Enforced by trigger.

---

## Indexes

```sql
child_profiles(user_id)
conversations(user_id)
conversations(child_profile_id)
conversations(updated_at desc)
messages(conversation_id)
messages(created_at)
messages(risk_level)
safety_events(user_id)
safety_events(risk_level)
safety_events(created_at desc)
usage_events(user_id)
usage_events(event_type)
usage_events(created_at desc)
```

---

## Migrations Applied

| Migration | Description |
|---|---|
| 20260312_001_mvp_core.sql | Full MVP schema |
| (SQL Editor) | Added `child_age integer` to child_profiles |
| (SQL Editor) | Added `neurotype text[]` to child_profiles |
| (SQL Editor) | Added `interaction_logs`, `parent_thoughts`, `saved_scripts`, `script_feedback`, `subscriptions`, `user_preferences`, `child_insights`, `incident_events`, `trial_usage` |
| 20260327_002_add_child_age.sql | Formalised `child_age` in migration history; backfilled |
| 20260428_004_add_user_id_foreign_keys.sql | Added FK constraints from every `user_id` column to `auth.users(id)` with `ON DELETE CASCADE` across the 10 user-scoped tables. Idempotent — drops any pre-existing FK on the column before re-adding under the canonical name. `safety_events` will flip to `ON DELETE SET NULL` in the next migration per Principle 8. |

