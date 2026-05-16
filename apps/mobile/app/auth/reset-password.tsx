// app/auth/reset-password.tsx
// New password form — shown after the user taps the reset link in their email.
// The deep link handler in app/_layout.tsx detects the recovery URL and
// navigates here with accessToken + refreshToken as params.
// On submit we establish the session then immediately update the password.

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
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '../../src/lib/supabase';
import { colors as C, fonts as F } from '../../src/theme/colors';

export default function ResetPasswordScreen() {
  const { accessToken, refreshToken } = useLocalSearchParams<{
    accessToken?: string;
    refreshToken?: string;
  }>();

  const [password, setPassword]             = useState('');
  const [confirm, setConfirm]               = useState('');
  const [showPw, setShowPw]                 = useState(false);
  const [pwFocused, setPwFocused]           = useState(false);
  const [confirmFocused, setConfirmFocused] = useState(false);
  const [loading, setLoading]               = useState(false);
  const [error, setError]                   = useState('');

  const mismatch  = confirm.length > 0 && password !== confirm;
  const canSubmit = password.length >= 6 && password === confirm && !loading;

  const handleSet = async () => {
    if (!canSubmit) return;
    setError('');
    setLoading(true);
    try {
      if (!accessToken || !refreshToken) {
        throw new Error('Reset link is invalid or has expired. Request a new one.');
      }

      const { error: sessionErr } = await supabase.auth.setSession({
        access_token:  accessToken,
        refresh_token: refreshToken,
      });
      if (sessionErr) throw sessionErr;

      const { error: updateErr } = await supabase.auth.updateUser({ password });
      if (updateErr) throw updateErr;

      // Session is now established with the new password — AuthGate routes to /(tabs).
      router.replace('/(tabs)' as any);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update password. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const hasTokens = !!accessToken && !!refreshToken;

  return (
    <View style={s.root}>
      <StatusBar style="light" />
      <LinearGradient
        colors={[C.gradientTop, C.gradientMid1, C.gradientMid2, C.gradientMid3, C.gradientMid4, C.gradientBottom]}
        locations={[0, 0.14, 0.28, 0.42, 0.58, 1]}
        style={StyleSheet.absoluteFill}
      />
      <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
        <ScrollView
          contentContainerStyle={s.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {!hasTokens ? (
            <View style={s.invalidWrap}>
              <Text style={s.headline}>Link expired</Text>
              <Text style={s.headlineSub}>
                This reset link is no longer valid. Request a new one from the sign-in screen.
              </Text>
              <Pressable
                onPress={() => router.replace('/auth?mode=signin' as any)}
                style={({ pressed }) => [s.backLink, pressed && { opacity: 0.6 }]}
              >
                <Text style={s.backLinkText}>Back to sign in</Text>
              </Pressable>
            </View>
          ) : (
            <>
              <View style={s.hlArea}>
                <Text style={s.headline}>Set new password</Text>
                <Text style={s.headlineSub}>Choose something you'll remember.</Text>
              </View>

              <View style={s.formCard}>
                <View style={s.field}>
                  <Text style={s.fieldLabel}>NEW PASSWORD</Text>
                  <View style={[s.inputWrap, pwFocused && s.inputFocused, s.inputRow]}>
                    <TextInput
                      secureTextEntry={!showPw}
                      autoCapitalize="none"
                      autoCorrect={false}
                      autoComplete="password-new"
                      autoFocus
                      placeholder="At least 6 characters"
                      placeholderTextColor={C.inputPlaceholder}
                      value={password}
                      onChangeText={(v) => { setPassword(v); if (error) setError(''); }}
                      onFocus={() => setPwFocused(true)}
                      onBlur={() => setPwFocused(false)}
                      style={[s.input, { flex: 1 }]}
                      editable={!loading}
                    />
                    <Pressable
                      onPress={() => setShowPw(v => !v)}
                      style={s.eyeBtn}
                      hitSlop={8}
                      accessibilityRole="button"
                      accessibilityLabel={showPw ? 'Hide password' : 'Show password'}
                    >
                      <Text style={s.eyeIcon}>{showPw ? '🙈' : '👁'}</Text>
                    </Pressable>
                  </View>
                  <Text style={s.pwHint}>Use at least 6 characters.</Text>
                </View>

                <View style={s.field}>
                  <Text style={s.fieldLabel}>CONFIRM PASSWORD</Text>
                  <View style={[s.inputWrap, confirmFocused && s.inputFocused, mismatch && s.inputError]}>
                    <TextInput
                      secureTextEntry={!showPw}
                      autoCapitalize="none"
                      autoCorrect={false}
                      autoComplete="password-new"
                      placeholder="Repeat password"
                      placeholderTextColor={C.inputPlaceholder}
                      value={confirm}
                      onChangeText={(v) => { setConfirm(v); if (error) setError(''); }}
                      onFocus={() => setConfirmFocused(true)}
                      onBlur={() => setConfirmFocused(false)}
                      style={s.input}
                      editable={!loading}
                      returnKeyType="go"
                      onSubmitEditing={handleSet}
                    />
                  </View>
                  {mismatch ? <Text style={s.mismatchText}>Passwords don't match.</Text> : null}
                </View>
              </View>

              {error ? <Text style={s.errorText}>{error}</Text> : null}
            </>
          )}
        </ScrollView>
        </KeyboardAvoidingView>

        {hasTokens && (
          <View style={s.stickyWrap}>
            <LinearGradient
              colors={['transparent', 'rgba(12,12,12,0.85)', C.background]}
              locations={[0, 0.45, 0.85]}
              style={s.stickyFade}
              pointerEvents="none"
            />
            <View style={s.stickyContent}>
              <Pressable
                onPress={handleSet}
                disabled={!canSubmit}
                style={({ pressed }) => [
                  pressed && canSubmit && { opacity: 0.92, transform: [{ scale: 0.98 }] },
                ]}
                accessibilityRole="button"
              >
                {!canSubmit || loading ? (
                  <View style={[s.ctaBase, s.ctaDisabled]}>
                    <Text style={[s.ctaText, { color: C.disabledText }]}>
                      {loading ? 'Setting password…' : 'Set new password'}
                    </Text>
                  </View>
                ) : (
                  <LinearGradient
                    colors={[C.amber, C.amberMid]}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                    style={s.ctaBase}
                  >
                    <Text style={s.ctaText}>Set new password</Text>
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

const s = StyleSheet.create({
  root:    { flex: 1, backgroundColor: C.background },
  content: { paddingHorizontal: 28, paddingTop: 12, paddingBottom: 110, gap: 20 },

  hlArea:      { alignItems: 'center', gap: 8, paddingVertical: 16 },
  headline:    { fontFamily: F.heading, fontSize: 26, color: C.text, textAlign: 'center', letterSpacing: -0.3 },
  headlineSub: { fontFamily: F.body, fontSize: 14, color: C.textSecondary, textAlign: 'center', lineHeight: 20 },

  invalidWrap: { flex: 1, alignItems: 'center', paddingTop: 60, gap: 16 },
  backLink:    { marginTop: 8, paddingVertical: 10 },
  backLinkText: { fontFamily: F.bodyMedium, fontSize: 15, color: C.amberLight, textDecorationLine: 'underline' },

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
  field:      { gap: 6 },
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
  inputError:   { borderColor: C.sos },
  input: {
    fontFamily:        F.body,
    fontSize:          16,
    color:             C.text,
    paddingHorizontal: 16,
    paddingVertical:   14,
  },
  eyeBtn:      { paddingHorizontal: 14, paddingVertical: 12 },
  eyeIcon:     { fontSize: 18, opacity: 0.5 },
  pwHint:      { fontFamily: F.body, fontSize: 12, color: C.textMuted },
  mismatchText: { fontFamily: F.body, fontSize: 12, color: C.sos },

  errorText: { fontFamily: F.body, fontSize: 14, color: C.sos, textAlign: 'center' },

  stickyWrap:    { position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 10 },
  stickyFade:    { height: 36 },
  stickyContent: { backgroundColor: C.background, paddingHorizontal: 28, paddingTop: 4, paddingBottom: 28 },
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
