// app/auth/forgot-password.tsx
// Forgot password — email form → "check your inbox" confirmation state.

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
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '../../src/lib/supabase';
import { colors as C, fonts as F } from '../../src/theme/colors';

export default function ForgotPasswordScreen() {
  const [email, setEmail]     = useState('');
  const [focused, setFocused] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sent, setSent]       = useState(false);
  const [error, setError]     = useState('');

  const canSubmit = email.trim().length > 0 && !loading;

  const handleSend = async () => {
    if (!canSubmit) return;
    setError('');
    setLoading(true);
    try {
      const { error: authErr } = await supabase.auth.resetPasswordForEmail(
        email.trim().toLowerCase(),
        { redirectTo: 'sturdy://password-reset' },
      );
      if (authErr) throw authErr;
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/auth?mode=signin' as any);
  };

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
          <Pressable onPress={handleBack} style={s.back} hitSlop={8}>
            <Text style={s.backText}>← Back</Text>
          </Pressable>

          {sent ? (
            <View style={s.sentWrap}>
              <Text style={s.sentIcon}>📬</Text>
              <Text style={s.headline}>Check your inbox</Text>
              <Text style={s.headlineSub}>
                We sent a reset link to{'\n'}
                <Text style={s.emailDisplay}>{email.trim()}</Text>
              </Text>
              <Text style={s.hint}>
                Tap the link in the email and you'll be taken back to set a new password.
                Check your spam folder if you don't see it within a minute.
              </Text>
              <Pressable
                onPress={() => router.replace('/auth?mode=signin' as any)}
                style={({ pressed }) => [s.signinLink, pressed && { opacity: 0.6 }]}
              >
                <Text style={s.signinLinkText}>Back to sign in</Text>
              </Pressable>
            </View>
          ) : (
            <>
              <View style={s.hlArea}>
                <Text style={s.headline}>Reset your password</Text>
                <Text style={s.headlineSub}>
                  Enter your email and we'll send a reset link.
                </Text>
              </View>

              <View style={s.formCard}>
                <View style={s.field}>
                  <Text style={s.fieldLabel}>EMAIL</Text>
                  <View style={[s.inputWrap, focused && s.inputFocused]}>
                    <TextInput
                      autoCapitalize="none"
                      autoCorrect={false}
                      keyboardType="email-address"
                      autoComplete="email"
                      autoFocus
                      placeholder="you@example.com"
                      placeholderTextColor={C.inputPlaceholder}
                      value={email}
                      onChangeText={(v) => { setEmail(v); if (error) setError(''); }}
                      onFocus={() => setFocused(true)}
                      onBlur={() => setFocused(false)}
                      style={s.input}
                      editable={!loading}
                      returnKeyType="send"
                      onSubmitEditing={handleSend}
                    />
                  </View>
                </View>
              </View>

              {error ? <Text style={s.errorText}>{error}</Text> : null}
            </>
          )}
        </ScrollView>
        </KeyboardAvoidingView>

        {!sent && (
          <View style={s.stickyWrap}>
            <LinearGradient
              colors={['transparent', 'rgba(12,12,12,0.85)', C.background]}
              locations={[0, 0.45, 0.85]}
              style={s.stickyFade}
              pointerEvents="none"
            />
            <View style={s.stickyContent}>
              <Pressable
                onPress={handleSend}
                disabled={!canSubmit}
                style={({ pressed }) => [
                  pressed && canSubmit && { opacity: 0.92, transform: [{ scale: 0.98 }] },
                ]}
                accessibilityRole="button"
              >
                {!canSubmit || loading ? (
                  <View style={[s.ctaBase, s.ctaDisabled]}>
                    <Text style={[s.ctaText, { color: C.disabledText }]}>
                      {loading ? 'Sending…' : 'Send reset link'}
                    </Text>
                  </View>
                ) : (
                  <LinearGradient
                    colors={[C.amber, C.amberMid]}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                    style={s.ctaBase}
                  >
                    <Text style={s.ctaText}>Send reset link</Text>
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
  inputFocused: { borderColor: C.borderFocus },
  input: {
    fontFamily:        F.body,
    fontSize:          16,
    color:             C.text,
    paddingHorizontal: 16,
    paddingVertical:   14,
  },

  errorText: { fontFamily: F.body, fontSize: 14, color: C.sos, textAlign: 'center' },

  // ─── Sent state ───
  sentWrap: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 32,
    gap: 16,
  },
  sentIcon: { fontSize: 48, lineHeight: 56 },
  emailDisplay: {
    fontFamily: F.bodySemi,
    color:      C.amberLight,
  },
  hint: {
    fontFamily:  F.body,
    fontSize:    14,
    color:       C.textSecondary,
    textAlign:   'center',
    lineHeight:  21,
    paddingHorizontal: 8,
  },
  signinLink:     { marginTop: 8, paddingVertical: 10 },
  signinLinkText: { fontFamily: F.bodyMedium, fontSize: 15, color: C.amberLight, textDecorationLine: 'underline' },

  // ─── Sticky CTA ───
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
