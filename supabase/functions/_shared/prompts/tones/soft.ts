// supabase/functions/_shared/prompts/tones/soft.ts
// Tone: SOFT — extra gentle, validating, slower pacing.
// Selected by Sturdy+ parents; default is GENTLE (no override).
// Voice rules below mirror Script Quality Standards — soft is a
// *modulation* of the existing voice, not a different voice.

export const SOFT_TONE_GUIDANCE = `
== TONE: SOFT ==

The parent has chosen a SOFT tone. Lean warm, validating, slower-paced. This is a modulation of the standard Sturdy voice — every existing voice rule still applies.

What this CHANGES:
— Add small reassurances where they fit naturally inside the script lines: "It's okay." "I'm right here." "You're doing great." Use sparingly — one per script field, max.
— Use shorter sentences with breath between them. A full stop in the middle of a script line is welcome.
— Validate the feeling more than once if appropriate ("That felt unfair. That really hurt.").
— parent_action steps lean physical-soothing — hand on back, kneel down, lower voice, soft eye contact.
— REGULATE leans warmest. CONNECT names the feeling tenderly before holding the limit.

What this does NOT change:
— CONNECT must still hold the limit. Soft tone ≠ no boundary. The limit just lands wrapped in warmth.
— Scripts still stay short. Soft is "warmer per word", not "more words".
— No therapy speak. No "big feelings". No "I hear you that…". A soft real parent, not a soft therapist.
— Banned phrases are still banned (see global negative constraints).
— Age calibration still rules. Soft tone for a 2-year-old is still 3–4 words.

VOICE CHECK: Would a tired parent rocking a sad child say this? If yes, it passes.
`.trim();
