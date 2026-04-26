// src/utils/analytics.ts
// Event-tracking stubs for the onboarding funnel.
//
// In dev: logs to console with an [ANALYTICS] prefix.
// In prod: no-op until a tracking backend is wired (PostHog, Mixpanel, Amplitude…).
// Adding the calls now means the funnel is already instrumented — the only
// follow-up work to make events flow is replacing the `track()` body.

declare const __DEV__: boolean;

export type AnalyticsEvent =
  | 'onboarding_screen_viewed'
  | 'onboarding_trial_started'
  | 'onboarding_trial_completed'
  | 'onboarding_trial_failed'
  | 'onboarding_trial_result_viewed'
  | 'onboarding_child_setup_completed'
  | 'onboarding_child_setup_skipped'
  | 'onboarding_signup_completed'
  | 'onboarding_signup_skipped'
  | 'onboarding_screen_dropped';

export function track(event: AnalyticsEvent, props?: Record<string, unknown>): void {
  if (typeof __DEV__ !== 'undefined' && __DEV__) {
    // eslint-disable-next-line no-console
    console.log('[ANALYTICS]', event, props ?? {});
  }
}
