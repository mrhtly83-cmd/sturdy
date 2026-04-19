// app/auth/sign-up.tsx
// v5 — Logo palette + amber gradient CTA + glassmorphism
// Blue #5778A3, Coral #E87461, Amber #D4944A

import AsyncStorage from '@react-native-async-storage/async-storage';
import { useState } from 'react';
import {
  Dimensions,
  Image,
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
import { supabase }         from '../../src/lib/supabase';
import { useAuth }          from '../../src/context/AuthContext';
import { colors as C, fonts as F } from '../../src/theme/colors';

const { width: W } = Dimensions.get('window');
const PENDING_CHILD_KEY = 'sturdy_pending_child_v1';

function Stars({ count = 30 }: { count?: number }) {
  const [stars] = useState(() =>
    Array.from({ length: count }, () => ({
      top: Math.random() * 45, left: Math.random() * 100,
      size: Math.random() * 1.8 + 0.4, opacity: Math.random() * 0.2 + 0.04,
    }))
  );
  return (
    <View style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '45%', zIndex: 1 }} pointerEvents="none">
      {stars.map((s, i) => (
        <View key={i} style={{ position: 'absolute', top: `${s.top}%` as any, left: `${s.left}%` as any, width: s.size, height: s.size, opacity: s.opacity, borderRadius: 10, backgroundColor: '#FFF' }} />
      ))}
    </View>
  );
}

export default function SignUpScreen() {
  const { session } = useAuth();
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const [showPw, setShowPw]     = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [pwFocused, setPwFocused]       = useState(false);

  const handleSignUp = async () => {
    if (!email.trim() || password.length < 6) return;
    setLoading(true); setError('');
    try {
      const { error: authErr } = await supabase.auth.signUp({
        email: email.trim(), password,
      });
      if (authErr) throw authErr;

      try {
        const pendingRaw = await AsyncStorage.getItem(PENDING_CHILD_KEY);
        if (pendingRaw) {
          const pending = JSON.parse(pendingRaw);
          const { data: { user } } = await supabase.auth.getUser();
          if (user && pending.name && pending.age) {
            await supabase.from('child_profiles').insert({
              user_id: user.id, name: pending.name,
              child_age: pending.age,
              age_band: pending.age <= 4 ? '2-4' : pending.age <= 7 ? '5-7' : '8-12',
              neurotype: pending.neurotype ?? [],
            });
          }
          await AsyncStorage.removeItem(PENDING_CHILD_KEY);
        }
      } catch {}

      router.replace('/(tabs)');
    } catch (err: any) {
      setError(err?.message || 'Could not create account. Try again.');
    } finally { setLoading(false); }
  };

  const canSubmit = email.trim().length > 0 && password.length >= 6;

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

        <Pressable onPress={() => router.back()} style={s.back}>
          <Text style={s.backText}>← Back</Text>
        </Pressable>

        <View style={s.logoWrap}>
          <Image source={require('../../assets/logo.png')} style={s.logo} resizeMode="contain" />
        </View>

        <View style={s.hlArea}>
          <Text style={s.headline}>Create account</Text>
          <Text style={s.headlineSub}>Save scripts and personalise for your child.{'\n'}Unlimited access.</Text>
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
                placeholder="Choose a password" placeholderTextColor="rgba(255,255,255,0.18)"
                value={password} onChangeText={v => { setPassword(v); if (error) setError(''); }}
                onFocus={() => setPwFocused(true)} onBlur={() => setPwFocused(false)}
                style={[s.input, { flex: 1 }]}
              />
              <Pressable onPress={() => setShowPw(!showPw)} style={s.eyeBtn}>
                <Text style={{ fontSize: 18, opacity: 0.4 }}>{showPw ? '👁' : '👁‍🗨'}</Text>
              </Pressable>
            </View>
            <Text style={s.pwHint}>Use at least 6 characters.</Text>
          </View>
        </LinearGradient>

        {error ? <Text style={s.errorText}>{error}</Text> : null}

        <View style={s.siRow}>
          <Text style={s.siGrey}>Already have an account? </Text>
          <Pressable onPress={() => router.replace('/auth/sign-in')}>
            <Text style={s.siLink}>Sign in</Text>
          </Pressable>
        </View>
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
            onPress={handleSignUp}
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
              <Text style={s.btnText}>{loading ? 'Creating account…' : 'Create account'}</Text>
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

  logoWrap: { alignItems: 'center', marginTop: 8 },
  logo: { height: 60, width: 60 },

  hlArea: { alignItems: 'center', gap: 8 },
  headline: { fontFamily: F.heading, fontSize: 26, color: C.text, textAlign: 'center' },
  headlineSub: { fontFamily: F.body, fontSize: 14, color: C.textSub, textAlign: 'center', lineHeight: 20 },

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
  pwHint: { fontFamily: F.body, fontSize: 12, color: C.textMuted },

  errorText: { fontFamily: F.body, fontSize: 14, color: C.coral, textAlign: 'center' },

  siRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: 4 },
  siGrey: { fontFamily: F.body, fontSize: 14, color: C.textMuted },
  siLink: { fontFamily: F.bodySemi, fontSize: 14, color: C.amber, textDecorationLine: 'underline' },

  stickyWrap: { position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 10 },
  stickyContent: { backgroundColor: '#0e0a10', paddingHorizontal: 28, paddingBottom: 28, paddingTop: 4 },
  btn: {
    borderRadius: 18, minHeight: 56, alignItems: 'center', justifyContent: 'center',
  },
  btnText: { fontFamily: F.subheading, fontSize: 16, color: '#FFFFFF', letterSpacing: 0.3 },
});