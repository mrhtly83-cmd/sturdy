// apps/mobile/src/__tests__/normalizeAuthError.test.ts
//
// `normalizeAuthError` is a pure function that lives inside AuthContext.tsx.
// Importing AuthContext.tsx pulls in '../lib/supabase' → AsyncStorage →
// the @react-native-async-storage/async-storage native module, which
// requires a non-trivial mock chain. We short-circuit that by mocking
// '../lib/supabase' so the import resolves without booting Supabase.

jest.mock('../lib/supabase', () => ({
  supabase: {
    auth: {
      getSession:        jest.fn(() => Promise.resolve({ data: { session: null }, error: null })),
      onAuthStateChange: jest.fn(() => ({ data: { subscription: { unsubscribe: jest.fn() } } })),
    },
  },
}));

import { normalizeAuthError } from '../context/AuthContext';

describe('normalizeAuthError', () => {
  test('maps "Invalid login credentials" to a friendly sign-in message', () => {
    expect(normalizeAuthError('Invalid login credentials'))
      .toBe('That email or password did not match. Please try again.');
  });

  test('match is case-insensitive', () => {
    expect(normalizeAuthError('INVALID LOGIN CREDENTIALS'))
      .toBe('That email or password did not match. Please try again.');
    expect(normalizeAuthError('invalid login credentials'))
      .toBe('That email or password did not match. Please try again.');
  });

  test('matches when error message contains the phrase as a substring', () => {
    expect(normalizeAuthError('AuthApiError: Invalid login credentials returned by server'))
      .toBe('That email or password did not match. Please try again.');
  });

  test('maps "Email not confirmed" to a confirmation prompt', () => {
    expect(normalizeAuthError('Email not confirmed'))
      .toBe('Check your email to confirm your account, then sign in.');
  });

  test('email-not-confirmed match is also case-insensitive', () => {
    expect(normalizeAuthError('EMAIL NOT CONFIRMED'))
      .toBe('Check your email to confirm your account, then sign in.');
  });

  test('returns the original message when nothing matches', () => {
    expect(normalizeAuthError('Network request failed'))
      .toBe('Network request failed');
    expect(normalizeAuthError('something else entirely'))
      .toBe('something else entirely');
  });

  test('passes empty string through unchanged', () => {
    expect(normalizeAuthError('')).toBe('');
  });
});
