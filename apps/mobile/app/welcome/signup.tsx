// app/welcome/signup.tsx
// Onboarding Screen 5 — "Create Account".
// Email + password → Supabase auth → optional child_profiles insert →
// markOnboardingComplete → /(tabs).
//
// Apple/Google buttons are placeholder — render the layout the spec calls
// for, but disabled with an explanatory tooltip until those flows are
// wired (separate work).

import { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import { colors as C, fonts as F } from '../../src/theme/colors';
import { ProgressDots } from '../../src/components/welcome/ProgressDots';
import { useAuth } from '../../src/context/AuthContext';
import { useOnboarding } from '../../src/context/OnboardingContext';
import { supabase } from '../../src/lib/supabase';
import { markOnboardingComplete } from '../../src/utils/onboarding';
import { track } from '../../src/utils/analytics';

function ageToBand(age: number): '2-4' | '5-7' | '8-12' {
  if (age <= 4) return '2-4';
  if (age <= 7) return '5-7';
  return '8-12';
}

export default function WelcomeSignup() {
  const { signUpWithEmail } = useAuth();
  const { childSetup, reset } = useOnboarding();

  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState<string | null>(null);

  useEffect(() => {
    track('onboarding_screen_viewed', { screen: 5 });
  }, []);

  const canSubmit = email.trim().length > 3 && password.length >= 6 && !loading;

  async function onCreate() {
    if (!canSubmit) return;
    setError(null);
    setLoading(true);

    try {
      const { session } = await signUpWithEmail(email.trim(), password);

      // Some Supabase configurations require email confirmation before a
      // session is issued. We can still complete onboarding locally — the
      // user just needs to confirm and sign back in.
      const userId = session?.user?.id ?? (await supabase.auth.getUser()).data.user?.id ?? null;

      // If the user gave us child setup data, persist it now.
      if (userId && childSetup && typeof childSetup.childAge === 'number') {
        const { error: insertErr } = await supabase
          .from('child_profiles')
          .insert({
            user_id:    userId,
            name:       childSetup.name ?? null,
            age_band:   ageToBand(childSetup.childAge),
            child_age:  childSetup.childAge,
            preferences: childSetup.challenges?.length
              ? { challenges: childSetup.challenges }
              : {},
          });
        if (insertErr) {
          // Don't block the user from getting into the app — log + continue.
          // The dashboard will prompt them to add a child profile.
          console.warn('[signup] child_profiles insert failed:', insertErr.message);
        }
      }

      await markOnboardingComplete();
      track('onboarding_signup_completed', { method: 'email' });
      reset();
      router.replace('/(tabs)');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Could not create account.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  function onSignInLink() {
    track('onboarding_screen_dropped', { screen: 5, action: 'sign_in' });
    router.push('/auth/sign-in');
  }

  return (
    <View style={s.root}>
      <LinearGradient
        colors={[C.gradientTop, C.gradientBottom]}
        style={StyleSheet.absoluteFillObject}
      />
      <SafeAreaView style={s.safe}>
        <StatusBar style="light" />
        <ProgressDots step={5} />

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={s.kav}
        >
          <ScrollView
            contentContainerStyle={s.scroll}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <Text style={s.h1}>Save your scripts.{'\n'}Build your child's profile.</Text>
            <Text style={s.sub}>Free forever · No credit card needed</Text>

            <View style={s.card}>
              <Text style={s.label}>Email</Text>
              <TextInput
                style={s.input}
                value={email}
                onChangeText={setEmail}
                placeholder="you@example.com"
                placeholderTextColor={C.textMuted}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                editable={!loading}
                returnKeyType="next"
              />

              <Text style={s.label}>Password</Text>
              <TextInput
                style={s.input}
                value={password}
                onChangeText={setPassword}
                placeholder="At least 6 characters"
                placeholderTextColor={C.textMuted}
                secureTextEntry
                autoComplete="password-new"
                editable={!loading}
                returnKeyType="go"
                onSubmitEditing={onCreate}
              />
            </View>

            {error ? (
              <View style={s.errorBox}>
                <Text style={s.errorText}>{error}</Text>
              </View>
            ) : null}

            <Pressable
              onPress={onCreate}
              disabled={!canSubmit}
              style={({ pressed }) => [
                s.cta,
                !canSubmit && s.ctaDisabled,
                pressed && canSubmit && s.ctaPressed,
              ]}
              accessibilityRole="button"
            >
              <Text style={s.ctaText}>
                {loading ? 'Creating your account…' : 'Create my free account'}
              </Text>
            </Pressable>

            <View style={s.dividerRow}>
              <View style={s.dividerLine} />
              <Text style={s.dividerText}>or</Text>
              <View style={s.dividerLine} />
            </View>

            <Pressable
              style={[s.socialBtn, s.socialDisabled]}
              disabled
              accessibilityRole="button"
              accessibilityLabel="Continue with Apple — not yet available"
            >
              <Text style={s.socialText}>Continue with Apple</Text>
              <Text style={s.soonPill}>SOON</Text>
            </Pressable>
            <Pressable
              style={[s.socialBtn, s.socialDisabled]}
              disabled
              accessibilityRole="button"
              accessibilityLabel="Continue with Google — not yet available"
            >
              <Text style={s.socialText}>Continue with Google</Text>
              <Text style={s.soonPill}>SOON</Text>
            </Pressable>

            <View style={s.bottomRow}>
              <Text style={s.bottomText}>Already have an account?</Text>
              <Pressable onPress={onSignInLink} style={s.linkBtn} disabled={loading}>
                <Text style={s.link}>Sign in</Text>
              </Pressable>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.background },
  safe: { flex: 1, paddingHorizontal: 20 },
  kav:  { flex: 1 },
  scroll: { paddingTop: 16, paddingBottom: 24, gap: 16 },

  h1: {
    fontFamily: F.heading,
    fontSize: 26,
    lineHeight: 32,
    color: C.text,
    letterSpacing: -0.3,
  },
  sub: {
    fontFamily: F.body,
    fontSize: 14,
    lineHeight: 22,
    color: C.amber,
  },

  card: {
    backgroundColor: C.surface,
    borderColor:     C.border,
    borderWidth: 1,
    borderRadius: 20,
    padding: 16,
    gap: 14,
  },

  label: {
    fontFamily: F.label,
    fontSize: 11,
    letterSpacing: 0.8,
    color: C.textMuted,
    textTransform: 'uppercase',
  },

  input: {
    backgroundColor: C.inputBg,
    borderColor:     C.inputBorder,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontFamily: F.body,
    fontSize: 16,
    color: C.text,
  },

  errorBox: {
    backgroundColor: C.sosLight,
    borderColor:     C.sos,
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
  },
  errorText: { fontFamily: F.bodySemi, fontSize: 14, color: C.sos },

  cta: {
    backgroundColor: C.amber,
    borderRadius: 14,
    paddingVertical: 16,
    width: '100%',
    alignItems: 'center',
  },
  ctaPressed:  { opacity: 0.85 },
  ctaDisabled: { backgroundColor: C.disabled },
  ctaText: {
    fontFamily: F.bodySemi,
    fontSize: 17,
    color: C.textInverse,
    letterSpacing: 0.3,
  },

  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 4,
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: C.divider },
  dividerText: {
    fontFamily: F.body,
    fontSize: 12,
    color: C.textMuted,
    textTransform: 'lowercase',
  },

  socialBtn: {
    backgroundColor: C.surfaceRaised,
    borderColor:     C.border,
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  socialDisabled: { opacity: 0.55 },
  socialText: { fontFamily: F.bodySemi, fontSize: 15, color: C.text },
  soonPill: {
    fontFamily: F.label,
    fontSize: 9,
    letterSpacing: 0.8,
    color: C.amber,
    backgroundColor: C.amberLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    overflow: 'hidden',
  },

  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 8,
  },
  bottomText: { fontFamily: F.body, fontSize: 14, color: C.textMuted },
  linkBtn:    { paddingVertical: 6 },
  link:       { fontFamily: F.bodySemi, fontSize: 14, color: C.amber },
});
