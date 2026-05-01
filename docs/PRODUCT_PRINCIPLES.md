# Sturdy Product Principles

These are the locked principles that govern every product decision in Sturdy.
Before building any feature, screen, prompt, or copy, this file must be read
and the work must be verified against these principles.

If a principle is violated, the work does not ship — even if it works
technically, even if it tests well, even if it would convert better.

When principles conflict with marketing intuition, conversion best practice,
or "what every other parenting app does" — the principles win.

---

## What Sturdy is

Sturdy. The bridge from chaos to connection.

This sentence is the product. Every feature, screen, prompt, and design 
decision is in service of building that bridge — in the moment, and over 
years. When a feature doesn't serve the bridge, it doesn't ship.

## 1. Neurotype invisibility

Sturdy detects neurotype (ADHD, Autism, Anxiety, Sensory, PDA, 2e) silently
from how parents describe their child. The detection adapts AI output but is
never named, displayed, or set by the user.

**Why it matters:** Sturdy's differentiation is that parents do not need to
diagnose their child to get help. Every other parenting app asks parents to
declare their child's traits. Sturdy reads it from how they describe behaviour.
This is the single most defensible product position Sturdy has.

**This looks like a violation when:**
- A UI screen asks the parent to select their child's neurotype
- A paywall offers neurotype-related features
- AI output names a neurotype ("Children with ADHD often...")
- Marketing copy mentions specific neurotype names ("Aware of ADHD, autism")
- Settings expose neurotype as user-editable
- Database queries that surface neurotype to a non-AI client

**The DB column `child_profiles.neurotype` exists for AI use only.**

---

## 2. Scripts as examples, not instructions

Sturdy's SOS scripts are example phrasings. The parent adapts them. They are
not verbatim commands.

**This looks like a violation when:**
- UI implies the script must be said exactly as written
- "Copy" buttons that suggest verbatim use without adaptation
- Language that says "tell your child:" instead of "you might say something like:"

---

## 3. Exact age, never age-bands

Sturdy uses integer ages 2-17. A 4-year-old and a 5-year-old are different
products. Never reintroduce age bands like 2-4, 5-7, 8-12.

**This looks like a violation when:**
- Any UI offers age range selection
- Any prompt logic groups ages into buckets
- Any documentation references age bands as a current feature (legacy mentions OK)

---

## 4. Crisis is never paywalled

If the safety filter detects a crisis, the resulting flow is always free.
Crisis routing, the crisis screen, and any safety-related guidance must work
for users with no subscription.

**This looks like a violation when:**
- Any paywall sits between a crisis-classified message and its resources
- Premium features ride alongside crisis content (degrading the experience for free users)
- Free-tier rate limits apply to crisis paths

---

## 5. Long-walk register

Sturdy's voice is "a wise friend on a long walk." Plain words, no preamble,
no therapy speak, no parenting-blog tone. The first sentence stands alone as
a complete answer. Every sentence earns its place.

See `docs/QUESTION_MODE_QUALITY_STANDARDS.md` for the canonical voice
references and `docs/SCRIPT QUALITY STANDARDS.md` for SOS register.

**This looks like a violation when:**
- Copy opens with "It's so common!" or "Great question!"
- Phrases like "your feelings are valid" appear
- Framework names (theory of mind, secure attachment, executive function)
  show up in user-facing text
- Endearments ("honey," "mama," "sweetheart")
- Social-media voice ("power move," "living their best life")
- Validation by disparaging other parents

---

## 6. Free-tier honesty

The free tier of Sturdy is a real product, not a trial. Unlimited SOS scripts.
Question mode. Crisis support. These never become paid.

**This looks like a violation when:**
- Free-tier features get rate-limited beyond reasonable abuse prevention
- Free-tier features get degraded over time to push subscription
- Marketing implies the free tier is a teaser

---

## 7. Trust over conversion

Sturdy does not use dark patterns to drive subscription. No fake higher prices
discounted back. No urgency manufactured by countdown timers. No friction
inserted to make cancellation harder than subscription.

**This looks like a violation when:**
- Pricing anchors that don't reflect real prices
- "Limited time" claims that aren't limited
- Multi-step cancellation flows
- Loss-aversion language in the paywall ("don't miss out")

---

## 8. Account deletion means deletion

When a user deletes their Sturdy account, their data is gone. We do not
preserve deleted accounts for re-engagement campaigns. We do not
anonymize-and-retain for analytics. We do not maintain shadow profiles.
We offer a 30-day pause for users who might regret a hasty decision, and
we offer a data export before any deletion. Once a user chooses to delete,
we honour it fully.

The one exception is `safety_events` — when a safety filter triggers, the
resulting log row has its `user_id` stripped on account deletion but the
content is retained anonymously. This is disclosed in the privacy policy.
The retention serves the safety filter's improvement for all future users,
including those whose own accounts are later deleted.

**This looks like a violation when:**
- "Recover deleted account" flows that revive data after the deletion period
- Analytics or marketing systems retain deleted-user data linked to the user
- Soft-delete patterns that flag accounts as deleted but keep the rows linked
- "We may retain certain information for legitimate business purposes"
  clauses that quietly preserve deleted user data
- Any path where a user's deletion is reversible by the company (only the
  user can reverse a pause; only within the 30-day window)

---

## How to use this file

Every Claude Code brief that touches product UI, AI prompts, or copy must
reference this file. The brief should explicitly state which principles are
relevant and verify the work does not violate them.

When a principle conflicts with a request:
1. Surface the conflict to the human (Thai)
2. Quote the relevant principle and explain why the work as proposed
   would violate it
3. Wait for explicit override or for the request to be revised

This file is updated only with explicit human decisions. New principles
require an OPERATIONS.md entry explaining the addition.
