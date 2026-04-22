// app/auth/sign-in.tsx
// v6 — Journal identity: pastel gradient, frosted glass, rose CTA

import { useState } from 'react';
import {
  Dimensions,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { router }           from 'expo-router';
import { StatusBar }        from 'expo-status-bar';
import { SafeAreaView }     from 'react-native-safe-area-context';
import { LinearGradient }   from 'expo-linear-gradient';
import { useAuth }          from '../../src/context/AuthContext';
import { colors as C, fonts as F } from '../../src/theme/colors';

const { width: W } = Dimensions.get('window');

export default function SignInScreen() {
  const { signInWithEmail } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [pwFocused, setPwFocused] = useState(false);

  const handleSignIn = async () => {
    const e = email.trim().toLowerCase();
    if (!e || !password) { setError('Enter your email and password.'); return; }
    setError(''); setLoading(true);
    try {
      await signInWithEmail(e, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign in failed. Please try again.');
    } finally { setLoading(false); }
  };

  const canSubmit = email.trim().length > 0 && password.length > 0;

  return (
    <SafeAreaView style={s.root} edges={['top', 'bottom']}>
      <StatusBar style="dark" />
      <LinearGradient
        colors={[C.gradStart, C.gradMid1, C.gradMid2, C.gradEnd]}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      <ScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <Pressable onPress={() => router.canGoBack() ? router.back() : router.replace('/welcome')} style={s.back}>
          <Text style={s.backText}>← Back</Text>
        </Pressable>

        <View style={s.hlArea}>
          <Text style={s.headline}>Welcome back</Text>
          <Text style={s.headlineSub}>Sign in to continue</Text>
        </View>

        <View style={s.formCard}>
          <View style={s.field}>
            <Text style={s.fieldLabel}>EMAIL</Text>
            <View style={[s.inputWrap, emailFocused && s.inputFocused]}>
              <TextInput
                autoCapitalize="none" autoCorrect={false} keyboardType="email-address" autoComplete="email"
                placeholder="you@example.com" placeholderTextColor={C.textMuted}
                value={email} onChangeText={v => { setEmail(v); if (error) setError(''); }}
                onFocus={() => setEmailFocused(true)} onBlur={() => setEmailFocused(false)}
                style={s.input}
              />
            </View>
          </View>

          <View style={s.field}>
            <Text style={s.fieldLabel}>PASSWORD</Text>
            <View style={[s.inputWrap, pwFocused && s.inputFocused, { flexDirection: 'row', alignItems: 'center' }]}>
              <TextInput
                secureTextEntry={!showPw} autoCapitalize="none" autoCorrect={false} autoComplete="password"
                placeholder="Enter your password" placeholderTextColor={C.textMuted}
                value={password} onChangeText={v => { setPassword(v); if (error) setError(''); }}
                onFocus={() => setPwFocused(true)} onBlur={() => setPwFocused(false)}
                style={[s.input, { flex: 1 }]}
              />
              <Pressable onPress={() => setShowPw(!showPw)} style={s.eyeBtn}>
                <Text style={{ fontSize: 18, opacity: 0.4 }}>{showPw ? '🙈' : '👁'}</Text>
              </Pressable>
            </View>
          </View>

          {error ? <Text style={s.errorText}>{error}</Text> : null}
        </View>

        <Pressable onPress={() => router.push('/auth/sign-up')} style={({ pressed }) => [s.linkBtn, pressed && { opacity: 0.6 }]}>
          <Text style={s.linkText}>Don't have an account? <Text style={s.linkAccent}>Sign up free</Text></Text>
        </Pressable>
      </ScrollView>

      <View style={s.stickyWrap}>
        <LinearGradient colors={['transparent', 'rgba(253,250,245,0.95)', C.base]} locations={[0, 0.4, 0.8]} style={{ height: 30 }} />
        <View style={s.stickyContent}>
          <Pressable onPress={handleSignIn} disabled={!canSubmit || loading}
            style={({ pressed }) => [pressed && canSubmit && { opacity: 0.9, transform: [{ scale: 0.98 }] }]}>
            <View style={[s.btn, (!canSubmit || loading) && s.btnDisabled]}>
              <Text style={[s.btnText, (!canSubmit || loading) && { color: C.textMuted }]}>
                {loading ? 'Signing in…' : 'Sign in'}
              </Text>
            </View>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.base },
  content: { paddingHorizontal: 28, paddingTop: 12, paddingBottom: 100, gap: 20 },

  back: { alignSelf: 'flex-start', paddingVertical: 6 },
  backText: { fontFamily: F.bodyMedium, fontSize: 16, color: C.textMuted },

  hlArea: { alignItems: 'center', gap: 8, paddingVertical: 16 },
  headline: { fontFamily: F.heading, fontSize: 26, color: C.text, textAlign: 'center' },
  headlineSub: { fontFamily: F.body, fontSize: 14, color: C.textSub, textAlign: 'center' },

  formCard: { borderRadius: 24, padding: 22, gap: 18, backgroundColor: C.cardGlass, borderWidth: 1, borderColor: C.border },
  field: { gap: 6 },
  fieldLabel: { fontFamily: F.label, fontSize: 11, letterSpacing: 0.8, color: C.textMuted, textTransform: 'uppercase' },
  inputWrap: { borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.6)', borderWidth: 1, borderColor: C.border },
  inputFocused: { borderColor: 'rgba(129,178,154,0.40)' },
  input: { fontFamily: F.body, fontSize: 16, color: C.text, paddingHorizontal: 16, paddingVertical: 14 },
  eyeBtn: { paddingHorizontal: 14, paddingVertical: 12 },

  errorText: { fontFamily: F.body, fontSize: 14, color: C.rose, textAlign: 'center' },

  linkBtn: { alignSelf: 'center', paddingVertical: 8 },
  linkText: { fontFamily: F.body, fontSize: 14, color: C.textMuted, textAlign: 'center' },
  linkAccent: { fontFamily: F.bodySemi, color: C.rose, textDecorationLine: 'underline' },

  stickyWrap: { position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 10 },
  stickyContent: { backgroundColor: C.base, paddingHorizontal: 28, paddingBottom: 28, paddingTop: 4 },
  btn: { borderRadius: 18, minHeight: 56, alignItems: 'center', justifyContent: 'center', backgroundColor: C.rose },
  btnDisabled: { backgroundColor: 'rgba(0,0,0,0.06)' },
  btnText: { fontFamily: F.subheading, fontSize: 16, color: '#FFFFFF', letterSpacing: 0.3 },
});

