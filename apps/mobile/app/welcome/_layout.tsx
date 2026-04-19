// app/welcome/_layout.tsx
// Nested layout for onboarding flow

import { Stack } from 'expo-router';

export default function WelcomeLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#09090B' },
        animation: 'slide_from_right',
      }}
    />
  );
}