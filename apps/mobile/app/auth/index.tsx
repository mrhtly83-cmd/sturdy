// app/auth/index.tsx
// Unified auth screen — sign-in and sign-up merged into one surface.
// v3 dark identity (solid #0e0a10, glass card, amber gradient CTA).
//
// Mode is read from `?mode=` query param; defaults to 'signup' when
// missing. Tapping the toggle link switches mode without remounting.
//
// Replaces the two prior screens:
//   - app/auth/sign-in.tsx
//   - app/auth/sign-up.tsx
//
// Other files updated their route refs from /auth/sign-in →
// /auth?mode=signin and /auth/sign-up → /auth.

import AsyncStorage from '@react-native-async-storage/async-storage';
import { useState } from 'react';
import {
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
import { useAuth }        from '../../src/context/AuthContext';
import { fonts as F }     from '../../src/theme/colors';

// ═══════════════════════════════════════════════
// V3 DARK TOKENS (hardcoded — this screen owns its identity even when
// the global theme is mid-transition elsewhere in the app)
// ═══════════════════════════════════════════════

const BG          = '#0e0a10';
const SURFACE     = 'rgba(255,255,255,0.055)';
const BORDER      = 'rgba(255,255,255,0.07)';
const INPUT_BG    = 'rgba(255,255,255,0.06)';
const INPUT_FOCUS = 'rgba(212,148,74,0.40)';
const TEXT        = 'rgba(255,255,255,0.92)';
const TEXT_SEC    = 'rgba(255,255,255,0.52)';
const TEXT_MUTED  = 'rgba(255,255,255,0.28)';
const AMBER       = '#D4944A';                          // toggle accent
const AMBER_DEEP  = '#C8883A';                          // CTA gradient start
const AMBER_LIGHT = '#E8A855';                          // CTA gradient end
const CORAL_SOS   = '#E87461';                          // error / SOS only
const DISABLED_BG = 'rgba(255,255,255,0.06)';

const PENDING_CHILD_KEY = 'sturdy_pending_child_v1';

type Mode = 'signup' | 'signin';

function isMode(v: unknown): v is Mode {
  return v === 'signup' || v === 'signin';
}

export default function AuthScreen() {
  const params = useLocalSearchParams<{ mode?: string }>();
  const initialMode: Mode = isMode(params.mode) ? params.mode : 'signup';

  const { signInWithEmail } = useAuth();

  const [mode, setMode]         = useState<Mode>(initialMode);
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
        const { error: authErr } = await supabase.auth.signUp({ email: e, password });
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

        // No router.replace here — AuthGate in _layout.tsx handles
        // post-signup routing once the session lands.
      } else {
        await signInWithEmail(e, password);
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
    <SafeAreaView style={s.root} edges={['top', 'bottom']}>
      <StatusBar style="light" />

      <ScrollView
        contentContainerStyle={s.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
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
                placeholderTextColor={TEXT_MUTED}
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
                placeholderTextColor={TEXT_MUTED}
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
      </ScrollView>

      {/* Sticky CTA with gradient fade into the dark base */}
      <View style={s.stickyWrap}>
        <LinearGradient
          colors={['transparent', 'rgba(14,10,16,0.95)', BG]}
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
                <Text style={[s.ctaText, { color: TEXT_MUTED }]}>
                  {loading
                    ? (isSignup ? 'Creating account…' : 'Signing in…')
                    : (isSignup ? 'Create account' : 'Sign in')}
                </Text>
              </View>
            ) : (
              <LinearGradient
                colors={[AMBER_DEEP, AMBER_LIGHT]}
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
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root:    { flex: 1, backgroundColor: BG },
  content: { paddingHorizontal: 28, paddingTop: 12, paddingBottom: 110, gap: 20 },

  back:     { alignSelf: 'flex-start', paddingVertical: 6 },
  backText: { fontFamily: F.bodyMedium, fontSize: 15, color: TEXT_MUTED },

  hlArea:      { alignItems: 'center', gap: 8, paddingVertical: 16 },
  headline:    { fontFamily: F.heading, fontSize: 26, color: TEXT, textAlign: 'center', letterSpacing: -0.3 },
  headlineSub: { fontFamily: F.body, fontSize: 14, color: TEXT_SEC, textAlign: 'center', lineHeight: 20 },

  formCard: {
    borderRadius: 20,
    padding: 22,
    gap: 18,
    backgroundColor: SURFACE,
    borderWidth: 1, borderColor: BORDER,
  },
  field: { gap: 6 },
  fieldLabel: {
    fontFamily: F.label, fontSize: 11,
    letterSpacing: 0.8, color: TEXT_MUTED,
    textTransform: 'uppercase',
  },
  inputWrap: {
    borderRadius: 14,
    backgroundColor: INPUT_BG,
    borderWidth: 1, borderColor: BORDER,
  },
  inputRow:     { flexDirection: 'row', alignItems: 'center' },
  inputFocused: { borderColor: INPUT_FOCUS },
  input: {
    fontFamily: F.body, fontSize: 16,
    color: TEXT,
    paddingHorizontal: 16, paddingVertical: 14,
  },
  eyeBtn:  { paddingHorizontal: 14, paddingVertical: 12 },
  eyeIcon: { fontSize: 18, opacity: 0.5 },
  pwHint:  { fontFamily: F.body, fontSize: 12, color: TEXT_MUTED },

  errorText: { fontFamily: F.body, fontSize: 14, color: CORAL_SOS, textAlign: 'center' },

  linkBtn:    { alignSelf: 'center', paddingVertical: 8 },
  linkText:   { fontFamily: F.body, fontSize: 14, color: TEXT_SEC, textAlign: 'center' },
  linkAccent: { fontFamily: F.bodySemi, color: AMBER },

  stickyWrap: { position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 10 },
  stickyFade: { height: 36 },
  stickyContent: {
    backgroundColor: BG,
    paddingHorizontal: 28,
    paddingTop: 4,
    paddingBottom: 28,
  },
  ctaBase: {
    borderRadius: 18,
    minHeight: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaDisabled: { backgroundColor: DISABLED_BG },
  ctaText:     { fontFamily: F.subheading, fontSize: 16, color: '#FFFFFF', letterSpacing: 0.3 },
});
