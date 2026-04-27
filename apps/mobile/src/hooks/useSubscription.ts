// src/hooks/useSubscription.ts
//
// MOCK subscription hook — billing is intentionally not wired yet.
// When real RevenueCat / StoreKit lands, replace this file's body with
// the live implementation; every call site already imports from here
// and uses { isPremium, plan, purchase, restore }, so unlocking the
// app is a single-file swap.

export const useSubscription = () => ({
  isPremium: false,
  plan: 'free' as const,
  purchase: async () => {
    // eslint-disable-next-line no-console
    console.log('[BILLING] purchase() — wire RevenueCat later');
  },
  restore: async () => {
    // eslint-disable-next-line no-console
    console.log('[BILLING] restore() — wire RevenueCat later');
  },
});
