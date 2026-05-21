# Sturdy

**The parenting companion that helps you respond in the moment, understand your child, and grow as a parent.**

---

## What is Sturdy?

Sturdy is an AI-powered parenting app built on the collective wisdom of the world's best parenting research and books — delivered in plain, human language exactly when parents need it.

The core question Sturdy answers:

> **"What should I say right now?"**

But Sturdy is more than a script generator. It is a go-to parenting companion for every level of parent — new, experienced, overwhelmed, or simply curious about doing better.

---

## The Three Layers

### 1. In the Moment — SOS
Parent describes a hard moment. Sturdy returns a calm, age-specific, human-sounding script in seconds.

**Regulate → Connect → Guide**

Every response includes:
- What the parent does first (body language, positioning)
- What the parent says (natural spoken language, not therapy speak)
- What happens next (one clear next step)
- What to avoid saying in this specific moment

### 2. Understand Your Child
Why does my child do this? What is normal at this age? What approach works for this kind of behaviour?

Sturdy draws from the world's best parenting research to help parents understand what's happening developmentally — and why.

### 3. Grow as a Parent
Reflection, pattern recognition, repair guidance. Sturdy helps parents break cycles, build awareness, and become the parent they want to be — quietly, over time.

---

## What Makes Sturdy Different

Every other parenting app tracks, controls, or organises. Nobody has built the relationship layer — the moment-by-moment intelligence that helps parents respond to their actual child, in real time.

**Sturdy's knowledge base is built from:**
- The Whole-Brain Child (Siegel & Bryson)
- Good Inside (Becky Kennedy)
- How to Talk So Kids Will Listen (Faber & Mazlish)
- No-Drama Discipline (Siegel & Bryson)
- Peaceful Parent Happy Kids (Laura Markham)
- Hunt Gather Parent (Michaeleen Doucleff)
- Raising Good Humans (Hunter Clarke-Fields)
- The Explosive Child (Ross Greene)
- 1-2-3 Magic (Thomas Phelan)
- Simplicity Parenting (Kim John Payne)
- The Book You Wish Your Parents Had Read (Philippa Perry)
- Cribsheet (Emily Oster)

This is not a chatbot. This is a structured, safety-aware, science-backed parenting tool that sounds like a calm parent — not a textbook.

---

## Core Product Principles

### Human, not clinical
Scripts sound like something a calm, capable parent would actually say out loud. No therapy jargon. No robotic phrases. No lecture tone.

### Exact-age aware
A 2-year-old needs 4 words. A 7-year-old needs a brief explanation. A 14-year-old needs respect. Sturdy adapts to the child's exact age — never age bands.

### Neurotype intelligent
Sturdy detects neurotype cues from the parent's description — ADHD, Autism, Anxiety, Sensory, PDA, 2e — and adapts silently. No labels. No clinical UI. Scripts just feel right.

### Length matches detail
A short message gets a focused script. A long detailed message gets a rich, specific response that reflects what the parent actually shared.

### Safety first, always
If a message suggests danger — to the parent, the child, or either's wellbeing — Sturdy prioritises safety before generating any script.

### Not a replacement for professional help
Sturdy is a parenting support tool. It is not therapy, medical advice, or crisis counselling. When situations require professional support, Sturdy says so clearly and warmly.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Mobile app | React Native / Expo |
| Auth + DB | Supabase |
| AI generation | Anthropic Claude |
| Edge Functions | Supabase Edge Functions (Deno) |
| Safety layer | Keyword filter + policy routing |

---

## Repository Structure

```
CLAUDE.md                       # Canonical repo guide for Claude Code
apps/
  mobile/               # React Native / Expo app
    app/                # Expo Router screens
      (tabs)/           # 3-tab bar: Home, Family, Settings
      auth/             # Sign in, sign up, forgot password, reset
      child/            # Per-child hub [id].tsx, new.tsx
      child-profile/    # Your Child screen [id].tsx
      welcome/          # v12 onboarding flow
      legal/            # Privacy, ToS, AI limitations, medical safety
      account/          # Pause, delete, export
    src/
      components/       # UI components (Card, PaywallSheet, etc.)
      context/          # Auth, ChildProfile contexts
      hooks/            # useSubscription (RevenueCat), useCrisisMode
      lib/              # api.ts, supabase.ts, loadChildInsights.ts
      theme/            # Design tokens (colors.ts, fonts)
      utils/            # tone, analytics, onboarding, profileNudge
    assets/             # Images (golden-particles-bg.png, welcome photos)

  web/                  # Next.js marketing/landing site

supabase/
  migrations/           # Database schema (timestamped SQL)
  functions/
    chat-parenting-assistant/   # Main AI Edge Function
    account-export/             # Data export
    account-pause/              # Account pause
    account-delete/             # Account deletion
    scheduled-pause-cleanup/    # Daily cron for auto-deleting paused accounts
    _shared/                    # buildPrompt, validateResponse, safetyFilter,
                                # rateLimit, triggerClassifier, requestHelpers

docs/
  OPERATIONS.md                 # Append-only decision log
  ROADMAP.md                    # Product roadmap
  FEATURE_INVENTORY.md          # Ground-truth feature audit
  PRODUCT_PRINCIPLES.md         # 8 locked product principles
  SCRIPT_QUALITY_STANDARDS.md   # SOS output quality bar
  QUESTION_MODE_QUALITY_STANDARDS.md  # Question mode voice reference
  SESSION_END_CHECKLIST.md      # Mandatory end-of-session doc update checklist
  master/STURDY_MASTER_BLUEPRINT.md   # Canonical product spec
```

---

## Running the App

```bash
# Install dependencies
cd apps/mobile && npm install

# Start development
npx expo start -c --tunnel

# Deploy Edge Function
cd /workspaces/Sturdy
npx supabase functions deploy chat-parenting-assistant
```

---

## Active Branch

`main` — default integration branch. Feature work on `claude/<topic>` branches, merged via squash PR.

---

## The Standard

If a stressed parent opens Sturdy in a hard moment, the product should feel:

**Fast. Calm. Clear. Human. Useful within seconds.**

That is the standard everything else must serve.