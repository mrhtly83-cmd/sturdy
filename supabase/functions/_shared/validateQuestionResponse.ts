// supabase/functions/_shared/validateQuestionResponse.ts
// Validator for Question mode responses.
// Shape from question.ts prompt: { response: string }
// Defensive against empty strings, missing field, wrong type, runaway length.

const MIN_LENGTH = 20;     // shorter than this is meaningless
const MAX_LENGTH = 4000;   // ~600-700 words; longer = model went off rails

export type QuestionResponse = {
  response: string;
};

export function validateQuestionResponse(value: unknown): value is QuestionResponse {
  if (typeof value !== 'object' || value === null) return false;

  const v = value as Record<string, unknown>;

  if (typeof v.response !== 'string') return false;

  const trimmed = v.response.trim();

  if (trimmed.length < MIN_LENGTH) return false;
  if (trimmed.length > MAX_LENGTH) return false;

  return true;
}
