# Question Mode Quality Standards

Sibling to `SCRIPT QUALITY STANDARDS.md`. The first document defines what good output looks like for SOS-style scripts (Regulate / Connect / Guide). This one does the same job for Question mode — the flowing-prose responses Sturdy returns when the parent types into the Home input.

---

## The Standard

A Sturdy Question-mode response sounds like a wise friend on a long walk. Plain words, no preamble, no therapy speak, no parenting-blog tone. Specific to the parent and the child. Length matched to what the question deserves, not eagerness to be helpful.

---

## The Three Tests

**Read it out loud.** Does it sound like a real person texting a friend? Or a textbook, a therapist, a self-help book, a customer service script? If it sounds like any of those, it fails.

**Specificity.** Could it have been sent to any parent of any child? If yes, fail. The response must reflect what *this* parent said about *this* child.

**Length proportionality.** Does the length match what the question asked for? A reassurance question coming back at four paragraphs is as much a failure as a `hard_conversation` coming back at two.

---

## The Five Reference Questions

The five reference Q&A pairs below are the permanent calibration set. They are also the inputs in `supabase/functions/_shared/prompts/__tests__/eval-inputs.json` — running `npm run eval:question` generates the model's output for the same five inputs so we can grade drift against these references.

The reference responses are **tuning forks, not answer keys**. Outputs are not graded for verbatim match. They're graded on the three tests above.

---

> **⚠ v2 in progress — references not yet drafted.** Eval inputs were swapped to non-overlapping scenarios because the v1 inputs collided with the in-prompt Phase 2d examples (recitation test, not voice test). Replacement reference responses must be human-written by Thai before the eval becomes a quality benchmark again. Until then, these placeholders make the doc structurally complete (the eval script still runs cleanly) but eval outputs cannot be graded against them.

### Q1 — `reassurance`, age 3

**Parent input:**

> "my 3 year old has started crying every single morning at nursery drop off. she was fine for months and now suddenly it's a full meltdown every day. did i do something wrong??"

**Reference response:**

> TODO: Reference response pending — see thread `claude/sturdy-cta-thread`.
> Do not run eval as a quality benchmark until this is filled in.

**What this response does right:**

> TODO

**Likely failure modes:**

> TODO

---

### Q2 — `explain_why`, age 8

**Parent input:**

> "my 8 year old has started lying about doing his homework. he'll say he did it and then i find out from the teacher he didn't. why is he doing this when he knows i'll find out?"

**Reference response:**

> TODO: Reference response pending — see thread `claude/sturdy-cta-thread`.
> Do not run eval as a quality benchmark until this is filled in.

**What this response does right:**

> TODO

**Likely failure modes:**

> TODO

---

### Q3 — `parent_self`, no specific child

**Parent input:**

> "i think i'm too strict with my kids. my husband says i need to lighten up and i see other parents being so much more chill. but if i don't hold the line nothing gets done. am i actually being too strict or is that just what good parenting looks like?"

**Reference response:**

> TODO: Reference response pending — see thread `claude/sturdy-cta-thread`.
> Do not run eval as a quality benchmark until this is filled in.

**What this response does right:**

> TODO

**Likely failure modes:**

> TODO

---

### Q4 — `hard_conversation`, ages 6 and 10

**Parent input:**

> "my husband and i are getting divorced. we have two kids, 6 and 10. we haven't told them yet. how do we tell them and should we tell them together or separately?"

**Reference response:**

> TODO: Reference response pending — see thread `claude/sturdy-cta-thread`.
> Do not run eval as a quality benchmark until this is filled in.

**What this response does right:**

> TODO

**Likely failure modes:**

> TODO

---

### Q5 — `celebrating`, age 5

**Parent input:**

> "my 5 year old's teacher pulled me aside today to tell me he sat with a new kid at lunch who was eating alone and made him laugh. i didn't even know he had it in him. i just want to remember this."

**Reference response:**

> TODO: Reference response pending — see thread `claude/sturdy-cta-thread`.
> Do not run eval as a quality benchmark until this is filled in.

**What this response does right:**

> TODO

**Likely failure modes:**

> TODO

---

## Common Failure Patterns

Failure modes across the reference set group into six recurring patterns. These are the things to look for first when reading an eval output.

**Preamble drift.** Opening with "It's so common," "This is such a great question," "It's understandable to wonder," or any other warm-up before the actual answer. Sturdy opens with the answer.

**Therapy speak.** "Your feelings are valid," "I'm hearing that," "validate her feelings," "hold space for." Banned outright. The voice is a friend, not a clinician.

**Framework name-dropping.** Naming the STOP technique, theory of mind, after-school restraint collapse, executive function, co-regulation. The science can show up as the rightness of what's said. The science cannot show up as a name.

**Hallmark voice (celebrating drift).** "What a beautiful moment!" "These connections are so precious." The exclamation marks alone are usually the tell. Celebrating responses should witness the moment, not greet it like a card.

**Strategy creep into reassurance.** A parent asking "is this normal?" doesn't need a five-step plan. They need to know they aren't alone or failing. Adding strategy turns reassurance into homework.

**Length inflation.** Adding "to summarize" recaps. Padding with filler. Repeating the same insight in different words. Every sentence earns its place — if it doesn't, cut it.

---

## Testing Protocol

When changing `_shared/prompts/question.ts`, run `npm run eval:question` from the repo root. This generates outputs for all five reference inputs, hitting the live Anthropic API with the same model the Edge Function uses (`claude-sonnet-4-20250514`). Output goes to `supabase/functions/_shared/prompts/__tests__/eval-outputs/{ISO_DATE}_{commit_short_sha}.md`.

Read each output beside the reference. Mark each on three axes:

1. **Opens with answer, not preamble?**
2. **Sounds like a long walk?** (real-friend register, no therapist / blog / textbook drift)
3. **Length proportional?** (matches what the question asked for)

A change is safe to ship only if **four of five outputs hold across all three axes**. Three or fewer = roll back.

Outputs are not graded for verbatim match. Reference responses are tuning forks, not answer keys. Two correct outputs to the same question can read very differently and both pass.

The eval is a **manual command, run by a human before merging prompt changes** — it hits the live Anthropic API and costs real money, so it's deliberately not in CI.
