# Sturdy — Architecture Shift Spec

**Date locked:** April 2026
**Status:** Pre-build. Specification only. No code written yet.

---

## Why this document exists

Sturdy started as an SOS tool — parents open it when things are on fire.
This shift turns Sturdy into a **daily thinking partner** for parents,
where SOS is one feature inside a broader companion experience.

This doc captures every decision made across our design conversation so
nothing gets lost, and we can build against a single source of truth.

---

## The big shift — in one sentence

Sturdy becomes a thinking partner for parents who wonder. The SOS becomes
a feature inside each child's personal hub. The Home screen becomes a
calm reflection space where parents can ask anything about any of their
children.

**Before:** Open app → SOS tab → type crisis → get script
**After:** Open app → greeted by name → type a question or select a
child for crisis → context-aware response

---

## The two product modes

### 1. Question mode (lives on Home)
- Parent types anything — a worry, a wonder, a celebration
- Sturdy responds with warm, flowing, human language
- Adaptive length — short for "is this normal?", longer for hard
  conversations (divorce, death, puberty, bullying, failure)
- Auto-saves every Q&A to Recent Thoughts
- Auto-detects which child the question is about
- Voice input supported (v1), voice output via TTS (v2)
- NEVER sounds like an R/C/G script

### 2. SOS mode (lives inside each child's hub)
- Kept from current implementation
- Regulate / Connect / Guide structure
- Crisis detection + intensity picker
- Category-aware (meltdown, refusal, shutdown, aggression, transition)
- Only reachable by tapping a child avatar first — impossible to send
  an SOS without knowing which child

---

## Screen architecture

### Tab bar (new)
Two tabs only:
- 🏠 Home
- ⚙️ Settings

SOS tab is removed. Child tab is removed. Everything SOS lives inside
child hubs now.

### Home = Parent Hub

Top to bottom:

1. **Rotating greeting**
   - "Hi Mary," / "Hello Mary," / "Hey Mary," — randomly picked per open
   - Uses real first name from profile
   - Falls back to "Hi there," if no name set

2. **Child avatar row**
   - Horizontal scroll, large touch targets
   - Each avatar = first-letter initial circle (premium: custom avatars)
   - Tap an avatar → navigates to /child/[id] (child's hub)
   - "+ Add child" card at the end

3. **"What's on your mind?" input**
   - Directly below avatar row
   - Big text input, ready to type, no preamble
   - Mic button inside for voice-to-text input
   - Send button at the bottom

4. **Recent Thoughts strip** (appears when data exists)
   - Last 3-5 Q&A entries across all children
   - Pinned thoughts highlighted
   - "See all →" link

5. **Future engagement zone** (reserved space)
   - Parenting tip of the day
   - Article from library
   - Weekly reflection prompt
   - Not built v1, but design leaves room

### Child hub (/child/[id])

Top to bottom:

1. **Back button** (top-left) → Home (only shown if >1 children)
2. **Child avatar** — large initial circle
3. **Child name + age** — centered, below avatar
4. **"What's happening with [name]?" input** — immediate access, SOS-only
5. **Intensity pills** (optional) — Mild / Building / Hard / Intense
6. **Crisis detection banner** — inline, appears if keywords detected
7. **Get Script button**
8. **Recent activity** — "Last script 2 hours ago" or empty state
9. **Saved scripts for this child** — horizontal scroll, "See all →"
10. **Parent insights placeholder** — "Patterns will appear here as you
    use Sturdy with [name]."
11. **Edit profile link** — at the bottom

Behavior:
- Session timeout (20 min idle → sign out) preserved
- Activates this child in the global context so all child-scoped calls
  use the right profile
- No multi-mode switcher (SOS-only). Other modes absorbed into Question
  mode on Home.

---

## Child auto-detection (the smart wiring)

When parent types a question on Home and taps Send:

1. Run name-match detection against the user's child_profiles
2. **If a name is detected** → auto-tag the thought to that child
3. **If no name is detected AND parent has 2+ children** → show a tiny
   picker above keyboard:

   ```
   Which child?
   🟢 Emma    🟠 Brandon    🟣 Tyler
   Just wondering in general
   ```

4. **If no name is detected AND parent has 1 child** → auto-tag to that
   child (never show the picker)
5. **If "Just wondering" is tapped** → save at Home level, no child tag

Parents never have to manually "select a child" on Home. The system
figures it out. Over time, parents learn to type names naturally.

---

## Question mode response shape

Not cards. Not labels. A flowing, journal-style response in a frosted
card. Reads like a human wrote it. The feel is "a wise friend on a
long walk."

### Adaptive length

| Question type | Response length |
|---|---|
| Simple reassurance ("Is this normal?") | 1 short paragraph, warm validation |
| Specific behavior question | 2-3 paragraphs — answer + why + what helps |
| Big developmental topic | 3-4 paragraphs with clear sections |
| Hard conversation prep (divorce, death, puberty) | Longer, includes sample language |
| Celebrating moment | 1 short paragraph of joy reflected back |

Claude decides on-the-fly based on the question's complexity and
emotional weight. No mode toggle, no parent classification.

### What Claude draws from

Same 12-book knowledge base already powering SOS scripts, but
synthesized into narrative prose, not structured scripts. The books
finally get to earn their keep here — parents asking "why does my
7-year-old suddenly lie about small things?" deserve developmental
wisdom from Philippa Perry, Siegel, Oster, etc., woven into one human
voice.

---

## Recent Thoughts system

### Auto-save
Every Q&A auto-saves to a "Recent Thoughts" pile:
- If child detected → saves under that child's profile
- If no child → saves at Home level

### Pin
Parent can pin a thought → moves to "Parent Insights" (persistent,
curated section)

### Delete
Standard delete with confirm

### Organization
- Home shows Recent Thoughts across all children
- Each child's hub shows Recent Thoughts scoped to that child
- Pinned items surface at the top

---

## Voice

### v1 (build from day one)
- Mic button in input areas (Home + child hub)
- Speech-to-text → populates the input
- Parent can edit text before sending
- Uses Expo speech recognition or web speech API

### v1.5 (toggle exists from day one, functionality later)
- Male / female voice option in Settings
- Stored preference, remembered across sessions

### v2
- Voice output — Sturdy reads responses aloud with chosen voice
- TTS via platform APIs

---

## Backend architecture

### New prompt mode: "question"

Separate from the current SOS/reconnect/understand/conversation modes.

Key differences from SOS:
- No R/C/G structure
- No intensity calibration
- No crisis detection at prompt level (still runs at safety filter
  layer)
- Outputs flowing narrative, not structured JSON with parent_action /
  script / coaching
- Response length varies per complexity
- Cites sources naturally ("research on child lying shows..." without
  name-dropping specific books, unless the parent asks for a source)

### New database table

```
parent_thoughts
├── id                   uuid, primary key
├── user_id              uuid, FK to auth.users
├── child_profile_id     uuid, FK to child_profiles (nullable)
├── prompt_text          text
├── response_text        text
├── created_at           timestamptz
└── pinned_at            timestamptz (nullable)
```

### New endpoint OR mode flag

Either:
- Extend `chat-parenting-assistant` edge function with `mode: 'question'`
- OR create a new `/chat-question` edge function

Decision: extend existing function. Fewer deployments to manage, shared
safety filter.

### Validation

Question responses don't need the R/C/G validator. Need a new simple
validator: response_text is a non-empty string under N characters.

---

## Build order (confirmed)

### Phase 1 — Child hub infrastructure (BUILD FIRST)
Profiles need to be solid before we can test auto-detection accurately.

1. **File 1:** Tab bar — 2 tabs (Home + Settings). Child tab hidden.
2. **File 2:** Child hub (/child/[id]) — avatar + name + SOS input +
   saved scripts + insights placeholder.
3. **File 3:** Home as child selector (multiple children) or single-child
   hub (1 child). Includes greeting.
4. **File 4:** Result screen — back button routes to the correct child
   hub instead of /now.
5. **File 5:** Delete now.tsx.

Test: sign in, navigate between children, generate SOS scripts from each
child's hub, confirm correct context passed.

### Phase 2 — Question mode
6. Backend: new "question" prompt mode + validator
7. Backend: parent_thoughts DB table + RLS policies
8. Backend: child auto-detection logic
9. Mobile: Home redesign with "What's on your mind?" input
10. Mobile: Child picker modal (for ambiguous sends)
11. Mobile: Question result screen (flowing layout)
12. Mobile: Recent Thoughts strip
13. Mobile: Voice input

### Phase 3 — Polish and engagement layer
14. Pinned thoughts → Parent Insights section
15. Voice output (TTS) with male/female preference
16. Rotating greeting variations tuned
17. Future engagement zone content (tips, articles, reflections)

---

## What this unlocks

### Engagement
Parents currently open Sturdy 2-3 times a week — only in crisis.
With Question mode, they open Sturdy every day because wondering is
daily.

### Personalization
Over time, Sturdy learns:
- What this parent wonders about most
- Which child takes up most mental space
- Which topics recur (sleep, screens, homework, siblings)
- What the parent wants to hold onto (pinned)

This data powers future features: pattern recognition, weekly
reflections, contextual book insights.

### Product positioning
Before: "AI parenting scripts for hard moments"
After: "A thinking partner for parents who wonder. Save what helps.
Get emergency scripts when things get hard."

The SOS is the safety net. The ask is the daily use. That's the
engagement unlock.

---

## Decisions we've made (for the record)

1. ✅ Tab bar drops to Home + Settings only
2. ✅ SOS lives inside each child's hub, not as a standalone tab
3. ✅ Home greeting rotates randomly using real name
4. ✅ "What's on your mind?" is the input label, no feature name shown
5. ✅ Child auto-detection with fallback picker (2+ children only)
6. ✅ Single-child users skip all pickers and selectors
7. ✅ Adaptive question response length (Claude decides)
8. ✅ Hybrid save: auto to Recent Thoughts, manual pin to Insights
9. ✅ Voice input v1, voice output v2
10. ✅ Male/female TTS preference, stored from day one
11. ✅ Build child hub + profiles FIRST, then Question mode
12. ✅ Child hub is SOS-only (no multi-mode tabs)
13. ✅ Future engagement content zone reserved on Home
14. ✅ Kill now.tsx entirely after child hub ships

---

## Open questions / TBD

- Avatar generation: first-letter initial with color picker (v1) →
  custom uploaded avatars (premium, v2)
- Parent name capture: where does this get asked? At signup? First
  Home visit? Profile settings?
- Greeting variations list: how many? Who writes them?
- Question result screen: any visual distinction per question type
  (celebrating vs worrying vs curious)? Probably not for v1.
- Search within Recent Thoughts: v1 or later?

---

*End of spec. Next action: build File 1 (tab bar), then File 2 (child
hub), then File 3 (Home), then File 4 (result screen back button), then
delete now.tsx.*
