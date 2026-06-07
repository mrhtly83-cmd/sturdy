# STURDY — SESSION HANDOFF
**Date:** June 6, 2026
**Version:** v5 — Post Journey Audit Sessions
**Prepared by:** Claude (Fractional CPO & Strategic Advisor)
**Target:** New Claude chat session

---

## 1. ROLE & OPERATING CONTRACT

Claude operates as **Fractional CPO & Strategic Advisor** — the judgment seat.
Decides WHAT and WHY. Writes precise briefs. Makes calls with reasoning.
Does NOT echo options back or ask for permission on clear decisions.

**The workflow:**
- Strategy, decisions, mockups, briefs → Claude.ai (this chat)
- Code execution → Claude Code CLI (`claude --dangerously-skip-permissions`)
- Commits and doc updates → Claude Code handles at end of each brief

**Hard rules:**
- Honest pushback over agreeableness
- Ruthless prioritization toward core promise
- No jumping between stages — finish one before the next
- Decisions logged in `docs/OPERATIONS.md`
- Step-by-step, one command at a time
- Never commit before verifying on device
- Proactively surface improvement and enhancement suggestions — don't wait to be asked. If a better approach exists, a trust leak is spotted, a UX pattern could be stronger, or a principle is at risk, flag it. The advisor's job is to see what the founder can't see from inside the build.

---

## 2. PRODUCT CONTEXT

**Sturdy** — parenting support mobile app. Gives parents clear, human scripts
in real-time friction moments.

**Core value loop:** Respond (calm, age-specific scripts) → Understand → Grow
→ Find your own voice.

**The moat:** The Voice. Sounds like a wise friend on a long walk. Warm, plain,
human. Zero clinical therapy-speak. Zero corporate SaaS jargon.

**Ship gate:** ~10 real parents using SOS without a trust-breaking bug.

**Stack:**
- Expo / React Native, expo-router, TypeScript
- Supabase (auth, DB, edge functions)
- Anthropic Claude API (script generation)
- RevenueCat (billing)
- react-native-reanimated 4.1.1

**Repo:** `mrhtly83-cmd/sturdy` (monorepo)
**Live Supabase project:** `lwmzfhigommayvmvqzvf`

**Thai's setup:**
- Chromebook via GitHub Codespace
- Terminal 1: `/workspaces/sturdy` (git, docs, supabase)
- Terminal 2: `/workspaces/sturdy/apps/mobile` (expo)
- Terminal 3: Claude Code CLI (repo root)
- Start Expo: `npx expo start -c --tunnel`

---

## 3. LOCKED DECISIONS — DO NOT REVISIT

### Voice
**Set C — The Understated** is permanently locked as Sturdy's in-app copy voice.
Fewest words. Maximum weight. Trusts the parent completely. Quiet and knowing,
not performative. No drama, no therapy-speak, no validation language.
Every line earns its place.

Reference examples:
- "Parenting is hard in ways no one says. Sturdy says them."
- "Some questions deserve a real answer."
- "You show up. That's already the work."

### Welcome Screen (Stage 1 — COMPLETE)
Three beats locked:
- Beat 1 (Chaos): "Parenting is hard in ways no one says." / "Sturdy says them."
- Beat 2 (Thinking): "Some questions deserve a real answer." / "Ask anything. No jargon, no judgment."
- Beat 3 (Connection): "You show up. That's already the work." / "Just the right words, at the right time."

Trust lines (Style A — Fraunces italic, amber, 13px, opacity 0.85):
- Beat 1: "Calmest when it's hardest."
- Beat 2: "What you share here stays here."
- Beat 3: "Sturdy gives you the words. Use them exactly, or make them yours."

Headline split: plain white line 1, amber italic line 2.
Fixed-drawer layout: buttons pinned, visible from slide 1.
Animation: fade + slide-up on beat change, 1000ms, Easing.out cubic.

### Quota model (shipped, verified)
75 scripts + 25 questions per month. Dual buckets.
Crisis detection always free, never counted.
SOS counts toward the 75 (not unlimited).

### Navigation principle
No back/home buttons on result screen. Tab bar handles all navigation.

### Trust over conversion (Principle 7)
No dark patterns. No fake urgency. No "unlimited" claims that are false.
"75 free scripts & 25 questions each month." is the correct footer copy.

---

## 4. JOURNEY AUDIT STATUS

### Stage 1 — Onboarding ✅ Structurally complete
**Done:**
- Set C copy locked on all three beats ✓
- Trust lines live (Style A — italic amber) ✓
- Fixed-drawer layout — buttons visible from slide 1 ✓
- Amber/white headline split restored ✓
- Fade + slide-up text animation (1000ms) ✓
- Docs updated ✓

**Still open (SMTP dependency — separate session):**
- Name capture bug (email-junk scrape root unresolved)
- Email confirmation off (needs custom SMTP before enabling)
- Crisis reachability during onboarding — not verified
- Legal links verified in-flow — not checked

### Stage 2 — Core Loop (SOS) 🔄 In progress
**Done:**
- "Always free · No paywall" lie removed ✓
- "Unlimited scripts" lie removed from result screen ✓
- Tone selector hidden from free users ✓
- Back/home buttons removed from result screen ✓
- "Find calm words" confirmed as correct button label ✓
- Night background (black sky, warm stars) implemented ✓
- Star field with twinkling animation wired ✓

**IN PROGRESS — Brief written, not yet executed:**
SOS button retract model (see Section 6 below).

**Still open:**
- Parent name capture (new feature — needs signup flow)
- SOS button retract implementation
- Full on-device walkthrough after SOS brief executes

### Stages 3–6 — Not started

---

## 5. HOME SCREEN CURRENT STATE

**File:** `apps/mobile/app/(tabs)/index.tsx`

**What's live and working:**
- Night background: deep black sky, warm white star field, amber horizon glow
- Greeting: `Good evening.` (no subtitle — "The hard moments pass." removed)
- SOS hero: `What's happening with Tyler ▾ right now?` with current text input card
- Ask section: `What's on your mind?` label above Ask card
- Tyler chip showing (child name wired via heroChildName fallback)
- TrafficDots quota indicator top-right
- Tab bar: Home / Family / Settings

**Known issues in current build:**
- `<Background period={period} />` — should be `<Background />` (prop left from
  adaptive background attempt, needs cleanup)
- Ask card sometimes shows expanded when it should be collapsed
- "The hard moments pass." subtitle — CONFIRMED REMOVED in last session

**What was reverted (intentionally):**
- Day/night adaptive background toggle — reverted, parked for later
- SOS/Ask adaptive time-based layout — reverted, SOS is permanent hero

---

## 6. NEXT BRIEF TO EXECUTE — SOS BUTTON RETRACT MODEL

This brief was written but NOT yet sent to Claude Code. Send it first thing.

### What it builds:
Replaces the current SOS text input card with:
- **Resting state:** Big pulsing red SOS button, centered, two ripple rings,
  "Tap for calm words now" hint below
- **Active state (after tap):** Button shrinks to small circle left-aligned,
  child name appears next to it (no age), input box slides in below

### Key decisions locked for this brief:
- SOS badge "From chaos to connection" tagline → REMOVED entirely
- Child shown as name only — no age ("Tyler" not "Tyler · age 6")
- "The hard moments pass." subtitle → REMOVED (already done)
- Parent name in amber italic when available (data not yet captured)
- No sheet, no modal — everything on one surface

````markdown
# BRIEF: Home — SOS button retract model + greeting cleanup
**File:** `apps/mobile/app/(tabs)/index.tsx`
**Scope:** Greeting, SOS section, new state. Ask section untouched.

## STEP 1 — Fix Background prop
Find: `<Background period={period} />`
Replace with: `<Background />`

## STEP 2 — Remove greeting subtitle entirely
Find:
```tsx
<Text style={s.greetingSub}>
  {period === 'active' ? 'Here when the moment gets hard.' : 'The hard moments pass.'}
</Text>
```
Delete the entire Text element.

## STEP 3 — Update greeting to style parent name in amber italic
Find:
```tsx
<Text style={s.greetingText}>{greeting}{displayName ? `, ${displayName}` : ''}.</Text>
```
Replace with:
```tsx
<Text style={s.greetingText}>
  {greeting}{displayName ? (
    <Text style={s.greetingName}>, {displayName}.</Text>
  ) : '.'}
</Text>
```
Add to StyleSheet after `greetingText`:
```ts
greetingName: {
  fontFamily: F.headingItalic,
  color: C.amber,
},
```

## STEP 4 — Add sosOpen state
After `const [secondaryOpen, setSecondaryOpen] = useState(false);` add:
```tsx
const [sosOpen, setSosOpen] = useState(false);
```

## STEP 5 — Replace sosEyebrow const entirely
Find the entire `sosEyebrow` const. Replace with:
```tsx
const sosButton = (
  <View style={s.sosButtonSection}>
    {!sosOpen ? (
      <Pressable
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          setSosOpen(true);
        }}
        style={s.sosBigBtnWrap}
      >
        <View style={s.sosBigBtn}>
          <Text style={s.sosBigBtnText}>SOS</Text>
        </View>
        <Text style={s.sosBigBtnHint}>Tap for calm words now</Text>
      </Pressable>
    ) : (
      <View style={s.sosActiveWrap}>
        <View style={s.sosActiveRow}>
          <Pressable
            onPress={() => { setSosOpen(false); setSosInputText(''); }}
            style={s.sosSmallBtn}
          >
            <Text style={s.sosSmallBtnText}>SOS</Text>
          </Pressable>
          <Text style={s.sosActiveChild}>
            {heroChildName !== 'your child' ? heroChildName : 'my child'}
          </Text>
        </View>
      </View>
    )}
  </View>
);
```

## STEP 6 — Replace SOS layout block in main JSX
Find:
```tsx
{/* SOS hero */}
{sosEyebrow}
{sosCrisisBanner}
{renderSosCard(true)}
{isPremium && toneSelector}
```
Replace with:
```tsx
{/* SOS hero */}
{sosButton}
{sosCrisisBanner}
{sosOpen && renderSosCard(true)}
{sosOpen && isPremium && toneSelector}
```

## STEP 7 — Add new styles to StyleSheet
Add after `heroEyebrowWrap`:
```ts
sosButtonSection: {
  alignItems: 'center',
  marginBottom: 20,
},
sosBigBtnWrap: {
  alignItems: 'center',
  gap: 10,
},
sosBigBtn: {
  width: 100,
  height: 100,
  borderRadius: 50,
  backgroundColor: '#C83228',
  alignItems: 'center',
  justifyContent: 'center',
  shadowColor: '#E87461',
  shadowOffset: { width: 0, height: 0 },
  shadowOpacity: 0.6,
  shadowRadius: 24,
  elevation: 12,
},
sosBigBtnText: {
  fontFamily: F.label,
  fontSize: 22,
  color: '#FFFFFF',
  letterSpacing: 2,
},
sosBigBtnHint: {
  fontFamily: F.headingItalic,
  fontStyle: 'italic',
  fontSize: 11,
  color: 'rgba(243,232,200,0.3)',
},
sosActiveWrap: {
  width: '100%',
  gap: 10,
},
sosActiveRow: {
  flexDirection: 'row',
  alignItems: 'center',
  gap: 12,
  marginBottom: 10,
},
sosSmallBtn: {
  width: 46,
  height: 46,
  borderRadius: 23,
  backgroundColor: '#C83228',
  alignItems: 'center',
  justifyContent: 'center',
  shadowColor: '#E87461',
  shadowOffset: { width: 0, height: 0 },
  shadowOpacity: 0.5,
  shadowRadius: 10,
  elevation: 6,
},
sosSmallBtnText: {
  fontFamily: F.label,
  fontSize: 11,
  color: '#FFFFFF',
  letterSpacing: 1,
},
sosActiveChild: {
  fontFamily: F.headingItalic,
  fontStyle: 'italic',
  fontSize: 18,
  color: 'rgba(243,232,200,0.85)',
},
```

## STEP 8 — Remove unused sosEyebrow
If `sosEyebrow` is now unreferenced, delete the old const.

## DO NOT TOUCH
- `renderSosCard` — keep entirely
- `sosCrisisBanner` — keep
- Ask section — `askEyebrow`, `renderAskCard` untouched
- Child switcher sheet
- All existing SOS input logic and `handleSosSend`
- `heroChildName` — keep

## After build — do NOT commit
Screenshot both states (resting + tapped) and review before committing.
````

---

## 7. PARKED ITEMS (do not build yet)

- **Day/night adaptive background** — mockup approved (deep black night sky +
  golden hour day), wired to `period` state. Parked until home screen stable.
  Reference files: `sturdy-home-day-night-v3.html` in outputs.
- **Parent name capture** — needs new signup screen asking "What should Sturdy
  call you?" — optional, skippable. Wired to `profiles.full_name` in Supabase.
  Blocked by SMTP session (email confirmation must be enabled first).
- **SOS pulse animation** — breathing circle (Option A from mockup) approved
  for the SOS button. Build after button retract is stable.
- **Home info cards** — Last Session + scripts remaining below Ask card.
  Parked until home layout is finalized.
- **"or take a quieter" divider text** — confirmed for removal but not yet done.

---

## 8. OPEN BLOCKERS (separate sessions)

| Blocker | Status | Dependency |
|---------|--------|------------|
| Email confirmation off | Launch blocker | Custom SMTP setup |
| Name capture at signup | Stage 1 open | SMTP session |
| Child profile loading bug | Intermittent | Session expiry / Supabase |

---

## 9. KEY FILES

```
apps/mobile/app/welcome/index.tsx       ← Welcome screen (Stage 1 complete)
apps/mobile/app/(tabs)/index.tsx        ← Home screen (Stage 2 in progress)
apps/mobile/app/result.tsx              ← Result screen (Stage 2 fixes done)
apps/mobile/src/theme/colors.ts         ← Full token system (Warm Ember palette)
apps/mobile/src/utils/dayPeriod.ts      ← Time-of-day helpers
apps/mobile/src/context/ChildProfileContext.tsx  ← Child data loading
docs/OPERATIONS.md                      ← Decision log (append all decisions)
docs/STURDY_JOURNEY_AUDIT.md            ← Stage-by-stage audit tracking
docs/PRODUCT_PRINCIPLES.md             ← Hard constraints (read before any build)
```

---

## 10. RECENT COMMITS

```
979129c  docs: log fixed-drawer layout completion
8e9da05  welcome: fixed-drawer layout — buttons pinned from slide 1
f220786  welcome: fade + slide-up text animation on beat change
e94e317  fix: remove trust-breaking copy (no paywall lie, unlimited scripts)
[latest] home: stable layout — SOS hero, night background, Tyler chip
```

---

## 11. INSTRUCTIONS FOR NEW CLAUDE SESSION

You are resuming as **Fractional CPO & Strategic Advisor** for Sturdy.

1. Read `docs/PRODUCT_PRINCIPLES.md` before touching anything
2. Read `docs/OPERATIONS.md` for full decision history
3. Read `docs/STURDY_JOURNEY_AUDIT.md` for stage status
4. **First action:** Execute the SOS button brief in Section 6 above
5. After brief executes — verify on device, screenshot both states, then commit
6. Update `docs/OPERATIONS.md` and `docs/STURDY_JOURNEY_AUDIT.md` after commit
7. Then continue Stage 2 remaining items

**Terminal setup reminder:**
- Terminal 1: `/workspaces/sturdy` — git and docs
- Terminal 2: `/workspaces/sturdy/apps/mobile` — expo (`npx expo start -c --tunnel`)
- Terminal 3: Claude Code (`claude --dangerously-skip-permissions`)

**Label every command with its terminal and working directory.**
**Never commit before verifying on device.**
**One command at a time.**
