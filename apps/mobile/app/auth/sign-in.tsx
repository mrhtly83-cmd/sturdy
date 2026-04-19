// app/auth/sign-in.tsx
// v5 — Logo palette + amber gradient CTA + glassmorphism
// Matching sign-up screen style

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

function Stars({ count = 25 }: { count?: number }) {
  const [stars] = useState(() =>
    Array.from({ length: count }, () => ({
      top: Math.random() * 40, left: Math.random() * 100,
      size: Math.random() * 1.8 + 0.4, opacity: Math.random() * 0.2 + 0.04,
    }))
  );
  return (
    <View style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '40%', zIndex: 1 }} pointerEvents="none">
      {stars.map((s, i) => (
        <View key={i} style={{ position: 'absolute', top: `${s.top}%` as any, left: `${s.left}%` as any, width: s.size, height: s.size, opacity: s.opacity, borderRadius: 10, backgroundColor: '#FFF' }} />
      ))}
    </View>
  );
}

export default function SignInScreen() {
  const { signInWithEmail } = useAuth();
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw]     = useState(false);
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [pwFocused, setPwFocused]       = useState(false);

  const handleSignIn = async () => {
    const e = email.trim().toLowerCase();
    if (!e || !password) { setError('Enter your email and password.'); return; }
    setError(''); setLoading(true);
    try {
      await signInWithEmail(e, password);
      router.replace('/(tabs)');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign in failed. Please try again.');
    } finally { setLoading(false); }
  };

  const canSubmit = email.trim().length > 0 && password.length > 0;

  return (
    <SafeAreaView style={s.root} edges={['top', 'bottom']}>
      <StatusBar style="light" />

      <LinearGradient
        colors={['#0e0a10', '#14101a', '#1a1622', '#1e1a28', '#201c2a', '#1e1a24', '#1a1620', '#18141e', '#14101a']}
        locations={[0, 0.10, 0.22, 0.35, 0.48, 0.60, 0.72, 0.85, 1]}
        style={StyleSheet.absoluteFill}
      />
      <Stars />
      <LinearGradient
        colors={['transparent', 'rgba(212,148,74,0.03)', 'rgba(212,148,74,0.06)']}
        locations={[0, 0.5, 1]}
        style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '45%', zIndex: 1 }}
        pointerEvents="none"
      />

      <ScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} style={{ zIndex: 2 }}>

        <Pressable onPress={() => router.canGoBack() ? router.back() : router.replace('/welcome')} style={s.back}>
          <Text style={s.backText}>← Back</Text>
        </Pressable>

        <View style={s.hlArea}>
          <Text style={s.headline}>Welcome back</Text>
          <Text style={s.headlineSub}>Sign in to continue</Text>
        </View>

        {/* Form card */}
        <LinearGradient
          colors={['rgba(255,255,255,0.08)', 'rgba(255,255,255,0.02)', 'rgba(0,0,0,0.12)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 0.8, y: 1 }}
          style={s.formCard}
        >
          <View style={s.field}>
            <Text style={s.fieldLabel}>EMAIL</Text>
            <View style={[s.inputWrap, emailFocused && s.inputFocused]}>
              <TextInput
                autoCapitalize="none" autoCorrect={false} keyboardType="email-address"
                autoComplete="email"
                placeholder="you@example.com" placeholderTextColor="rgba(255,255,255,0.18)"
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
                secureTextEntry={!showPw} autoCapitalize="none" autoCorrect={false}
                autoComplete="password"
                placeholder="Enter your password" placeholderTextColor="rgba(255,255,255,0.18)"
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
        </LinearGradient>

        <Pressable onPress={() => router.push('/auth/sign-up')} style={({ pressed }) => [s.linkBtn, pressed && { opacity: 0.6 }]}>
          <Text style={s.linkText}>Don't have an account? <Text style={s.linkAccent}>Sign up free</Text></Text>
        </Pressable>
      </ScrollView>

      {/* Sticky CTA */}
      <View style={s.stickyWrap}>
        <LinearGradient
          colors={['transparent', 'rgba(14,10,16,0.95)', '#0e0a10']}
          locations={[0, 0.4, 0.8]}
          style={{ height: 30 }}
        />
        <View style={s.stickyContent}>
          <Pressable
            onPress={handleSignIn}
            disabled={!canSubmit || loading}
            style={({ pressed }) => [
              pressed && canSubmit && { opacity: 0.9, transform: [{ scale: 0.98 }] },
              (!canSubmit || loading) && { opacity: 0.35 },
            ]}
          >
            <LinearGradient
              colors={canSubmit ? ['#C8883A', '#E8A855'] : ['rgba(255,255,255,0.06)', 'rgba(255,255,255,0.04)']}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              style={s.btn}
            >
              <Text style={s.btnText}>{loading ? 'Signing in…' : 'Sign in'}</Text>
            </LinearGradient>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0e0a10' },
  content: { paddingHorizontal: 28, paddingTop: 12, paddingBottom: 100, gap: 20 },

  back: { alignSelf: 'flex-start', paddingVertical: 6 },
  backText: { fontFamily: F.bodyMedium, fontSize: 16, color: 'rgba(255,255,255,0.30)' },

  hlArea: { alignItems: 'center', gap: 8, paddingVertical: 16 },
  headline: { fontFamily: F.heading, fontSize: 26, color: C.text, textAlign: 'center' },
  headlineSub: { fontFamily: F.body, fontSize: 14, color: C.textSub, textAlign: 'center' },

  formCard: {
    borderRadius: 24, padding: 22, gap: 18,
    borderWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.18)',
    borderLeftColor: 'rgba(255,255,255,0.08)',
    borderRightColor: 'rgba(0,0,0,0.08)',
    borderBottomColor: 'rgba(0,0,0,0.12)',
  },
  field: { gap: 6 },
  fieldLabel: { fontFamily: F.label, fontSize: 11, letterSpacing: 0.8, color: C.textMuted, textTransform: 'uppercase' },
  inputWrap: {
    borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
  },
  inputFocused: { borderColor: 'rgba(87,120,163,0.35)' },
  input: { fontFamily: F.body, fontSize: 16, color: C.text, paddingHorizontal: 16, paddingVertical: 14 },
  eyeBtn: { paddingHorizontal: 14, paddingVertical: 12 },

  errorText: { fontFamily: F.body, fontSize: 14, color: C.coral, textAlign: 'center' },

  linkBtn: { alignSelf: 'center', paddingVertical: 8 },
  linkText: { fontFamily: F.body, fontSize: 14, color: C.textMuted, textAlign: 'center' },
  linkAccent: { fontFamily: F.bodySemi, color: C.amber, textDecorationLine: 'underline' },

  stickyWrap: { position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 10 },
  stickyContent: { backgroundColor: '#0e0a10', paddingHorizontal: 28, paddingBottom: 28, paddingTop: 4 },
  btn: {
    borderRadius: 18, minHeight: 56, alignItems: 'center', justifyContent: 'center',
  },
  btnText: { fontFamily: F.subheading, fontSize: 16, color: '#FFFFFF', letterSpacing: 0.3 },
});