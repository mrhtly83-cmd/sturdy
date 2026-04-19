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
neurotype   text[] default '{}'  -- detected or set: ADHD, Autism, Anxiety, Sensory, PDA, 2e
preferences jsonb default '{}'
created_at  timestamptz
updated_at  timestamptz
```

**Key design decisions:**
- `child_age` is exact integer — not a band. A 4-year-old and 2-year-old are completely different.
- `neurotype` is an array — future support for multiple. Currently uses first element.
- Neurotype is set by auto-detection from message or optionally by parent (premium).

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

## Future Tables (Not Yet Built)

```
saved_scripts        -- parent-bookmarked scripts
subscriptions        -- plan management, premium gating
child_insights       -- pattern recognition from history
daily_reflections    -- parent growth layer
```

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

