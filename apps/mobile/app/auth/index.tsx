// app/auth/index.tsx
// v4 — Deep Warm v5.2: C-2 gradient, dark glass form card, amber CTA.
//
// Mode is read from `?mode=` query param; defaults to 'signup' when
// missing. Tapping the toggle link switches mode without remounting.

import AsyncStorage from '@react-native-async-storage/async-storage';
import { useState } from 'react';
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
import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar }      from 'expo-status-bar';
import { SafeAreaView }   from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase }       from '../../src/lib/supabase';
import { markOnboardingComplete } from '../../src/utils/onboarding';
import { useAuth }        from '../../src/context/AuthContext';
import { colors as C, fonts as F } from '../../src/theme/colors';

const PENDING_CHILD_KEY = 'sturdy_pending_child_v1';

type Mode = 'signup' | 'signin';

function isMode(v: unknown): v is Mode {
  return v === 'signup' || v === 'signin';
}

type ScreenState = 'form' | 'confirm-email';

export default function AuthScreen() {
  const params = useLocalSearchParams<{ mode?: string }>();
  const initialMode: Mode = isMode(params.mode) ? params.mode : 'signup';

  const { signInWithEmail } = useAuth();

  const [mode, setMode]         = useState<Mode>(initialMode);
  const [screenState, setScreenState] = useState<ScreenState>('form');
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw]     = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [pwFocused, setPwFocused]       = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');

  const isSignup = mode === 'signup';
  const minPwLen = isSignup ? 6 : 1;
  const canSubmit = email.trim().length > 0 && password.length >= minPwLen;

  const handleSubmit = async () => {
    if (!canSubmit || loading) return;
    setError('');
    setLoading(true);
    try {
      const e = email.trim().toLowerCase();
      if (isSignup) {
        const { data: signUpData, error: authErr } = await supabase.auth.signUp({ email: e, password });
        if (authErr) throw authErr;

        // Pending-child migration — preserved verbatim from sign-up.tsx.
        // No-op when guest mode never wrote a pending child.
        try {
          const pendingRaw = await AsyncStorage.getItem(PENDING_CHILD_KEY);
          if (pendingRaw) {
            const pending = JSON.parse(pendingRaw);
            const { data: { user } } = await supabase.auth.getUser();
            if (user && pending.name && pending.age) {
              await supabase.from('child_profiles').insert({
                user_id:    user.id,
                name:       pending.name,
                child_age:  pending.age,
                age_band:   pending.age <= 4 ? '2-4' : pending.age <= 7 ? '5-7' : '8-12',
                neurotype:  pending.neurotype ?? [],
              });
            }
            await AsyncStorage.removeItem(PENDING_CHILD_KEY);
          }
        } catch { /* non-blocking */ }

        await markOnboardingComplete();

        // If email confirmation is required, session will be null.
        // Show a "check your inbox" screen instead of leaving the user hanging.
        if (!signUpData.session) {
          setScreenState('confirm-email');
          return;
        }
        // Session present (confirmation disabled) — AuthGate routes to /(tabs).
      } else {
        await signInWithEmail(e, password);
        await markOnboardingComplete();
        // signInWithEmail throws on failure; on success AuthGate in
        // _layout.tsx handles routing.
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message
        : isSignup ? 'Could not create account. Try again.'
                   : 'Sign in failed. Please try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/welcome');
  };

  const switchMode = (next: Mode) => {
    setMode(next);
    setError('');
    setShowPw(false);
  };

  return (
    <View style={s.root}>
      <StatusBar style="light" />
      <LinearGradient
        colors={[
          C.gradientTop,
          C.gradientMid1,
          C.gradientMid2,
          C.gradientMid3,
          C.gradientMid4,
          C.gradientBottom,
        ]}
        locations={[0, 0.14, 0.28, 0.42, 0.58, 1]}
        style={StyleSheet.absoluteFill}
      />
      <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
      <ScrollView
        contentContainerStyle={s.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {screenState === 'confirm-email' ? (
          // ─── Post-signup: email confirmation required ───
          <>
            <View style={s.confirmWrap}>
              <Text style={s.confirmIcon}>📬</Text>
              <Text style={s.headline}>Check your inbox</Text>
              <Text style={s.headlineSub}>
                We sent a confirmation link to{'\n'}
                <Text style={s.emailDisplay}>{email.trim()}</Text>
              </Text>
              <Text style={s.confirmHint}>
                Tap the link in the email to activate your account, then come back and sign in.
                Check spam if you don't see it.
              </Text>
              <Pressable
                onPress={() => { setScreenState('form'); switchMode('signin'); }}
                style={({ pressed }) => [s.linkBtn, pressed && { opacity: 0.6 }]}
              >
                <Text style={s.linkText}>
                  Already confirmed? <Text style={s.linkAccent}>Sign in</Text>
                </Text>
              </Pressable>
            </View>
          </>
        ) : (
          // ─── Normal sign-in / sign-up form ───
          <>
            <Pressable onPress={handleBack} style={s.back} hitSlop={8}>
              <Text style={s.backText}>← Back</Text>
            </Pressable>

            <View style={s.hlArea}>
              <Text style={s.headline}>
                {isSignup ? 'Create account' : 'Welcome back'}
              </Text>
              <Text style={s.headlineSub}>
                {isSignup ? 'Save scripts and personalise for your child.' : 'Sign in to continue'}
              </Text>
            </View>

            <View style={s.formCard}>
              <View style={s.field}>
                <Text style={s.fieldLabel}>EMAIL</Text>
                <View style={[s.inputWrap, emailFocused && s.inputFocused]}>
                  <TextInput
                    autoCapitalize="none"
                    autoCorrect={false}
                    keyboardType="email-address"
                    autoComplete="email"
                    placeholder="you@example.com"
                    placeholderTextColor={C.inputPlaceholder}
                    value={email}
                    onChangeText={(v) => { setEmail(v); if (error) setError(''); }}
                    onFocus={() => setEmailFocused(true)}
                    onBlur={() => setEmailFocused(false)}
                    style={s.input}
                    editable={!loading}
                  />
                </View>
              </View>

              <View style={s.field}>
                <Text style={s.fieldLabel}>PASSWORD</Text>
                <View style={[s.inputWrap, pwFocused && s.inputFocused, s.inputRow]}>
                  <TextInput
                    secureTextEntry={!showPw}
                    autoCapitalize="none"
                    autoCorrect={false}
                    autoComplete={isSignup ? 'password-new' : 'password'}
                    placeholder={isSignup ? 'Choose a password' : 'Enter your password'}
                    placeholderTextColor={C.inputPlaceholder}
                    value={password}
                    onChangeText={(v) => { setPassword(v); if (error) setError(''); }}
                    onFocus={() => setPwFocused(true)}
                    onBlur={() => setPwFocused(false)}
                    style={[s.input, { flex: 1 }]}
                    editable={!loading}
                    returnKeyType="go"
                    onSubmitEditing={handleSubmit}
                  />
                  <Pressable
                    onPress={() => setShowPw((v) => !v)}
                    style={s.eyeBtn}
                    hitSlop={8}
                    accessibilityRole="button"
                    accessibilityLabel={showPw ? 'Hide password' : 'Show password'}
                  >
                    <Text style={s.eyeIcon}>{showPw ? '🙈' : '👁'}</Text>
                  </Pressable>
                </View>
                {isSignup ? <Text style={s.pwHint}>Use at least 6 characters.</Text> : null}
              </View>
            </View>

            {error ? <Text style={s.errorText}>{error}</Text> : null}

            {!isSignup && (
              <Pressable
                onPress={() => router.push('/auth/forgot-password' as any)}
                style={({ pressed }) => [s.forgotBtn, pressed && { opacity: 0.6 }]}
                accessibilityRole="button"
              >
                <Text style={s.forgotText}>Forgot password?</Text>
              </Pressable>
            )}

            <Pressable
              onPress={() => switchMode(isSignup ? 'signin' : 'signup')}
              style={({ pressed }) => [s.linkBtn, pressed && { opacity: 0.6 }]}
              accessibilityRole="button"
              disabled={loading}
            >
              <Text style={s.linkText}>
                {isSignup ? "Already have an account? " : "Don't have an account? "}
                <Text style={s.linkAccent}>{isSignup ? 'Sign in' : 'Sign up free'}</Text>
              </Text>
            </Pressable>
          </>
        )}
      </ScrollView>
      </KeyboardAvoidingView>

      {/* Sticky CTA — hidden on confirm-email screen */}
      {screenState !== 'confirm-email' && <View style={s.stickyWrap}>
        <LinearGradient
          colors={['transparent', 'rgba(12,12,12,0.85)', C.background]}
          locations={[0, 0.45, 0.85]}
          style={s.stickyFade}
          pointerEvents="none"
        />
        <View style={s.stickyContent}>
          <Pressable
            onPress={handleSubmit}
            disabled={!canSubmit || loading}
            style={({ pressed }) => [
              pressed && canSubmit && !loading && { opacity: 0.92, transform: [{ scale: 0.98 }] },
            ]}
            accessibilityRole="button"
          >
            {(!canSubmit || loading) ? (
              <View style={[s.ctaBase, s.ctaDisabled]}>
                <Text style={[s.ctaText, { color: C.disabledText }]}>
                  {loading
                    ? (isSignup ? 'Creating account…' : 'Signing in…')
                    : (isSignup ? 'Create account' : 'Sign in')}
                </Text>
              </View>
            ) : (
              <LinearGradient
                colors={[C.amber, C.amberMid]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={s.ctaBase}
              >
                <Text style={s.ctaText}>
                  {isSignup ? 'Create account' : 'Sign in'}
                </Text>
              </LinearGradient>
            )}
          </Pressable>
        </View>
      </View>}
      </SafeAreaView>
    </View>
  );
}

const s = StyleSheet.create({
  root:    { flex: 1, backgroundColor: C.background },
  content: { paddingHorizontal: 28, paddingTop: 12, paddingBottom: 110, gap: 20 },

  back:     { alignSelf: 'flex-start', paddingVertical: 6 },
  backText: { fontFamily: F.bodyMedium, fontSize: 15, color: C.textSecondary },

  hlArea:      { alignItems: 'center', gap: 8, paddingVertical: 16 },
  headline:    { fontFamily: F.heading, fontSize: 26, color: C.text, textAlign: 'center', letterSpacing: -0.3 },
  headlineSub: { fontFamily: F.body, fontSize: 14, color: C.textSecondary, textAlign: 'center', lineHeight: 20 },

  formCard: {
    borderRadius:    20,
    padding:         22,
    gap:             18,
    backgroundColor: C.surface,
    borderWidth:     1,
    borderColor:     C.border,
    borderTopWidth:  1,
    borderTopColor:  C.borderHi,
    shadowColor:     '#000000',
    shadowOffset:    { width: 0, height: 6 },
    shadowOpacity:   0.35,
    shadowRadius:    20,
    elevation:       4,
  },
  field: { gap: 6 },
  fieldLabel: {
    fontFamily:    F.label,
    fontSize:      11,
    letterSpacing: 0.8,
    color:         C.textMuted,
    textTransform: 'uppercase',
  },
  inputWrap: {
    borderRadius:    14,
    backgroundColor: C.inputBg,
    borderWidth:     1,
    borderColor:     C.inputBorder,
    borderTopWidth:  1,
    borderTopColor:  C.inputHighlight,
  },
  inputRow:     { flexDirection: 'row', alignItems: 'center' },
  inputFocused: { borderColor: C.borderFocus },
  input: {
    fontFamily:        F.body,
    fontSize:          16,
    color:             C.text,
    paddingHorizontal: 16,
    paddingVertical:   14,
  },
  eyeBtn:  { paddingHorizontal: 14, paddingVertical: 12 },
  eyeIcon: { fontSize: 18, opacity: 0.5 },
  pwHint:  { fontFamily: F.body, fontSize: 12, color: C.textMuted },

  errorText: { fontFamily: F.body, fontSize: 14, color: C.sos, textAlign: 'center' },

  forgotBtn:  { alignSelf: 'center', paddingVertical: 4 },
  forgotText: { fontFamily: F.bodyMedium, fontSize: 13, color: C.textSecondary, textDecorationLine: 'underline' },

  linkBtn:    { alignSelf: 'center', paddingVertical: 8 },
  linkText:   { fontFamily: F.body, fontSize: 14, color: C.textSecondary, textAlign: 'center' },
  linkAccent: { fontFamily: F.bodySemi, color: C.amberLight },

  // ─── Confirm-email state ───
  confirmWrap: { flex: 1, alignItems: 'center', paddingTop: 48, gap: 16 },
  confirmIcon: { fontSize: 48, lineHeight: 56 },
  emailDisplay: { fontFamily: F.bodySemi, color: C.amberLight },
  confirmHint: {
    fontFamily:        F.body,
    fontSize:          14,
    color:             C.textSecondary,
    textAlign:         'center',
    lineHeight:        21,
    paddingHorizontal: 8,
  },

  stickyWrap: { position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 10 },
  stickyFade: { height: 36 },
  stickyContent: {
    backgroundColor:   C.background,
    paddingHorizontal: 28,
    paddingTop:        4,
    paddingBottom:     28,
  },
  ctaBase: {
    borderRadius:   18,
    minHeight:      56,
    alignItems:     'center',
    justifyContent: 'center',
    shadowColor:    C.amber,
    shadowOffset:   { width: 0, height: 6 },
    shadowOpacity:  0.35,
    shadowRadius:   20,
    elevation:      4,
  },
  ctaDisabled: { backgroundColor: C.disabled, shadowOpacity: 0, elevation: 0 },
  ctaText:     { fontFamily: F.subheading, fontSize: 16, color: '#FFFFFF', letterSpacing: 0.3 },
});
