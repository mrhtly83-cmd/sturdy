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
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
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
    line1: 'When the moment\nhits,',
    highlight: "you don't need a script —",
    line2: 'you need words.',
    desc: 'Calm, age-specific words you can say out\nloud, before it escalates.',
  },
  {
    id: 'beat2',
    image: require('../../assets/welcome-wc-think.png.png'),
    line1: 'When the question is',
    highlight: 'too quiet',
    line2: 'to ask out loud.',
    desc: 'Ask Sturdy. No judgment, no jargon — just\nthe answer you needed.',
  },
  {
    id: 'beat3',
    image: require('../../assets/welcome-wc-connection.png'),
    line1: 'From chaos.',
    highlight: 'To connection.',
    isCta: true,
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
        colors={['rgba(13,11,8,0.4)', 'rgba(13,11,8,0.6)', 'rgba(13,11,8,0.85)', '#0d0b08']}
        locations={[0, 0.4, 0.7, 1]}
        style={StyleSheet.absoluteFill}
      />
    </>
  );
};

export default function WelcomeScreen() {
  const { session } = useAuth();
  const insets = useSafeAreaInsets();
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
          <Pressable onPress={handleGetStarted} hitSlop={10}>
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
                  {'\n'}
                  <Text style={s.highlightText}>{beat.highlight}</Text>
                  {beat.line2 ? `\n${beat.line2}` : ''}
                </Text>

                {beat.desc && (
                  <Text style={s.descText}>{beat.desc}</Text>
                )}

                {beat.isCta && (
                  <View style={s.ctaWrapper}>
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
                )}
              </View>

            </View>
          ))}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0d0b08' },
  safe: { flex: 1 },
  header: {
    position: 'absolute',
    top: 60,
    left: 24,
    right: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 10,
  },
  progressContainer: { flexDirection: 'row', gap: 6 },
  progressLine: { width: 20, height: 2, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 1 },
  progressLineActive: { backgroundColor: C.amber },
  skipText: { color: 'rgba(255,255,255,0.5)', fontFamily: F.body, fontSize: 14 },

  page: { width: W, height: '100%', justifyContent: 'space-between' },

  haloContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 40,
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
    flex: 1.2, 
    paddingHorizontal: 32,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  titleText: {
    fontFamily: F.heading,
    fontSize: 34,
    color: '#FFF8E7',
    textAlign: 'center',
    lineHeight: 44,
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

  ctaWrapper: {
    width: '100%',
    marginTop: 40,
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