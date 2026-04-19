# Sturdy Master Blueprint

**Last updated: v4-rebuild**

This document is the single source of truth for Sturdy's product architecture. If all other documentation is lost, this file contains enough to rebuild the product.

---

## Vision

Sturdy is the go-to parenting companion for every parent at every level.

It helps parents:
1. **Respond in the moment** — calm, age-specific, human-sounding scripts
2. **Understand their child** — why this happens, what's normal, what helps
3. **Grow as a parent** — patterns, repair, reflection
4. **Find their own voice** — scripts are a starting point, not a script to memorise

The core question: **"What should I say right now?"**

The deeper promise: **A better parent, one moment at a time.**

The philosophy: **Sturdy gives you the words. Use them exactly, or make them yours.**

---

## Product Architecture

### One Input, One Flow

There are no mode tabs or mode cards. The parent types what's happening and selects their desired outcome. Sturdy routes to the correct mode internally.

**Flow:**
```
Parent opens app → Home screen
        ↓
Describes the moment (text input)
        ↓
Selects outcome: What do you need right now?
  • Help us both calm down → SOS mode
  • Get through this together → SOS mode (guide-weighted)
  • Help me understand why → Understand mode
  • Repair what just happened → Reconnect mode
        ↓
Selects tone: Soft / Gentle / Direct
        ↓
Safety filter (instant keyword scan)
        ↓ safe              ↓ unsafe
Normal pipeline         Safety support path
        ↓
Neurotype detection (from message)
        ↓
Message length analysis
        ↓
Age-specific prompt assembly
        ↓
Claude generates structured script
        ↓
Response validation
        ↓
Result screen (collapsible steps)
        ↓
"What happened next?" follow-up
        ↓
Interaction logged → feeds child profile
```

### Four Internal Modes (invisible to parent)

Each mode has its own dedicated prompt function in `buildPrompt.ts`:

- `getSOSPrompt()` — Regulate → Connect → Guide
- `getReconnectPrompt()` — Open the Door → Hold Steady → Leave Space
- `getUnderstandPrompt()` — Why it happens → What they need → What helps
- `getConversationPrompt()` — Set up → Open with curiosity → State clearly

Mode detection happens from the outcome selector + message content. The parent never sees mode names.

**Output shape (all modes):**
```json
{
  "situation_summary": "string",
  "step1": { "label": "string", "parent_action": "string", "script": "string", "coaching": "string", "strategies": ["string"] },
  "step2": { "label": "string", "parent_action": "string", "script": "string", "coaching": "string", "strategies": ["string"] },
  "step3": { "label": "string", "parent_action": "string", "script": "string", "coaching": "string", "strategies": ["string"] },
  "avoid": ["string", "string", "string"]
}
```

---

## Revenue Architecture

### Free Tier (unlimited)
- Unlimited SOS scripts — no cap, no limit, ever
- All four modes via outcome selector
- Basic script output (Regulate → Connect → Guide)
- Voice playback on SOS mode

### Sturdy+ ($9.99/month)
- Coaching layer on all scripts ("Why this works")
- Voice playback on all modes
- Know Your Child profile (builds from interactions)
- Weekly audio insight (Sunday push notification)
- Full interaction history
- Tone selector (Soft / Gentle / Direct)

### Sturdy Family ($14.99/month)
- Everything in Sturdy+
- 2 co-parent seats
- Multiple child profiles
- Co-parent sharing (send script cards to partner)

### Revenue Target
$100k/month = ~8,300 paying subscribers at ~$12 avg revenue.

### Conversion Strategy
- SOS is free and unlimited — this is the acquisition engine
- After 3+ interactions, subtle nudge: "Sturdy is learning how [child] responds. See their profile →"
- Child profile is the conversion trigger — parents pay when they see Sturdy knows their child
- No paywalls on crisis moments. Ever.

---

## Navigation

### Tab Bar (3 tabs)
```
[ Home 🏠 ]    [ Your Child 👤 ]    [ You ⚙ ]
```

**Home** — single input, outcome selector, tone, child card, weekly insight preview, free plan counter

**Your Child** — living profile that builds over time. Triggers, what works, emerging patterns, weekly insight with audio player. Empty state when new → builds after 5+ interactions.

**You** — account, subscription, co-parent setup, preferences, support, legal

### Key Screens
```
/welcome              → Welcome (new users only)
/child-setup           → Add child: name + age (skippable)
/auth/sign-up          → Create account (or continue as guest)
/auth/sign-in          → Sign in (returning users)
/(tabs)/index          → Home (single input)
/(tabs)/your-child     → Your Child profile
/(tabs)/you            → Settings / Account
/result                → Script result (collapsible cards)
/crisis                → Safety support (adaptive)
/child/new             → Add child profile
/child/[id]            → Edit child profile
```

### User Flows

**New user:**
Open app → Welcome → Add child (or skip) → Sign up (or guest) → Home → first script

**Returning user (signed in):**
Open app → Home. Straight there. No splash.

**Returning user (signed out):**
Open app → Sign in → Home.

**Guest returning:**
Data persists locally. When they sign up, everything migrates. They never lose a script.

---

## AI System

### Model
**Anthropic Claude** (claude-sonnet-4-20250514)

### Edge Function
`supabase/functions/chat-parenting-assistant/` — NO CHANGES in v4 rebuild.

### Prompt System
`supabase/functions/_shared/buildPrompt.ts` — NO CHANGES in v4 rebuild.

### Response Validation
`supabase/functions/_shared/validateResponse.ts` — NO CHANGES in v4 rebuild.

### Safety System
`supabase/functions/_shared/safetyFilter.ts` — NO CHANGES in v4 rebuild.

All AI/prompt/safety changes are deferred to a future phase after the UI rebuild is complete.

### Knowledge Base
Unchanged — 12 foundational parenting books. See PROMPT_SYSTEM.md.

### Neurotype Detection
Unchanged — detects from message content. See PROMPT_SYSTEM.md.

---

## Voice Feature

### Implementation
1. Script generates as normal (text JSON from Claude)
2. After response, second call to TTS API (OpenAI TTS or ElevenLabs)
3. Audio URL returns to app alongside text response
4. App plays audio with simple player — play/pause, step progress
5. Audio caches locally for replay

### Voice bar placement
Top of result screen, above script cards. Shows play button, title, subtitle, organic sound wave animation.

### During playback
Walks through each step with pauses between:
- Parent action (spoken)
- 1.5s pause
- Script (spoken)
- 2s pause
- Next step

### Voice access
- SOS mode: free
- All other modes + weekly insight: Sturdy+

---

## Result Screen — Visual Spec

### Theme: Deep Warm
Dark background (#1E1D25) with warm mesh gradient (amber/sage/slate radial gradients). Transparent glass cards. Generous spacing. Organic animations.

### Layout (top to bottom)
```
‹ Back

Situation summary (italic Fraunces serif, amber gradient)
[outcome tag]  [child avatar + name, age]        [Avatar]

[ ▶ Listen to this script                        ||||| ]
[   Put in your earbuds — Sturdy walks you through it  ]

▼ ⚠️ Avoid saying                              3 phrases
   (collapsed dropdown — expands to show avoid list)

▼ 1  REGULATE                          "This homework..."
   (open by default — shows action, "Say this", script, coaching)

▼ 2  CONNECT                    "You're frustrated because..."
   (collapsed — preview snippet shown)

▼ 3  GUIDE                     "Just this one. We'll figure..."
   (collapsed — preview snippet shown)

   ─── (thin amber line) ───
   Your child doesn't need perfect words.
   They need you — these just help you get there.

   What happened next?
   [ 🚫 They refused           ]
   [ 📈 It escalated           ]
   [ 💛 It helped a bit        ]
   [ 💬 Something else happened ]

   Sturdy is learning how Claude responds.
   See Claude's profile →
```

### Script card structure (inside each dropdown)
```
[Parent action — italic, secondary color]

SAY THIS
"Script text — large, high contrast, readable"

💡 Why this works                           ▶
   (collapsed coaching — expands to show explanation + strategies)
```

### Animation placement
- Child avatar: gentle breathing scale (4s cycle)
- Voice button: amber glow pulse (3s cycle)
- Floating particles: 4 dots (amber/sage/slate), very slow float upward
- "Your Way" text: slow shimmer animation (6s cycle)
- Card entrance: staggered fadeSlide (0.2s, 0.35s, 0.5s delays)
- NO animation on: script text, parent actions, coaching content

### Card styling
- Transparent background (no fill when collapsed)
- Subtle tint when expanded (rgba of accent color at 0.03)
- Border defined by accent color (amber/sage/slate at 0.14 opacity)
- Border radius: 16px
- Padding: 18px inner content

---

## Home Screen — Spec

### Layout (top to bottom)
```
Good morning, [child]'s parent
What's happening?

┌─────────────────────────────────────┐
│ Describe the moment                 │
│ ┌─────────────────────────────────┐ │
│ │ [textarea]                      │ │
│ └─────────────────────────────────┘ │
│                                     │
│ What do you need right now?         │
│ [ 🧘 Help us both calm down      ] │
│ [ 🧭 Get through this together   ] │
│ [ 💡 Help me understand why      ] │
│ [ 🤝 Repair what just happened   ] │
│                                     │
│ Tone: [ Soft ] [ Gentle ] [ Direct ]│
│                                     │
│ [ Help me with this ]               │
└─────────────────────────────────────┘

── Your child ──
[C] Claude · Age 10 · 7 interactions    ›

┌ Weekly insight · Sunday ─────────────┐
│ (locked preview, blurred)            │
│       Unlock with Sturdy+ →         │
└──────────────────────────────────────┘

Free plan · Unlimited SOS        Upgrade →
```

### Outcome selector
4 options, single select, vertical stack. Each has emoji + title + subtitle.
Maps to internal mode:
- "Help us both calm down" → SOS (regulate-heavy)
- "Get through this together" → SOS (guide-heavy)
- "Help me understand why" → Understand
- "Repair what just happened" → Reconnect

Conversation mode triggers when Sturdy detects the message is about a future conversation ("I need to tell her...", "How do I talk to him about...").

### Tone selector
3 options, horizontal row, single select. Saves to profile.
- **Soft** — warm, spacious, feelings-first
- **Gentle** — balanced, calm but clear
- **Direct** — short, firm, no extras

Tone is Sturdy+ only. Free users default to Gentle.

---

## Your Child Screen — Spec

### Empty state (< 5 interactions)
```
[Avatar C]
Claude · Age 10
2 interactions

      🌱

   Getting to know Claude
   After a few more interactions,
   Sturdy will show you patterns
   and what works best.
```

### Active state (5+ interactions)
```
[Avatar C]
Claude · Age 10
7 interactions · 3 this week

┌ This week's insight ─────────────────┐
│ "Homework is the battleground —      │
│  but it's not really about homework."│
│                                      │
│ [▶ Listen to this week's insight]    │
└──────────────────────────────────────┘

┌ Common triggers ─────────────────────┐
│ Homework                ████████  4× │
│ Screen time limits      ████     2× │
│ Bedtime                 ██       1× │
└──────────────────────────────────────┘

┌ What works for Claude ───────────────┐
│ One clear direction > choices (tired)│
│ Sitting close calms him faster       │
│ Needs 5-10 min before retrying       │
└──────────────────────────────────────┘

┌ Emerging patterns ───────────────────┐
│ Worst moments: 4-6pm                 │
│ Responds to repair quickly           │
└──────────────────────────────────────┘

┌──────────────────────────────────────┐
│ Claude's profile is growing          │
│ Unlock full profile with Sturdy+     │
│                                      │
│     [ Sturdy+ · $9.99/month ]       │
└──────────────────────────────────────┘
```

---

## Welcome / Onboarding — Spec

### Screen 1 — Welcome
```
[Sturdy logo or wordmark]

"You don't need to be a perfect parent.
 You just need the right words
 at the right time."

[Live preview of a Regulate card — real content, not mockup]

        [ Get started ]
```

### Screen 2 — Add your child
```
"Who are you here for?"

Name  [ Claude          ]
Age   [ 10              ]  ← drum picker

This helps Sturdy match their age exactly.
Every year matters.

        [ Continue ]
        Skip for now
```

### Screen 3 — Account
```
"Save your scripts and build
 your child's profile."

Email    [ ... ]
Password [ ... ]

        [ Create account ]
        Continue as guest
```

3 screens. Under 60 seconds. First script by second minute.

---

## Design System — Deep Warm (Locked)

### Background
`#1E1D25` — warm dark charcoal

### Mesh gradient (3 layers)
- Amber: `radial-gradient(ellipse 70% 50% at 10% 0%, rgba(212,148,74,0.07))`
- Slate: `radial-gradient(ellipse 55% 55% at 90% 80%, rgba(130,170,196,0.06))`
- Sage: `radial-gradient(ellipse 60% 40% at 50% 40%, rgba(141,184,154,0.04))`

### Colors
```
--amber: #D4944A
--amber-lt: #F4C06A
--sage: #8DB89A
--sage-lt: #A8D4B4
--slate: #82AAC4
--slate-lt: #A0C4DA
--text: rgba(255,255,255,0.93)
--text-sec: rgba(255,255,255,0.6)
--text-muted: rgba(255,255,255,0.36)
--text-faint: rgba(255,255,255,0.18)
--border: rgba(255,255,255,0.08)
--border-hi: rgba(255,255,255,0.13)
```

### Cards
- Transparent background (no fill when collapsed)
- Subtle accent tint when expanded (0.03 opacity)
- Border: accent color at 0.14 opacity
- Border radius: 16px (cards), 20px (main cards), 14px (buttons)
- Backdrop blur: 30px on glass elements

### Typography
- Headlines: Fraunces italic (serif) — for situation summaries, insight titles, philosophy lines
- Body: DM Sans — everything else
- Script text: 17-18px, high contrast (0.93 white)
- Labels: 10-12px, uppercase, letter-spacing 0.06-0.1em
- "Say this" label above scripts

### Animations
- Child avatar: `breathe` — scale 1→1.04, 4s ease-in-out infinite
- Voice button: `vpulse` — box-shadow glow, 3s ease-in-out infinite
- Particles: 4 floating dots, 20-28s duration, barely visible
- "Your Way" shimmer: background-position slide, 6s infinite
- Card entrance: `fadeSlide` — translateY(18px)→0, staggered delays
- Dropdown expand: max-height transition, 0.45s ease

### Navigation
- Active tab: amber (#D4944A)
- Inactive: rgba(255,255,255,0.18)
- Bottom nav background: gradient fade from bg color

---

## Database Schema

### Existing tables (NO CHANGES)
```
profiles           — authenticated parent accounts
child_profiles     — child context (name, child_age, neurotype[])
conversations      — hard moment threads
messages           — individual turns (user + assistant)
safety_events      — safety trigger logs
usage_events       — script generation tracking
```

### New tables (v4 additions)
```
interaction_logs   — every script result logged for child profile
  - user_id, child_profile_id
  - mode (sos / reconnect / understand / conversation)
  - outcome_selected (text)
  - tone_selected (soft / gentle / direct)
  - trigger_category (homework / bedtime / screen_time / etc.)
  - intensity_inferred (1-4)
  - followup_type (refused / escalated / helped / other / null)
  - created_at

child_insights     — aggregated patterns per child
  - child_profile_id
  - insight_type (trigger_pattern / what_works / emerging)
  - content (jsonb)
  - generated_at
  - week_of (date)

user_preferences   — tone, notification settings
  - user_id
  - tone_default (soft / gentle / direct)
  - weekly_insight_enabled (boolean)
  - push_enabled (boolean)
```

---

## Build Order

### Phase 1 — Theme (Day 1)
Update `src/theme/` to Deep Warm palette. All existing screens inherit dark theme.

### Phase 2 — Result Screen (Days 2-3)
Rebuild `result.tsx`. Create new collapsible `ScriptCard` component. Voice bar component. Avoid dropdown. "Your Way" section. Follow-up buttons with profile nudge.

### Phase 3 — Home Screen (Days 4-5)
Rebuild `(tabs)/index.tsx`. Single input. Outcome selector. Tone selector (Sturdy+ gated). Child card. Insight preview. Free plan bar.

### Phase 4 — Navigation (Day 5)
Update `(tabs)/_layout.tsx`. Three tabs: Home / Your Child / You. Update routing.

### Phase 5 — Your Child Tab (Days 6-7)
New screen `(tabs)/your-child.tsx`. Empty state. Profile cards (triggers, what works, patterns). Paywall prompt.

### Phase 6 — Welcome & Onboarding (Days 8-9)
Rebuild `welcome/index.tsx`. Three screens. Child setup with skip. Guest flow.

### Phase 7 — Interaction Logging (Day 10)
Add `interaction_logs` table migration. Log every script result. This powers the child profile.

### Phase 8 — Edge Function Updates (Future)
Update `buildPrompt.ts` to accept outcome + tone params. Add mode classifier. Update output schema for coaching fields. NOT part of UI rebuild.

---

## Environment Variables

```
EXPO_PUBLIC_SUPABASE_URL         — Supabase project URL
EXPO_PUBLIC_SUPABASE_ANON_KEY    — Supabase anon key
ANTHROPIC_API_KEY                — Claude API key (Edge Function)
```

---

## Git

- Active branch: `v4-rebuild` (create from v3-ui)
- Previous branch: `v3-ui`
- Run: `cd apps/mobile && npx expo start -c --tunnel`
- Deploy edge functions: `npx supabase functions deploy chat-parenting-assistant`

---

## The Standard

If a stressed parent opens Sturdy in a hard moment, the product should feel:

**Fast. Calm. Clear. Human. Useful within seconds.**

If a returning parent opens Sturdy on a calm evening, the product should feel:

**Warm. Knowing. Personal. Worth keeping.**

That is the standard everything else must serve.

