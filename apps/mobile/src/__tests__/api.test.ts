// apps/mobile/src/__tests__/api.test.ts
//
// Covers:
//   - isParentingScriptResponse: every shape gate
//   - getParentingScript:
//       happy path → resolves with parsed body
//       crisis response → throws CrisisDetectedError
//       network failure → throws 'network-error'
//       JSON parse failure → throws 'parse-error'
//       non-2xx with error body → throws the server's error string
//       invalid response shape → throws 'invalid-response'
//
// Env vars are seeded by jest-setup.ts so api.ts module-load doesn't crash.

import {
  isParentingScriptResponse,
  getParentingScript,
  CrisisDetectedError,
} from '../lib/api';

const validStep = { parent_action: 'do this', script: 'say this' };
const validBody = {
  situation_summary: 'child melting down',
  regulate: validStep,
  connect:  validStep,
  guide:    validStep,
  avoid:    ['x'],
};

const baseRequest = { childName: 'Maya', childAge: 5, message: 'meltdown' };

beforeEach(() => {
  // Silence the [API] console.log noise in test output.
  jest.spyOn(console, 'log').mockImplementation(() => {});
});

afterEach(() => {
  jest.restoreAllMocks();
});

// ─── isParentingScriptResponse ────────────────

describe('isParentingScriptResponse', () => {
  test('accepts a complete valid response', () => {
    expect(isParentingScriptResponse(validBody)).toBe(true);
  });

  test('rejects null + non-object', () => {
    expect(isParentingScriptResponse(null)).toBe(false);
    expect(isParentingScriptResponse(undefined)).toBe(false);
    expect(isParentingScriptResponse('str')).toBe(false);
    expect(isParentingScriptResponse(42)).toBe(false);
  });

  test('rejects missing situation_summary', () => {
    const { situation_summary: _, ...rest } = validBody;
    expect(isParentingScriptResponse(rest)).toBe(false);
  });

  test('rejects each missing step', () => {
    for (const k of ['regulate', 'connect', 'guide'] as const) {
      const copy = { ...validBody };
      delete (copy as Record<string, unknown>)[k];
      expect(isParentingScriptResponse(copy)).toBe(false);
    }
  });

  test('rejects when avoid is not an array', () => {
    expect(isParentingScriptResponse({ ...validBody, avoid: 'nope' })).toBe(false);
  });

  test('rejects step with missing fields', () => {
    expect(isParentingScriptResponse({
      ...validBody,
      regulate: { parent_action: 'x' },
    })).toBe(false);
  });
});

// ─── getParentingScript ──────────────────────

describe('getParentingScript', () => {
  test('happy path — resolves with the parsed body', async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok:     true,
        status: 200,
        text:   () => Promise.resolve(JSON.stringify(validBody)),
      } as Response),
    ) as jest.Mock;

    await expect(getParentingScript(baseRequest)).resolves.toEqual(validBody);
  });

  test('crisis response_type throws CrisisDetectedError with type + level', async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok:     true,
        status: 200,
        text:   () => Promise.resolve(JSON.stringify({
          response_type: 'crisis',
          crisis_type:   'suicidal_parent',
          risk_level:    'CRISIS_RISK',
        })),
      } as Response),
    ) as jest.Mock;

    await expect(getParentingScript(baseRequest)).rejects.toMatchObject({
      name:       'CrisisDetectedError',
      crisisType: 'suicidal_parent',
      riskLevel:  'CRISIS_RISK',
    });
  });

  test('crisis with missing fields falls back to defaults', async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok:     true,
        status: 200,
        text:   () => Promise.resolve(JSON.stringify({ response_type: 'crisis' })),
      } as Response),
    ) as jest.Mock;

    try {
      await getParentingScript(baseRequest);
      throw new Error('should have thrown');
    } catch (err) {
      expect(err).toBeInstanceOf(CrisisDetectedError);
      expect((err as CrisisDetectedError).crisisType).toBe('unknown');
      expect((err as CrisisDetectedError).riskLevel).toBe('ELEVATED_RISK');
    }
  });

  test('network failure throws "network-error"', async () => {
    global.fetch = jest.fn(() => Promise.reject(new Error('boom'))) as jest.Mock;
    await expect(getParentingScript(baseRequest)).rejects.toThrow('network-error');
  });

  test('non-2xx with structured error body bubbles up the server message', async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok:     false,
        status: 500,
        text:   () => Promise.resolve(JSON.stringify({ error: 'boom' })),
      } as Response),
    ) as jest.Mock;

    await expect(getParentingScript(baseRequest)).rejects.toThrow('boom');
  });

  test('non-2xx without error body falls back to "request-failed"', async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok:     false,
        status: 500,
        text:   () => Promise.resolve(JSON.stringify({})),
      } as Response),
    ) as jest.Mock;

    await expect(getParentingScript(baseRequest)).rejects.toThrow('request-failed');
  });

  test('non-JSON body throws "parse-error"', async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok:     true,
        status: 200,
        text:   () => Promise.resolve('not-json'),
      } as Response),
    ) as jest.Mock;

    await expect(getParentingScript(baseRequest)).rejects.toThrow('parse-error');
  });

  test('shape-invalid body throws "invalid-response"', async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok:     true,
        status: 200,
        text:   () => Promise.resolve(JSON.stringify({ situation_summary: 'x' })),
      } as Response),
    ) as jest.Mock;

    await expect(getParentingScript(baseRequest)).rejects.toThrow('invalid-response');
  });

  test('POSTs to the chat-parenting-assistant function URL', async () => {
    const fetchMock = jest.fn(() =>
      Promise.resolve({
        ok: true, status: 200,
        text: () => Promise.resolve(JSON.stringify(validBody)),
      } as Response),
    ) as jest.Mock;
    global.fetch = fetchMock;

    await getParentingScript(baseRequest);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, opts] = fetchMock.mock.calls[0];
    expect(url).toContain('/functions/v1/chat-parenting-assistant');
    expect(opts.method).toBe('POST');
    expect(JSON.parse(opts.body)).toMatchObject(baseRequest);
  });
});
