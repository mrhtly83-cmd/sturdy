// app/(tabs)/index.tsx
// v9 — Twilight × Obsidian Gold. Theme only — structure identical to v8.
// v8 — Two Textbox Layout (final home screen before F&F test)
//
// Two clear zones:
//   Zone 1 — 💬 Ask Sturdy (Question mode, rotating placeholders)
//   Zone 2 — SOS (script generation, rotating real-parent-voice scenarios)
//
// Removed: trigger grid, describe card, dashboard cards (Last Session,
// Patterns, Sturdy+), picker modal, quota bar, hookStack.
// Kept: particle system, background, TrafficDots, handleSend logic.

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Easing,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { router, useFocusEffect } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';

import { useAuth } from '../../src/context/AuthContext';
import { useChildProfile } from '../../src/context/ChildProfileContext';
import { supabase } from '../../src/lib/supabase';
import { getParentingScript, getQuestionResponse, CrisisDetectedError, RateLimitError, QuotaExceededError, type ParentingScriptRequest } from '../../src/lib/api';
import { incrementScriptCount } from '../../src/utils/profileNudge';
import { colors as C, fonts as F, TAB_BAR_HEIGHT } from '../../src/theme';
import { detectCrisis } from '../../src/hooks/useCrisisMode';
import { TrafficDots } from '../../src/components/ui/TrafficDots';
import { useSubscription } from '../../src/hooks/useSubscription';
import { getTone as loadTone, setTone as saveTone, type Tone, TONE_DEFAULT } from '../../src/utils/tone';

// ═══════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════

const ASK_PLACEHOLDERS = [
  'Ask Sturdy anything…',
  'Why does he completely shut down when I try to talk to him?',
  'Am I making things worse by giving in sometimes?',
  'How do I stop losing my temper before I even realise it?',
  'Is this normal for her age or should I be worried?',
  'How do I repair things after I said something I regret?',
];

// SOS rotating placeholders — real parent voice, no ages, present tense
const SOS_SCENARIOS: string[] = [
  "He's losing it right now and I don't know what to say",
  "She's been crying for 20 minutes and nothing is working",
  "He completely shut down and won't talk to me or look at me",
  "She threw herself on the floor and I'm losing patience",
  "He said he hates me and slammed his door",
];

function getTimeGreeting(): string {
  const h = new Date().getHours();
  if (h >= 5 && h < 12) return 'Good morning';
  if (h >= 12 && h < 17) return 'Good afternoon';
  if (h >= 17 && h < 21) return 'Good evening';
  return 'Good night';
}

function inferIntensity(text: string): number | null {
  const lower = text.toLowerCase();
  if (/hitting|throwing|hurting|screaming|can't breathe|completely lost it|out of control|violent|won't stop|freaking out/.test(lower)) return 4;
  if (/losing it|meltdown|losing patience|can't handle|really struggling/.test(lower)) return 3;
  if (/getting worse|really frustrated|keeps doing|won't listen|building up/.test(lower)) return 2;
  return null;
}

// ═══════════════════════════════════════════════
// PARTICLE SYSTEM
// Matches sturdy-home-final.html particle distribution:
//   - Top-right cluster (35%): densest, in the light beam
//   - Mid scatter (25%): lighter, wider spread
//   - Lower scatter (20%): gentle presence
//   - Bottom (20%): so floor doesn't die
// ═══════════════════════════════════════════════

type ParticleConfig = {
  left: number;
  top: number;
  size: number;
  opacity: number;
  duration: number;
  delay: number;
  colorR: number;
  colorG: number;
  colorB: number;
};

function generateParticles(count: number): ParticleConfig[] {
  const particles: ParticleConfig[] = [];
  for (let i = 0; i < count; i++) {
    const zone = Math.random();
    let left: number, top: number, size: number, opacity: number;

    if (zone < 0.35) {
      left = 42 + Math.random() * 58;
      top = Math.random() * 30;
      size = 2 + Math.random() * 3;
      opacity = 0.28 + Math.random() * 0.42;
    } else if (zone < 0.60) {
      left = 15 + Math.random() * 70;
      top = 28 + Math.random() * 32;
      size = 1.5 + Math.random() * 2.5;
      opacity = 0.14 + Math.random() * 0.24;
    } else if (zone < 0.80) {
      left = 10 + Math.random() * 80;
      top = 58 + Math.random() * 22;
      size = 1.5 + Math.random() * 2;
      opacity = 0.10 + Math.random() * 0.18;
    } else {
      left = 8 + Math.random() * 84;
      top = 78 + Math.random() * 18;
      size = 1.5 + Math.random() * 2;
      opacity = 0.08 + Math.random() * 0.15;
    }

    const warmth = Math.random();
    let colorR: number, colorG: number, colorB: number;
    if (warmth > 0.7) {
      colorR = 255; colorG = 230; colorB = 170;
    } else if (warmth > 0.35) {
      colorR = 244; colorG = 200; colorB = 120;
    } else {
      colorR = 225; colorG = 180; colorB = 100;
    }

    particles.push({
      left, top, size, opacity,
      duration: 4500 + Math.random() * 6000,
      delay: Math.random() * 9000,
      colorR, colorG, colorB,
    });
  }
  return particles;
}

const PARTICLES = generateParticles(40);

function FloatingParticle({ config }: { config: ParticleConfig }) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const startLoop = () => {
      anim.setValue(0);
      Animated.sequence([
        Animated.delay(config.delay),
        Animated.timing(anim, {
          toValue: 1,
          duration: config.duration,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
      ]).start(() => startLoop());
    };
    startLoop();
    return () => anim.stopAnimation();
  }, []);

  const particleOpacity = anim.interpolate({
    inputRange: [0, 0.12, 0.88, 1],
    outputRange: [0, config.opacity, config.opacity, 0],
  });

  const translateY = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -110],
  });

  const translateX = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 25],
  });

  return (
    <Animated.View
      style={{
        position: 'absolute',
        left: `${config.left}%` as any,
        top: `${config.top}%` as any,
        width: config.size,
        height: config.size,
        borderRadius: config.size / 2,
        backgroundColor: `rgb(${config.colorR},${config.colorG},${config.colorB})`,
        shadowColor: `rgb(${config.colorR},${config.colorG},${config.colorB})`,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: config.opacity * 1.5,
        shadowRadius: config.size * 2.5,
        opacity: particleOpacity,
        transform: [{ translateY }, { translateX }],
      }}
    />
  );
}

function ParticleField() {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {PARTICLES.map((p, i) => (
        <FloatingParticle key={i} config={p} />
      ))}
    </View>
  );
}

const CHILD_GRADIENTS: Array<[string, string]> = [
  [C.iconTalkStart, C.iconTalkEnd],
  [C.iconSosStart, C.iconSosEnd],
  [C.iconUnderstandStart, C.iconUnderstandEnd],
  [C.iconRepairStart, C.iconRepairEnd],
];

// ═══════════════════════════════════════════════
// CHILD AUTO-DETECTION (question mode)
// ═══════════════════════════════════════════════

function detectChildFromMessage(
  message: string,
  children: Array<{ id: string; name?: string }>,
): string | null {
  if (!message || !Array.isArray(children) || children.length === 0) return null;
  const lower = message.toLowerCase();
  const matches: string[] = [];
  for (const child of children) {
    const name = (child?.name ?? '').trim().toLowerCase();
    if (!name || name.length < 2) continue;
    const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const pattern = new RegExp(`(^|[^a-z])${escaped}([^a-z]|$)`, 'i');
    if (pattern.test(lower)) matches.push(child.id);
  }
  return matches.length === 1 ? matches[0] : null;
}

// ═══════════════════════════════════════════════
// BACKGROUND
// ═══════════════════════════════════════════════

function Background() {
  const moveAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(moveAnim, {
          toValue: 1,
          duration: 25000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(moveAnim, {
          toValue: 0,
          duration: 25000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [moveAnim]);

  const translateY = moveAnim.interpolate({ inputRange: [0, 1], outputRange: [0, -40] });
  const scale = moveAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.1] });

  return (
    <>
      {/* Twilight × Obsidian Gold */}
      <LinearGradient
        colors={['#020202','#060604','#0a0906','#0d0b08','#0c0a06','#050402']}
        locations={[0, 0.16, 0.40, 0.58, 0.76, 1]}
        style={StyleSheet.absoluteFill}
      />
      <LinearGradient
        colors={['transparent','rgba(120,80,10,0.22)']}
        locations={[0.45, 1]}
        style={StyleSheet.absoluteFill}
      />
    </>
  );
}

// ═══════════════════════════════════════════════
// SCREEN
// ═══════════════════════════════════════════════

export default function HomeScreen() {
  const { session } = useAuth();
  const { children, isLoadingChild } = useChildProfile() as any;
  const { isPremium } = useSubscription();

  // ─── Identity ───
  const [firstName, setFirstName] = useState<string | null>(null);

  // ─── Question mode ───
  const [question, setQuestion] = useState('');
  const [questionFocused, setQuestionFocused] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [placeholderIdx, setPlaceholderIdx] = useState(0);
  const placeholderFade = useRef(new Animated.Value(1)).current;

  // ─── SOS mode ───
  const [sosInputText, setSosInputText] = useState('');
  const [sosInputFocused, setSosInputFocused] = useState(false);
  const [sosError, setSosError] = useState('');
  const [sosSending, setSosSending] = useState(false);
  const [sosScenarioIdx, setSosScenarioIdx] = useState(0);
  const sosScenarioFade = useRef(new Animated.Value(1)).current;

  // ─── Children ───
  const [activeChildId, setActiveChildId] = useState<string | null>(null);

  // ─── Tone ───
  const [tone, setTone] = useState<Tone>(TONE_DEFAULT);

  // ─── Entry animation ───
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  // ─── Entry animation start ───
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 600, useNativeDriver: true }),
    ]).start();
  }, []);

  // ─── Rotate Ask Sturdy placeholder ───
  useEffect(() => {
    if (questionFocused || question.length > 0) return;
    const interval = setInterval(() => {
      Animated.sequence([
        Animated.timing(placeholderFade, { toValue: 0, duration: 350, useNativeDriver: true }),
        Animated.timing(placeholderFade, { toValue: 1, duration: 350, useNativeDriver: true }),
      ]).start();
      setTimeout(() => {
        setPlaceholderIdx((prev) => (prev + 1) % ASK_PLACEHOLDERS.length);
      }, 350);
    }, 4000);
    return () => clearInterval(interval);
  }, [questionFocused, question]);

  // ─── Rotate SOS scenario placeholder ───
  useEffect(() => {
    if (sosInputText.length > 0 || sosInputFocused) return;
    const interval = setInterval(() => {
      Animated.sequence([
        Animated.timing(sosScenarioFade, { toValue: 0, duration: 350, useNativeDriver: true }),
        Animated.timing(sosScenarioFade, { toValue: 1, duration: 350, useNativeDriver: true }),
      ]).start();
      setTimeout(() => {
        setSosScenarioIdx((prev) => (prev + 1) % SOS_SCENARIOS.length);
      }, 350);
    }, 3500);
    return () => clearInterval(interval);
  }, [sosInputText, sosInputFocused]);

  // ─── Fetch parent's first name ───
  const fetchName = useCallback(async () => {
    if (!session?.user?.id) return;
    try {
      const { data } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', session.user.id)
        .single();
      if (data?.full_name) {
        const first = String(data.full_name).trim().split(/\s+/)[0];
        if (first) { setFirstName(first); return; }
      }
      const email = session.user.email ?? '';
      const local = email.split('@')[0] ?? '';
      const cleaned = local.split(/[._+-]/)[0] ?? '';
      if (cleaned) {
        setFirstName(cleaned.charAt(0).toUpperCase() + cleaned.slice(1));
      }
    } catch { }
  }, [session?.user?.id, session?.user?.email]);

  useFocusEffect(
    useCallback(() => {
      fetchName();
      let cancelled = false;
      loadTone().then((t) => { if (!cancelled) setTone(t); });
      return () => { cancelled = true; };
    }, [fetchName]),
  );

  // ─── Auto-select sole child ───
  const kidList = Array.isArray(children) ? children : [];
  useEffect(() => {
    if (kidList.length === 1 && activeChildId === null) {
      setActiveChildId(kidList[0].id);
    }
  }, [kidList.length]);

  // ─── Helpers ───
  const displayName = firstName ?? 'there';
  const canSend = question.trim().length > 0 && !sending;
  const sosIsCrisis = detectCrisis(sosInputText);
  const canSosSend = sosInputText.trim().length > 0 && !sosSending && !sosIsCrisis.isCrisis;

  // ─── Question mode handler ───
  const handleSend = async () => {
    const msg = question.trim();
    if (!msg || sending) return;
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setError('');
    setSending(true);

    try {
      const detectedChild = detectChildFromMessage(msg, kidList)
        ? kidList.find((k: any) => k.id === detectChildFromMessage(msg, kidList))
        : kidList.length === 1 ? kidList[0] : null;

      const result = await getQuestionResponse({
        message:        msg,
        userId:         session?.user?.id,
        childName:      detectedChild?.name ?? null,
        childAge:       detectedChild?.childAge ?? null,
        childProfileId: detectedChild?.id ?? null,
      });

      setQuestion('');

      const responsePayload = result.response ?? '';
      const thoughtId = result.thought_id ?? null;
      if (thoughtId) {
        router.push({
          pathname: `/thought/${thoughtId}` as any,
          params: { fallbackResponse: responsePayload, prompt: msg },
        });
      } else {
        router.push({
          pathname: '/thought/inline' as any,
          params: { fallbackResponse: responsePayload, prompt: msg },
        });
      }
    } catch (err) {
      if (err instanceof CrisisDetectedError) {
        router.push({
          pathname: '/crisis',
          params: { crisisType: err.crisisType, riskLevel: err.riskLevel },
        });
        return;
      }
      if (err instanceof QuotaExceededError) { router.push('/upgrade' as any); return; }
      if (err instanceof RateLimitError) { setError(err.message); return; }
      setError("Couldn't get a response right now. Please try again.");
    } finally {
      setSending(false);
    }
  };

  // ─── SOS handler — calls API directly, bypasses child hub ───
  const handleSosSend = async () => {
    const text = sosInputText.trim();
    if (!text || sosSending) return;

    const targetId = activeChildId ?? kidList[0]?.id;
    if (!targetId) {
      router.push('/child/new' as any);
      return;
    }

    if (sosIsCrisis.isCrisis) {
      router.push({ pathname: '/crisis', params: { crisisType: sosIsCrisis.crisisType, riskLevel: sosIsCrisis.riskLevel } });
      return;
    }

    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSosSending(true);
    setSosError('');

    try {
      const child = kidList.find((k: any) => k.id === targetId);

      const script = await getParentingScript({
        childName:      child?.name || 'My child',
        childAge:       child?.childAge ?? 4,
        message:        text,
        userId:         session?.user?.id,
        childProfileId: child?.id,
        intensity:      inferIntensity(text),
        mode:           'sos',
        tone:           isPremium ? tone : 'gentle',
      } satisfies ParentingScriptRequest);

      if (child?.id) incrementScriptCount(child.id).catch(() => {});

      setSosInputText('');
      router.push({
        pathname: '/result',
        params: {
          source:              'home',
          childId:             child?.id,
          situationSummary:    script.situation_summary,
          regulateAction:      script.regulate.parent_action,
          regulateScript:      script.regulate.script,
          regulateCoaching:    script.regulate.coaching ?? '',
          regulateStrategies:  JSON.stringify(script.regulate.strategies ?? []),
          connectAction:       script.connect.parent_action,
          connectScript:       script.connect.script,
          connectCoaching:     script.connect.coaching ?? '',
          connectStrategies:   JSON.stringify(script.connect.strategies ?? []),
          guideAction:         script.guide.parent_action,
          guideScript:         script.guide.script,
          guideCoaching:       script.guide.coaching ?? '',
          guideStrategies:     JSON.stringify(script.guide.strategies ?? []),
          avoid:               JSON.stringify(script.avoid),
          childMessage:        text,
          mode:                'sos',
        },
      });
    } catch (err) {
      if (err instanceof CrisisDetectedError) {
        router.push({ pathname: '/crisis', params: { crisisType: err.crisisType, riskLevel: err.riskLevel } });
        return;
      }
      if (err instanceof QuotaExceededError) { router.push('/upgrade' as any); return; }
      if (err instanceof RateLimitError) { setSosError(err.message); return; }
      setSosError("Couldn't get a script right now. Please try again.");
    } finally {
      setSosSending(false);
    }
  };

  const handleAddChild = () => {
    Haptics.selectionAsync();
    router.push('/child/new');
  };

  // ─── Loading ───
  if (isLoadingChild) {
    return (
      <View style={s.root}>
        <Background />
        <StatusBar style="light" />
        <SafeAreaView style={s.centerGate}>
          <ActivityIndicator color={C.amber} />
        </SafeAreaView>
      </View>
    );
  }

  // ─── Empty: 0 children ───
  if (kidList.length === 0) {
    return (
      <View style={s.root}>
        <Background />
        <StatusBar style="light" />
        <SafeAreaView style={s.safe} edges={['top']}>
          <View style={s.emptyWrap}>
            <Text style={s.greetingText}>{getTimeGreeting()}, {displayName}.</Text>
            <Text style={s.emptyTitle}>Let's add your first child.</Text>
            <Text style={s.emptyBody}>
              Sturdy tailors every response to your child's age and world.
            </Text>
            <Pressable
              onPress={handleAddChild}
              style={({ pressed }) => [pressed && { opacity: 0.92, transform: [{ scale: 0.98 }] }]}
            >
              <LinearGradient
                colors={[C.amber, C.amberMid]}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={s.primaryBtn}
              >
                <Text style={s.primaryBtnText}>Add a child</Text>
              </LinearGradient>
            </Pressable>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  // ─── Main: 1+ children ───
  return (
    <View style={s.root}>
      <Background />
      <StatusBar style="light" />
      <SafeAreaView style={s.safe} edges={['top']}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{ flex: 1 }}
        >
          <ScrollView
            contentContainerStyle={s.scroll}
            keyboardDismissMode="interactive"
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>

              {/* ─── Header: Greeting + Traffic dots ─── */}
              <View style={s.headerRow}>
                <Text style={s.greetingText}>{getTimeGreeting()}, {displayName}.</Text>
                <TrafficDots />
              </View>

              {/* ══════════════════════════════════════════ */}
              {/* ZONE 1: QUESTION MODE                     */}
              {/* ══════════════════════════════════════════ */}

              <View style={s.zoneLabelRow}>
                <Text style={s.zoneEmoji}>💬</Text>
                <Text style={s.zoneLabel}>Ask Sturdy</Text>
              </View>
              <Text style={s.questionIntro}>The quiet questions matter too.</Text>

              <Animated.View style={[s.thinkingCard, questionFocused && s.thinkingCardFocused]}>
                {!question && (
                  <Animated.View style={[s.placeholderWrap, { opacity: placeholderFade }]} pointerEvents="none">
                    <Text style={s.placeholderText}>{ASK_PLACEHOLDERS[placeholderIdx]}</Text>
                  </Animated.View>
                )}
                <TextInput
                  multiline
                  value={question}
                  onChangeText={(t) => { setQuestion(t); if (error) setError(''); }}
                  onFocus={() => setQuestionFocused(true)}
                  onBlur={() => setQuestionFocused(false)}
                  style={s.thinkingInput}
                  textAlignVertical="top"
                  editable={!sending}
                  selectionColor={C.amber}
                />
                <View style={s.thinkingSendWrap}>
                  <Pressable
                    onPress={handleSend}
                    disabled={!canSend}
                    style={({ pressed }) => [
                      !canSend && { opacity: 0.32 },
                      pressed && canSend && { transform: [{ scale: 0.94 }] },
                    ]}
                  >
                    <LinearGradient
                      colors={[C.amber, C.amberMid]}
                      start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                      style={s.thinkingSendBtn}
                    >
                      <Text style={s.thinkingSendArrow}>{sending ? '…' : '→'}</Text>
                    </LinearGradient>
                  </Pressable>
                </View>
              </Animated.View>
              {error ? <Text style={s.errorText}>{error}</Text> : null}

              {/* ─── Divider between zones ─── */}
              <View style={s.zoneDivider} />

              {/* ══════════════════════════════════════════ */}
              {/* ZONE 2: SOS MODE                          */}
              {/* ══════════════════════════════════════════ */}

              {/* Child pills */}
              {kidList.length > 0 && (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={s.pillRow}
                >
                  {kidList.map((kid: any, index: number) => {
                    const isActive = activeChildId === kid.id;
                    const grad = CHILD_GRADIENTS[index % CHILD_GRADIENTS.length];
                    const initial = (kid?.name?.trim()?.[0] ?? '?').toUpperCase();
                    return (
                      <Pressable
                        key={kid.id}
                        onPress={() => {
                          Haptics.selectionAsync();
                          setActiveChildId(kid.id);
                        }}
                        style={[s.childPill, isActive && s.childPillActive]}
                      >
                        <LinearGradient
                          colors={grad}
                          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                          style={s.pillAvatar}
                        >
                          <Text style={s.pillInitial}>{initial}</Text>
                        </LinearGradient>
                        <Text style={[s.pillName, isActive && s.pillNameActive]}>
                          {kid.name} · {kid.childAge}
                        </Text>
                      </Pressable>
                    );
                  })}
                  <Pressable onPress={handleAddChild} style={s.childPill}>
                    <View style={s.pillAddCircle}>
                      <Text style={s.pillAddPlus}>+</Text>
                    </View>
                    <Text style={s.pillName}>Add</Text>
                  </Pressable>
                </ScrollView>
              )}

              {/* SOS tagline */}
              <Text style={s.sosTagline}>From chaos to connection</Text>

              {/* SOS header */}
              <View style={s.sosHeader}>
                <View style={s.sosBadge}>
                  <Text style={s.sosBadgeText}>SOS</Text>
                </View>
                <Text style={s.sosQuestion}>
                  {'What\'s happening with '}
                  <Text style={s.sosChildName}>
                    {kidList.find((k: any) => k.id === activeChildId)?.name ?? 'your child'}
                  </Text>
                  {' right now?'}
                </Text>
              </View>

              {/* SOS crisis banner — shown when input contains crisis content */}
              {sosIsCrisis.isCrisis && (
                <Pressable
                  onPress={() => router.push({ pathname: '/crisis', params: { crisisType: sosIsCrisis.crisisType ?? undefined, riskLevel: sosIsCrisis.riskLevel ?? undefined } })}
                  style={s.crisisBanner}
                >
                  <Text style={s.crisisIcon}>⚠️</Text>
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text style={s.crisisTitle}>This sounds serious</Text>
                    <Text style={s.crisisSub}>Tap here if you need immediate help →</Text>
                  </View>
                </Pressable>
              )}

              {/* SOS input */}
              <Animated.View style={[s.sosCard, sosInputFocused && s.sosCardFocused]}>
                {!sosInputText && (
                  <Animated.View style={[s.placeholderWrap, { opacity: sosScenarioFade }]} pointerEvents="none">
                    <Text style={s.sosPlaceholder}>
                      {SOS_SCENARIOS[sosScenarioIdx]}
                    </Text>
                  </Animated.View>
                )}
                <TextInput
                  multiline
                  value={sosInputText}
                  onChangeText={(t) => { setSosInputText(t); if (sosError) setSosError(''); }}
                  onFocus={() => setSosInputFocused(true)}
                  onBlur={() => setSosInputFocused(false)}
                  style={s.sosInput}
                  textAlignVertical="top"
                  editable={!sosSending}
                  selectionColor={'#E87461'}
                />
                <View style={s.thinkingSendWrap}>
                  <Pressable
                    onPress={handleSosSend}
                    disabled={!canSosSend}
                    style={({ pressed }) => [
                      !canSosSend && { opacity: 0.32 },
                      pressed && canSosSend && { transform: [{ scale: 0.94 }] },
                    ]}
                  >
                    <View style={[s.getScriptBtn, canSosSend && s.getScriptBtnActive]}>
                      <Text style={s.getScriptText}>{sosSending ? '…' : 'Get Script'}</Text>
                    </View>
                  </Pressable>
                </View>
              </Animated.View>
              {sosError ? <Text style={s.errorText}>{sosError}</Text> : null}

              {/* Tone selector */}
              <Text style={s.toneLabel}>TONE</Text>
              <View style={s.toneRow}>
                {(['soft', 'gentle', 'direct'] as const).map((t) => {
                  const isSelected = tone === t;
                  const isLocked = !isPremium && t !== 'gentle';
                  return (
                    <Pressable
                      key={t}
                      onPress={() => {
                        if (isLocked) { router.push('/upgrade' as any); return; }
                        Haptics.selectionAsync();
                        setTone(t);
                        saveTone(t).catch(() => {});
                      }}
                      style={[s.tonePill, isSelected && s.tonePillSelected]}
                    >
                      <Text style={[s.tonePillName, isSelected && s.tonePillNameSelected]}>
                        {t.charAt(0).toUpperCase() + t.slice(1)}{isLocked ? ' 🔒' : ''}
                      </Text>
                      <Text style={s.tonePillDesc}>
                        {t === 'soft' ? 'Warm' : t === 'gentle' ? 'Calm, clear' : 'Short, firm'}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              <Text style={s.freeFooter}>Always free · No paywall</Text>
              <View style={{ height: TAB_BAR_HEIGHT }} />

            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

// ═══════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#020202' },
  safe: { flex: 1 },
  scroll: { paddingHorizontal: 24, paddingTop: 16, paddingBottom: 20 },
  centerGate: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  // ─── Header ───
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 18,
  },
  greetingText: {
    fontFamily: F.heading,
    fontSize: 28,
    color: 'rgba(255,248,230,0.92)',
    letterSpacing: -0.5,
    lineHeight: 34,
  },

  // ─── Question zone ───
  zoneLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  zoneEmoji: { fontSize: 14 },
  zoneLabel: {
    fontFamily: F.bodyMedium,
    fontSize: 12,
    color: 'rgba(255,248,230,0.5)',
    letterSpacing: 0.3,
  },
  questionIntro: {
    fontFamily: F.scriptItalic,
    fontSize: 13,
    fontStyle: 'italic',
    color: 'rgba(255,248,230,0.45)',
    marginBottom: 10,
    lineHeight: 18,
  },
  thinkingCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,248,231,0.07)',
    backgroundColor: 'rgba(255,255,255,0.04)',
    minHeight: 120,
    padding: 16,
    paddingBottom: 60,
    position: 'relative',
    marginBottom: 12,
  },
  thinkingCardFocused: {
    borderColor: 'rgba(200,136,58,0.3)',
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  thinkingInput: {
    fontFamily: F.body,
    fontSize: 16,
    color: '#FFF8E7',
    minHeight: 80,
    maxHeight: 160,
    textAlignVertical: 'top',
    lineHeight: 24,
  },
  placeholderWrap: {
    position: 'absolute',
    top: 16,
    left: 16,
    right: 60,
  },
  placeholderText: {
    fontFamily: F.body,
    fontSize: 16,
    color: 'rgba(255,248,231,0.38)',
    lineHeight: 24,
  },
  thinkingSendWrap: {
    position: 'absolute',
    bottom: 12,
    right: 12,
  },
  thinkingSendBtn: {
    width: 56,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  thinkingSendArrow: {
    color: '#140f0a',
    fontSize: 18,
    fontFamily: F.bodySemi,
  },
  errorText: {
    color: '#FF8A7D',
    fontSize: 13,
    marginTop: -8,
    marginBottom: 12,
    paddingHorizontal: 4,
  },

  // ─── Divider ───
  zoneDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.05)',
    marginVertical: 18,
  },

  // ─── Child pills ───
  pillRow: { flexDirection: 'row', gap: 7, paddingBottom: 14 },
  childPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingLeft: 8,
    paddingRight: 12,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  childPillActive: {
    backgroundColor: 'rgba(200,136,58,0.15)',
    borderColor: C.amber,
    shadowColor: C.amber,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 2,
  },
  pillAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillInitial: { fontFamily: F.bodySemi, fontSize: 11, color: '#FFF' },
  pillName: {
    fontFamily: F.bodyMedium,
    fontSize: 12,
    color: 'rgba(255,248,230,0.32)',
  },
  pillNameActive: { color: C.amber },
  pillAddCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: 'rgba(255,248,230,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillAddPlus: { fontSize: 14, color: 'rgba(255,248,230,0.2)' },

  // ─── SOS zone ───
  sosTagline: {
    fontFamily: F.scriptItalic,
    fontSize: 12,
    fontStyle: 'italic',
    color: 'rgba(200,136,58,0.45)',
    textAlign: 'right',
    marginBottom: 8,
  },
  sosHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  sosBadge: {
    backgroundColor: 'rgba(232,116,97,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(232,116,97,0.3)',
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  sosBadgeText: {
    fontFamily: F.bodySemi,
    fontSize: 10,
    color: '#E87461',
    letterSpacing: 0.5,
  },
  sosQuestion: {
    fontFamily: F.bodyMedium,
    fontSize: 13,
    color: 'rgba(255,248,230,0.85)',
    flex: 1,
    lineHeight: 18,
  },
  sosChildName: { color: C.amber },
  sosCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(232,116,97,0.18)',
    backgroundColor: 'rgba(232,116,97,0.05)',
    minHeight: 110,
    padding: 14,
    paddingBottom: 52,
    position: 'relative',
    marginBottom: 12,
  },
  sosCardFocused: {
    borderColor: 'rgba(232,116,97,0.35)',
    backgroundColor: 'rgba(232,116,97,0.08)',
  },
  sosInput: {
    fontFamily: F.body,
    fontSize: 15,
    color: 'rgba(255,248,230,0.9)',
    minHeight: 70,
    maxHeight: 150,
    textAlignVertical: 'top',
    lineHeight: 22,
  },
  sosPlaceholder: {
    fontFamily: F.body,
    fontSize: 15,
    color: 'rgba(232,116,97,0.35)',
    lineHeight: 22,
    fontStyle: 'italic',
  },
  getScriptBtn: {
    paddingHorizontal: 16,
    height: 44,
    borderRadius: 10,
    backgroundColor: 'rgba(232,116,97,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(232,116,97,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  getScriptBtnActive: {
    backgroundColor: 'rgba(232,116,97,0.2)',
    borderColor: 'rgba(232,116,97,0.4)',
  },
  getScriptText: {
    fontFamily: F.bodyMedium,
    fontSize: 13,
    color: '#E87461',
  },

  // ─── Tone selector ───
  toneLabel: {
    fontFamily: F.label,
    fontSize: 10,
    letterSpacing: 1,
    color: 'rgba(255,248,230,0.25)',
    marginBottom: 8,
  },
  toneRow: { flexDirection: 'row', gap: 6, marginBottom: 14 },
  tonePill: {
    flex: 1,
    alignItems: 'center',
    padding: 8,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
  },
  tonePillSelected: {
    backgroundColor: 'rgba(200,136,58,0.15)',
    borderColor: C.amber,
  },
  tonePillName: {
    fontFamily: F.bodyMedium,
    fontSize: 12,
    color: 'rgba(255,248,230,0.45)',
  },
  tonePillNameSelected: { color: C.amber },
  tonePillDesc: {
    fontFamily: F.body,
    fontSize: 10,
    color: 'rgba(255,248,230,0.2)',
    marginTop: 2,
  },

  // ─── Crisis banner ───
  crisisBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    paddingHorizontal: 16,
    backgroundColor: C.sosLight,
    borderWidth: 1,
    borderColor: 'rgba(232,116,97,0.30)',
    borderRadius: 12,
    marginBottom: 10,
  },
  crisisIcon: { fontSize: 16 },
  crisisTitle: {
    fontFamily: F.bodyMedium,
    fontSize: 14,
    color: '#E87461',
  },
  crisisSub: {
    fontFamily: F.body,
    fontSize: 12,
    color: 'rgba(232,116,97,0.75)',
  },

  // ─── Footer ───
  freeFooter: {
    fontFamily: F.body,
    fontSize: 10,
    fontStyle: 'italic',
    color: 'rgba(255,248,230,0.18)',
    textAlign: 'center',
  },

  // ─── Empty state ───
  emptyWrap: { flex: 1, paddingHorizontal: 24, gap: 14, justifyContent: 'center' },
  emptyTitle: {
    fontFamily: F.heading,
    fontSize: 26,
    color: 'rgba(255,248,230,0.90)',
    letterSpacing: -0.3,
  },
  emptyBody: {
    fontFamily: F.body,
    fontSize: 15,
    color: 'rgba(255,255,255,0.50)',
    lineHeight: 22,
    marginBottom: 8,
  },
  primaryBtn: {
    borderRadius: 14,
    minHeight: 52,
    alignSelf: 'flex-start',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  primaryBtnText: {
    fontFamily: F.subheading,
    fontSize: 15,
    color: '#140f0a',
    letterSpacing: 0.3,
  },
});
