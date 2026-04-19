# Sturdy Script Quality Standards

## The Standard

A Sturdy script passes quality if a stressed parent could pick up their phone, read these words, and say them out loud in the next 30 seconds — and they'd actually help.

---

## The Three Tests

### Test 1 — The Say It Out Loud Test
Read the script out loud. Does it sound like a real calm parent? Or does it sound like:
- A therapist writing notes
- A parenting blog
- A school counsellor
- A robot

If it sounds like any of those — it fails.

### Test 2 — The Specificity Test
Does the script reflect the actual situation? Or could it have been written for any child in any situation?

Generic: *"You're really upset right now."*
Specific: *"You're really upset about leaving the park."*

The specific version is always better. Generic output for a detailed message is a failure.

### Test 3 — The Age Test
Read the Guide step. Could a child of this exact age actually follow this instruction?

A 3-year-old cannot process: *"When you feel ready, you can make a different choice about how we handle this."*
A 3-year-old can process: *"It's time to go. Hold my hand."*

If the Guide doesn't match the age — it fails.

---

## Examples by Age

### Age 2 — Hitting sibling

**PASS:**
```
regulate: "Big mad."
connect:  "Ouch. Hitting hurts."
guide:    "Gentle hands."
```

**FAIL:**
```
regulate: "I can see you're feeling really frustrated right now."
connect:  "I understand that you're angry, but hitting is not the right way to express your feelings."
guide:    "Can you use your words to tell your brother how you're feeling?"
```
*Why it fails:* A 2-year-old cannot process any of that. Too long, too abstract, too clinical.

---

### Age 4 — Leaving the park

**PASS:**
```
regulate: "You're really upset about leaving the park."
connect:  "You wanted more time to play, and it's so hard to stop. We're still going."
guide:    "Walk with me or I'll carry you. You choose."
```

**FAIL:**
```
regulate: "I see you're having some big feelings."
connect:  "It's okay to feel sad. Sometimes we have to do things we don't want to do."
guide:    "Let's take some deep breaths and then we can walk to the car together."
```
*Why it fails:* "Big feelings" is banned. "Deep breaths" sounds like a yoga teacher. "Together" is not a clear next step.

---

### Age 7 — Refusing homework

**PASS:**
```
regulate: "You've been working hard today and your brain is done."
connect:  "I get it — you're exhausted. Homework still needs to happen."
guide:    "15 minutes, then you're free. Start with the easiest one."
```

**FAIL:**
```
regulate: "I understand you don't want to do your homework."
connect:  "It's important to complete your responsibilities even when we don't feel like it."
guide:    "Let's try to develop some good study habits that will help you in the future."
```
*Why it fails:* Connect doesn't name the feeling. Guide is a lecture about future habits. "Responsibilities" and "study habits" sound like a teacher, not a parent.

---

### Age 13 — Silent treatment

**PASS:**
```
regulate: "I can see you're really angry with me."
connect:  "You're furious about the party, and you wanted to go. I get it. I still needed to keep you safe."
guide:    "Dinner's ready whenever you want to come down. I'm here when you're ready to talk."
```

**FAIL:**
```
regulate: "I notice that you seem upset."
connect:  "I understand your frustration, and I want you to know your feelings are valid."
guide:    "When you're ready to have a constructive conversation, I'm here to listen."
```
*Why it fails:* "Feelings are valid" is therapy speak. "Constructive conversation" is corporate. No real parent talks like this to their teenager.

---

## Common Failure Patterns

### Failure: Generic regulate
Instead of naming the actual emotion from the specific situation — using a default phrase.

❌ "You're having a really hard time right now."
✅ "You're really angry that screen time is over."

### Failure: Passive boundary in Connect
Instead of a first-person clear limit — using hedged or passive language.

❌ "We can't have hitting in this house."
❌ "That kind of behaviour isn't acceptable."
✅ "I'm not going to let you hit."
✅ "Hitting your sister is something I won't allow."

### Failure: Open-ended Guide
Instead of one concrete action — a vague condition.

❌ "When you're feeling calmer, we can talk about this."
❌ "Take some time to think about what just happened."
✅ "Go to your room. Come back when you're ready."
✅ "We leave in two minutes. Put on your shoes now."

### Failure: Multi-clause Connect for young children
Age 2-4 cannot process a sentence with more than one idea.

❌ "You're upset because you wanted to stay, and I understand that, but we have to leave because it's time for dinner."
✅ "You wanted to stay." (then pause) "It's time to go."

### Failure: Robotic regulate
The parent action is fine but the script sounds performed.

❌ "I can see that you are feeling upset about the current situation."
✅ "That felt really unfair."

---

## Testing Protocol

When testing a new prompt version, test these six scenarios:

| Scenario | Age | Key check |
|---|---|---|
| Cookie meltdown | 3 | Regulate is 4 words max. Guide is one step. |
| Leaving the park | 4 | Connect names feeling AND holds limit. |
| Hitting sibling | 7 | Regulate names specific feeling. Guide is short and direct. |
| Bedtime resistance | 5 | Guide offers a real binary choice. |
| Screen time refusal | 10 | Language is respectful, not babyish. |
| Teen silent treatment | 14 | No therapy speak. Parent sounds human. |

Also test:
- Same scenario at intensity 1 vs intensity 5 — scripts should feel dramatically different
- Short 5-word message vs 60-word detailed message — detailed should feel richer and more specific
- Message with ADHD keywords — Guide should include movement option
- Message with Autism indicators — Connect should be sequential and concrete
