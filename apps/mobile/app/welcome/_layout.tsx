// app/welcome/_layout.tsx
// v6 — Stack for the v12 welcome carousel. The OnboardingProvider was
// removed when its only consumers (trial / trial-result / child-setup /
// signup) were deleted.

import { Stack } from 'expo-router';
import { colors } from '../../src/theme/colors';

export default function WelcomeLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
        animation: 'slide_from_right',
        orientation: 'portrait',
      }}
    />
  );
}
