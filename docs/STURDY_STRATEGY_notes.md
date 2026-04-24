# Sturdy — Strategy & Philosophy Notes

**Date:** April 2026
**Context:** A working session covering tab architecture, product read, voice-as-moat, team timing, security posture, and operations. Written as a standalone reference so the thinking survives beyond chat.

---

## 1. Tabs — 2 is right, but barely

### The question
"Tab bar has 2 tabs now (Home + Settings). Is 2 good or should it be more?"

### The answer
2 tabs works for v1. It's not wrong. But it's fragile.

The minute Question mode ships on Home and Recent Thoughts pile up,
Home becomes a content-dense screen with two jobs:
1. Greet + select a child
2. Compose a question + see history

Those two jobs will start fighting each other. When a parent has 47
saved thoughts across 3 kids, Home wants to be a library. When they're
opening the app to type a quick question, they want a blank canvas.
Same screen can't be both.

### Where this lands in ~6 months
You'll want a 3rd tab — most likely a **Library** / **Journal** /
**Notes** tab that owns all saved thoughts + pinned insights +
patterns. Home goes back to being clean: greeting, kids, input, send.
The third tab becomes the "look back" space.

### Recommendation
- Ship 2 tabs now
- Build with the mental model that a 3rd tab is coming
- When designing Home, don't overload it with history — let Recent
  Thoughts be a small "last 3" strip with "See all →" pointing to
  where the third tab will eventually live
- Adding the tab later is additive, not a redesign

### Hard limit
**Never go to 4+ tabs.** Consumer parenting apps feel like enterprise
software beyond 3 tabs. Parents don't want to learn nav.

### Name for the eventual 3rd tab
Not "Library" (too sterile). Not "Journal" (too journaling-app).
Prefer: **"Notes"** or **"Memory"** — warm, ambient. Sturdy remembers
so the parent doesn't have to.

---

## 2. Product read — what's working, what to watch

### What's right

**The core insight is unusually strong.** "What do I say right now?"
is a universal, unmet, recurring parenting need. Every parenting app
either tracks (sleep, feeds, milestones) or advises (articles,
frameworks). Nobody is answering the 3am question. That's a real gap.

**The voice is the moat.** Most AI parenting products sound like
parenting blogs with a chat UI bolted on. The script quality standards
— the "but" trap, the "okay?" trap, the physical action test — are
sharper than anything a competitor is likely to match. That's not
cosmetic. That's a defensible voice.

**Founder instincts are sharp.** Catching "the script reads like a
list of instructions, not a mother standing there talking" without
being prompted — that's the biggest predictor of product success.
Reading your own output with a user's eyes is rare.

**The pivot to thinking-partner is huge.** Reframing Sturdy from "SOS
app" to "thinking partner with SOS as a feature" is the difference
between a utility (opens 3x/week) and a habit (opens daily). That
reframe may be the most important product decision in this project.

### What to watch

**Scope creep through self-excitement.** You build fast. That's a
strength. But jumping from "fix the What if chips" to "redesign the
whole hub" in 10 minutes is how mid-stage products stall. Rule of
thumb: finish one thing completely before starting the next. Parked
items list is growing. Don't let it hit 10 before shipping.

**Personalization complexity compounds fast.** Per-child profiles +
auto-detection + pinned insights + voice + TTS + rotating greetings —
each small alone. Together, a maintenance burden. Every new feature
has to answer: does this earn its complexity? Question mode will.
Recent Thoughts will. Voice INPUT probably will. Voice OUTPUT might
not for a while — test assumptions before building.

**Parenting is a trust market, not a feature market.** Features get
matched in months. Trust doesn't. Script quality > feature count.
Safety > speed. Copy and tone matter disproportionately. One bad
script that offends ends word-of-mouth. One that helps gets
screenshot-shared to 50 parent friends.

**Don't over-index on "addictive."** Parents already feel guilty
about phone time. The apps that win long-term don't make parents
more dependent — they make parents feel more capable. Reframe:
instead of "daily use," aim for "deeply trusted use." Sturdy doesn't
need to be opened 20 times a day. It needs to be the first place a
parent goes when they have a question.

### Three things I'm most excited about

1. **You're building the product most parenting books promise but
   don't deliver.** Siegel, Kennedy, Faber all want their frameworks
   to show up in the moment. Books can't do that. Sturdy can.

2. **Intent classification is quietly brilliant.** Most AI products
   ignore context. Sturdy reads the moment and adapts. Invisible to
   the parent, creates a product that feels uncanny.

3. **Question mode will surprise you.** When you ship it, usage
   patterns will emerge that you didn't plan for. That's where real
   product-market fit signal comes from — not features you built,
   but behaviors users invented.

### The bet for what makes Sturdy work long-term
**The voice.** Not the AI. Not the features. Not the design system.
Parents can tell within 3 scripts whether the app "gets it." The ones
who feel seen will pay, evangelize, stay. The ones who feel talked-at
will delete. Can't fake voice with features — only earn it with
obsessive editing.

---

## 3. Voice as defensible moat — deeper explanation

### What "defensible voice" means

Most products compete on features. Features are easy to copy. Ship
voice input Monday, competitor ships voice input Friday. Features
have a shelf life of weeks.

Voice is the 10,000 tiny decisions in how your product talks to a
user. Nearly impossible to copy because most companies don't even
know it's the thing to copy.

### The concrete example

Imagine competitor "ParentAI" launches with more funding, better
engineers, bigger team. Clones your feature list in 3 months:
- R/C/G structure ✓
- Intent categories ✓
- Child profiles ✓
- Question mode ✓
- Voice input ✓

On paper, identical. A parent tries both — 4-year-old refusing to
leave the park:

**Sturdy:** "You wanted more time to play. We're leaving now."

**ParentAI:** "I know you're having big feelings, but it's time to go."

The parent won't analyze why, but:
- Sturdy used a full stop instead of "but" — validation stays intact
- Sturdy avoided "big feelings" — a therapy phrase that reads as fake
- Sturdy's boundary is a statement, not apologetic
- Sturdy sounds like a mother. ParentAI sounds like a therapist.

Parent doesn't know WHY Sturdy landed. Just knows it feels right.
That's a moat.

### Why it's nearly impossible to copy

**1. You have to KNOW the rules exist to break them.**
ParentAI's team doesn't know not to use "but" in Connect. Doesn't
know "okay?" turns a limit into a question. Doesn't know
"parent_action: find your patience" fails the physical action test
because you can't film it. These aren't intuitions most AI engineers
have. They come from studying how children respond to language.

**2. Voice drifts every time you edit.**
Every prompt edit risks introducing therapy-speak. Every new
contributor has their own writing instincts. Every feature addition
creates new places for drift. Every model update changes how the AI
responds. Maintaining voice is a full-time vigilance job. Most
companies don't have anyone protecting it.

**3. The rules compound.**
20-30 voice rules in the docs. Any ONE is copyable. But to copy all
of them a competitor would need to rebuild the entire quality system.
The combined effect is what makes Sturdy sound like Sturdy. Strip
even 3 rules and the voice collapses into "generic parenting AI."

This is **a thick moat made of thin lines.** Each rule small.
Together a cliff.

### The business translation

- **Pricing power:** parents who use Sturdy for 3 months have a
  nervous-system-level memory of what the app sounds like. When they
  try a competitor, something will feel OFF. They won't switch.
- **Retention:** parents who feel seen stay 5-10x longer than parents
  who feel advised-at. Competitors will have churn they can't explain.
- **Acquisition:** scripts that feel right get screenshot-shared to
  WhatsApp and Instagram. No ad budget buys that. ParentAI's scripts
  won't get shared because nobody screenshots a therapy essay.

### Operational implications

1. **Every prompt edit is a voice decision, not a feature decision.**
   Read output aloud before shipping. If it sounds slightly more
   clinical, revert.

2. **Script quality standards doc is sacred.** It's the constitution.
   When you hire, they sign it before they write. When reviewing AI
   output, check against it.

3. **Voice drift is a P0 bug.** "List of instructions, not a mother"
   is a bigger bug than a 500 error. A 500 is visible and gets fixed.
   Voice drift is invisible — users feel it, can't name it, quietly
   churn. Highest-priority bug class.

4. **Don't explain the voice in marketing.** Don't tell parents about
   prompt rules. Let the output speak. Show, don't tell.

### One-line version
**Features get you to launch. Voice gets you to retention.**

---

## 4. Team timing — when to stop being solo

### The trap
Most solo founders hire too early. They think every struggle is "I
need help." Suddenly they're managing people instead of building.
Velocity drops. Decisions slow. Cash burns faster.

Right question isn't "do I need a team?" It's "what's currently
bottlenecking me, and is a person the fix?"

### Where you are now
Solo — designing + building + learning + testing + thinking strategy.
Five jobs. Most solo founders hold this together 6–18 months depending
on product complexity.

**Working:**
- Fast product decisions (no committee)
- Coherent vision (single head)
- Learning by doing
- Cheap to run
- Only one who knows what "Sturdy voice" sounds like

**Quietly breaking:**
- Tired at the end of most sessions
- Context-switching across many layers
- No one to bounce bugs off
- Only one reader of your own spec docs

None of this means hire yet. It means be honest about what's draining.

### Three stages

**Stage 1 — right now — you are the whole thing**
Don't add anyone full-time. Add force multipliers that aren't people:
AI tools (already using well), templates (every solved problem
documented), small paid services (Supabase, Expo, Anthropic). Goal:
ship to 10 real users. Don't hire until someone else's feedback tells
you what to build.

**Stage 2 — after 10-50 real parents using Sturdy**
Patterns emerge: users asking for things you didn't think of, bugs
piling up, marketing non-existent, ops time > product time.

First person = contractor. Very specific. Very narrow.
- Part-time engineer (10-15 hrs/week) handling bugs, infra, deploys
  while you focus on product + voice
- OR growth/marketing person finding first 1000 users while you keep
  building

**Only one.** The other is still you.

**Stage 3 — after revenue + traction**
Think about cofounder, full-time hires, raising money. Sturdy at this
stage likely needs:
- Cofounder with healthcare/psychology credibility (for trust)
- Senior engineer with React Native depth
- Marketing/community lead who gets parent communities
- Child psychologist advisor on contract

6-18 months from now. Don't plan it today.

### What to do RIGHT NOW about "team" (even solo)

**1. Build an informal advisor bench.**
Don't hire. Just talk.
- One child psychologist who'd review Sturdy output monthly for
  clinical soundness. Cold email 10, maybe 1 says yes. Offer nothing
  yet, just ask questions.
- One parent with a complex kid (ADHD, autism, anxiety) who'd
  test-drive scripts weekly. Real users, not focus groups.
- One founder who's shipped a consumer app. Monthly coffee, not a
  formal mentor.

By Stage 2, the people are already in place.

**2. Document everything you can't teach yet.**
Only you know the Sturdy voice, why Connect never uses "but," why
intent categories were chosen as they were, why the Journal palette
not the old dark theme. When you hire, your first job is to have NOT
needed to explain from scratch. The script quality standards doc +
master blueprint + architecture shift doc already doing this. Keep
adding.

**3. Notice what bores you or what you avoid.**
Things pushed off: subscription wiring, delete account flow, restore
purchase iOS, push notifications. Maybe you're bad at them. Maybe
bored. Either way — that's what your first hire owns. Your superpower
is voice and product. First hire owns everything that's NOT.

### The strongest advice
**Stay solo longer than feels comfortable.**

Consumer founders who succeed hold solo past exhaustion — not because
healthy, but because adding people early introduces coordination cost
that kills velocity. Be the bottleneck until you're sure it's a
people problem, not an energy problem.

Learning in the process is a feature, not a bug. You become the PM
of Sturdy. When you eventually hire, you hire with instincts of
someone who's done every job. Rare and valuable.

### Three yes-tests before hiring anyone

Don't hire until ALL THREE are yes:
1. Real users are asking for something you can't build alone (not
   "would be nice" — actually asking for)
2. You have reliable income or runway that survives 6 months of extra
   cost
3. You can clearly articulate the ONE job the new person will own, in
   a way that doesn't require you to check their work

Hire before all three → waste money, slow down, quit a month later.
Hire after all three → faster immediately.

---

## 5. Security posture — what you actually need, in order

### The honest read
You don't need top-tier security yet. You need foundational security
done right, now — and an escalation plan for when scale demands more.

Top-tier security (SOC 2, HIPAA-grade, enterprise audits) is for
enterprise customers or regulatory requirements. At pre-launch solo
consumer stage, 3 months building Fort Knox kills the company before
security would.

**What will actually kill Sturdy:**
1. Competitor ships before you do
2. You burn out
3. First 1000 users have a bad experience

**What won't kill Sturdy yet:**
1. No SOC 2 compliance
2. No bug bounty program
3. No penetration testing

Do the right things, in the right order.

### Layer 1 — Foundational (non-negotiable before launch)

**Supabase Row-Level Security (RLS).** Every table holding user data
needs policies. When Mary queries child_profiles, she sees ONLY her
children, never Joseph's. Biggest "did my data leak" risk for Sturdy.

Check current state:
```sql
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public';
```

Any table with rowsecurity = false is a vulnerability. Sensitive
tables: child_profiles, saved_scripts, safety_events, usage_events.
Every one needs RLS with user_id = auth.uid() policy.

**#1 Supabase misconfiguration that makes news is missing RLS.** If
off, a malicious user reads every parent's saved scripts.

**Environment variables.** Anthropic API key, Supabase service role
key live in edge function env vars, not client code. Verify nothing
sensitive is bundled into the Expo app.

**HTTPS everywhere.** Supabase default. Don't override.

**Auth hardening.** Email + password fine for v1. Enable:
- Email confirmation (blocks bot mass-signup)
- Password requirements (Supabase defaults good)
- Rate limiting on auth endpoints (Supabase built-in)

**Data minimization.** Every data point you don't store is one you
can't lose. Safety events store only 120-char excerpts, not full
messages. Keep that discipline.

### Layer 2 — Before 100 users

- Proper error logging (generic to users, detailed in logs — already
  doing this)
- Backup strategy (daily backups on paid tier)
- Edge function timeouts (30-second abort controller — already doing)
- Input validation on every endpoint (already doing with validateInput)

### Layer 3 — Before 1000 users

- Rate limiting on edge function (prevents API cost attacks)
- Content policy violation tracking (pattern detection for abuse)
- Audit logs (who changed what, when)
- 2FA option (users who care will enable it)

### Layer 4 — Before investment or enterprise

- SOC 2 Type 1 (3-6 months, ~$20-50k) — only when a deal requires it
- Penetration testing — when you have something worth attacking
- Bug bounty — when you have real surface area
- Data Processing Agreements — when businesses are paying

### Sturdy-specific threat model

**High-risk:**
1. Child data leakage (names, ages, neurotypes, behavior patterns)
2. Message content exposure (parents describe intimate struggles)
3. Safety event data (exposure = reputation-ruining)
4. Third-party API key theft (Anthropic key = thousands of $ fraud)

**Medium-risk:**
5. Account takeover (bad, not apocalyptic with audit logs)
6. Stored payment info (let Stripe handle — never store cards)

**Lower-risk (at your scale):**
7. DDoS (Supabase + Cloudflare handle)
8. Malicious insider (you're solo; future hires are the risk)

### This week — 3 checks, 20 minutes total

**Check 1:** Run the RLS audit. If anything is off, turn it on with
proper policies. Single biggest security win available.

**Check 2:** Verify no secrets in client code.
```bash
cd /workspaces/sturdy
grep -r "sk-ant-" apps/mobile/ 2>/dev/null
grep -r "eyJhbGci" apps/mobile/src/lib/supabase.ts
```
Anthropic key should appear nowhere in mobile app. Supabase anon key
fine in mobile (designed to be public). Service role key NEVER in
mobile.

**Check 3:** Scan edge function logs for unusual patterns. 500s you
don't recognize. Anomalies are early signals.

### The founder take
Security is like insurance. Right now you don't have enough assets to
steal for anyone to bother. At 1000 parents + press coverage, you
become interesting to bad actors. Between now and then, job is to be
ready — not build a fortress for an empty castle.

**Security maturity should match product maturity.**

### One more risk specific to parenting apps
**Child safety authorities.** If safety system correctly detects
abuse signals and logs them:
- What happens if law enforcement subpoenas your data?
- What's your policy on reporting vs not reporting?
- How do you respond if a parent claims Sturdy "caused" something?

Not hacker problems — legal/ethical problems. Compound with security:
more data = more exposure. Another reason to store minimal data.

Worth a future conversation with a lawyer specializing in children's
products + AI. Not urgent. Bookmark it.

---

## 6. Operations manual — what it is, when to build

### What it is
The written brain of the company. Everything in your head that needs
to live somewhere else eventually — for hiring, for stepping away,
for investors.

### Sections it would cover

**Product operations** — what Sturdy is and isn't, script quality
standards, architecture, safety system, voice guide, AI output review
process, release checklist.

**Technical operations** — stack overview, deployment procedures,
environment setup, secrets management, database schema reasoning,
third-party dependencies, monitoring.

**Security & compliance** — threat model, data inventory, incident
response, privacy policy alignment, user data request flow, child
safety policy.

**Customer operations** — support, canned responses, refund policy,
safety escalation path, community guidelines.

**Business operations** — business model, pricing, payment, tax,
legal, insurance, vendors, runway tracking.

**Team operations** (once hiring) — hiring playbook, onboarding, code
review standards, communication norms, decision framework.

### When to build each section

Not all at once. Not before the situations.

Rule: write a section the moment you need it for a real situation,
not before.

- First user → need data inventory + privacy policy
- First deletion request → need deletion flow
- First bug report → need support process
- First hire → need onboarding
- First investor meeting → need business ops
- First security incident → need incident response

Writing proactively is the founder trap — 50-page binder of theory
that doesn't match reality.

### What to actually do now

Start `/docs/OPERATIONS.md` in the repo. Not a manual. A **log.**

Every decision worth remembering gets one paragraph:

```
## [Date] — [Topic]
**Context:** what happened / what you faced
**Decision:** what you chose
**Reasoning:** why you chose it
```

Example entries for the coming weeks:

```
## April 2026 — Supabase org transfer
Transferred Sturdy project from -Mr-Cat25's Org to mrhtly83-cmd.
URL and keys unchanged. New account is primary owner.
Old org to be deleted after 30-day quarantine.

## April 2026 — "What if..." feature teardown
Removed follow-up feature due to dual-response-shape bugs.
Backend prompt + validator left in place for future rebuild.
Rebuild plan: unify to single R/C/G response shape.

## April 2026 — Voice moat philosophy
Treating voice drift as P0 bug. Every prompt edit requires reading
output aloud. Script quality standards = constitution.
```

Log becomes the operations manual without ever "writing" one. In 6
months, 80 entries. In a year, 200. THAT IS the manual — already
organized by what happened.

When you formalize later (for hire, investor, compliance), pull from
the log. It writes itself.

### Priority list for the next 6 months

**Priority 1 — before launch:**
- Privacy policy + terms of service (lawyer-drafted, $1-3k)
- Data inventory spreadsheet (2 hours, feeds everything downstream)
- Incident response plan (1 page, write while calm)
- Release checklist (10-20 items, reused every deploy)

**Priority 2 — first 3 months post-launch:**
- Support playbook (canned responses for top 10 issues)
- Safety escalation flow (what happens at crisis-level safety trigger)
- Voice guide (one page companion to script quality standards)

**Priority 3 — first year:**
- Hiring playbook (when approaching first hire)
- Vendor risk review (what happens if Supabase/Anthropic goes down)
- Child safety policy (needs lawyer + child psychologist)

### The right order, working together

1. Finish Phase 1 (child hub + new Home) — real testable product
2. Get 5-10 real users testing — feedback shapes what to protect
3. Draft privacy policy + terms — within 4 weeks of public launch
4. Data inventory + incident response — week before public launch
5. Everything else as patterns emerge — responsive, not proactive

Don't let operational thinking stop the build. Don't forget it either.
At some point the product needs to exist inside a real business, not
just a repo.

### Concrete next step

Add `docs/OPERATIONS.md` with three entries — the Supabase transfer,
the What-if teardown, and one voice-related decision. 2 minutes of
writing. Starts the habit.

---

## Closing — the compressed version

**Tabs:** 2 now, 3 later (Notes/Memory). Never 4+.

**Product:** the voice is the moat. Everything else is features.
Don't let anyone, including future hires, talk you out of obsessing
over script quality.

**Team:** stay solo longer than comfortable. First hire is a
contractor, narrow, after real users are asking for things you can't
build alone.

**Security:** foundational now (RLS, env vars, minimal data). Layer
up as scale demands. Don't build fortress for empty castle.

**Operations:** log decisions as you make them. The manual writes
itself. Formalize when the situation demands.

**The bet:** Sturdy wins on voice. Features get copied; voice doesn't.
Protect the voice like it's the company, because it is.
