# Question-mode eval harness

Manual voice-drift detection for `_shared/prompts/question.ts`. Run before merging prompt changes; never on CI.

## What this is

Generates one Markdown file per run with the model's responses to the five reference inputs in `eval-inputs.json`. Hits the live Anthropic API at `claude-sonnet-4-20250514` (same model as the live Edge Function), so it costs real money.

## How to run

From the repo root:

```bash
ANTHROPIC_API_KEY=sk-ant-...  npm run eval:question
```

Output lands at `eval-outputs/{ISO_DATE}_{short_sha}.md`, gitignored.

## How to grade results

See `docs/QUESTION_MODE_QUALITY_STANDARDS.md` — read each model output beside its reference response and mark it on three axes:

1. Opens with the answer, not preamble?
2. Sounds like a long walk?
3. Length proportional?

**Four of five outputs holding across all three axes = safe to ship.** Three or fewer = roll back the prompt change.

Q3 (parent_self) and Q5 (celebrating) are the highest-drift classifications. Read those first.
