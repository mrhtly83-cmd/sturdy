// apps/mobile/jest.config.js
//
// Jest config for the Expo / React Native mobile app.
// - Uses jest-expo preset (handles RN transform + bundles standard mocks
//   for AsyncStorage, expo-modules-core, etc.).
// - jest-setup.ts seeds the EXPO_PUBLIC_* env vars BEFORE any module loads,
//   because src/lib/supabase.ts and src/lib/api.ts both throw at import
//   time if those env vars are missing.

module.exports = {
  preset: 'jest-expo',
  setupFiles: ['<rootDir>/jest-setup.ts'],
  testMatch: [
    '<rootDir>/src/__tests__/**/*.test.{ts,tsx}',
  ],
  // jest-expo's preset already supplies a sensible transformIgnorePatterns
  // (it allows expo / @expo / react-native packages through Babel). Don't
  // override it — that's what blocks expo-modules-core/src/polyfill from
  // being transformed.
};
