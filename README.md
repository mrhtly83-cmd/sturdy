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
apps/
  mobile/               # React Native / Expo app
    app/                # Expo Router screens
    src/
      components/       # UI components
      context/          # Auth, child profile contexts
      lib/              # API, Supabase, utilities
      theme/            # Design tokens
      types/            # TypeScript types

supabase/
  migrations/           # Database schema
  functions/
    chat-parenting-assistant/   # Main AI Edge Function
    _shared/                    # buildPrompt, validateResponse, safetyFilter

docs/
  README.md                     # This file
  MASTER_BLUEPRINT.md           # Full product architecture
  AI_PROMPT_SYSTEM.md           # How scripts are generated
  SAFETY_SYSTEM.md              # Safety architecture
  DATABASE_SCHEMA.md            # Schema reference
  ROADMAP.md                    # Product roadmap
  SCRIPT_QUALITY_STANDARDS.md  # What good output looks like
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

`v3-ui` — current development branch

---

## The Standard

If a stressed parent opens Sturdy in a hard moment, the product should feel:

**Fast. Calm. Clear. Human. Useful within seconds.**

That is the standard everything else must serve.

