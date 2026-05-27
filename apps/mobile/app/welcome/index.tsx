// app/welcome/index.tsx
// v16 — Twilight × Obsidian Gold
// Locked theme applied: pure night sky gradient, procedural stars,
// gold horizon glow, noise grain — replacing golden-particles-bg.png.
// All navigation, carousel logic, and narrative beats preserved from v15.

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

// ─── Theme Tokens (Twilight × Obsidian Gold) ─────────────────────────────────
const T = {
  // Sky gradient stops — pure near-black, warm undertone, zero blue/purple
  sky0:  '#020202',
  sky1:  '#040403',
  sky2:  '#060604',
  sky3:  '#080705',
  sky4:  '#0a0906',
  sky5:  '#0c0a07',
  sky6:  '#0d0b08',
  sky7:  '#0e0c08', // mid — warmest dark point
  sky8:  '#0d0b07',
  sky9:  '#0c0a06',
  sky10: '#0a0806',
  sky11: '#080605',
  sky12: '#050402',

  // Gold accent system
  gold:       '#c9a85c',
  goldMid:    '#a8843a',
  goldDeep:   '#8a6820',
  goldBorder: 'rgba(184,142,74,0.22)',
  goldGlow:   'rgba(184,142,74,0.07)',
  goldFaint:  'rgba(184,142,74,0.10)',

  // Horizon glow (bleeds up from bottom)
  horizon0: 'rgba(120,80,10,0.22)',
  horizon1: 'rgba(160,105,15,0.14)',
  horizon2: 'rgba(184,142,74,0.08)',

  // Card surfaces
  cardBg:     'rgba(255,255,255,0.04)',
  cardBorder: 'rgba(184,142,74,0.22)',
  cardInset:  'rgba(220,185,110,0.10)',

  // Text
  textPrimary:   'rgba(248,238,212,0.97)',
  textSecondary: 'rgba(200,175,120,0.55)',
  textMuted:     'rgba(200,175,120,0.35)',
  textGold:      'rgba(200,162,74,0.95)',

  // Tab / bar bg
  barBg: 'rgba(5,4,8,0.82)',
};

// ─── Narrative Data (preserved from v15) ─────────────────────────────────────
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
  },
];

// ─── Star data — 3-tier brightness, concentrated in top 55% ─────────────────
// Each: { top, left, size, opacity, tier }
// tier 1 = bright anchor (2–3px), tier 2 = medium (1.5px), tier 3 = faint (1px)
const STARS = [
  // Tier 1 — bright anchors
  { top: 0.04, left: 0.12, size: 2,   opacity: 1.0  },
  { top: 0.02, left: 0.67, size: 2.5, opacity: 1.0  },
  { top: 0.07, left: 0.88, size: 2,   opacity: 1.0  },
  { top: 0.05, left: 0.45, size: 3,   opacity: 1.0  },
  { top: 0.09, left: 0.28, size: 2,   opacity: 0.95 },
  { top: 0.12, left: 0.78, size: 2.5, opacity: 0.95 },
  { top: 0.15, left: 0.58, size: 2,   opacity: 0.9  },
  { top: 0.18, left: 0.05, size: 2,   opacity: 0.9  },
  { top: 0.03, left: 0.93, size: 2.5, opacity: 0.95 },
  { top: 0.22, left: 0.38, size: 2,   opacity: 0.85 },
  // Tier 2 — medium
  { top: 0.06, left: 0.20, size: 1.5, opacity: 0.85 },
  { top: 0.08, left: 0.52, size: 1.5, opacity: 0.80 },
  { top: 0.05, left: 0.82, size: 1.5, opacity: 0.85 },
  { top: 0.13, left: 0.35, size: 1.5, opacity: 0.80 },
  { top: 0.17, left: 0.70, size: 1.5, opacity: 0.80 },
  { top: 0.24, left: 0.16, size: 1.5, opacity: 0.75 },
  { top: 0.26, left: 0.60, size: 1.5, opacity: 0.75 },
  { top: 0.20, left: 0.90, size: 1.5, opacity: 0.75 },
  { top: 0.30, left: 0.48, size: 1.5, opacity: 0.70 },
  { top: 0.30, left: 0.08, size: 1.5, opacity: 0.70 },
  { top: 0.28, left: 0.75, size: 1.5, opacity: 0.70 },
  { top: 0.35, left: 0.25, size: 1.5, opacity: 0.65 },
  { top: 0.37, left: 0.55, size: 1.5, opacity: 0.65 },
  { top: 0.33, left: 0.85, size: 1.5, opacity: 0.60 },
  // Tier 3 — faint dust
  { top: 0.03, left: 0.42, size: 1,   opacity: 0.70 },
  { top: 0.10, left: 0.07, size: 1,   opacity: 0.70 },
  { top: 0.14, left: 0.95, size: 1,   opacity: 0.70 },
  { top: 0.18, left: 0.30, size: 1,   opacity: 0.65 },
  { top: 0.20, left: 0.62, size: 1,   opacity: 0.65 },
  { top: 0.16, left: 0.18, size: 1,   opacity: 0.65 },
  { top: 0.22, left: 0.80, size: 1,   opacity: 0.60 },
  { top: 0.27, left: 0.40, size: 1,   opacity: 0.60 },
  { top: 0.24, left: 0.72, size: 1,   opacity: 0.55 },
  { top: 0.32, left: 0.14, size: 1,   opacity: 0.55 },
  { top: 0.34, left: 0.50, size: 1,   opacity: 0.55 },
  { top: 0.28, left: 0.96, size: 1,   opacity: 0.50 },
  { top: 0.40, left: 0.33, size: 1,   opacity: 0.45 },
  { top: 0.42, left: 0.65, size: 1,   opacity: 0.40 },
  { top: 0.44, left: 0.22, size: 1,   opacity: 0.38 },
  { top: 0.38, left: 0.88, size: 1,   opacity: 0.35 },
  { top: 0.46, left: 0.57, size: 1,   opacity: 0.30 },
  { top: 0.48, left: 0.10, size: 1,   opacity: 0.28 },
];

// Twinkling star positions (12 — exact from locked mockup)
const TWINKLERS = [
  { top: 0.035, left: 0.45, size: 2.5, delay: 0    },
  { top: 0.07,  left: 0.67, size: 2,   delay: 800  },
  { top: 0.02,  left: 0.88, size: 3,   delay: 1400 },
  { top: 0.12,  left: 0.78, size: 2,   delay: 400  },
  { top: 0.05,  left: 0.12, size: 2.5, delay: 2100 },
  { top: 0.17,  left: 0.58, size: 2,   delay: 1700 },
  { top: 0.09,  left: 0.30, size: 2,   delay: 600  },
  { top: 0.22,  left: 0.90, size: 1.5, delay: 2500 },
  { top: 0.26,  left: 0.22, size: 2,   delay: 1100 },
  { top: 0.31,  left: 0.70, size: 1.5, delay: 3000 },
  { top: 0.14,  left: 0.05, size: 2,   delay: 300  },
  { top: 0.38,  left: 0.48, size: 1.5, delay: 1900 },
];

// ─── TwinklingDot component ───────────────────────────────────────────────────
const TwinklingDot = ({
  top, left, size, delay, index,
}: {
  top: number; left: number; size: number; delay: number; index: number;
}) => {
  const anim = useRef(new Animated.Value(index % 3 === 0 ? 1 : index % 3 === 1 ? 0.7 : 0.5)).current;

  useEffect(() => {
    const duration = index % 3 === 0 ? 3200 : index % 3 === 1 ? 4100 : 2800;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(anim, {
          toValue: index % 3 === 0 ? 0.3 : index % 3 === 1 ? 0.2 : 0.35,
          duration: duration / 2,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(anim, {
          toValue: index % 3 === 0 ? 1 : index % 3 === 1 ? 0.7 : 0.5,
          duration: duration / 2,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);

  return (
    <Animated.View
      style={{
        position: 'absolute',
        top: top * H,
        left: left * W,
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: 'rgba(255,248,225,0.95)',
        opacity: anim,
      }}
    />
  );
};

// ─── Background — Twilight × Obsidian Gold ───────────────────────────────────
const Background = () => (
  <>
    {/* Layer 0: Pure deep night sky gradient */}
    <LinearGradient
      colors={[T.sky0, T.sky1, T.sky2, T.sky3, T.sky4, T.sky5, T.sky6, T.sky7, T.sky8, T.sky9, T.sky10, T.sky11, T.sky12]}
      locations={[0, 0.08, 0.16, 0.24, 0.32, 0.40, 0.46, 0.52, 0.58, 0.64, 0.76, 0.88, 1]}
      style={StyleSheet.absoluteFill}
    />

    {/* Layer 1: Static star field */}
    {STARS.map((star, i) => (
      <View
        key={`star-${i}`}
        style={{
          position: 'absolute',
          top: star.top * H,
          left: star.left * W,
          width: star.size,
          height: star.size,
          borderRadius: star.size / 2,
          backgroundColor: `rgba(255,248,225,${star.opacity})`,
        }}
      />
    ))}

    {/* Layer 2: Twinkling animated stars */}
    {TWINKLERS.map((t, i) => (
      <TwinklingDot key={`twinkle-${i}`} {...t} index={i} />
    ))}

    {/* Layer 3: Horizon gold glow — bleeds from bottom */}
    <LinearGradient
      colors={['transparent', T.horizon0]}
      locations={[0.35, 1]}
      style={StyleSheet.absoluteFill}
    />
    <LinearGradient
      colors={['transparent', T.horizon1]}
      locations={[0.45, 1]}
      style={StyleSheet.absoluteFill}
    />
    <LinearGradient
      colors={['transparent', T.horizon2]}
      locations={[0.55, 1]}
      style={StyleSheet.absoluteFill}
    />
  </>
);

// ─── Main Screen ─────────────────────────────────────────────────────────────
export default function WelcomeScreen() {
  const { session } = useAuth();
  const [page, setPage] = useState(0);
  const scrollRef = useRef<ScrollView>(null);

  // Auth redirect — preserved from v15
  useEffect(() => {
    if (session) router.replace('/(tabs)');
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
              <View
                key={i}
                style={[s.progressLine, page === i && s.progressLineActive]}
              />
            ))}
          </View>
          <Pressable onPress={handleGetStarted} hitSlop={12}>
            <Text style={s.skipText}>Skip</Text>
          </Pressable>
        </View>

        {/* ─── Carousel ─── */}
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

              {/* TOP: Watercolor halo — preserved from v15, gold shadow applied */}
              <View style={s.haloContainer}>
                <View style={s.haloWrapper}>
                  <View style={s.imageCrop}>
                    <Image
                      source={beat.image}
                      style={s.beatImage}
                      resizeMode="cover"
                    />
                    {/* Fade bottom edge into night sky */}
                    <LinearGradient
                      colors={['transparent', T.sky6]}
                      locations={[0.55, 1]}
                      style={StyleSheet.absoluteFill}
                    />
                  </View>
                </View>
              </View>

              {/* BOTTOM: Typography */}
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

                {/* CTA — beat 3 only */}
                {beat.isCta && (
                  <View style={s.ctaWrapper}>
                    {/* Primary — gold gradient button */}
                    <Pressable
                      onPress={handleGetStarted}
                      style={({ pressed }) => [
                        s.btnWrap,
                        pressed && { transform: [{ scale: 0.98 }] },
                      ]}
                    >
                      <LinearGradient
                        colors={[T.gold, T.goldMid, T.goldDeep]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={s.btnPrimary}
                      >
                        <Text style={s.btnPrimaryText}>Get started — it's free</Text>
                      </LinearGradient>
                    </Pressable>

                    {/* Secondary — ghost border */}
                    <Pressable
                      onPress={handleSignIn}
                      style={({ pressed }) => [
                        s.btnSecondary,
                        pressed && { opacity: 0.7 },
                      ]}
                    >
                      <Text style={s.btnSecondaryText}>I already have an account</Text>
                    </Pressable>

                    {/* Sign-in row */}
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

// ─── Styles ──────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: T.sky0,
  },

  safe: { flex: 1 },

  // Header
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
  progressLine: {
    width: 24,
    height: 2,
    backgroundColor: 'rgba(184,142,74,0.18)',
    borderRadius: 1,
  },
  progressLineActive: {
    backgroundColor: T.gold,
    shadowColor: T.gold,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 4,
    elevation: 4,
  },
  skipText: {
    color: 'rgba(200,175,120,0.55)',
    fontFamily: F.body,
    fontSize: 14,
    letterSpacing: 0.02,
  },

  // Carousel page
  page: {
    width: W,
    height: '100%',
    justifyContent: 'space-between',
  },

  // Watercolor halo
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
    // Gold glow halo — matches locked theme shadow style
    shadowColor: T.gold,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.40,
    shadowRadius: 48,
    elevation: 12,
  },
  imageCrop: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 999,
    overflow: 'hidden',
    // Thin gold ring
    borderWidth: 0.5,
    borderColor: 'rgba(184,142,74,0.25)',
  },
  beatImage: { width: '100%', height: '100%' },

  // Typography
  textContainer: {
    flex: 1.2,
    paddingHorizontal: 32,
    paddingTop: 24,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  titleText: {
    fontFamily: F.heading,
    fontSize: 34,
    color: T.textPrimary,
    textAlign: 'center',
    lineHeight: 44,
    letterSpacing: -0.5,
  },
  highlightText: {
    color: T.gold,
    fontStyle: 'italic',
  },
  descText: {
    fontFamily: F.body,
    marginTop: 24,
    fontSize: 15,
    color: 'rgba(200,175,120,0.62)',
    textAlign: 'center',
    lineHeight: 22,
  },

  // CTA block
  ctaWrapper: {
    width: '100%',
    marginTop: 36,
    alignItems: 'center',
    gap: 10,
  },

  // Primary gold button
  btnWrap: { width: '100%' },
  btnPrimary: {
    minHeight: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: T.gold,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 16,
    elevation: 8,
  },
  btnPrimaryText: {
    fontFamily: F.heading,
    fontSize: 16,
    fontWeight: '700',
    color: '#1a1200',
    letterSpacing: 0.04,
  },

  // Secondary ghost button
  btnSecondary: {
    width: '100%',
    minHeight: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 0.5,
    borderColor: 'rgba(184,142,74,0.22)',
  },
  btnSecondaryText: {
    fontFamily: F.body,
    fontSize: 14,
    fontWeight: '400',
    color: 'rgba(200,175,120,0.65)',
    letterSpacing: 0.02,
  },

  // Sign-in inline row
  signInRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 4,
  },
  signInGrey: {
    fontFamily: F.body,
    fontSize: 13,
    color: 'rgba(200,175,120,0.38)',
  },
  signInLink: {
    fontFamily: F.body,
    fontSize: 13,
    color: T.gold,
    textDecorationLine: 'underline',
  },
});
