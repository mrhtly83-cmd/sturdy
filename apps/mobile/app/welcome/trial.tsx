// app/welcome/trial.tsx
// Onboarding Screen 2 — "Live Trial".
// The parent describes a moment, picks an age + intensity, and we hit
// the existing edge function in trial mode (no userId → no logging,
// no profile attachment). On success → /welcome/trial-result with the
// payload stashed in OnboardingContext. Crisis path → /crisis.

import { useEffect, useRef, useState } from 'react';
import {
  Animated,
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
import { CrisisDetectedError, getParentingScript } from '../../src/lib/api';
import { track } from '../../src/utils/analytics';

const AGES = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] as const;
type Intensity = 'Mild' | 'Heated' | 'Crisis';
const INTENSITIES: Intensity[] = ['Mild', 'Heated', 'Crisis'];
const INTENSITY_VALUE: Record<Intensity, 1 | 3 | 5> = {
  Mild:   1,
  Heated: 3,
  Crisis: 5,
};

export default function WelcomeTrial() {
  const { trialInput, setTrialInput, setTrialResult } = useOnboarding();
  const [situation, setSituation]   = useState(trialInput?.situation ?? '');
  const [age, setAge]               = useState<number>(trialInput?.childAge ?? 5);
  const [intensity, setIntensity]   = useState<Intensity>(trialInput?.intensityLabel ?? 'Heated');
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState<string | null>(null);
  const startTime = useRef<number>(0);

  // Subtle pulse on the loading button.
  const pulse = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    if (!loading) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 0.7, duration: 700, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1.0, duration: 700, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [loading]);

  useEffect(() => {
    track('onboarding_screen_viewed', { screen: 2 });
  }, []);

  const canSubmit = situation.trim().length > 0 && !loading;

  async function onSubmit() {
    if (!canSubmit) return;
    setError(null);
    setLoading(true);
    startTime.current = Date.now();

    const intensityValue = INTENSITY_VALUE[intensity];
    track('onboarding_trial_started', { age, intensity });

    setTrialInput({
      situation:      situation.trim(),
      childAge:       age,
      intensity:      intensityValue,
      intensityLabel: intensity,
    });

    try {
      const result = await getParentingScript({
        childName: 'Your child',
        childAge:  age,
        message:   situation.trim(),
        intensity: intensityValue,
        mode:      'sos',
      });
      const duration = Date.now() - startTime.current;
      track('onboarding_trial_completed', { age, duration_ms: duration });
      setTrialResult(result);
      router.push('/welcome/trial-result');
    } catch (err) {
      if (err instanceof CrisisDetectedError) {
        // Safety route is always free — never block on onboarding.
        track('onboarding_trial_failed', { reason: 'crisis', age });
        router.push('/crisis');
        return;
      }
      const message = err instanceof Error ? err.message : 'request-failed';
      track('onboarding_trial_failed', { reason: message, age });
      setError("Something went wrong. Try again?");
    } finally {
      setLoading(false);
    }
  }

  function onSkip() {
    track('onboarding_screen_dropped', { screen: 2, action: 'skip' });
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
        <ProgressDots step={2} />

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={s.kav}
        >
          <ScrollView
            contentContainerStyle={s.scroll}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <Text style={s.h1}>What's happening{'\n'}right now?</Text>
            <Text style={s.sub}>
              Describe the moment. Sturdy will show you{'\n'}exactly what to say.
            </Text>

            <View style={s.card}>
              <TextInput
                style={s.input}
                value={situation}
                onChangeText={setSituation}
                placeholder="They're screaming that homework is stupid and threw their pencil…"
                placeholderTextColor={C.textMuted}
                multiline
                numberOfLines={4}
                autoFocus
                editable={!loading}
                maxLength={1000}
              />

              <View style={s.divider} />

              <Text style={s.label}>How old is your child?</Text>
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
                      accessibilityLabel={`Age ${a}${selected ? ', selected' : ''}`}
                    >
                      <Text style={[s.agePillText, selected && s.agePillTextSelected]}>
                        {a === 12 ? '12+' : a}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>

              <View style={s.divider} />

              <Text style={s.label}>How intense is this?</Text>
              <View style={s.intensityRow}>
                {INTENSITIES.map((opt) => {
                  const selected = opt === intensity;
                  return (
                    <Pressable
                      key={opt}
                      onPress={() => setIntensity(opt)}
                      style={[s.intensityPill, selected && s.intensityPillSelected]}
                      accessibilityRole="button"
                      accessibilityLabel={`Intensity ${opt}${selected ? ', selected' : ''}`}
                    >
                      <Text style={[s.intensityPillText, selected && s.intensityPillTextSelected]}>
                        {opt}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {error ? (
              <View style={s.errorBox}>
                <Text style={s.errorText}>{error}</Text>
              </View>
            ) : null}
          </ScrollView>

          <View style={s.ctaBlock}>
            <Pressable
              onPress={onSubmit}
              disabled={!canSubmit}
              style={({ pressed }) => [
                s.cta,
                !canSubmit && s.ctaDisabled,
                pressed && canSubmit && s.ctaPressed,
              ]}
              accessibilityRole="button"
            >
              <Animated.Text style={[s.ctaText, loading && { opacity: pulse }]}>
                {loading ? 'Finding the right words…' : 'Get my script →'}
              </Animated.Text>
            </Pressable>

            <Pressable onPress={onSkip} style={s.linkBtn} disabled={loading}>
              <Text style={s.link}>Skip to sign up →</Text>
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
  input: {
    fontFamily: F.body,
    fontSize: 16,
    lineHeight: 24,
    color: C.text,
    minHeight: 96,
    textAlignVertical: 'top',
    padding: 0,
  },
  divider: { height: 1, backgroundColor: C.divider },

  label: {
    fontFamily: F.label,
    fontSize: 11,
    letterSpacing: 0.8,
    color: C.textMuted,
    textTransform: 'uppercase',
  },

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

  intensityRow: { flexDirection: 'row', gap: 8 },
  intensityPill: {
    flex: 1,
    height: 40,
    borderRadius: 12,
    backgroundColor: C.chipBg,
    borderColor:     C.chipBorder,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  intensityPillSelected: {
    backgroundColor: C.amberLight,
    borderColor:     C.amber,
  },
  intensityPillText: {
    fontFamily: F.bodySemi,
    fontSize: 14,
    color: C.textSecondary,
  },
  intensityPillTextSelected: { color: C.amber },

  errorBox: {
    backgroundColor: C.sosLight,
    borderColor:     C.sos,
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
  },
  errorText: { fontFamily: F.bodySemi, fontSize: 14, color: C.sos },

  ctaBlock: { paddingBottom: 12, gap: 10, alignItems: 'center' },
  cta: {
    backgroundColor: C.amber,
    borderRadius: 14,
    paddingVertical: 16,
    width: '100%',
    alignItems: 'center',
  },
  ctaPressed:  { opacity: 0.85 },
  ctaDisabled: { backgroundColor: C.disabled },
  ctaText: {
    fontFamily: F.bodySemi,
    fontSize: 17,
    color: C.textInverse,
    letterSpacing: 0.3,
  },
  linkBtn: { paddingVertical: 8 },
  link: { fontFamily: F.body, fontSize: 14, color: C.textMuted },
});
