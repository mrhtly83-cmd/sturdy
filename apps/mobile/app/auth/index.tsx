// app/auth/index.tsx
// v5 — Twilight × Obsidian Gold
// Theme: pure night sky gradient + stars + gold horizon glow replacing
// golden-particles-bg.png. All auth logic, states, and navigation
// preserved verbatim from v4.

import AsyncStorage from '@react-native-async-storage/async-storage';
import { useState } from 'react';
import {
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

const { width: W, height: H } = Dimensions.get('window');
import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar }      from 'expo-status-bar';
import { SafeAreaView }   from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase }       from '../../src/lib/supabase';
import { markOnboardingComplete } from '../../src/utils/onboarding';
import { useAuth }        from '../../src/context/AuthContext';
import { fonts as F }     from '../../src/theme/colors';

// ─── Theme Tokens (Twilight × Obsidian Gold — locked) ────────────────────────
const T = {
  // Sky — pure near-black, warm undertone, zero blue/purple
  skyGradient: [
    '#020202', '#040403', '#060604', '#080705',
    '#0a0906', '#0c0a07', '#0d0b08', '#0e0c08',
    '#0d0b07', '#0c0a06', '#0a0806', '#080605', '#050402',
  ] as const,
  skyLocations: [0, 0.08, 0.16, 0.24, 0.32, 0.40, 0.46, 0.52, 0.58, 0.64, 0.76, 0.88, 1] as const,
  skyBase: '#020202',

  // Gold accent
  gold:          '#c9a85c',
  goldMid:       '#a8843a',
  goldDeep:      '#8a6820',
  goldBorder:    'rgba(184,142,74,0.22)',
  goldBorderHi:  'rgba(220,185,110,0.10)',
  goldFocused:   'rgba(184,142,74,0.55)',
  goldFaint:     'rgba(184,142,74,0.08)',
  goldDisabled:  'rgba(184,142,74,0.18)',

  // Card surface — matches locked card tokens
  cardBg:        'rgba(255,255,255,0.04)',
  inputBg:       'rgba(255,255,255,0.03)',
  inputBorder:   'rgba(184,142,74,0.18)',
  inputHighlight:'rgba(220,185,110,0.07)',

  // Horizon glow
  horizon0:      'rgba(120,80,10,0.22)',
  horizon1:      'rgba(160,105,15,0.14)',
  horizon2:      'rgba(184,142,74,0.08)',

  // Text
  textPrimary:   'rgba(248,238,212,0.97)',
  textSecondary: 'rgba(200,175,120,0.55)',
  textMuted:     'rgba(184,142,74,0.45)',
  textGold:      'rgba(200,162,74,0.95)',
  textError:     'rgba(220,80,80,0.9)',

  // Sticky bar
  barBg:         '#020202',
  stickyBg:      '#020202',

  // Disabled state
  disabled:      'rgba(255,255,255,0.06)',
  disabledText:  'rgba(200,175,120,0.28)',
};

// ─── Stars — decimal fractions of screen, converted to px in render ──────────
// top/left are 0–1 fractions; multiplied by H/W in the Background component.
const STARS: { t: number; l: number; size: number; opacity: number }[] = [
  { t: 0.04, l: 0.12, size: 2,   opacity: 1.0  },
  { t: 0.02, l: 0.67, size: 2.5, opacity: 1.0  },
  { t: 0.07, l: 0.88, size: 2,   opacity: 1.0  },
  { t: 0.05, l: 0.45, size: 3,   opacity: 1.0  },
  { t: 0.09, l: 0.28, size: 2,   opacity: 0.95 },
  { t: 0.12, l: 0.78, size: 2.5, opacity: 0.95 },
  { t: 0.15, l: 0.58, size: 2,   opacity: 0.9  },
  { t: 0.18, l: 0.05, size: 2,   opacity: 0.9  },
  { t: 0.03, l: 0.93, size: 2.5, opacity: 0.95 },
  { t: 0.22, l: 0.38, size: 2,   opacity: 0.85 },
  { t: 0.06, l: 0.20, size: 1.5, opacity: 0.85 },
  { t: 0.08, l: 0.52, size: 1.5, opacity: 0.80 },
  { t: 0.05, l: 0.82, size: 1.5, opacity: 0.85 },
  { t: 0.13, l: 0.35, size: 1.5, opacity: 0.80 },
  { t: 0.17, l: 0.70, size: 1.5, opacity: 0.80 },
  { t: 0.24, l: 0.16, size: 1.5, opacity: 0.75 },
  { t: 0.26, l: 0.60, size: 1.5, opacity: 0.75 },
  { t: 0.20, l: 0.90, size: 1.5, opacity: 0.75 },
  { t: 0.30, l: 0.48, size: 1.5, opacity: 0.70 },
  { t: 0.30, l: 0.08, size: 1.5, opacity: 0.70 },
  { t: 0.10, l: 0.07, size: 1,   opacity: 0.70 },
  { t: 0.14, l: 0.95, size: 1,   opacity: 0.70 },
  { t: 0.18, l: 0.30, size: 1,   opacity: 0.65 },
  { t: 0.16, l: 0.18, size: 1,   opacity: 0.65 },
  { t: 0.22, l: 0.80, size: 1,   opacity: 0.60 },
  { t: 0.27, l: 0.40, size: 1,   opacity: 0.60 },
  { t: 0.28, l: 0.96, size: 1,   opacity: 0.50 },
  { t: 0.33, l: 0.14, size: 1,   opacity: 0.45 },
  { t: 0.35, l: 0.50, size: 1,   opacity: 0.40 },
];

// ─── Background component ─────────────────────────────────────────────────────
const Background = () => (
  <>
    {/* Night sky gradient */}
    <LinearGradient
      colors={T.skyGradient}
      locations={T.skyLocations}
      style={StyleSheet.absoluteFill}
    />
    {/* Static star field — t/l are 0-1 fractions multiplied to px */}
    {STARS.map((star, i) => (
      <View
        key={i}
        style={{
          position:        'absolute',
          top:             star.t * H,
          left:            star.l * W,
          width:           star.size,
          height:          star.size,
          borderRadius:    star.size / 2,
          backgroundColor: `rgba(255,248,225,${star.opacity})`,
        }}
      />
    ))}
    {/* Gold horizon glow from bottom */}
    <LinearGradient
      colors={['transparent', T.horizon0]}
      locations={[0.4, 1]}
      style={StyleSheet.absoluteFill}
    />
    <LinearGradient
      colors={['transparent', T.horizon1]}
      locations={[0.5, 1]}
      style={StyleSheet.absoluteFill}
    />
    <LinearGradient
      colors={['transparent', T.horizon2]}
      locations={[0.6, 1]}
      style={StyleSheet.absoluteFill}
    />
  </>
);

// ─── Types (preserved from v4) ────────────────────────────────────────────────
const PENDING_CHILD_KEY = 'sturdy_pending_child_v1';
type Mode = 'signup' | 'signin';
function isMode(v: unknown): v is Mode { return v === 'signup' || v === 'signin'; }
type ScreenState = 'form' | 'confirm-email';

// ─── Screen ───────────────────────────────────────────────────────────────────
export default function AuthScreen() {
  const params = useLocalSearchParams<{ mode?: string }>();
  const initialMode: Mode = isMode(params.mode) ? params.mode : 'signup';
  const { signInWithEmail } = useAuth();

  const [mode, setMode]               = useState<Mode>(initialMode);
  const [screenState, setScreenState] = useState<ScreenState>('form');
  const [email, setEmail]             = useState('');
  const [password, setPassword]       = useState('');
  const [showPw, setShowPw]           = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [pwFocused, setPwFocused]     = useState(false);
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState('');

  const isSignup   = mode === 'signup';
  const minPwLen   = isSignup ? 6 : 1;
  const canSubmit  = email.trim().length > 0 && password.length >= minPwLen;

  // ─── Submit — preserved verbatim from v4 ──────────────────────────────────
  const handleSubmit = async () => {
    if (!canSubmit || loading) return;
    setError('');
    setLoading(true);
    try {
      const e = email.trim().toLowerCase();
      if (isSignup) {
        const { data: signUpData, error: authErr } = await supabase.auth.signUp({ email: e, password });
        if (authErr) throw authErr;
        try {
          const pendingRaw = await AsyncStorage.getItem(PENDING_CHILD_KEY);
          if (pendingRaw) {
            const pending = JSON.parse(pendingRaw);
            const { data: { user } } = await supabase.auth.getUser();
            if (user && pending.name && pending.age) {
              await supabase.from('child_profiles').insert({
                user_id:   user.id,
                name:      pending.name,
                child_age: pending.age,
                age_band:  pending.age <= 4 ? '2-4' : pending.age <= 7 ? '5-7' : '8-12',
                neurotype: pending.neurotype ?? [],
              });
            }
            await AsyncStorage.removeItem(PENDING_CHILD_KEY);
          }
        } catch { /* non-blocking */ }
        await markOnboardingComplete();
        if (!signUpData.session) { setScreenState('confirm-email'); return; }
      } else {
        await signInWithEmail(e, password);
        await markOnboardingComplete();
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
      <Background />

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

            {/* ─── Confirm email state ─── */}
            {screenState === 'confirm-email' ? (
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

            ) : (
              /* ─── Form state ─── */
              <>
                <Pressable onPress={handleBack} style={s.back} hitSlop={8}>
                  <Text style={s.backText}>← Back</Text>
                </Pressable>

                <View style={s.hlArea}>
                  <Text style={s.headline}>
                    {isSignup ? 'Create account' : 'Welcome back'}
                  </Text>
                  <Text style={s.headlineSub}>
                    {isSignup
                      ? 'Save scripts and personalise for your child.'
                      : 'Sign in to continue'}
                  </Text>
                </View>

                {/* ─── Form card — locked glass style ─── */}
                <View style={s.formCard}>

                  {/* Email field */}
                  <View style={s.field}>
                    <Text style={s.fieldLabel}>EMAIL</Text>
                    <View style={[s.inputWrap, emailFocused && s.inputFocused]}>
                      <TextInput
                        autoCapitalize="none"
                        autoCorrect={false}
                        keyboardType="email-address"
                        autoComplete="email"
                        placeholder="you@example.com"
                        placeholderTextColor={T.textMuted}
                        value={email}
                        onChangeText={(v) => { setEmail(v); if (error) setError(''); }}
                        onFocus={() => setEmailFocused(true)}
                        onBlur={() => setEmailFocused(false)}
                        style={s.input}
                        editable={!loading}
                      />
                    </View>
                  </View>

                  {/* Password field */}
                  <View style={s.field}>
                    <Text style={s.fieldLabel}>PASSWORD</Text>
                    <View style={[s.inputWrap, pwFocused && s.inputFocused, s.inputRow]}>
                      <TextInput
                        secureTextEntry={!showPw}
                        autoCapitalize="none"
                        autoCorrect={false}
                        autoComplete={isSignup ? 'password-new' : 'password'}
                        placeholder={isSignup ? 'Choose a password' : 'Enter your password'}
                        placeholderTextColor={T.textMuted}
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
                    {isSignup && <Text style={s.pwHint}>Use at least 6 characters.</Text>}
                  </View>

                </View>

                {/* Error */}
                {error ? <Text style={s.errorText}>{error}</Text> : null}

                {/* Forgot password — sign in only */}
                {!isSignup && (
                  <Pressable
                    onPress={() => router.push('/auth/forgot-password' as any)}
                    style={({ pressed }) => [s.forgotBtn, pressed && { opacity: 0.6 }]}
                    accessibilityRole="button"
                  >
                    <Text style={s.forgotText}>Forgot password?</Text>
                  </Pressable>
                )}

                {/* Mode toggle */}
                <Pressable
                  onPress={() => switchMode(isSignup ? 'signin' : 'signup')}
                  style={({ pressed }) => [s.linkBtn, pressed && { opacity: 0.6 }]}
                  accessibilityRole="button"
                  disabled={loading}
                >
                  <Text style={s.linkText}>
                    {isSignup ? 'Already have an account? ' : "Don't have an account? "}
                    <Text style={s.linkAccent}>
                      {isSignup ? 'Sign in' : 'Sign up free'}
                    </Text>
                  </Text>
                </Pressable>
              </>
            )}

          </ScrollView>
        </KeyboardAvoidingView>

        {/* ─── Sticky CTA ─── */}
        {screenState !== 'confirm-email' && (
          <View style={s.stickyWrap}>
            {/* Fade scrim */}
            <LinearGradient
              colors={['transparent', 'rgba(2,2,2,0.88)', T.stickyBg]}
              locations={[0, 0.45, 0.85]}
              style={s.stickyFade}
              pointerEvents="none"
            />
            <View style={s.stickyContent}>
              <Pressable
                onPress={handleSubmit}
                disabled={!canSubmit || loading}
                style={({ pressed }) => [
                  pressed && canSubmit && !loading && {
                    opacity: 0.92,
                    transform: [{ scale: 0.98 }],
                  },
                ]}
                accessibilityRole="button"
              >
                {/* Disabled / loading state */}
                {(!canSubmit || loading) ? (
                  <View style={[s.ctaBase, s.ctaDisabled]}>
                    <Text style={[s.ctaText, s.ctaTextDisabled]}>
                      {loading
                        ? (isSignup ? 'Creating account…' : 'Signing in…')
                        : (isSignup ? 'Create account' : 'Sign in')}
                    </Text>
                  </View>
                ) : (
                  /* Active — gold gradient */
                  <LinearGradient
                    colors={[T.gold, T.goldMid, T.goldDeep]}
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
        )}

      </SafeAreaView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root:    { flex: 1, backgroundColor: T.skyBase },
  content: { paddingHorizontal: 28, paddingTop: 12, paddingBottom: 110, gap: 20 },

  // Back button
  back:     { alignSelf: 'flex-start', paddingVertical: 6 },
  backText: {
    fontFamily: F.bodyMedium,
    fontSize:   15,
    color:      'rgba(200,175,120,0.65)',
  },

  // Header
  hlArea: { alignItems: 'center', gap: 8, paddingVertical: 16 },
  headline: {
    fontFamily:    F.heading,
    fontSize:      28,
    color:         'rgba(248,238,212,0.97)',
    textAlign:     'center',
    letterSpacing: -0.3,
  },
  headlineSub: {
    fontFamily:  F.body,
    fontSize:    14,
    color:       'rgba(200,175,120,0.50)',
    textAlign:   'center',
    lineHeight:  20,
  },

  // Form card — locked glass token
  formCard: {
    borderRadius:    18,
    padding:         20,
    gap:             16,
    backgroundColor: T.cardBg,
    borderWidth:     0.5,
    borderColor:     T.goldBorder,
    // Top highlight edge
    shadowColor:     '#000',
    shadowOffset:    { width: 0, height: 8 },
    shadowOpacity:   0.45,
    shadowRadius:    24,
    elevation:       6,
  },

  // Fields
  field:      { gap: 7 },
  fieldLabel: {
    fontFamily:    F.label,
    fontSize:      10,
    letterSpacing: 1.2,
    color:         'rgba(184,142,74,0.55)',
    textTransform: 'uppercase',
  },

  // Input wrapper
  inputWrap: {
    borderRadius:    12,
    backgroundColor: T.inputBg,
    borderWidth:     0.5,
    borderColor:     T.inputBorder,
  },
  inputFocused: {
    borderColor:  T.goldFocused,
    shadowColor:  T.gold,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation:    2,
  },
  inputRow: { flexDirection: 'row', alignItems: 'center' },
  input: {
    fontFamily:        F.body,
    fontSize:          16,
    color:             'rgba(230,210,165,0.85)',
    paddingHorizontal: 16,
    paddingVertical:   13,
  },
  eyeBtn:  { paddingHorizontal: 14, paddingVertical: 12 },
  eyeIcon: { fontSize: 17, opacity: 0.45 },
  pwHint:  {
    fontFamily: F.body,
    fontSize:   11,
    color:      'rgba(184,142,74,0.35)',
  },

  // Error
  errorText: {
    fontFamily:  F.body,
    fontSize:    14,
    color:       T.textError,
    textAlign:   'center',
  },

  // Forgot password
  forgotBtn:  { alignSelf: 'center', paddingVertical: 4 },
  forgotText: {
    fontFamily:          F.bodyMedium,
    fontSize:            13,
    color:               'rgba(200,175,120,0.55)',
    textDecorationLine:  'underline',
  },

  // Mode toggle
  linkBtn:    { alignSelf: 'center', paddingVertical: 8 },
  linkText:   {
    fontFamily:  F.body,
    fontSize:    14,
    color:       'rgba(200,175,120,0.48)',
    textAlign:   'center',
  },
  linkAccent: {
    fontFamily: F.bodySemi,
    color:      T.textGold,
  },

  // Confirm-email state
  confirmWrap: { flex: 1, alignItems: 'center', paddingTop: 48, gap: 16 },
  confirmIcon: { fontSize: 48, lineHeight: 56 },
  emailDisplay: {
    fontFamily: F.bodySemi,
    color:      T.textGold,
  },
  confirmHint: {
    fontFamily:        F.body,
    fontSize:          14,
    color:             'rgba(200,175,120,0.55)',
    textAlign:         'center',
    lineHeight:        21,
    paddingHorizontal: 8,
  },

  // Sticky CTA bar
  stickyWrap: {
    position: 'absolute',
    bottom:   0,
    left:     0,
    right:    0,
    zIndex:   10,
  },
  stickyFade: { height: 36 },
  stickyContent: {
    backgroundColor:   T.stickyBg,
    paddingHorizontal: 28,
    paddingTop:        4,
    paddingBottom:     28,
  },

  // CTA button
  ctaBase: {
    borderRadius:   18,
    minHeight:      56,
    alignItems:     'center',
    justifyContent: 'center',
    shadowColor:    '#c9a85c',
    shadowOffset:   { width: 0, height: 6 },
    shadowOpacity:  0.28,
    shadowRadius:   20,
    elevation:      6,
  },
  ctaDisabled: {
    backgroundColor: T.disabled,
    shadowOpacity:   0,
    elevation:       0,
    borderWidth:     0.5,
    borderColor:     T.goldDisabled,
  },
  ctaText: {
    fontFamily:    F.subheading,
    fontSize:      16,
    color:         '#1a1200',
    letterSpacing: 0.3,
    fontWeight:    '700',
  },
  ctaTextDisabled: {
    color: T.disabledText,
  },

  // Reuse T.stickyBg for backgroundColor inline where needed
});
