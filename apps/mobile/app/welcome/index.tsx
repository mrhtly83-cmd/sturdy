// app/welcome/index.tsx
// v15 — Direction B: "Held in Glass" Final Production Flow
// 3-beat narrative with original watercolor assets & golden particles.

import React, { useRef, useState, useEffect } from 'react';
import {
  Animated,
  Dimensions,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  Easing,
  Image,
} from 'react-native';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useAuth } from '../../src/context/AuthContext';
import { colors as C, fonts as F } from '../../src/theme/colors';

const { width: W, height: H } = Dimensions.get('window');

// ─── Narrative Data ──────────────────────────────────────────────────────────
const BEATS = [
  {
    id: 'beat1',
    image: require('../../assets/welcome-wc-chaos.png'),
    line1: 'Parenting is hard in ways no one says.',
    highlight: '',
    line2: '',
    desc: 'Sturdy says them.',
    trust: 'Calmest when it\'s hardest.',
  },
  {
    id: 'beat2',
    image: require('../../assets/welcome-wc-think.png'),
    line1: 'Some questions deserve a real answer.',
    highlight: '',
    line2: '',
    desc: 'Ask anything. No jargon, no judgment.',
    trust: 'What you share here stays here.',
  },
  {
    id: 'beat3',
    image: require('../../assets/welcome-wc-connection.png'),
    line1: 'You show up. That\'s already the work.',
    highlight: '',
    line2: '',
    desc: 'Just the right words, at the right time.',
    trust: 'Sturdy gives you the words. Use them exactly, or make them yours.',
  }
];

// ─── Shared Animated Background ──────────────────────────────────────────────
const Background = () => {
  const moveAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(moveAnim, { toValue: 1, duration: 25000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(moveAnim, { toValue: 0, duration: 25000, easing: Easing.inOut(Easing.sin), useNativeDriver: true })
      ])
    ).start();
  }, [moveAnim]);

  const translateY = moveAnim.interpolate({ inputRange: [0, 1], outputRange: [0, -40] });
  const scale = moveAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.1] });

  return (
    <>
      <Animated.Image
        source={require('../../assets/golden-particles-bg.png')}
        style={[StyleSheet.absoluteFill, { width: '100%', height: '100%', transform: [{ translateY }, { scale }] }]}
        resizeMode="cover"
      />
      <LinearGradient
        // Warm-ember scrim over the particles photo, fading into the warm base (#15100a = rgb(21,16,10))
        colors={['rgba(21,16,10,0.4)', 'rgba(21,16,10,0.6)', 'rgba(21,16,10,0.85)', C.background]}
        locations={[0, 0.4, 0.7, 1]}
        style={StyleSheet.absoluteFill}
      />
    </>
  );
};

export default function WelcomeScreen() {
  const { session } = useAuth();
  const [page, setPage] = useState(0);
  const scrollRef = useRef<ScrollView>(null);

  // ─── Auth Redirect ───
  useEffect(() => {
    if (session) {
      router.replace('/(tabs)');
    }
  }, [session]);

  const onMomentumScrollEnd = (e: any) => {
    const newPage = Math.round(e.nativeEvent.contentOffset.x / W);
    if (newPage !== page) {
      setPage(newPage);
      Haptics.selectionAsync();
    }
  };

  const handleGetStarted = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/auth?mode=signup');
  };

  const handleSignIn = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/auth?mode=signin');
  };

  return (
    <View style={s.root}>
      <StatusBar style="light" />
      <Background />
      
      <SafeAreaView style={s.safe} edges={['top', 'bottom']}>

        {/* ─── Navigation Header ─── */}
        <View style={s.header}>
          <View style={s.progressContainer}>
            {BEATS.map((_, i) => (
              <View key={i} style={[s.progressLine, page === i && s.progressLineActive]} />
            ))}
          </View>
          <Pressable onPress={handleGetStarted} hitSlop={12}>
            <Text style={s.skipText}>Skip</Text>
          </Pressable>
        </View>

        <ScrollView
          ref={scrollRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={onMomentumScrollEnd}
          style={{ flex: 1 }}
        >
          {BEATS.map((beat) => (
            <View key={beat.id} style={s.page}>
              
              {/* TOP: Watercolor Halo */}
              <View style={s.haloContainer}>
                <View style={s.haloWrapper}>
                  <View style={s.imageCrop}>
                    <Image source={beat.image} style={s.beatImage} resizeMode="cover" />
                    <LinearGradient
                      // TODO: update rgba stop to new base rgb(14,12,8)
                      colors={['transparent', 'rgba(13,11,8,0.5)']}
                      style={StyleSheet.absoluteFill}
                    />
                  </View>
                </View>
              </View>

              {/* BOTTOM: Typography & Actions */}
              <View style={s.textContainer}>
                <Text style={s.titleText}>
                  {beat.line1}
                  {beat.highlight ? (
                    <>
                      {'\n'}
                      <Text style={s.highlightText}>{beat.highlight}</Text>
                    </>
                  ) : null}
                  {beat.line2 ? `\n${beat.line2}` : ''}
                </Text>

                {beat.desc && (
                  <Text style={s.descText}>{beat.desc}</Text>
                )}

                {beat.trust && (
                  <Text style={s.trustText}>{beat.trust}</Text>
                )}

              </View>

            </View>
          ))}
        </ScrollView>

        {/* ─── Fixed Bottom Drawer ─── */}
        <View style={s.drawer}>
          <Pressable
            onPress={handleGetStarted}
            style={({ pressed }) => [s.btnWrap, pressed && { transform: [{ scale: 0.98 }] }]}
          >
            <LinearGradient
              colors={[C.amber, C.amberMid]}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={s.btnActive}
            >
              <Text style={s.btnText}>Get started</Text>
            </LinearGradient>
          </Pressable>
          <View style={s.signInRow}>
            <Text style={s.signInGrey}>Already with us? </Text>
            <Pressable onPress={handleSignIn} hitSlop={8}>
              <Text style={s.signInLink}>Sign in</Text>
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.background },
  safe: { flex: 1 },
  header: {
    flexShrink: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 8,
  },
  progressContainer: { flexDirection: 'row', gap: 6 },
  progressLine: { width: 20, height: 2, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 1 }, // TODO: check token
  progressLineActive: { backgroundColor: C.amber },
  skipText: { color: 'rgba(255,255,255,0.5)', fontFamily: F.body, fontSize: 14 }, // TODO: check token

  page: { width: W, height: '100%', justifyContent: 'flex-start' },

  haloContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 8,
  },
  haloWrapper: {
    width: W * 0.65,
    height: W * 0.65,
    borderRadius: 999,
    shadowColor: C.amber, 
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.45, 
    shadowRadius: 50,
    elevation: 12,
  },
  imageCrop: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 999,
    overflow: 'hidden',
  },
  beatImage: { width: '100%', height: '100%' },

  textContainer: {
    flexShrink: 0,
    paddingHorizontal: 32,
    paddingTop: 24,
    paddingBottom: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleText: {
    fontFamily: F.heading,
    fontSize: 33,
    color: '#FFF8E7',
    textAlign: 'center',
    lineHeight: 43,
    letterSpacing: -0.5,
  },
  highlightText: {
    color: C.amber,
    fontStyle: 'italic',
  },
  descText: {
    fontFamily: F.body,
    marginTop: 24,
    fontSize: 15,
    color: 'rgba(255, 248, 231, 0.7)',
    textAlign: 'center',
    lineHeight: 22,
  },
  trustText: {
    fontFamily: F.heading,
    fontStyle: 'italic',
    fontSize: 13,
    color: C.amber,
    textAlign: 'center',
    marginTop: 16,
    lineHeight: 20,
    opacity: 0.85,
  },

  ctaWrapper: {
    width: '100%',
    marginTop: 40,
    alignItems: 'center',
  },
  drawer: {
    flexShrink: 0,
    paddingHorizontal: 32,
    paddingTop: 16,
    paddingBottom: 8,
    width: '100%',
    alignItems: 'center',
  },
  btnWrap: { width: '100%', marginBottom: 20 },
  btnActive: {
    minHeight: 56,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnText: { fontFamily: F.heading, fontSize: 17, fontWeight: '700', color: '#1A1A1A' },
  signInRow: { flexDirection: 'row', justifyContent: 'center' },
  signInGrey: { fontFamily: F.body, fontSize: 14, color: 'rgba(255, 248, 231, 0.5)' },
  signInLink: { fontFamily: F.bodySemi, fontSize: 14, color: C.amber, textDecorationLine: 'underline' },
});