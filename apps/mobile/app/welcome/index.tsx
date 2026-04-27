// app/welcome/index.tsx
// v12 — Native photo identity welcome flow
//
// 5 screens: splash → 3 feature slides → final CTA
// Native patterns:
//   - Paged horizontal ScrollView (real swipe)
//   - BlurView glass cards anchored to bottom edge
//   - LinearGradient photo dim overlays
//   - Spring card entrance animation (Animated API)
//   - Page dots (not progress bar)
//   - Plain text Skip (not pill button)
//   - Haptics on every interaction
//
// Auth wiring preserved from v11:
//   - Session check → redirect to tabs
//   - GUEST_SEEN_KEY in AsyncStorage
//   - Get started → /child-setup
//   - Try without account → guest flag → tabs
//   - Sign in → /auth?mode=signin

import { useEffect, useRef, useState } from 'react';
import {
  Animated,
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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient }  from 'expo-linear-gradient';
import { BlurView }        from 'expo-blur';
import * as Haptics        from 'expo-haptics';
import AsyncStorage        from '@react-native-async-storage/async-storage';
import { useAuth }         from '../../src/context/AuthContext';
import { colors as C, fonts as F } from '../../src/theme/colors';

const { width: W, height: H } = Dimensions.get('window');
const GUEST_SEEN_KEY = 'sturdy_guest_seen_v1';

// Static requires — resolved at build time, images must exist before running
const FAMILY_PHOTO  = require('../../assets/images/welcome/welcome-family.jpg');
const HORIZON_PHOTO = require('../../assets/images/welcome/welcome-horizon.jpg');

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
    badgeColor:  '#E8A855',
    titlePre:    'Built around',
    titleAccent: '',
    titlePost:   '\nyour child.',
    accentColor: '#E8A855',
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

    // Fade in splash branding
    Animated.timing(splashOpacity, {
      toValue:         1,
      duration:        700,
      useNativeDriver: true,
    }).start();

    // Auto-advance to first feature slide after 3s
    const timer = setTimeout(() => {
      goToPage(1);
    }, 3000);

    return () => clearTimeout(timer);
  }, [session]);

  // Animate card in whenever page changes to a non-splash screen
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
    if (newPage !== page) {
      setPage(newPage);
    }
  };

  const handleSkip = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await AsyncStorage.setItem(GUEST_SEEN_KEY, 'true');
    router.replace('/(tabs)');
  };

 const handleGetStarted = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/auth/sign-up');
  };

  const handleTryWithout = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await AsyncStorage.setItem(GUEST_SEEN_KEY, 'true');
    router.replace('/(tabs)');
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

      {/* Skip — plain text, top-right, only on feature slides */}
      {page >= 1 && page <= 3 && (
        <Pressable
          style={[s.skipBtn, { top: insets.top + 16 }]}
          onPress={handleSkip}
          hitSlop={12}
        >
          <Text style={s.skipText}>Skip</Text>
        </Pressable>
      )}

      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEventThrottle={16}
        onMomentumScrollEnd={onMomentumScrollEnd}
      >
        {/* ══════════════════════════════════════════
            PAGE 0 — SPLASH
            Logo at top, family photo full-bleed
            Family figures visible in lower portion
            ══════════════════════════════════════════ */}
        <View style={s.page}>
          <Image
            source={FAMILY_PHOTO}
            style={s.photoBg}
            resizeMode="cover"
          />
          <LinearGradient
            colors={[
              'rgba(15,10,18,0.52)',
              'rgba(15,10,18,0.18)',
              'rgba(15,10,18,0.04)',
              'rgba(15,10,18,0.22)',
            ]}
            locations={[0, 0.28, 0.60, 1]}
            style={StyleSheet.absoluteFill}
          />

          {/* Branding anchored to top */}
          <Animated.View
            style={[
              s.splashContent,
              { paddingTop: insets.top + 70 },
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
            <Text style={s.splashTagline}>
  The bridge between chaos and calm.
</Text>
          </Animated.View>
        </View>

        {/* ══════════════════════════════════════════
            PAGES 1-3 — FEATURE SLIDES
            Horizon photo background
            BlurView glass card anchored to bottom
            ══════════════════════════════════════════ */}
        {FEATURES.map((feat, i) => {
          const slideIndex = i + 1;
          return (
            <View key={i} style={s.page}>
              <Image
                source={HORIZON_PHOTO}
                style={s.photoBg}
                resizeMode="cover"
              />
              <LinearGradient
                colors={[
                  'rgba(15,10,18,0.25)',
                  'rgba(15,10,18,0.20)',
                  'rgba(15,10,18,0.62)',
                ]}
                locations={[0, 0.40, 1]}
                style={StyleSheet.absoluteFill}
              />

              {/* Page dots */}
              <View style={[s.dotsRow, { top: insets.top + 20 }]}>
                {FEATURES.map((_, di) => (
                  <View
                    key={di}
                    style={[s.dot, di === i && s.dotActive]}
                  />
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
                <BlurView
                  intensity={50}
                  tint="dark"
                  style={s.card}
                >
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
                </BlurView>
              </Animated.View>
            </View>
          );
        })}

        {/* ══════════════════════════════════════════
            PAGE 4 — FINAL CTA
            Family photo returns (bookend)
            BlurView card with buttons
            ══════════════════════════════════════════ */}
        <View style={s.page}>
          <Image
            source={FAMILY_PHOTO}
            style={s.photoBg}
            resizeMode="cover"
          />
          <LinearGradient
            colors={[
              'rgba(15,10,18,0.22)',
              'rgba(15,10,18,0.30)',
              'rgba(15,10,18,0.72)',
            ]}
            locations={[0, 0.30, 1]}
            style={StyleSheet.absoluteFill}
          />

          {/* Glass CTA card — bottom anchored */}
          <Animated.View
            style={[
              s.cardWrap,
              { paddingBottom: insets.bottom + 36 },
              page === 4 ? cardAnimStyle : null,
            ]}
          >
            <BlurView
              intensity={50}
              tint="dark"
              style={[s.card, s.finalCard]}
            >
              {/* Logo */}
              <LinearGradient
                colors={['#D4944A', '#E87461']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={s.finalLogoBox}
              >
                <Text style={s.finalLogoLetter}>S</Text>
              </LinearGradient>

              {/* Headline */}
              <Text style={s.finalTitle}>
  {'From chaos.\n'}
  <Text style={s.finalAccent}>To calm.</Text>
</Text>

<Text style={s.finalSub}>
  The two things every parent needs — exactly when you need them.
</Text>

              {/* Feature list */}
              <View style={s.finalFeats}>
                {[
                 { icon: '⚡', title: 'Hard moment scripts',   sub: 'Free · Always' },
{ icon: '💭', title: 'Ask Sturdy anything',   sub: 'Free · Always' },
{ icon: '👶', title: 'Adapts to your child',  sub: 'Free · Always' },
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
                  colors={['#C8883A', '#E8A855']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={s.btnPrimary}
                >
                  <Text style={s.btnPrimaryText}>Get started</Text>
                </LinearGradient>
              </Pressable>

              {/* Try without account */}
              <Pressable
                style={({ pressed }) => [s.btnSecondary, { opacity: pressed ? 0.7 : 1 }]}
                onPress={handleTryWithout}
              >
                <Text style={s.btnSecondaryText}>Try it without an account</Text>
              </Pressable>

              {/* Sign in */}
              <View style={s.signInRow}>
                <Text style={s.signInGrey}>Already with us? </Text>
                <Pressable onPress={handleSignIn} hitSlop={8}>
                  <Text style={s.signInLink}>Sign in</Text>
                </Pressable>
              </View>
            </BlurView>
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
    backgroundColor: '#0E0A12',
  },

page: {
    width:          W,
    height:         H,
    justifyContent: 'center',
    alignItems:     'stretch',
  },

  photoBg: {
    position: 'absolute',
    top:      0,
    left:     0,
    width:    W,
    height:   H,
  },

  // ── Skip ────────────────────────────────────────────────────────────────────

  skipBtn: {
    position: 'absolute',
    right:    24,
    zIndex:   50,
    padding:  8,
  },

  skipText: {
    fontFamily: F.body,
    fontSize:   14,
    color:      'rgba(255,255,255,0.75)',
    letterSpacing: 0.5,
  },

  // ── Splash ──────────────────────────────────────────────────────────────────

  splashContent: {
    position:        'absolute',
    top:             0,
    left:            0,
    right:           0,
    alignItems:      'center',
    paddingHorizontal: 32,
  },

  logoBox: {
    width:          60,
    height:         60,
    borderRadius:   17,
    alignItems:     'center',
    justifyContent: 'center',
    marginBottom:   12,
    shadowColor:    '#D4944A',
    shadowOffset:   { width: 0, height: 8 },
    shadowOpacity:  0.55,
    shadowRadius:   20,
    elevation:      12,
  },

  logoLetter: {
    fontFamily:    F.heading,
    fontSize:      28,
    color:         '#FFFFFF',
    letterSpacing: -1,
  },

  splashName: {
    fontFamily:       F.heading,
    fontSize:         32,
    color:            '#FFFFFF',
    letterSpacing:    0.5,
    marginBottom:     8,
    textShadowColor:  'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 12,
  },

  splashTagline: {
    fontFamily:       F.body,
    fontSize:         14,
    color:            'rgba(255,255,255,0.88)',
    letterSpacing:    0.3,
    textAlign:        'center',
    textShadowColor:  'rgba(0,0,0,0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 8,
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
    backgroundColor: 'rgba(255,255,255,0.30)',
  },

  dotActive: {
    width:           18,
    backgroundColor: '#E8A855',
  },

  // ── Card wrapper (bottom-anchored) ──────────────────────────────────────────
cardWrap: {
    alignSelf:         'stretch',
    paddingHorizontal: 20,
    paddingVertical:   20,
  },

  card: {
    borderRadius:  24,
    overflow:      'hidden',
    padding:       22,
    borderWidth:   1,
    borderColor:   'rgba(255,255,255,0.14)',
  },

  // ── Feature slide card content ───────────────────────────────────────────────

  badge: {
    alignSelf:       'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius:    20,
    marginBottom:    12,
  },

  badgeText: {
    fontFamily:    F.label,
    fontSize:      10,
    letterSpacing: 1.4,
  },

  featTitle: {
    fontFamily:       F.heading,
    fontSize:         26,
    color:            '#FFFFFF',
    lineHeight:       32,
    letterSpacing:    -0.4,
    marginBottom:     10,
    textShadowColor:  'rgba(0,0,0,0.4)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 8,
  },

  featAccent: {
    fontFamily: F.heading,
    fontSize:   26,
    lineHeight: 32,
  },

  featDesc: {
    fontFamily:    F.body,
    fontSize:      14,
    color:         'rgba(255,255,255,0.78)',
    lineHeight:    21,
    marginBottom:  12,
  },

  itemList: {
    gap: 7,
  },

  item: {
    flexDirection:   'row',
    alignItems:      'center',
    gap:             11,
    paddingHorizontal: 13,
    paddingVertical: 9,
    borderRadius:    11,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth:     1,
    borderColor:     'rgba(255,255,255,0.08)',
  },

  itemIcon: {
    fontSize:   14,
    lineHeight: 18,
  },

  itemText: {
    fontFamily: F.bodyMedium,
    fontSize:   13,
    color:      'rgba(255,255,255,0.92)',
    lineHeight: 18,
    flex:       1,
  },

  // ── Final CTA card ──────────────────────────────────────────────────────────

  finalCard: {
    alignItems: 'center',
  },

  finalLogoBox: {
    width:          52,
    height:         52,
    borderRadius:   15,
    alignItems:     'center',
    justifyContent: 'center',
    marginBottom:   10,
    shadowColor:    '#D4944A',
    shadowOffset:   { width: 0, height: 6 },
    shadowOpacity:  0.50,
    shadowRadius:   16,
    elevation:      10,
  },

  finalLogoLetter: {
    fontFamily:    F.heading,
    fontSize:      24,
    color:         '#FFFFFF',
    letterSpacing: -1,
  },

  finalTitle: {
    fontFamily:       F.heading,
    fontSize:         22,
    color:            '#FFFFFF',
    textAlign:        'center',
    lineHeight:       28,
    letterSpacing:    -0.3,
    marginBottom:     6,
    textShadowColor:  'rgba(0,0,0,0.4)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 8,
  },

  finalAccent: {
    color: '#E8A855',
  },

  finalSub: {
    fontFamily:    F.body,
    fontSize:      13,
    color:         'rgba(255,255,255,0.72)',
    textAlign:     'center',
    lineHeight:    19,
    marginBottom:  12,
  },

  finalFeats: {
    width:         '100%',
    gap:           6,
    marginBottom:  14,
  },

  finalFeat: {
    flexDirection:   'row',
    alignItems:      'center',
    gap:             10,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius:    11,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth:     1,
    borderColor:     'rgba(255,255,255,0.08)',
  },

  finalFeatIcon: {
    fontSize:   16,
    lineHeight: 20,
  },

  finalFeatInfo: {
    flex: 1,
  },

  finalFeatTitle: {
    fontFamily: F.bodySemi,
    fontSize:   13,
    color:      '#FFFFFF',
  },

  finalFeatSub: {
    fontFamily: F.body,
    fontSize:   11,
    color:      'rgba(255,255,255,0.50)',
    marginTop:  1,
  },

  check: {
    fontSize:   13,
    color:      '#A0C880',
    fontWeight: '700',
  },

  // ── Buttons ─────────────────────────────────────────────────────────────────

  btnPrimary: {
    width:           '100%',
    paddingVertical: 15,
    borderRadius:    14,
    alignItems:      'center',
    marginBottom:    10,
    shadowColor:     '#D4944A',
    shadowOffset:    { width: 0, height: 8 },
    shadowOpacity:   0.55,
    shadowRadius:    20,
    elevation:       12,
  },

  btnPrimaryText: {
    fontFamily:    F.heading,
    fontSize:      15,
    color:         '#FFFFFF',
    letterSpacing: 0.3,
  },

  btnSecondary: {
    width:           '100%',
    paddingVertical: 13,
    borderRadius:    12,
    borderWidth:     1,
    borderColor:     'rgba(255,255,255,0.22)',
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems:      'center',
    marginBottom:    10,
  },

  btnSecondaryText: {
    fontFamily: F.body,
    fontSize:   13,
    color:      'rgba(255,255,255,0.88)',
  },

  signInRow: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'center',
  },

  signInGrey: {
    fontFamily: F.body,
    fontSize:   12,
    color:      'rgba(255,255,255,0.50)',
  },

  signInLink: {
    fontFamily:          F.bodySemi,
    fontSize:            12,
    color:               '#E8A855',
    textDecorationLine:  'underline',
    textDecorationColor: '#E8A855',
  },
});
