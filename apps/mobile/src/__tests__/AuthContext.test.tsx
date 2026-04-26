// apps/mobile/src/__tests__/AuthContext.test.tsx
//
// Covers the contract-of-use guarantee:
//   useAuth() called outside <AuthProvider> throws a clear error.
//
// React 19's react-test-renderer no longer lets render-time errors bubble
// out of `create()` synchronously, so we capture them with a class-based
// error boundary instead.
//
// Mock supabase BEFORE importing AuthContext — otherwise the import chain
// pulls in @react-native-async-storage/async-storage's native module.

jest.mock('../lib/supabase', () => ({
  supabase: {
    auth: {
      getSession:        jest.fn(() => Promise.resolve({ data: { session: null }, error: null })),
      onAuthStateChange: jest.fn(() => ({ data: { subscription: { unsubscribe: jest.fn() } } })),
    },
  },
}));

import * as React from 'react';
import TestRenderer from 'react-test-renderer';
import { useAuth } from '../context/AuthContext';

function Probe() {
  useAuth();
  return null;
}

class CaptureBoundary extends React.Component<
  { children: React.ReactNode; onError: (e: Error) => void },
  { errored: boolean }
> {
  state = { errored: false };
  static getDerivedStateFromError() { return { errored: true }; }
  componentDidCatch(error: Error) { this.props.onError(error); }
  render() { return this.state.errored ? null : this.props.children; }
}

describe('useAuth', () => {
  test('throws a clear error when called outside an AuthProvider', () => {
    // React logs render errors to console.error / warn — silence the noise.
    const errSpy  = jest.spyOn(console, 'error').mockImplementation(() => {});
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

    let captured: Error | null = null;
    try {
      // act() flushes all scheduled work — React 19 runs componentDidCatch
      // in a layout-effect-scheduled callback that's pending when create()
      // returns synchronously.
      TestRenderer.act(() => {
        TestRenderer.create(
          <CaptureBoundary onError={(e) => { captured = e; }}>
            <Probe />
          </CaptureBoundary>,
        );
      });
    } finally {
      errSpy.mockRestore();
      warnSpy.mockRestore();
    }

    expect(captured).toBeInstanceOf(Error);
    expect((captured as unknown as Error).message)
      .toBe('useAuth must be used within an AuthProvider');
  });
});
