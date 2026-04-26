// app/welcome/child-setup.tsx
// Onboarding Screen 4 — "Your Child".
// Collects the minimum needed to personalise. Stored in OnboardingContext
// (no Supabase yet — no account exists). Created in the DB after Screen 5
// signup completes.
//
// Pre-fills age from the trial screen if the parent already picked one —
// it should feel like the app already remembers them.

import { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import { colors as C, fonts as F } from '../../src/theme/colors';
import { ProgressDots } from '../../src/components/welcome/ProgressDots';
import { useOnboarding } from '../../src/context/OnboardingContext';
import { track } from '../../src/utils/analytics';

const AGES = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] as const;

const CHALLENGES = [
  'Meltdowns & tantrums',
  'Not listening',
  'Screen time battles',
  'Bedtime resistance',
  'Sibling conflict',
  'Back-talk & attitude',
] as const;

export default function WelcomeChildSetup() {
  const { trialInput, childSetup, setChildSetup } = useOnboarding();

  const [name, setName]                = useState<string>(childSetup?.name ?? '');
  const [age, setAge]                  = useState<number>(childSetup?.childAge ?? trialInput?.childAge ?? 5);
  const [challenges, setChallenges]    = useState<string[]>(childSetup?.challenges ?? []);

  useEffect(() => {
    track('onboarding_screen_viewed', { screen: 4 });
  }, []);

  function toggleChallenge(c: string) {
    setChallenges((prev) =>
      prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c],
    );
  }

  function onContinue() {
    setChildSetup({
      name:        name.trim() || null,
      childAge:    age,
      challenges,
    });
    track('onboarding_child_setup_completed', {
      has_name:   Boolean(name.trim()),
      age,
      challenges,
    });
    router.push('/welcome/signup');
  }

  function onSkip() {
    setChildSetup(null);
    track('onboarding_child_setup_skipped', {});
    router.push('/welcome/signup');
  }

  return (
    <View style={s.root}>
      <LinearGradient
        colors={[C.gradientTop, C.gradientBottom]}
        style={StyleSheet.absoluteFillObject}
      />
      <SafeAreaView style={s.safe}>
        <StatusBar style="light" />
        <ProgressDots step={4} />

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={s.kav}
        >
          <ScrollView
            contentContainerStyle={s.scroll}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <Text style={s.h1}>Who are you here for?</Text>
            <Text style={s.sub}>
              This helps Sturdy match scripts to your child's age.{'\n'}
              Every year matters.
            </Text>

            <View style={s.card}>
              <Text style={s.label}>Child's name <Text style={s.optional}>(optional)</Text></Text>
              <TextInput
                style={s.input}
                value={name}
                onChangeText={setName}
                placeholder="Their first name"
                placeholderTextColor={C.textMuted}
                autoCapitalize="words"
                maxLength={40}
                returnKeyType="done"
              />

              <View style={s.divider} />

              <Text style={s.label}>Age</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={s.ageRow}
              >
                {AGES.map((a) => {
                  const selected = a === age;
                  return (
                    <Pressable
                      key={a}
                      onPress={() => setAge(a)}
                      style={[s.agePill, selected && s.agePillSelected]}
                      accessibilityRole="button"
                    >
                      <Text style={[s.agePillText, selected && s.agePillTextSelected]}>
                        {a === 12 ? '12+' : a}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>

              <View style={s.divider} />

              <Text style={s.label}>What's your biggest challenge right now? <Text style={s.optional}>(optional)</Text></Text>
              <Text style={s.helper}>Pick as many as you like</Text>
              <View style={s.challengeWrap}>
                {CHALLENGES.map((c) => {
                  const selected = challenges.includes(c);
                  return (
                    <Pressable
                      key={c}
                      onPress={() => toggleChallenge(c)}
                      style={[s.challengePill, selected && s.challengePillSelected]}
                      accessibilityRole="button"
                      accessibilityState={{ selected }}
                    >
                      <Text style={[s.challengeText, selected && s.challengeTextSelected]}>
                        {c}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          </ScrollView>

          <View style={s.ctaBlock}>
            <Pressable
              onPress={onContinue}
              style={({ pressed }) => [s.cta, pressed && s.ctaPressed]}
              accessibilityRole="button"
            >
              <Text style={s.ctaText}>Continue →</Text>
            </Pressable>
            <Pressable onPress={onSkip} style={s.linkBtn}>
              <Text style={s.link}>Skip for now →</Text>
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.background },
  safe: { flex: 1, paddingHorizontal: 20 },
  kav:  { flex: 1 },
  scroll: { paddingTop: 16, paddingBottom: 16, gap: 16 },

  h1: {
    fontFamily: F.heading,
    fontSize: 28,
    lineHeight: 34,
    color: C.text,
    letterSpacing: -0.3,
  },
  sub: {
    fontFamily: F.body,
    fontSize: 15,
    lineHeight: 22,
    color: C.textSecondary,
  },

  card: {
    backgroundColor: C.surface,
    borderColor:     C.border,
    borderWidth: 1,
    borderRadius: 20,
    padding: 16,
    gap: 14,
  },

  label: {
    fontFamily: F.label,
    fontSize: 11,
    letterSpacing: 0.8,
    color: C.textMuted,
    textTransform: 'uppercase',
  },
  optional: {
    fontFamily: F.body,
    fontSize: 11,
    letterSpacing: 0,
    color: C.textFaint,
    textTransform: 'none',
  },
  helper: {
    fontFamily: F.body,
    fontSize: 12,
    lineHeight: 18,
    color: C.textMuted,
    marginTop: -6,
  },

  input: {
    backgroundColor: C.inputBg,
    borderColor:     C.inputBorder,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontFamily: F.body,
    fontSize: 16,
    color: C.text,
  },

  divider: { height: 1, backgroundColor: C.divider },

  ageRow: { gap: 8, paddingVertical: 4 },
  agePill: {
    minWidth: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: C.chipBg,
    borderColor:     C.chipBorder,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  agePillSelected: {
    backgroundColor: C.amberLight,
    borderColor:     C.amber,
  },
  agePillText: {
    fontFamily: F.bodySemi,
    fontSize: 16,
    color: C.textSecondary,
  },
  agePillTextSelected: { color: C.amber },

  challengeWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  challengePill: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 999,
    backgroundColor: C.chipBg,
    borderColor:     C.chipBorder,
    borderWidth: 1,
  },
  challengePillSelected: {
    backgroundColor: C.amberLight,
    borderColor:     C.amber,
  },
  challengeText: {
    fontFamily: F.body,
    fontSize: 13,
    color: C.textSecondary,
  },
  challengeTextSelected: { color: C.amber },

  ctaBlock: { paddingBottom: 12, gap: 8, alignItems: 'center' },
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
  link: { fontFamily: F.body, fontSize: 14, color: C.textMuted },
});
