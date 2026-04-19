// app/welcome/index.tsx
// v9 — Single splash with live typing demo
// Uses shared Stars + TypingDemo components

import { useEffect } from 'react';
import {
  Dimensions,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { router }          from 'expo-router';
import { StatusBar }       from 'expo-status-bar';
import { SafeAreaView }    from 'react-native-safe-area-context';
import { LinearGradient }  from 'expo-linear-gradient';
import * as Haptics        from 'expo-haptics';
import AsyncStorage        from '@react-native-async-storage/async-storage';
import { useAuth }         from '../../src/context/AuthContext';
import { colors as C, fonts as F } from '../../src/theme';
import { Stars }           from '../../src/components/features/Stars';
import { TypingDemo }      from '../../src/components/features/TypingDemo';

const { width: W } = Dimensions.get('window');
const GUEST_SEEN_KEY = 'sturdy_guest_seen_v1';

export default function WelcomeScreen() {
  const { session } = useAuth();

  useEffect(() => {
    if (session) { router.replace('/(tabs)'); return; }
    AsyncStorage.getItem(GUEST_SEEN_KEY).then(val => {
      if (val === 'true') router.replace('/(tabs)');
    });
  }, [session]);

  const handleGetStarted = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/child-setup');
  };

  const handleTryNow = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push({ pathname: '/now', params: { mode: 'sos', trial: 'true' } });
  };

  return (
    <SafeAreaView style={st.root} edges={['top', 'bottom']}>
      <StatusBar style="light" />

      <LinearGradient
        colors={['#0e0a10', '#14101a', '#1a1622', '#1e1a28', '#201c2a', '#1e1a24', '#1a1620', '#18141e', '#14101a']}
        locations={[0, 0.10, 0.22, 0.35, 0.48, 0.60, 0.72, 0.85, 1]}
        style={StyleSheet.absoluteFill}
      />
      <Stars />
      <LinearGradient
        colors={['transparent', 'rgba(212,148,74,0.04)', 'rgba(212,148,74,0.07)']}
        locations={[0, 0.5, 1]}
        style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '45%', zIndex: 1 }}
        pointerEvents="none"
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={st.scroll}
        style={{ zIndex: 2 }}
      >
        <View style={st.heroArea}>
          <Image source={require('../../assets/logo.png')} style={st.logo} resizeMode="contain" />
          <Text style={st.heroTitle}>
            Your child is losing it.{'\n'}
            <Text style={st.heroAccent}>Here's what to say.</Text>
          </Text>
          <Text style={st.heroSub}>
            Calm scripts for hard moments — backed by{'\n'}12 foundational parenting books.
          </Text>
        </View>

        <TypingDemo />
      </ScrollView>

      <View style={st.bottomArea}>
        <LinearGradient
          colors={['transparent', 'rgba(14,10,16,0.95)', '#0e0a10']}
          locations={[0, 0.35, 0.75]}
          style={st.bottomFade}
          pointerEvents="none"
        />
        <View style={st.btnGlow} />
        <Pressable
          onPress={handleGetStarted}
          style={({ pressed }) => [pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] }]}
        >
          <LinearGradient colors={['#C8883A', '#E8A855']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={st.primaryBtn}>
            <Text style={st.primaryBtnText}>Get Started</Text>
          </LinearGradient>
        </Pressable>

        <Pressable
          onPress={handleTryNow}
          style={({ pressed }) => [st.secondaryBtn, pressed && { opacity: 0.8 }]}
        >
          <Text style={st.secondaryBtnText}>Try it now — free</Text>
        </Pressable>

        <View style={st.siRow}>
          <Text style={st.siGrey}>Already have an account? </Text>
          <Pressable onPress={() => router.push('/auth/sign-in')}>
            <Text style={st.siLink}>Sign in</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const st = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0e0a10' },
  scroll: { paddingHorizontal: 24, paddingTop: 16, paddingBottom: 180, gap: 24 },

  heroArea: { alignItems: 'center', gap: 12 },
  logo: { width: 80, height: 80, marginBottom: 4 },
  heroTitle: {
    fontFamily: F.heading, fontSize: 26, color: 'rgba(255,255,255,0.92)',
    lineHeight: 36, textAlign: 'center', letterSpacing: -0.3,
  },
  heroAccent: { fontFamily: F.heading, fontSize: 26, color: C.coral },
  heroSub: {
    fontFamily: F.body, fontSize: 14, color: 'rgba(255,255,255,0.38)',
    textAlign: 'center', lineHeight: 22,
  },

  bottomArea: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    paddingHorizontal: 28, paddingBottom: 28,
    zIndex: 10, alignItems: 'center', gap: 10,
  },
  bottomFade: { position: 'absolute', top: -50, left: 0, right: 0, height: 50 },
  btnGlow: { position: 'absolute', top: -10, width: W * 0.6, height: 70, borderRadius: 35, backgroundColor: 'rgba(200,136,58,0.10)' },
  primaryBtn: { width: W - 56, minHeight: 56, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  primaryBtnText: { fontFamily: F.subheading, fontSize: 17, color: '#FFFFFF', letterSpacing: 0.3 },
  secondaryBtn: {
    width: W - 56, minHeight: 48, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)',
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  secondaryBtnText: { fontFamily: F.bodyMedium, fontSize: 15, color: C.coral },
  siRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: 2 },
  siGrey: { fontFamily: F.body, fontSize: 13, color: 'rgba(255,255,255,0.25)' },
  siLink: { fontFamily: F.bodySemi, fontSize: 13, color: C.amber, textDecorationLine: 'underline' },
});