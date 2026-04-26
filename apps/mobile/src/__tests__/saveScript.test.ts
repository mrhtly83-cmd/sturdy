// apps/mobile/src/__tests__/saveScript.test.ts
//
// Covers:
//   - auth.getUser returns error → throw
//   - no signed-in user → throw "No signed-in user"
//   - DB insert error → throw
//   - Happy path → no throw, insert payload shape correct, user_id from session
//
// Note on the mock pattern: `jest.mock()` is hoisted above any `const`
// declarations in this file, so the factory closure can't capture an
// outer `mockX = jest.fn()`. The workaround is to define the spies
// INSIDE the factory and re-export them as a sibling object the tests
// can grab via `requireMock`. That gives the tests a stable handle to
// the same fn that the production code is actually calling.

jest.mock('../lib/supabase', () => {
  const insert  = jest.fn();
  const from    = jest.fn(() => ({ insert }));
  const getUser = jest.fn();
  return {
    supabase: {
      auth: { getUser },
      from,
    },
    __spies: { insert, from, getUser },
  };
});

import { saveScript } from '../lib/saveScript';
const supabaseMock = jest.requireMock('../lib/supabase') as {
  __spies: { insert: jest.Mock; from: jest.Mock; getUser: jest.Mock };
};

const validInput = {
  situation_summary: 'park meltdown',
  regulate: { parent_action: 'crouch', script: 'I see you' },
  connect:  { parent_action: 'wait',   script: 'we are leaving' },
  guide:    { parent_action: 'walk',   script: 'hold my hand' },
  avoid:    ['stop crying'],
};

beforeEach(() => {
  supabaseMock.__spies.insert.mockReset();
  supabaseMock.__spies.from.mockClear();
  supabaseMock.__spies.getUser.mockReset();
  // The .insert chain has to be re-wired after reset because mockReset()
  // clears the implementation set above.
  supabaseMock.__spies.from.mockImplementation(() => ({ insert: supabaseMock.__spies.insert }));
});

describe('saveScript', () => {
  test('throws when supabase returns auth error', async () => {
    supabaseMock.__spies.getUser.mockResolvedValue({ data: { user: null }, error: new Error('auth-failed') });
    await expect(saveScript(validInput)).rejects.toThrow('auth-failed');
    expect(supabaseMock.__spies.insert).not.toHaveBeenCalled();
  });

  test('throws when there is no signed-in user', async () => {
    supabaseMock.__spies.getUser.mockResolvedValue({ data: { user: null }, error: null });
    await expect(saveScript(validInput)).rejects.toThrow('No signed-in user');
    expect(supabaseMock.__spies.insert).not.toHaveBeenCalled();
  });

  test('throws when insert returns an error', async () => {
    supabaseMock.__spies.getUser.mockResolvedValue({ data: { user: { id: 'u-1' } }, error: null });
    supabaseMock.__spies.insert.mockResolvedValue({ error: new Error('db-down') });
    await expect(saveScript(validInput)).rejects.toThrow('db-down');
  });

  test('happy path — calls saved_scripts.insert with full structured payload', async () => {
    supabaseMock.__spies.getUser.mockResolvedValue({ data: { user: { id: 'u-1' } }, error: null });
    supabaseMock.__spies.insert.mockResolvedValue({ error: null });

    await expect(saveScript({
      ...validInput,
      childProfileId:  'child-7',
      conversationId:  'conv-9',
      triggerLabel:    'meltdown',
    })).resolves.toBeUndefined();

    expect(supabaseMock.__spies.from).toHaveBeenCalledWith('saved_scripts');
    expect(supabaseMock.__spies.insert).toHaveBeenCalledTimes(1);

    const payload = supabaseMock.__spies.insert.mock.calls[0][0];
    expect(payload.user_id).toBe('u-1');
    expect(payload.child_profile_id).toBe('child-7');
    expect(payload.conversation_id).toBe('conv-9');
    expect(payload.trigger_label).toBe('meltdown');
    expect(payload.title).toBe('park meltdown');
    expect(payload.structured).toEqual({
      situation_summary: 'park meltdown',
      regulate: validInput.regulate,
      connect:  validInput.connect,
      guide:    validInput.guide,
      avoid:    ['stop crying'],
    });
  });

  test('coalesces missing optional ids to null', async () => {
    supabaseMock.__spies.getUser.mockResolvedValue({ data: { user: { id: 'u-1' } }, error: null });
    supabaseMock.__spies.insert.mockResolvedValue({ error: null });

    await saveScript(validInput);

    const payload = supabaseMock.__spies.insert.mock.calls[0][0];
    expect(payload.child_profile_id).toBeNull();
    expect(payload.conversation_id).toBeNull();
    expect(payload.trigger_label).toBeNull();
  });

  test('truncates title to 80 chars from situation_summary', async () => {
    supabaseMock.__spies.getUser.mockResolvedValue({ data: { user: { id: 'u-1' } }, error: null });
    supabaseMock.__spies.insert.mockResolvedValue({ error: null });

    const longSummary = 'a'.repeat(120);
    await saveScript({ ...validInput, situation_summary: longSummary });

    const payload = supabaseMock.__spies.insert.mock.calls[0][0];
    expect(payload.title.length).toBe(80);
    expect(payload.title).toBe('a'.repeat(80));
  });
});
