// app/(tabs)/index.tsx
// v6 — Golden Beam (sturdy-home-final.html → React Native)
//
// Visual identity:
//   - Warm brown gradient (#302820 → #1c1812) — 20% softer
//   - Diagonal golden light beam top-right (LinearGradient, rotated)
//   - Animated floating golden particles distributed across full screen
//   - Warm atmospheric glows: mid-left, bottom-right, floor wash
//   - No glass cards — open, breathing layout
//   - Horizontal swipe mode selector with colored glow dots
//   - Stacked child avatars in a compact row
//   - CTA: "Get words to say" (amber gradient)
//
// All behavior preserved from v5.

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Easing,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  Image,
} from 'react-native';

import { router, useFocusEffect } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { ImageBackground } from 'react-native';

import { useAuth } from '../../src/context/AuthContext';
import { useChildProfile } from '../../src/context/ChildProfileContext';
import { supabase } from '../../src/lib/supabase';
import { getQuestionResponse, CrisisDetectedError, RateLimitError } from '../../src/lib/api';
import { colors as C, fonts as F } from '../../src/theme';

// ═══════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════

const GREETINGS = ['Hi', 'Hello', 'Hey'];
const MODE_CARD_WIDTH = 150; // 140 card + 10 gap

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

    // Color variation: warm whites → deep golds (matching HTML)
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

// ═══════════════════════════════════════════════
// OUTCOME MODES
// ═══════════════════════════════════════════════

type OutcomeMode = 'sos' | 'reconnect' | 'understand' | 'conversation';

type Outcome = {
  mode: OutcomeMode;
  title: string;
  desc: string;
  color: string;
  dotShadow: string;
  bgColor: string;
  borderColor: string;
};

const OUTCOMES: Outcome[] = [
  {
    mode: 'sos',
    title: 'Right now',
    desc: "It's happening. Help me through it.",
    color: '#E87461',
    dotShadow: 'rgba(232,116,97,0.30)',
    bgColor: 'rgba(232,116,97,0.06)',
    borderColor: 'rgba(232,116,97,0.14)',
  },
  {
    mode: 'reconnect',
    title: 'Repair',
    desc: 'After it went sideways. What do I say?',
    color: '#E8A855',
    dotShadow: 'rgba(232,168,85,0.25)',
    bgColor: 'rgba(200,136,58,0.06)',
    borderColor: 'rgba(200,136,58,0.14)',
  },
  {
    mode: 'understand',
    title: 'Understand',
    desc: 'Why do they keep doing this?',
    color: '#7BA4D0',
    dotShadow: 'rgba(123,164,208,0.22)',
    bgColor: 'rgba(87,120,163,0.06)',
    borderColor: 'rgba(87,120,163,0.14)',
  },
  {
    mode: 'conversation',
    title: 'Plan a talk',
    desc: 'A hard conversation is coming up.',
    color: '#A0C068',
    dotShadow: 'rgba(160,192,104,0.22)',
    bgColor: 'rgba(138,160,96,0.06)',
    borderColor: 'rgba(138,160,96,0.14)',
  },
];

// Rotating gradient pairs for child avatars
const CHILD_GRADIENTS: Array<[string, string]> = [
  [C.iconTalkStart, C.iconTalkEnd],
  [C.iconSosStart, C.iconSosEnd],
  [C.iconUnderstandStart, C.iconUnderstandEnd],
  [C.iconRepairStart, C.iconRepairEnd],
];

// ═══════════════════════════════════════════════
// CHILD AUTO-DETECTION
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
// SCREEN
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

  const translateY = moveAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -40],
  });

  const scale = moveAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.1],
  });

  return (
    <>
      <Animated.Image
        source={require('../../assets/golden-particles-bg.png')}
        style={[
          StyleSheet.absoluteFill,
          { width: '100%', height: '100%', transform: [{ translateY }, { scale }] },
        ]}
        resizeMode="cover"
      />
      <LinearGradient
        colors={[
          'rgba(0,0,0,0.50)',
          'rgba(0,0,0,0.65)',
          'rgba(0,0,0,0.80)',
          'rgba(0,0,0,0.90)',
          'rgba(0,0,0,0.95)',
        ]}
        locations={[0, 0.25, 0.50, 0.72, 1]}
        style={StyleSheet.absoluteFill}
      />
    </>
  );
}

export default function HomeScreen() {
  const { session } = useAuth();
  const { children, isLoadingChild } = useChildProfile() as any;

  const [firstName, setFirstName] = useState<string | null>(null);
  const [greeting, setGreeting] = useState<string>(GREETINGS[0]);

  const [question, setQuestion] = useState('');
  const [inputFocused, setInputFocused] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  const [pickerMode, setPickerMode] = useState<OutcomeMode | null>(null);
  const [activeScrollIndex, setActiveScrollIndex] = useState(0);

  // Entry animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1, duration: 600, useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0, duration: 600, useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // ─── Fetch parent's name ───
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
    } catch { /* non-blocking */ }
  }, [session?.user?.id, session?.user?.email]);

  useFocusEffect(
    useCallback(() => {
      setGreeting(GREETINGS[Math.floor(Math.random() * GREETINGS.length)]);
      fetchName();
    }, [fetchName]),
  );

  // ─── Handlers ───
  const handleOpenChild = (childId: string) => {
    Haptics.selectionAsync();
    router.push(`/child/${childId}` as any);
  };

  const handleAddChild = () => {
    Haptics.selectionAsync();
    router.push('/child/new');
  };

  const handleManageChildren = () => {
    Haptics.selectionAsync();
    if (kidList.length === 1 && kidList[0].id) {
      router.push(`/child/${kidList[0].id}` as any);
    } else if (kidList.length > 1) {
      setPickerMode('sos');
    }
  };

  const handleSelectOutcome = (mode: OutcomeMode) => {
    Haptics.selectionAsync();
    if (kidList.length === 0) { router.push('/child/new'); return; }
    if (kidList.length === 1) {
      router.push({ pathname: `/child/${kidList[0].id}` as any, params: { mode } });
      return;
    }
    setPickerMode(mode);
  };

  const handlePickerSelectChild = (childId: string) => {
    if (!pickerMode) return;
    Haptics.selectionAsync();
    const mode = pickerMode;
    setPickerMode(null);
    router.push({ pathname: `/child/${childId}` as any, params: { mode } });
  };

  const handlePickerCancel = () => setPickerMode(null);

  const handleModeScroll = (event: any) => {
    const x = event.nativeEvent.contentOffset.x;
    setActiveScrollIndex(Math.min(Math.round(x / MODE_CARD_WIDTH), OUTCOMES.length - 1));
  };

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
      if (err instanceof RateLimitError) { setError(err.message); return; }
      setError("Couldn't get a response right now. Please try again.");
    } finally {
      setSending(false);
    }
  };

  // ─── Helpers ───
  const displayName = firstName ?? 'there';
  const kidList = Array.isArray(children) ? children : [];
  const canSend = question.trim().length > 0 && !sending;

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
          <Text style={s.greetingText}>{greeting}, {displayName}.</Text>
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

            {/* ─── Greeting ─── */}
            <View style={s.greetingWrap}>
              <Text style={s.greetingText}>{greeting}, {displayName}.</Text>
              <Text style={s.subGreeting}>What's happening right now?</Text>
            </View>

            {/* ─── Ask Sturdy pill ─── */}
            <View style={[s.inputPill, inputFocused && s.inputPillFocused]}>
              <TextInput
                multiline
                numberOfLines={2}
                placeholder="Ask Sturdy anything…"
                placeholderTextColor="rgba(255,248,231,0.38)"
                value={question}
                onChangeText={(t) => { setQuestion(t); if (error) setError(''); }}
                onFocus={() => setInputFocused(true)}
                onBlur={() => setInputFocused(false)}
                style={s.pillInput}
                textAlignVertical="top"
                editable={!sending}
              />
              <Pressable
                onPress={handleSend}
                disabled={!canSend}
                style={({ pressed }) => [
                  s.pillSendBtn,
                  !canSend && { opacity: 0.32 },
                  pressed && canSend && { transform: [{ scale: 0.94 }] },
                ]}
              >
                <LinearGradient
                  colors={[C.amber, C.amberMid]}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                  style={s.pillSendGradient}
                >
                  <Text style={s.pillSendArrow}>{sending ? '…' : '→'}</Text>
                </LinearGradient>
              </Pressable>
            </View>
            {error ? <Text style={s.errorText}>{error}</Text> : null}

            {/* ─── SOS Hero Card ─── */}
            <Pressable
              onPress={() => handleSelectOutcome('sos')}
              style={({ pressed }) => [
                pressed && { opacity: 0.93, transform: [{ scale: 0.99 }] },
              ]}
              accessibilityRole="button"
              accessibilityLabel="Right now (SOS) — It's happening. Help me through it."
            >
              <LinearGradient
                colors={['rgba(232,116,97,0.20)', 'rgba(248,140,70,0.10)', 'rgba(232,116,97,0.06)']}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                style={s.sosHeroCard}
              >
                <View style={s.sosHeroDot} />
                <Text style={s.sosHeroLabel}>SOS</Text>
                <Text style={s.sosHeroTitle}>Right now</Text>
                <Text style={s.sosHeroDesc}>It's happening. Help me through it.</Text>
              </LinearGradient>
            </Pressable>

            {/* ─── Strategy Stack ─── */}
            <View style={s.strategyStack}>
              {OUTCOMES.filter((o) => o.mode !== 'sos').map((o) => (
                <Pressable
                  key={o.mode}
                  onPress={() => handleSelectOutcome(o.mode)}
                  style={({ pressed }) => [
                    s.strategyCard,
                    { backgroundColor: o.bgColor, borderColor: o.borderColor },
                    pressed && { opacity: 0.92, transform: [{ scale: 0.98 }] },
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel={`${o.title} — ${o.desc}`}
                >
                  <View style={[s.strategyDot, {
                    backgroundColor: o.color,
                    shadowColor: o.color,
                    shadowOffset: { width: 0, height: 0 },
                    shadowOpacity: 0.55,
                    shadowRadius: 7,
                    elevation: 3,
                  }]} />
                  <View style={s.strategyTextGroup}>
                    <Text style={[s.strategyName, { color: o.color }]}>{o.title}</Text>
                    <Text style={s.strategyDesc}>{o.desc}</Text>
                  </View>
                </Pressable>
              ))}
            </View>

          </Animated.View>
          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>

    {/* ─── Multi-child picker modal ─── */}
    <Modal visible={pickerMode !== null} animationType="fade" transparent onRequestClose={handlePickerCancel}>
      <Pressable style={s.pickerBackdrop} onPress={handlePickerCancel}>
        <Pressable style={s.pickerSheet} onPress={() => {}}>
          <Text style={s.pickerTitle}>Which child?</Text>
          <Text style={s.pickerSub}>
            {pickerMode ? OUTCOMES.find((o) => o.mode === pickerMode)?.desc : ''}
          </Text>
          <View style={s.pickerRow}>
            {kidList.map((kid: any, index: number) => {
              const grad = CHILD_GRADIENTS[index % CHILD_GRADIENTS.length];
              const initial = (kid?.name?.trim()?.[0] ?? '?').toUpperCase();
              return (
                <Pressable
                  key={kid.id}
                  onPress={() => handlePickerSelectChild(kid.id)}
                  style={({ pressed }) => [
                    s.pickerChild,
                    pressed && { opacity: 0.85, transform: [{ scale: 0.97 }] },
                  ]}
                >
                  <LinearGradient
                    colors={grad}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                    style={s.pickerAvatar}
                  >
                    <Text style={s.pickerAvatarText}>{initial}</Text>
                  </LinearGradient>
                  <Text style={s.pickerChildName} numberOfLines={1}>{kid.name}</Text>
                  <Text style={s.pickerChildAge}>Age {kid.childAge}</Text>
                </Pressable>
              );
            })}
          </View>
          <Pressable onPress={handlePickerCancel} style={s.pickerCancel}>
            <Text style={s.pickerCancelText}>Cancel</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  </View>
);
}

// ═══════════════════════════════════════════════
// STYLES — pixel-matched to sturdy-home-final.html
// with v2 text opacity bumps applied
// ═══════════════════════════════════════════════

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0d0b08' },
  safe: { flex: 1 },
  scroll: { paddingHorizontal: 24, paddingTop: 16, paddingBottom: 20 },
  centerGate: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  // ─── Light beam (diagonal golden glow from top-right) ───
  lightBeamWrap: {
    position: 'absolute',
    top: -80,
    right: -50,
    width: 380,
    height: 500,
    transform: [{ rotate: '-8deg' }],
    overflow: 'hidden',
  },
  lightBeamGradient: {
    width: '100%',
    height: '100%',
  },

  // ─── Atmospheric warmth layers ───
  warmthMid: {
    position: 'absolute',
    top: '40%',
    left: -40,
    width: 140,
    height: 180,
    borderRadius: 90,
  },
  warmthCorner: {
    position: 'absolute',
    bottom: 80,
    right: -30,
    width: 180,
    height: 180,
    borderRadius: 90,
  },
  warmthFloor: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 300,
  },

  // ─── Greeting ───
  greetingWrap: { gap: 6, marginTop: 8, marginBottom: 32 },
  greetingText: {
    fontFamily: F.heading,
    fontSize: 28,
    color: 'rgba(255,248,230,0.92)',
    letterSpacing: -0.5,
    lineHeight: 34,
  },
  subGreeting: {
    fontFamily: F.body,
    fontSize: 14,
    color: 'rgba(244,200,120,0.62)',      // bumped from 0.50
    letterSpacing: 0.2,
  },

  // ─── Ask Sturdy pill ───
  inputPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(14,10,6,0.72)',
    borderWidth: 1,
    borderColor: 'rgba(255,248,231,0.12)',
    borderRadius: 30,
    paddingLeft: 20,
    paddingRight: 6,
    paddingVertical: 6,
    marginBottom: 24,
    gap: 10,
  },
  inputPillFocused: {
    borderColor: 'rgba(232,168,85,0.55)',
    backgroundColor: 'rgba(14,10,6,0.88)',
  },
  pillInput: {
    flex: 1,
    color: '#FFF8E7',
    fontSize: 15,
    fontFamily: F.body,
    maxHeight: 44,
    paddingVertical: 8,
  },
  pillSendBtn: {
    borderRadius: 24,
    overflow: 'hidden',
  },
  pillSendGradient: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillSendArrow: {
    color: '#140f0a',
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 22,
  },
  errorText: {
    color: '#FF8A7D',
    fontSize: 13,
    marginTop: -16,
    marginBottom: 16,
    paddingHorizontal: 4,
  },

  // ─── SOS Hero Card ───
  sosHeroCard: {
    borderRadius: 20,
    padding: 24,
    paddingTop: 20,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(232,116,97,0.24)',
    minHeight: 148,
    justifyContent: 'flex-end',
  },
  sosHeroDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#E87461',
    marginBottom: 10,
    shadowColor: '#E87461',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.80,
    shadowRadius: 8,
    elevation: 4,
  },
  sosHeroLabel: {
    fontFamily: F.label,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 2.2,
    color: 'rgba(232,116,97,0.72)',
    marginBottom: 4,
  },
  sosHeroTitle: {
    fontFamily: F.heading,
    fontSize: 32,
    color: 'rgba(255,248,230,0.94)',
    letterSpacing: -0.6,
    lineHeight: 38,
    marginBottom: 6,
  },
  sosHeroDesc: {
    fontFamily: F.body,
    fontSize: 14,
    color: 'rgba(255,255,255,0.58)',
    lineHeight: 20,
  },

  // ─── Strategy Stack ───
  strategyStack: { gap: 10, marginTop: 2 },
  strategyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderWidth: 1,
    gap: 16,
  },
  strategyDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
    flexShrink: 0,
  },
  strategyTextGroup: { flex: 1, gap: 3 },
  strategyName: {
    fontFamily: F.bodySemi,
    fontSize: 15,
  },
  strategyDesc: {
    fontFamily: F.body,
    fontSize: 13,
    color: 'rgba(255,255,255,0.52)',
    lineHeight: 18,
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

  // ─── Picker modal ───
  pickerBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'flex-end',
  },
  pickerSheet: {
    backgroundColor: 'rgba(30,26,20,0.98)',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 36,
    gap: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
  },
  pickerTitle: {
    fontFamily: F.heading,
    fontSize: 22,
    color: 'rgba(255,248,230,0.90)',
    letterSpacing: -0.3,
  },
  pickerSub: {
    fontFamily: F.body,
    fontSize: 14,
    color: 'rgba(255,255,255,0.50)',
  },
  pickerRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    paddingTop: 4,
  },
  pickerChild: {
    width: 96,
    padding: 12,
    gap: 6,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    backgroundColor: 'rgba(40,34,26,0.80)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  pickerAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pickerAvatarText: {
    fontFamily: F.heading,
    fontSize: 20,
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  pickerChildName: {
    fontFamily: F.bodySemi,
    fontSize: 13,
    color: 'rgba(255,248,230,0.88)',
    textAlign: 'center',
  },
  pickerChildAge: {
    fontFamily: F.body,
    fontSize: 11,
    color: 'rgba(255,255,255,0.45)',
  },
  pickerCancel: { paddingVertical: 12, alignItems: 'center' },
  pickerCancelText: {
    fontFamily: F.bodyMedium,
    fontSize: 15,
    color: 'rgba(255,255,255,0.30)',
  },
});