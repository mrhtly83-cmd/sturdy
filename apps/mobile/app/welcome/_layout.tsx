// app/welcome/_layout.tsx
// v5 — Onboarding stack. Wraps the 5 screens with OnboardingProvider so
// trial input → trial result → child setup carry forward across screens.
// Background colour is the warm-dark base (set on Stack contentStyle);
// each screen renders its own LinearGradient via the Screen wrapper.

import { Stack } from 'expo-router';
import { colors } from '../../src/theme/colors';
import { OnboardingProvider } from '../../src/context/OnboardingContext';

export default function WelcomeLayout() {
  return (
    <OnboardingProvider>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
          animation: 'slide_from_right',
          orientation: 'portrait',
        }}
      />
    </OnboardingProvider>
  );
}
