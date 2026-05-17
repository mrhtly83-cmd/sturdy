Sturdy Master Blueprint
Version: v5 (Architecture Pivot & Consolidation)
Date Locked: May 2026
Status: Live Source of Truth

1. The Vision & The Shift
Sturdy is the go-to parenting companion for every parent at every level.

The Shift: Sturdy is transitioning from a purely emergency SOS tool into a daily thinking partner. The SOS remains the safety net (housed inside each child's hub), but the primary daily use is asking questions and wondering aloud.

The core question: "What should I say right now?"
The deeper promise: A better parent, one moment at a time.
The philosophy: Sturdy gives you the words. Use them exactly, or make them yours.

2. Revenue, Onboarding & Data (The Core Rules)
Authentication & Onboarding
Mandatory Auth: Guest mode does not exist. All users must authenticate to use the app.

3-Beat Welcome Flow: A clean, 3-page onboarding sequence. The final CTA card contains only two options: "Get started" (Sign Up) and "Sign in". There is no "Try without account" fallback.

State Hydration: ChildProfileContext relies strictly on an authenticated Supabase session.

The Metered Freemium Model
Free Tier: 50 free script generations per calendar month.

Sturdy+ ($9.99/month): Unlimited scripts, Voice playback on all modes, full weekly insights, and tone selector (Soft/Gentle/Direct).

The Quota System: Tracked strictly via a Supabase RPC (check_monthly_quota) evaluating the usage_events table. Free users hit a hard paywall (PaywallSheet.tsx) at script 51.

The Crisis Exemption: We never paywall safety. If the safety filter returns response_type: "crisis", it bypasses the quota limit and routes to the free /crisis support screen.

"Zero Trace" Data Safety
Strict Deletion: Users have a "Delete Account & All Data" button in settings.

Database Level: All user-scoped tables, including safety_events, strictly use ON DELETE CASCADE so no anonymized traces remain. The deletion triggers supabase.auth.admin.deleteUser(uid) via a Service Role Edge Function.

3. The Two Product Modes
1. Question Mode (Lives on Home)
Purpose: For wondering, worrying, and celebrating.

Input: A single "What's on your mind?" text area on the Home tab.

Output: A flowing, journal-style narrative (not structured cards). Length adapts to the question's complexity.

Child Auto-detection: Sturdy runs name-match detection. If it finds a child's name, it auto-tags the thought. If ambiguous with 2+ children, it prompts a tiny inline picker.

Storage: Saves to parent_thoughts. Displayed in a "Recent Thoughts" strip.

2. Directed Modes (Lives in Child Hub)
Purpose: For active parenting moments and meltdowns. Reached by tapping a child's avatar.

Internal Modes:

SOS: Help us calm down (Regulate / Connect / Guide)

Understand: Help me understand why (Why / What they need / What helps)

Reconnect: Repair what happened (Open Door / Hold Steady / Leave Space)

Conversation: Set up a talk (Set up / Curiosity / State clearly)

Output: Structured JSON translated into collapsible, interactive UI cards.

4. Navigation & Screen Architecture
Tab Bar (Strictly 2 Tabs)
🏠 Home (/(tabs)/index.tsx) — The Parent Hub / Distribution Center.

⚙️ Settings (/(tabs)/settings.tsx) — Account, subscription, and data deletion.

Home = The Parent Hub
State of Mind Header: Rotating greeting using the parent's real first name.

Question Mode Input: Big text area ready to type with a mic button.

The Gateways (Child Roster): Horizontal or vertical stack of glass cards. Each represents a child profile. Tapping routes directly to /child/[id].

Action Grid: Quick routing to specific modes (SOS, Understand, Reconnect).

Quota Counter: A subtle "X / 50 scripts remaining this month" for free users.

Recent Thoughts: Strip showing the last 3-5 Q&A entries.

The Child Hub (/child/[id].tsx)
Personalized Dashboard: Header shows the specific child's name and age.

SOS Input: Direct access to script generation contextualized to this child.

History: Saved scripts and recent activity for this child specifically.

Profile Link: Entry to /child-profile/[id].tsx to see their locked weekly insights, common triggers, and emerging patterns.

5. AI & Voice System
Model: Anthropic Claude (claude-sonnet-4-20250514) via Supabase Edge Functions.

Safety First: The safetyFilter.ts runs instantly on every prompt.

Neurotype Detection: Sturdy detects neurotype silently from message context to adapt the AI's tone and strategies. It is never displayed as a label to the user.

Voice Capabilities:

Input (v1): Speech-to-text populates the input fields.

Output (v2): expo-speech device TTS reads responses aloud. Unlocked for SOS for all users; Sturdy+ gated for other modes.

6. Design System: Deep Warm
Background: #1E1D25 (warm dark charcoal)

Gradients: Transparent radial meshes using Amber (#D4944A), Sage (#8DB89A), and Slate (#82AAC4).

Glass Cards: Transparent backgrounds, 0.03 accent tint when expanded, 0.14 opacity borders, 30px backdrop blur, 16px/20px border radii.

Typography: Fraunces italic (serif) for situational summaries and philosophy; DM Sans for body and UI.

Animations: Subtle, organic. Avatars 'breathe' (4s scale cycle). Buttons pulse with soft glows.

7. Database Architecture
Core Tables
profiles (Auth parent accounts)

child_profiles (Child context: name, age, inferred neurotype array)

parent_thoughts (NEW: Question mode Q&A, auto-tagged to children)

interaction_logs (Logs R/C/G mode results, tone selected, and user follow-up)

usage_events (Tracking for the 50-script quota)

safety_events (Logged triggers — MUST be ON DELETE CASCADE)

child_insights (Aggregated patterns, week_of dates, Sturdy+ content)

Key RPCs
check_monthly_quota: Returns count of usage_events for auth.uid() in the current month.

The Standard
If a stressed parent opens Sturdy in a hard moment, the product should feel:
Fast. Calm. Clear. Human. Useful within seconds.

If a returning parent opens Sturdy on a calm evening, the product should feel:
Warm. Knowing. Personal. Worth keeping.