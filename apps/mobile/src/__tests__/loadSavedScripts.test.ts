// apps/mobile/src/__tests__/loadSavedScripts.test.ts
//
// Covers:
//   - auth error → throw
//   - no user   → throw "No signed-in user"
//   - select error → throw
//   - data null → returns []
//   - .eq('user_id', user.id) called
//   - happy path with child name resolution
//   - rows without child_profile_id are returned as-is
//
// See saveScript.test.ts for the mock-pattern rationale: spies live INSIDE
// the jest.mock factory because hoisting precludes capturing outer consts.

jest.mock('../lib/supabase', () => {
  const order        = jest.fn();
  const eq           = jest.fn(() => ({ order }));
  const select       = jest.fn(() => ({ eq }));
  const inFn         = jest.fn();
  const childSelect  = jest.fn(() => ({ in: inFn }));
  const getUser      = jest.fn();

  const from = jest.fn((table: string) => {
    if (table === 'child_profiles') return { select: childSelect };
    return { select };
  });

  return {
    supabase: {
      auth: { getUser },
      from,
    },
    __spies: { order, eq, select, inFn, childSelect, from, getUser },
  };
});

import { loadSavedScripts } from '../lib/loadSavedScripts';
const supabaseMock = jest.requireMock('../lib/supabase') as {
  __spies: {
    order:       jest.Mock;
    eq:          jest.Mock;
    select:      jest.Mock;
    inFn:        jest.Mock;
    childSelect: jest.Mock;
    from:        jest.Mock;
    getUser:     jest.Mock;
  };
};

beforeEach(() => {
  // mockReset wipes the implementation set in the factory; rewire the chains.
  supabaseMock.__spies.order.mockReset();
  supabaseMock.__spies.inFn.mockReset();
  supabaseMock.__spies.getUser.mockReset();
  supabaseMock.__spies.eq.mockReset();
  supabaseMock.__spies.eq.mockImplementation(() => ({ order: supabaseMock.__spies.order }));
  supabaseMock.__spies.select.mockReset();
  supabaseMock.__spies.select.mockImplementation(() => ({ eq: supabaseMock.__spies.eq }));
  supabaseMock.__spies.childSelect.mockReset();
  supabaseMock.__spies.childSelect.mockImplementation(() => ({ in: supabaseMock.__spies.inFn }));
  supabaseMock.__spies.from.mockReset();
  supabaseMock.__spies.from.mockImplementation((table: string) => {
    if (table === 'child_profiles') return { select: supabaseMock.__spies.childSelect };
    return { select: supabaseMock.__spies.select };
  });
});

describe('loadSavedScripts', () => {
  test('throws on auth error', async () => {
    supabaseMock.__spies.getUser.mockResolvedValue({ data: { user: null }, error: new Error('auth-x') });
    await expect(loadSavedScripts()).rejects.toThrow('auth-x');
  });

  test('throws when no user', async () => {
    supabaseMock.__spies.getUser.mockResolvedValue({ data: { user: null }, error: null });
    await expect(loadSavedScripts()).rejects.toThrow('No signed-in user');
  });

  test('throws on select error', async () => {
    supabaseMock.__spies.getUser.mockResolvedValue({ data: { user: { id: 'u-1' } }, error: null });
    supabaseMock.__spies.order.mockResolvedValue({ data: null, error: new Error('db-down') });
    await expect(loadSavedScripts()).rejects.toThrow('db-down');
  });

  test('returns [] when query returns null data', async () => {
    supabaseMock.__spies.getUser.mockResolvedValue({ data: { user: { id: 'u-1' } }, error: null });
    supabaseMock.__spies.order.mockResolvedValue({ data: null, error: null });
    await expect(loadSavedScripts()).resolves.toEqual([]);
  });

  test('happy path — returns rows + resolves child_name', async () => {
    supabaseMock.__spies.getUser.mockResolvedValue({ data: { user: { id: 'u-1' } }, error: null });
    supabaseMock.__spies.order.mockResolvedValue({
      data: [
        { id: 'a', user_id: 'u-1', title: 'first',  trigger_label: null, child_profile_id: 'c-1', structured: {}, notes: null, created_at: 't1' },
        { id: 'b', user_id: 'u-1', title: 'second', trigger_label: null, child_profile_id: 'c-2', structured: {}, notes: null, created_at: 't2' },
      ],
      error: null,
    });
    supabaseMock.__spies.inFn.mockResolvedValue({
      data: [
        { id: 'c-1', name: 'Maya' },
        { id: 'c-2', name: 'Liam' },
      ],
    });

    const rows = await loadSavedScripts();

    expect(rows).toHaveLength(2);
    expect(rows[0].child_name).toBe('Maya');
    expect(rows[1].child_name).toBe('Liam');
  });

  test('rows without child_profile_id are returned without child_name', async () => {
    supabaseMock.__spies.getUser.mockResolvedValue({ data: { user: { id: 'u-1' } }, error: null });
    supabaseMock.__spies.order.mockResolvedValue({
      data: [
        { id: 'a', user_id: 'u-1', title: 'first', trigger_label: null, child_profile_id: null, structured: {}, notes: null, created_at: 't1' },
      ],
      error: null,
    });

    const rows = await loadSavedScripts();
    expect(rows).toHaveLength(1);
    expect(rows[0].child_name).toBeUndefined();
    // child_profiles never queried because no ids
    expect(supabaseMock.__spies.childSelect).not.toHaveBeenCalled();
  });

  test('filters by user_id via .eq("user_id", user.id)', async () => {
    supabaseMock.__spies.getUser.mockResolvedValue({ data: { user: { id: 'u-42' } }, error: null });
    supabaseMock.__spies.order.mockResolvedValue({ data: [], error: null });

    await loadSavedScripts();

    expect(supabaseMock.__spies.from).toHaveBeenCalledWith('saved_scripts');
    expect(supabaseMock.__spies.eq).toHaveBeenCalledWith('user_id', 'u-42');
  });
});
