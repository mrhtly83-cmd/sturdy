# Sturdy Roadmap

## Vision

Sturdy is the go-to parenting companion for every parent at every level — built on the collective wisdom of the world's best parenting research, delivered in plain human language exactly when parents need it.

---

## Guiding Priorities

Every decision should serve at least one of these:

- Faster support in hard moments
- More natural, human-sounding scripts
- Stronger safety without clinical coldness
- Better personalisation to the actual child
- Daily usefulness — not just emergency use
- Parent growth over time

---

## Phase 1 — Foundation (Current)

**Goal:** A working, trustworthy SOS tool that sounds human and adapts to the child.

### ✅ Completed
- Authentication (sign up, sign in, sign out)
- Child profiles (exact age, name)
- SOS input with intensity indicator
- Regulate → Connect → Guide script generation
- Expanded output schema (parent_action + script + avoid)
- Safety filter — 8 crisis categories, phrase-based detection
- Crisis screen — one adaptive screen, four types
- Safety event logging to Supabase
- Usage counter — real from Supabase usage_events
- Free quota — 5 scripts, enforced
- Welcome trial flow — live AI, Regulate shown, Connect+Guide locked
- Neurotype auto-detection from message
- Message length awareness
- Follow-up mode — "What happened next?" Option B
- Dashboard hub — greeting, counter, child, library
- SOS centre tab — pulsing button, modal sheet
- Settings — all sections with placeholders
- Child profile saving — correct columns

### 🔧 In Progress
- Switch to Claude (Anthropic) for script generation
- Fix fallback chain bug
- Tighten crisis keyword detection

### ⬜ Remaining Phase 1
- C×B glassmorphism — full visual implementation (one coordinated session)
- Upgrade screen — wire paywall to real subscription
- IS_PREMIUM → real subscription check
- Restore purchase (iOS requirement)
- Child profile editing
- Delete account API
- Saved scripts screen (data model exists)
- SOS History screen (data model exists)
- Research consent → save to DB

---

## Phase 2 — Quality & Retention

**Goal:** Scripts that feel unmistakably better. Daily habits that keep parents coming back.

### Script Quality
- Claude API fully integrated
- Prompt rebuilt around 12 source books with concrete examples
- Age calibration tested across all ages 2-17
- Neurotype detection accuracy improved with expanded keyword lists
- Follow-up scripts tested and tuned

### Parent Wellbeing Layer
- Replace clinical crisis routing with parent support
- When safety triggers: script for child + quiet support for parent below
- Repair guide — what to say after you lost your temper
- "You're not alone" — normalise the hard moments

### Daily Habit Features
- Daily reflection — one question per day
- Streak tracking — gentle, not gamified
- Script library — saved scripts organised by child and situation
- Pattern recognition — "You've described 6 transition situations this month"

---

## Phase 3 — Understand Your Child

**Goal:** Help parents understand why, not just what to say.

### Age Guide
- What's developmentally normal at every exact age 2-17
- Common behaviours at each age + why they happen
- What approaches work at each stage
- Based on Siegel, Markham, Kennedy, Faber & Mazlish

### Behaviour Decoder
- Parent describes a recurring pattern
- Sturdy explains the developmental or emotional driver
- Suggests approaches from relevant books
- Not a diagnosis — a framework for understanding

### Child Profile Insights
- Based on saved scripts and situations over time
- Proactive — "Based on what you've shared, Tyler often struggles with transitions"
- Quiet, not intrusive

---

## Phase 4 — Grow as a Parent

**Goal:** Long-term parent development. Break cycles. Build awareness.

### Reflection
- Daily or weekly prompts
- "What went well?" "What would you do differently?"
- Builds self-awareness over time

### Book Insights
- Bite-sized principles from the 12 source books
- Delivered contextually — after a relevant SOS, not as a library
- One insight, when it matters

### Parent Style Mirror
- Based on described situations over time
- Shows patterns in how the parent responds
- Not a label — a mirror
- "You tend to lead with connection. Here's how to balance that with clearer limits."

### Repair Guide
- You lost your temper. You said something you regret.
- What do you say now to your child?
- How do you repair it?
- From Philippa Perry + Becky Kennedy

---

## Phase 5 — Platform

**Goal:** Sturdy as a platform, not just an app.

### Multilingual
- App UI and scripts in multiple languages
- Priority order: English → Spanish → French → Mandarin → Arabic
- Scripts must maintain warmth and naturalness in translation

### Family Sharing
- Multiple parents / caregivers on one child profile
- Shared script library
- Co-parenting support (separate parents, shared child)

### Professional Version
- Therapists, educators, and social workers use Sturdy with families
- Different access model
- Annotation and notes layer

---

## What Not to Build Too Early

- Generic open-ended chatbot behaviour
- Heavy dashboards with lots of data
- Too much customisation before usefulness is proven
- Deep analytics before daily habit is established
- Community features before trust is earned

---

## The Standard

Every feature earns its place by answering yes to:

> If a stressed parent opens Sturdy right now, does this make the experience faster, calmer, clearer, or more useful?

