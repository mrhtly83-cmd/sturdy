// app/welcome/index.tsx
// v13 — Deep Warm v5.2 welcome carousel
//
// 5 pages: splash → 3 feature slides → final CTA
// Native patterns:
//   - Paged horizontal ScrollView (real swipe)
//   - Dark glass cards (Deep Warm tokens) anchored to bottom edge
//   - C-2 fast-fade gradient base (shared across all pages)
//   - Spring card entrance animation
//   - Page dots
//   - Haptics on every interaction
//
// Auth wiring:
//   - Session check → redirect to tabs
//   - Get started → /auth?mode=signup
//   - Sign in     → /auth?mode=signin

import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { router }            from 'expo-router';
import { StatusBar }         from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient }    from 'expo-linear-gradient';
import * as Haptics          from 'expo-haptics';
import { useAuth }           from '../../src/context/AuthContext';
import { colors as C, fonts as F } from '../../src/theme/colors';

const { width: W, height: H } = Dimensions.get('window');

// ─── Feature slide data ───────────────────────────────────────────────────────

const FEATURES = [
  {
    badge:       'When chaos hits',
    badgeBg:     'rgba(232,116,97,0.22)',
    badgeColor:  '#FFA294',
    titlePre:    'The right words.',
    titleAccent: '',
    titlePost:   '\nIn seconds.',
    accentColor: '#FFA294',
    desc:        'Describe the moment. Get calm, age-specific words you can say out loud — before it escalates.',
    items: [
      { icon: '⚡', text: 'Scripts in under 5 seconds' },
      { icon: '🎯', text: "Adapted to your child's exact age" },
      { icon: '🧩', text: 'Aware of ADHD, autism, anxiety' },
    ],
  },
  {
    badge:       'When you need to think',
    badgeBg:     'rgba(106,146,188,0.24)',
    badgeColor:  '#A8C4E2',
    titlePre:    'Ask the question',
    titleAccent: '',
    titlePost:   "\nyou can't ask anyone.",
    accentColor: '#A8C4E2',
    desc:        'Why is this happening? Is it normal? What do I do next? Sturdy answers — no judgment, no jargon.',
    items: [
      { icon: '🎙️', text: 'No therapy speak. No lectures.' },
      { icon: '📌', text: 'Saves your thoughts for later' },
      { icon: '✨', text: "Knows which child you're asking about" },
    ],
  },
  {
    badge:       'Always specific',
    badgeBg:     'rgba(212,148,74,0.24)',
    badgeColor:  C.amberMid,
    titlePre:    'Built around',
    titleAccent: '',
    titlePost:   '\nyour child.',
    accentColor: C.amberMid,
    desc:        "Every script, every answer shaped by their exact age and what you actually described. Never generic.",
    items: [
      { icon: '👶', text: 'Exact age, every time' },
      { icon: '📖', text: 'Reads what you share' },
      { icon: '📈', text: 'Adapts as things escalate' },
    ],
  },
];

// ─── Main component ───────────────────────────────────────────────────────────

export default function WelcomeScreen() {
  const { session }  = useAuth();
  const insets       = useSafeAreaInsets();
  const scrollRef    = useRef<ScrollView>(null);
  const [page, setPage] = useState(0);

  // Splash fade-in
  const splashOpacity = useRef(new Animated.Value(0)).current;

  // Card spring entrance (shared, reset per page)
  const cardY       = useRef(new Animated.Value(40)).current;
  const cardOpacity = useRef(new Animated.Value(0)).current;

  // ─── Effects ───────────────────────────────────────────────────────────────

  useEffect(() => {
    if (session) {
      router.replace('/(tabs)');
      return;
    }

    Animated.timing(splashOpacity, {
      toValue:         1,
      duration:        700,
      useNativeDriver: true,
    }).start();

    const timer = setTimeout(() => {
      goToPage(1);
    }, 3000);

    return () => clearTimeout(timer);
  }, [session]);

  useEffect(() => {
    if (page === 0) return;
    cardY.setValue(40);
    cardOpacity.setValue(0);
    Animated.parallel([
      Animated.spring(cardY, {
        toValue:         0,
        damping:         22,
        stiffness:       180,
        useNativeDriver: true,
      }),
      Animated.timing(cardOpacity, {
        toValue:         1,
        duration:        350,
        useNativeDriver: true,
      }),
    ]).start();
  }, [page]);

  // ─── Handlers ──────────────────────────────────────────────────────────────

  const goToPage = (index: number) => {
    scrollRef.current?.scrollTo({ x: W * index, animated: true });
    setPage(index);
  };

  const onMomentumScrollEnd = (e: any) => {
    const newPage = Math.round(e.nativeEvent.contentOffset.x / W);
    if (newPage !== page) setPage(newPage);
  };

  const handleGetStarted = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/auth?mode=signup');
  };

  const handleSignIn = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/auth?mode=signin');
  };

  // ─── Shared animated card style ────────────────────────────────────────────

  const cardAnimStyle = {
    opacity:   cardOpacity,
    transform: [{ translateY: cardY }],
  };

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <View style={s.root}>
      <StatusBar style="light" />

      {/* C-2 fast-fade gradient — shared base for every page so the swipe
          feels like one continuous canvas. */}
      <LinearGradient
        colors={[
          C.gradientTop,
          C.gradientMid1,
          C.gradientMid2,
          C.gradientMid3,
          C.gradientMid4,
          C.gradientBottom,
        ]}
        locations={[0, 0.14, 0.28, 0.42, 0.58, 1]}
        style={StyleSheet.absoluteFill}
      />

      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEventThrottle={16}
        onMomentumScrollEnd={onMomentumScrollEnd}
      >
        {/* ══════════════════════════════════════════
            PAGE 0 — SPLASH (logo + wordmark + tagline)
            ══════════════════════════════════════════ */}
        <View style={s.page}>
          <Animated.View
            style={[
              s.splashContent,
              { opacity: splashOpacity },
            ]}
          >
            <LinearGradient
              colors={['#D4944A', '#E87461']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={s.logoBox}
            >
              <Text style={s.logoLetter}>S</Text>
            </LinearGradient>

            <Text style={s.splashName}>Sturdy</Text>
            <Text style={s.splashTagline}>The bridge from chaos to connection.</Text>
          </Animated.View>
        </View>

        {/* ══════════════════════════════════════════
            PAGES 1-3 — FEATURE SLIDES
            ══════════════════════════════════════════ */}
        {FEATURES.map((feat, i) => {
          const slideIndex = i + 1;
          return (
            <View key={i} style={s.page}>
              {/* Page dots */}
              <View style={[s.dotsRow, { top: insets.top + 20 }]}>
                {FEATURES.map((_, di) => (
                  <View key={di} style={[s.dot, di === i && s.dotActive]} />
                ))}
              </View>

              {/* Glass card — bottom anchored */}
              <Animated.View
                style={[
                  s.cardWrap,
                  { paddingBottom: insets.bottom + 36 },
                  page === slideIndex ? cardAnimStyle : null,
                ]}
              >
                <View style={s.card}>
                  {/* Badge */}
                  <View style={[s.badge, { backgroundColor: feat.badgeBg }]}>
                    <Text style={[s.badgeText, { color: feat.badgeColor }]}>
                      {feat.badge.toUpperCase()}
                    </Text>
                  </View>

                  {/* Title */}
                  <Text style={s.featTitle}>
                    {feat.titlePre}
                    <Text style={[s.featAccent, { color: feat.accentColor }]}>
                      {feat.titleAccent}
                    </Text>
                    {feat.titlePost}
                  </Text>

                  {/* Description */}
                  <Text style={s.featDesc}>{feat.desc}</Text>

                  {/* Feature list */}
                  <View style={s.itemList}>
                    {feat.items.map((item, ii) => (
                      <View key={ii} style={s.item}>
                        <Text style={s.itemIcon}>{item.icon}</Text>
                        <Text style={s.itemText}>{item.text}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              </Animated.View>
            </View>
          );
        })}

        {/* ══════════════════════════════════════════
            PAGE 4 — FINAL CTA
            ══════════════════════════════════════════ */}
        <View style={s.page}>
          <Animated.View
            style={[
              s.cardWrap,
              { paddingBottom: insets.bottom + 36 },
              page === 4 ? cardAnimStyle : null,
            ]}
          >
            <View style={[s.card, s.finalCard]}>
              <LinearGradient
                colors={['#D4944A', '#E87461']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={s.finalLogoBox}
              >
                <Text style={s.finalLogoLetter}>S</Text>
              </LinearGradient>

              <Text style={s.finalTitle}>
                {'From chaos.\n'}
                <Text style={s.finalAccent}>To connection.</Text>
              </Text>

              <Text style={s.finalSub}>
                The two things every parent needs — exactly when you need them.
              </Text>

              <View style={s.finalFeats}>
                {[
                  { icon: '⚡', title: 'Hard moment scripts',  sub: 'Free · Always' },
                  { icon: '💭', title: 'Ask Sturdy anything',  sub: 'Free · Always' },
                  { icon: '👶', title: 'Adapts to your child', sub: 'Free · Always' },
                ].map((f, i) => (
                  <View key={i} style={s.finalFeat}>
                    <Text style={s.finalFeatIcon}>{f.icon}</Text>
                    <View style={s.finalFeatInfo}>
                      <Text style={s.finalFeatTitle}>{f.title}</Text>
                      <Text style={s.finalFeatSub}>{f.sub}</Text>
                    </View>
                    <Text style={s.check}>✓</Text>
                  </View>
                ))}
              </View>

              {/* Get started */}
              <Pressable
                onPress={handleGetStarted}
                style={({ pressed }) => [{ opacity: pressed ? 0.88 : 1, width: '100%' }]}
              >
                <LinearGradient
                  colors={[C.amber, C.amberMid]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={s.btnPrimary}
                >
                  <Text style={s.btnPrimaryText}>Get started</Text>
                </LinearGradient>
              </Pressable>

              {/* Sign in */}
              <View style={s.signInRow}>
                <Text style={s.signInGrey}>Already with us? </Text>
                <Pressable onPress={handleSignIn} hitSlop={8}>
                  <Text style={s.signInLink}>Sign in</Text>
                </Pressable>
              </View>
            </View>
          </Animated.View>
        </View>
      </ScrollView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  root: {
    flex:            1,
    backgroundColor: C.background,
  },

  page: {
    width:          W,
    height:         H,
    justifyContent: 'center',
    alignItems:     'stretch',
  },

  // ── Splash ──────────────────────────────────────────────────────────────────

  splashContent: {
    flex:              1,
    justifyContent:    'center',
    alignItems:        'center',
    paddingHorizontal: 32,
  },

  logoBox: {
    width:          60,
    height:         60,
    borderRadius:   17,
    alignItems:     'center',
    justifyContent: 'center',
    marginBottom:   12,
    shadowColor:    '#000000',
    shadowOffset:   { width: 0, height: 6 },
    shadowOpacity:  0.35,
    shadowRadius:   20,
    elevation:      4,
  },

  logoLetter: {
    fontFamily:    F.heading,
    fontSize:      28,
    color:         '#FFFFFF',
    letterSpacing: -1,
  },

  splashName: {
    fontFamily:    F.heading,
    fontSize:      32,
    color:         C.text,
    letterSpacing: 0.5,
    marginBottom:  8,
  },

  splashTagline: {
    fontFamily:    F.body,
    fontSize:      14,
    color:         C.textSecondary,
    letterSpacing: 0.3,
    textAlign:     'center',
  },

  // ── Page dots ───────────────────────────────────────────────────────────────

  dotsRow: {
    position:        'absolute',
    left:            0,
    right:           0,
    flexDirection:   'row',
    justifyContent:  'center',
    alignItems:      'center',
    gap:             6,
    zIndex:          10,
  },

  dot: {
    width:           6,
    height:          6,
    borderRadius:    3,
    backgroundColor: C.textMuted,
  },

  dotActive: {
    width:           18,
    backgroundColor: C.amber,
  },

  // ── Card wrapper (bottom-anchored) ──────────────────────────────────────────

  cardWrap: {
    alignSelf:         'stretch',
    paddingHorizontal: 20,
    paddingVertical:   20,
    marginTop:         'auto',
  },

  card: {
    backgroundColor:  'rgba(26,24,22,0.45)',
    borderRadius:     24,
    overflow:         'hidden',
    padding:          22,
    borderWidth:      1,
    borderColor:      C.border,
    borderTopWidth:   1,
    borderTopColor:   'rgba(255,255,255,0.20)',
    shadowColor:      '#000000',
    shadowOffset:     { width: 0, height: 12 },
    shadowOpacity:    0.50,
    shadowRadius:     32,
    elevation:        8,
  },

  // ── Feature slide card content ───────────────────────────────────────────────

  badge: {
    alignSelf:         'flex-start',
    paddingHorizontal: 12,
    paddingVertical:   5,
    borderRadius:      20,
    marginBottom:      12,
  },

  badgeText: {
    fontFamily:    F.label,
    fontSize:      10,
    letterSpacing: 1.4,
  },

  featTitle: {
    fontFamily:    F.heading,
    fontSize:      26,
    color:         C.text,
    lineHeight:    32,
    letterSpacing: -0.4,
    marginBottom:  10,
  },

  featAccent: {
    fontFamily: F.heading,
    fontSize:   26,
    lineHeight: 32,
  },

  featDesc: {
    fontFamily:   F.body,
    fontSize:     14,
    color:        C.textSecondary,
    lineHeight:   21,
    marginBottom: 16,
  },

  itemList: { gap: 7 },

  item: {
    flexDirection:     'row',
    alignItems:        'center',
    gap:               11,
    paddingHorizontal: 13,
    paddingVertical:   9,
    borderRadius:      11,
    backgroundColor:   C.chipBg,
    borderWidth:       1,
    borderColor:       C.chipBorder,
  },

  itemIcon: { fontSize: 14, lineHeight: 18 },

  itemText: {
    fontFamily: F.bodyMedium,
    fontSize:   13,
    color:      C.text,
    lineHeight: 18,
    flex:       1,
  },

  // ── Final CTA card ──────────────────────────────────────────────────────────

  finalCard: { alignItems: 'center' },

  finalLogoBox: {
    width:          52,
    height:         52,
    borderRadius:   15,
    alignItems:     'center',
    justifyContent: 'center',
    marginBottom:   10,
    shadowColor:    '#000000',
    shadowOffset:   { width: 0, height: 6 },
    shadowOpacity:  0.35,
    shadowRadius:   20,
    elevation:      4,
  },

  finalLogoLetter: {
    fontFamily:    F.heading,
    fontSize:      24,
    color:         '#FFFFFF',
    letterSpacing: -1,
  },

  finalTitle: {
    fontFamily:    F.heading,
    fontSize:      22,
    color:         C.text,
    textAlign:     'center',
    lineHeight:    28,
    letterSpacing: -0.3,
    marginBottom:  6,
  },

  finalAccent: { color: C.amberLight },

  finalSub: {
    fontFamily:   F.body,
    fontSize:     13,
    color:        C.textSecondary,
    textAlign:    'center',
    lineHeight:   19,
    marginBottom: 12,
  },

  finalFeats: {
    width:        '100%',
    gap:          6,
    marginBottom: 14,
  },

  finalFeat: {
    flexDirection:     'row',
    alignItems:        'center',
    gap:               10,
    paddingHorizontal: 12,
    paddingVertical:   9,
    borderRadius:      11,
    backgroundColor:   C.chipBg,
    borderWidth:       1,
    borderColor:       C.chipBorder,
  },

  finalFeatIcon: { fontSize: 16, lineHeight: 20 },

  finalFeatInfo: { flex: 1 },

  finalFeatTitle: {
    fontFamily: F.bodySemi,
    fontSize:   13,
    color:      C.text,
  },

  finalFeatSub: {
    fontFamily: F.body,
    fontSize:   11,
    color:      C.textMuted,
    marginTop:  1,
  },

  check: {
    fontSize:   13,
    color:      C.sage,
    fontWeight: '700',
  },

  // ── Buttons ─────────────────────────────────────────────────────────────────

  btnPrimary: {
    width:           '100%',
    paddingVertical: 15,
    borderRadius:    14,
    alignItems:      'center',
    marginBottom:    10,
    shadowColor:     C.amber,
    shadowOffset:    { width: 0, height: 6 },
    shadowOpacity:   0.35,
    shadowRadius:    20,
    elevation:       4,
  },

  btnPrimaryText: {
    fontFamily:    F.heading,
    fontSize:      15,
    color:         '#FFFFFF',
    letterSpacing: 0.3,
  },

  signInRow: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'center',
  },

  signInGrey: {
    fontFamily: F.body,
    fontSize:   12,
    color:      C.textSecondary,
  },

  signInLink: {
    fontFamily:          F.bodySemi,
    fontSize:            12,
    color:               C.amberLight,
    textDecorationLine:  'underline',
    textDecorationColor: C.amberLight,
  },
});
