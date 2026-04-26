// src/context/OnboardingContext.tsx
// Holds trial + child-setup state across the welcome stack.
// Lives only inside <WelcomeLayout> so it resets when the user leaves
// the flow (signup completes → routed to /(tabs) → provider unmounts).

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import type { ParentingScriptResponse } from '../lib/api';

export type TrialInput = {
  situation: string;
  childAge:  number;
  intensity: 1 | 2 | 3 | 4 | 5;
  intensityLabel: 'Mild' | 'Heated' | 'Crisis';
};

export type ChildSetup = {
  name?:        string | null;
  childAge?:    number | null;
  challenges?:  string[];
};

type Ctx = {
  trialInput:    TrialInput  | null;
  trialResult:   ParentingScriptResponse | null;
  childSetup:    ChildSetup  | null;

  setTrialInput:  (v: TrialInput  | null) => void;
  setTrialResult: (v: ParentingScriptResponse | null) => void;
  setChildSetup:  (v: ChildSetup  | null) => void;
  reset:          () => void;
};

const OnboardingContext = createContext<Ctx | null>(null);

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const [trialInput,  setTrialInput]  = useState<TrialInput  | null>(null);
  const [trialResult, setTrialResult] = useState<ParentingScriptResponse | null>(null);
  const [childSetup,  setChildSetup]  = useState<ChildSetup  | null>(null);

  const reset = useCallback(() => {
    setTrialInput(null);
    setTrialResult(null);
    setChildSetup(null);
  }, []);

  const value = useMemo<Ctx>(
    () => ({
      trialInput, trialResult, childSetup,
      setTrialInput, setTrialResult, setChildSetup,
      reset,
    }),
    [trialInput, trialResult, childSetup, reset],
  );

  return <OnboardingContext.Provider value={value}>{children}</OnboardingContext.Provider>;
}

export function useOnboarding(): Ctx {
  const ctx = useContext(OnboardingContext);
  if (!ctx) throw new Error('useOnboarding must be used within an OnboardingProvider');
  return ctx;
}
