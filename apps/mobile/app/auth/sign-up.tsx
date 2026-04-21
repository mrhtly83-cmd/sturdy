// app/auth/sign-up.tsx
// v6 — Journal identity: pastel gradient, frosted glass, rose CTA

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

export default function SignUpScreen() {
  const { session } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [pwFocused, setPwFocused] = useState(false);

  const handleSignUp = async () => {
    if (!email.trim() || password.length < 6) return;
    setLoading(true); setError('');
    try {
      const { error: authErr } = await supabase.auth.signUp({ email: email.trim(), password });
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
      <StatusBar style="dark" />
      <LinearGradient
        colors={[C.gradStart, C.gradMid1, C.gradMid2, C.gradEnd]}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      <ScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <Pressable onPress={() => router.back()} style={s.back}>
          <Text style={s.backText}>← Back</Text>
        </Pressable>

        <View style={s.logoWrap}>
          <Image source={require('../../assets/logo.png')} style={s.logo} resizeMode="contain" />
        </View>

        <View style={s.hlArea}>
          <Text style={s.headline}>Create account</Text>
          <Text style={s.headlineSub}>Save scripts and personalise for your child.{'\n'}Free forever for SOS.</Text>
        </View>

        <View style={s.formCard}>
          <View style={s.field}>
            <Text style={s.fieldLabel}>EMAIL</Text>
            <View style={[s.inputWrap, emailFocused && s.inputFocused]}>
              <TextInput
                autoCapitalize="none" autoCorrect={false} keyboardType="email-address"
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
                secureTextEntry={!showPw} autoCapitalize="none" autoCorrect={false}
                placeholder="Choose a password" placeholderTextColor={C.textMuted}
                value={password} onChangeText={v => { setPassword(v); if (error) setError(''); }}
                onFocus={() => setPwFocused(true)} onBlur={() => setPwFocused(false)}
                style={[s.input, { flex: 1 }]}
              />
              <Pressable onPress={() => setShowPw(!showPw)} style={s.eyeBtn}>
                <Text style={{ fontSize: 18, opacity: 0.4 }}>{showPw ? '🙈' : '👁'}</Text>
              </Pressable>
            </View>
            <Text style={s.pwHint}>Use at least 6 characters.</Text>
          </View>
        </View>

        {error ? <Text style={s.errorText}>{error}</Text> : null}

        <View style={s.siRow}>
          <Text style={s.siGrey}>Already have an account? </Text>
          <Pressable onPress={() => router.replace('/auth/sign-in')}>
            <Text style={s.siLink}>Sign in</Text>
          </Pressable>
        </View>
      </ScrollView>

      <View style={s.stickyWrap}>
        <LinearGradient colors={['transparent', 'rgba(253,250,245,0.95)', C.base]} locations={[0, 0.4, 0.8]} style={{ height: 30 }} />
        <View style={s.stickyContent}>
          <Pressable onPress={handleSignUp} disabled={!canSubmit || loading}
            style={({ pressed }) => [pressed && canSubmit && { opacity: 0.9, transform: [{ scale: 0.98 }] }]}>
            <View style={[s.btn, (!canSubmit || loading) && s.btnDisabled]}>
              <Text style={[s.btnText, (!canSubmit || loading) && { color: C.textMuted }]}>
                {loading ? 'Creating account…' : 'Create account'}
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

  logoWrap: { alignItems: 'center', marginTop: 8 },
  logo: { height: 60, width: 60 },

  hlArea: { alignItems: 'center', gap: 8 },
  headline: { fontFamily: F.heading, fontSize: 26, color: C.text, textAlign: 'center' },
  headlineSub: { fontFamily: F.body, fontSize: 14, color: C.textSub, textAlign: 'center', lineHeight: 20 },

  formCard: { borderRadius: 24, padding: 22, gap: 18, backgroundColor: C.cardGlass, borderWidth: 1, borderColor: C.border },
  field: { gap: 6 },
  fieldLabel: { fontFamily: F.label, fontSize: 11, letterSpacing: 0.8, color: C.textMuted, textTransform: 'uppercase' },
  inputWrap: { borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.6)', borderWidth: 1, borderColor: C.border },
  inputFocused: { borderColor: 'rgba(129,178,154,0.40)' },
  input: { fontFamily: F.body, fontSize: 16, color: C.text, paddingHorizontal: 16, paddingVertical: 14 },
  eyeBtn: { paddingHorizontal: 14, paddingVertical: 12 },
  pwHint: { fontFamily: F.body, fontSize: 12, color: C.textMuted },

  errorText: { fontFamily: F.body, fontSize: 14, color: C.rose, textAlign: 'center' },

  siRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: 4 },
  siGrey: { fontFamily: F.body, fontSize: 14, color: C.textMuted },
  siLink: { fontFamily: F.bodySemi, fontSize: 14, color: C.rose, textDecorationLine: 'underline' },

  stickyWrap: { position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 10 },
  stickyContent: { backgroundColor: C.base, paddingHorizontal: 28, paddingBottom: 28, paddingTop: 4 },
  btn: { borderRadius: 18, minHeight: 56, alignItems: 'center', justifyContent: 'center', backgroundColor: C.rose },
  btnDisabled: { backgroundColor: 'rgba(0,0,0,0.06)' },
  btnText: { fontFamily: F.subheading, fontSize: 16, color: '#FFFFFF', letterSpacing: 0.3 },
});

