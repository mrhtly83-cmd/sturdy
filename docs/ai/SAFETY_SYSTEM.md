# Sturdy Safety System

## Philosophy

Safety is invisible infrastructure. It protects without alarming.

The old approach routed parents to a crisis screen — cold, clinical, one-size-fits-all.

The new approach meets the parent first:
- Give them the script for their child
- Offer support for themselves, quietly, below
- No sirens. No redirects. No judgment.

**Sturdy should never make a stressed parent feel accused, shamed, or abandoned.**

---

## What the Safety System Protects Against

1. **Medical emergencies** — child not breathing, seizure, severe injury
2. **Suicidal ideation** — parent or child expressing desire to die
3. **Parent losing control** — fear of hurting their child
4. **Violence toward child** — parent describing hitting, physical harm
5. **Violence toward parent** — child with weapon or attacking parent
6. **Child self-harm** — cutting, hitting self, burning
7. **Abuse indicators** — signs a child is being harmed

---

## Architecture — Three Layers

```
Parent message
      ↓
Layer 1: Keyword filter (instant, pre-AI)
      ↓ triggered          ↓ safe
Layer 2: Policy routing    Normal pipeline
      ↓
Layer 3: Safety response + logging
```

---

## Layer 1 — Keyword Filter

**Runs before any AI call.** Returns in under 1ms.

Uses phrases, not single words — single words cause too many false positives.

**Trigger phrases by category:**

```
MEDICAL:
'not breathing', 'cant breathe', 'stopped breathing',
'unconscious', 'wont wake up', 'passed out',
'severe bleeding', 'having a seizure', 'seizure now',
'ingested', 'overdose', 'swallowed something',
'call an ambulance', 'need emergency'

SUICIDAL (PARENT):
'kill myself', 'want to die', 'end my life', 'end it all',
'no reason to live', 'better off dead', 'better off without me',
'thinking about suicide'

SUICIDAL (CHILD):
'said they want to die', 'wants to kill themselves',
'my child said suicide', 'child is suicidal',
'talked about ending their life'

PARENT LOSING CONTROL:
'might hurt my child', 'might hurt my kid',
'going to hurt them', 'feel like hurting',
'going to lose it completely', 'about to snap',
'cant control myself'

VIOLENCE TOWARD CHILD:
'hit my child', 'hitting my child', 'hit my kid',
'slapped my child', 'choked my child',
'shook my baby', 'beat my child', 'punched my child'

VIOLENCE TOWARD PARENT:
'has a knife', 'grabbed a knife', 'has a gun',
'attacking me', 'stabbing me', 'choking me'

CHILD SELF-HARM:
'self harm', 'self-harm', 'cutting themselves',
'cutting himself', 'cutting herself', 'burns themselves',
'hitting themselves until'

ABUSE INDICATORS:
'locked them in', 'haven\'t fed', 'bruises on my child',
'someone is hurting my child', 'being abused',
'someone touched my child'
```

---

## Layer 2 — Policy Routing

Each crisis type maps to a response approach:

| Crisis Type | Risk Level | Response |
|---|---|---|
| medical_emergency | MEDICAL_EMERGENCY | Immediate emergency services |
| suicidal_parent | CRISIS_RISK | Parent wellbeing support + crisis line |
| suicidal_child | CRISIS_RISK | Child mental health + crisis line |
| parent_losing_control | ELEVATED_RISK | Parent de-escalation + support |
| violence_toward_child | CRISIS_RISK | Child safety resources |
| violence_toward_parent | ELEVATED_RISK | Safety first + de-escalation |
| child_self_harm | ELEVATED_RISK | Mental health support |
| abuse_indicator | ELEVATED_RISK | Child protection resources |

---

## Layer 3 — Safety Event Logging

Every triggered event is logged to `safety_events` table.

```json
{
  "user_id": "...",
  "child_profile_id": "...",
  "message_excerpt": "first 120 characters only",
  "risk_level": "ELEVATED_RISK | CRISIS_RISK | MEDICAL_EMERGENCY",
  "policy_route": "safety_support | violence_escalation | medical_emergency",
  "classifier_version": "v1-keyword",
  "resolved_with": "crisis_type_string"
}
```

Non-blocking — logging failure never blocks the response.

---

## Crisis Screen Design Principles

- Calm, warm tone. No red. No alarm aesthetics.
- "I'm safe — this was a mistake" always visible at the bottom
- Parent can return to SOS input if it was a false positive
- Resources are generic — no country-specific numbers (for multilingual future)
- One screen adapts to all crisis types

---

## Inline Crisis Detection (SOS Input)

While the parent types, a lightweight keyword scan runs in real time. If a phrase is detected, a calm amber banner appears inside the textarea:

> *"This sounds serious — tap here if you need immediate help →"*

The banner fades out when keywords are removed. It does not block the parent from continuing to type or getting a script.

---

## False Positive Handling

False positives are handled gracefully:
- Parent can dismiss the crisis screen
- "I'm safe — this was a mistake" routes back to SOS input
- The message is preserved so they can try again

---

## What the Safety System Does NOT Do

- It does not diagnose
- It does not assess suicide risk
- It does not contact authorities
- It does not store full messages (only 120-char excerpt)
- It does not block parents from getting parenting help after a false positive
- It does not shame or judge

---

## Important Disclaimer

Sturdy is a parenting support tool. It is not a crisis counselling service, medical service, or emergency response system. When the safety filter triggers, Sturdy provides warm guidance toward appropriate professional resources — it does not replace them.
<
