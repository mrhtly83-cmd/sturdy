// app/welcome/trial-result.tsx
// Onboarding Screen 3 — "The Magic Moment".
// Shows the Regulate step in full; blurs Connect + Guide using BlurView
// (the parent SEES there's more, but can't read it — creates desire).
// Pitch text below ties what they just experienced to personalisation.

import { useEffect } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import { colors as C, fonts as F } from '../../src/theme/colors';
import { ProgressDots } from '../../src/components/welcome/ProgressDots';
import { useOnboarding } from '../../src/context/OnboardingContext';
import { track } from '../../src/utils/analytics';

export default function WelcomeTrialResult() {
  const { trialResult, setTrialInput, setTrialResult } = useOnboarding();

  useEffect(() => {
    track('onboarding_screen_viewed', { screen: 3 });
    track('onboarding_trial_result_viewed', {});
  }, []);

  // If user lands here directly without trial data, route back to /welcome.
  useEffect(() => {
    if (!trialResult) {
      router.replace('/welcome');
    }
  }, [trialResult]);

  if (!trialResult) return null;

  const { situation_summary, regulate, connect, guide } = trialResult;

  function onMakeItPersonal() {
    track('onboarding_screen_dropped', { screen: 3, action: 'make_it_personal' });
    router.push('/welcome/child-setup');
  }

  function onTryAnother() {
    track('onboarding_screen_dropped', { screen: 3, action: 'try_another' });
    setTrialInput(null);
    setTrialResult(null);
    router.replace('/welcome/trial');
  }

  function onSignIn() {
    track('onboarding_screen_dropped', { screen: 3, action: 'sign_in' });
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
        <ProgressDots step={3} />

        <ScrollView
          contentContainerStyle={s.scroll}
          showsVerticalScrollIndicator={false}
        >
          <Text style={s.summary}>“{situation_summary}”</Text>

          {/* Card 1 — REGULATE (fully visible, primary border accent) */}
          <View style={[s.stepCard, s.stepCardActive]}>
            <View style={[s.stepAccent, { backgroundColor: C.sos }]} />
            <View style={s.stepBody}>
              <Text style={s.stepLabel}>STEP 1 · REGULATE</Text>
              <Text style={s.parentAction}>{regulate.parent_action}</Text>
              <Text style={s.scriptText}>“{regulate.script}”</Text>
            </View>
          </View>

          {/* Card 2 — CONNECT (blurred) */}
          <BlurredStepCard
            label="STEP 2 · CONNECT"
            parentAction={connect.parent_action}
            scriptText={connect.script}
          />

          {/* Card 3 — GUIDE (blurred) */}
          <BlurredStepCard
            label="STEP 3 · GUIDE"
            parentAction={guide.parent_action}
            scriptText={guide.script}
          />

          <Text style={s.pitch}>
            That's one script. Sturdy builds hundreds —{'\n'}
            each one matched to your child's age,{'\n'}
            personality, and the moment you're in.
          </Text>
        </ScrollView>

        <View style={s.ctaBlock}>
          <Pressable
            onPress={onMakeItPersonal}
            style={({ pressed }) => [s.cta, pressed && s.ctaPressed]}
            accessibilityRole="button"
          >
            <Text style={s.ctaText}>Make it personal — it's free</Text>
          </Pressable>

          <View style={s.linkRow}>
            <Pressable onPress={onTryAnother} style={s.linkBtn}>
              <Text style={s.link}>Try another scenario</Text>
            </Pressable>
            <Text style={s.linkSep}>·</Text>
            <Pressable onPress={onSignIn} style={s.linkBtn}>
              <Text style={s.link}>Sign in</Text>
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

function BlurredStepCard({
  label, parentAction, scriptText,
}: { label: string; parentAction: string; scriptText: string }) {
  return (
    <View style={s.stepCard}>
      <View style={s.stepBody}>
        <Text style={[s.stepLabel, s.stepLabelMuted]}>{label}</Text>
        <Text style={s.parentAction}>{parentAction}</Text>
        <Text style={s.scriptText}>“{scriptText}”</Text>
      </View>
      <BlurView intensity={28} tint="dark" style={[StyleSheet.absoluteFill, s.blurOverlay]}>
        <View style={s.lockChip}>
          <Text style={s.lockEmoji}>🔒</Text>
        </View>
      </BlurView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.background },
  safe: { flex: 1, paddingHorizontal: 20 },
  scroll: { paddingTop: 8, paddingBottom: 20, gap: 16 },

  summary: {
    fontFamily: F.headingItalic,
    fontSize: 18,
    lineHeight: 26,
    color: C.amber,
    textAlign: 'center',
    paddingHorizontal: 8,
    paddingVertical: 8,
  },

  stepCard: {
    backgroundColor: C.surface,
    borderColor:     C.border,
    borderWidth: 1,
    borderRadius: 20,
    overflow: 'hidden',
    flexDirection: 'row',
    minHeight: 140,
  },
  stepCardActive: {
    // Subtle SOS accent on the regulate card edge.
    borderColor: 'rgba(232,116,97,0.20)',
  },
  stepAccent: {
    width: 4,
  },
  stepBody: {
    flex: 1,
    padding: 16,
    gap: 8,
  },

  stepLabel: {
    fontFamily: F.label,
    fontSize: 11,
    letterSpacing: 0.8,
    color: C.amber,
    textTransform: 'uppercase',
  },
  stepLabelMuted: { color: C.textMuted },

  parentAction: {
    fontFamily: F.body,
    fontSize: 13,
    lineHeight: 20,
    color: C.textSecondary,
    fontStyle: 'italic',
  },

  scriptText: {
    fontFamily: F.script,
    fontSize: 18,
    lineHeight: 28,
    color: C.text,
    marginTop: 4,
  },

  blurOverlay: {
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lockChip: {
    width: 44,
    height: 44,
    borderRadius: 999,
    backgroundColor: 'rgba(20,17,14,0.7)',
    borderColor: C.borderHi,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lockEmoji: { fontSize: 18 },

  pitch: {
    fontFamily: F.body,
    fontSize: 14,
    lineHeight: 22,
    color: C.textSecondary,
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 12,
  },

  ctaBlock: { paddingBottom: 12, gap: 12, alignItems: 'center' },
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
  linkRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  linkBtn: { paddingVertical: 8 },
  link: { fontFamily: F.body, fontSize: 14, color: C.textMuted },
  linkSep: { color: C.textFaint, fontSize: 14 },
});
