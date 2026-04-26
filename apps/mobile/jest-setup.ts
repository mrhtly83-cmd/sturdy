// apps/mobile/jest-setup.ts
//
// Runs BEFORE any test module is loaded (configured via jest.config.js
// `setupFiles`). Two responsibilities:
//   1. Seed Expo public env vars so src/lib/supabase.ts and src/lib/api.ts
//      don't throw at module load time.
//   2. Hand jest-expo a no-op Reanimated mock — the real one tries to call
//      a native module that doesn't exist in the jest jsdom environment.

process.env.EXPO_PUBLIC_SUPABASE_URL      = 'https://test.supabase.co';
process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';

// Some screens transitively pull in react-native-reanimated. Disable the
// worklet runtime so the require chain doesn't crash in node.
jest.mock('react-native-reanimated', () => {
  const Reanimated = require('react-native-reanimated/mock');
  Reanimated.default.call = () => {};
  return Reanimated;
});
