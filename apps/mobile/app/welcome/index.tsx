// app/welcome/index.tsx
// Onboarding Screen 1 — "The Moment".
// Emotional hook. Three lines fade in line by line, then the subtext,
// then the CTA. The parent should feel seen in 3 seconds.

import { useEffect, useRef } from 'react';
import {
  Animated,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import { colors as C, fonts as F } from '../../src/theme/colors';
import { ProgressDots } from '../../src/components/welcome/ProgressDots';
import { track } from '../../src/utils/analytics';

const HERO_LINES = [
  "It's 8pm.",
  "They won't brush their teeth.",
  "You've already asked three times.",
];

const SUBTEXT = "Sturdy gives you the right words\nfor moments like this.";

export default function WelcomeMoment() {
  const lineOpacity   = useRef(HERO_LINES.map(() => new Animated.Value(0))).current;
  const lineSlide     = useRef(HERO_LINES.map(() => new Animated.Value(8))).current;
  const subtextOpacity = useRef(new Animated.Value(0)).current;
  const ctaOpacity     = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    track('onboarding_screen_viewed', { screen: 1 });

    // Stagger lines (300ms apart, each fades up over 600ms).
    HERO_LINES.forEach((_, i) => {
      Animated.parallel([
        Animated.timing(lineOpacity[i], {
          toValue: 1, duration: 600, delay: i * 300, useNativeDriver: true,
        }),
        Animated.timing(lineSlide[i], {
          toValue: 0, duration: 600, delay: i * 300, useNativeDriver: true,
        }),
      ]).start();
    });

    // Subtext + CTA fade in after the last line settles.
    const tailDelay = HERO_LINES.length * 300 + 1500;
    Animated.timing(subtextOpacity, {
      toValue: 1, duration: 700, delay: tailDelay, useNativeDriver: true,
    }).start();
    Animated.timing(ctaOpacity, {
      toValue: 1, duration: 700, delay: tailDelay + 200, useNativeDriver: true,
    }).start();
  }, []);

  function onTryNow() {
    track('onboarding_screen_dropped', { screen: 1, action: 'try_now' });
    router.push('/welcome/trial');
  }

  function onSignIn() {
    track('onboarding_screen_dropped', { screen: 1, action: 'sign_in' });
    router.push('/auth/sign-in');
  }

  return (
    <View style={s.root}>
      <LinearGradient
        colors={[C.gradientTop, C.gradientBottom]}
        style={StyleSheet.absoluteFillObject}
      />
      <SafeAreaView style={s.safe}>
        <StatusBar style="light" />
        <ProgressDots step={1} />

        <View style={s.center}>
          <View style={s.heroBlock}>
            {HERO_LINES.map((line, i) => (
              <Animated.Text
                key={i}
                style={[
                  s.heroLine,
                  { opacity: lineOpacity[i], transform: [{ translateY: lineSlide[i] }] },
                ]}
              >
                {line}
              </Animated.Text>
            ))}
          </View>

          <Animated.Text style={[s.subtext, { opacity: subtextOpacity }]}>
            {SUBTEXT}
          </Animated.Text>
        </View>

        <Animated.View style={[s.ctaBlock, { opacity: ctaOpacity }]}>
          <Pressable
            onPress={onTryNow}
            style={({ pressed }) => [s.cta, pressed && s.ctaPressed]}
            accessibilityRole="button"
            accessibilityLabel="Try it now — free"
          >
            <Text style={s.ctaText}>Try it now — free</Text>
          </Pressable>

          <Pressable
            onPress={onSignIn}
            style={s.linkBtn}
            accessibilityRole="button"
            accessibilityLabel="I already have an account, sign in"
          >
            <Text style={s.link}>I already have an account → Sign in</Text>
          </Pressable>
        </Animated.View>
      </SafeAreaView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.background },
  safe: { flex: 1, paddingHorizontal: 24 },

  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  heroBlock: {
    alignItems: 'center',
    gap: 4,
    marginBottom: 36,
  },
  heroLine: {
    fontFamily: F.heading,
    fontSize: 32,
    lineHeight: 40,
    color: C.text,
    textAlign: 'center',
    letterSpacing: -0.4,
  },

  subtext: {
    fontFamily: F.body,
    fontSize: 16,
    lineHeight: 24,
    color: C.textSecondary,
    textAlign: 'center',
  },

  ctaBlock: {
    paddingBottom: 32,
    gap: 16,
    alignItems: 'center',
  },
  cta: {
    backgroundColor: C.amber,
    borderRadius: 14,
    paddingVertical: 16,
    width: '100%',
    alignItems: 'center',
  },
  ctaPressed: { opacity: 0.85 },
  ctaText: {
    fontFamily: F.bodySemi,
    fontSize: 17,
    color: C.textInverse,
    letterSpacing: 0.3,
  },
  linkBtn: { paddingVertical: 8 },
  link: {
    fontFamily: F.body,
    fontSize: 14,
    color: C.textMuted,
  },
});
