// app/account/_layout.tsx
// Stack layout for the account-lifecycle screens (pause, delete, export).
// Headers are hidden — each screen renders its own back button.

import { Stack } from 'expo-router';

export default function AccountLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#0e0a10' },
      }}
    />
  );
}
