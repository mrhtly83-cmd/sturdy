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
} from 'react-native';

import { router, useFocusEffect } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';

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
      const detectedChildId = detectChildFromMessage(msg, kidList);
      const result = await getQuestionResponse({
        message: msg,
        userId: session?.user?.id,
        childName: null,
        childAge: null,
        childProfileId: detectedChildId,
      } as any);

      setQuestion('');
      const responsePayload = (result as any).response ?? '';
      const thoughtId = (result as any).thought_id ?? null;

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

  // ═══════════════════════════════════════════════
  // BACKGROUND — matches sturdy-home-final.html exactly
  // ═══════════════════════════════════════════════

  const Background = () => (
    <>
      {/* Base gradient: warm brown, 20% softer */}
      <LinearGradient
        colors={['#3d3328', '#362c22', '#2e261c', '#282018', '#231c14']}
        locations={[0, 0.28, 0.52, 0.72, 1]}
        start={{ x: 0.4, y: 0 }}
        end={{ x: 0.6, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      {/* Diagonal golden light beam — top-right
          HTML: linear-gradient(225deg, rgba(255,225,150,0.22)→transparent)
          RN: rotated LinearGradient overlay */}
      <View style={s.lightBeamWrap} pointerEvents="none">
        <LinearGradient
         colors={[
  'rgba(255,225,150,0.33)',
  'rgba(244,200,120,0.18)',
  'rgba(220,170,80,0.08)',
  'transparent',
]}
          locations={[0, 0.2, 0.4, 0.6]}
          start={{ x: 1, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={s.lightBeamGradient}
        />
      </View>
      {/* Mid-left warmth glow */}
      <LinearGradient
        colors={['rgba(232,168,85,0.05)', 'transparent']}
        style={s.warmthMid}
        start={{ x: 0.5, y: 0.5 }}
        end={{ x: 1, y: 1 }}
      />
      {/* Bottom-right corner warmth */}
      <LinearGradient
        colors={['rgba(220,170,90,0.05)', 'transparent']}
        style={s.warmthCorner}
        start={{ x: 0.5, y: 0.5 }}
        end={{ x: 1, y: 1 }}
      />
      {/* Floor warmth — prevents cave feeling */}
      <LinearGradient
        colors={['transparent', 'rgba(200,150,80,0.02)', 'rgba(200,160,90,0.06)']}
        locations={[0, 0.5, 1]}
        style={s.warmthFloor}
      />
      {/* Animated particles */}
      <ParticleField />
    </>
  );

  // ─── Loading ───
  if (isLoadingChild) {
    return (
      <View style={s.root}>
        <StatusBar style="light" />
        <Background />
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
        <StatusBar style="light" />
        <Background />
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
      <StatusBar style="light" />
      <Background />

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

              {/* ─── Input ─── */}
              <View style={[s.inputArea, inputFocused && s.inputAreaFocused]}>
                <TextInput
                  multiline
                  numberOfLines={4}
                  placeholder="She won't put her shoes on and we're already late..."
                  placeholderTextColor="rgba(255,255,255,0.40)"
                  value={question}
                  onChangeText={(t) => { setQuestion(t); if (error) setError(''); }}
                  onFocus={() => setInputFocused(true)}
                  onBlur={() => setInputFocused(false)}
                  style={s.textarea}
                  textAlignVertical="top"
                  editable={!sending}
                />
                <Text style={s.inputHint}>A snapshot is enough.</Text>
              </View>

              {error ? <Text style={s.errorText}>{error}</Text> : null}

              {/* ─── CTA: "Get words to say" ─── */}
             {/* ─── CTA: "Get words to say" ─── */}
<Pressable
  onPress={handleSend}
  disabled={!canSend}
  style={({ pressed }) => [
    pressed && canSend && { opacity: 0.92, transform: [{ scale: 0.98 }] },
    !canSend && { opacity: 0.45 },
  ]}
>
  <LinearGradient
    colors={[C.amber, C.amberMid]}
    start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
    style={s.ctaBtn}
  >
    <Text style={s.ctaBtnText}>
      {sending ? 'Getting words…' : 'Get words to say'}
    </Text>
  </LinearGradient>
</Pressable>

              {/* ─── Mode selector (horizontal swipe) ─── */}
              <View style={s.modesSection}>
                <Text style={s.modesLabel}>OR CHOOSE A MODE</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  snapToInterval={MODE_CARD_WIDTH}
                  decelerationRate="fast"
                  contentContainerStyle={s.modesCarousel}
                  onScroll={handleModeScroll}
                  scrollEventThrottle={16}
                >
                  {OUTCOMES.map((o) => (
                    <Pressable
                      key={o.mode}
                      onPress={() => handleSelectOutcome(o.mode)}
                      style={({ pressed }) => [
                        s.modeCard,
                        { backgroundColor: o.bgColor, borderColor: o.borderColor },
                        pressed && { opacity: 0.92, transform: [{ scale: 0.97 }] },
                      ]}
                      accessibilityRole="button"
                      accessibilityLabel={`${o.title} — ${o.desc}`}
                    >
                      <View style={[s.modeDot, {
                        backgroundColor: o.color,
                        shadowColor: o.color,
                        shadowOffset: { width: 0, height: 0 },
                        shadowOpacity: 0.5,
                        shadowRadius: 6,
                        elevation: 3,
                      }]} />
                      <Text style={[s.modeName, { color: o.color }]}>{o.title}</Text>
                      <Text style={s.modeDesc}>{o.desc}</Text>
                    </Pressable>
                  ))}
                </ScrollView>
                <View style={s.scrollDots}>
                  {OUTCOMES.map((_, i) => (
                    <View key={i} style={[s.scrollDot, activeScrollIndex === i && s.scrollDotActive]} />
                  ))}
                </View>
              </View>

              {/* ─── Children row ─── */}
              <View style={s.childrenSection}>
                <View style={s.childrenRow}>
                  <View style={s.avatarStack}>
                    {kidList.map((kid: any, index: number) => {
                      const grad = CHILD_GRADIENTS[index % CHILD_GRADIENTS.length];
                      const initial = (kid?.name?.trim()?.[0] ?? '?').toUpperCase();
                      return (
                        <Pressable
                          key={kid.id}
                          onPress={() => handleOpenChild(kid.id)}
                          style={({ pressed }) => [
                            index > 0 && { marginLeft: -8 },
                            pressed && { opacity: 0.85 },
                          ]}
                        >
                          <LinearGradient
                            colors={[`${grad[0]}66`, `${grad[0]}2E`]}
                            style={s.avatarCircle}
                          >
                            <Text style={[s.avatarText, { color: grad[0] }]}>{initial}</Text>
                          </LinearGradient>
                        </Pressable>
                      );
                    })}
                    <Pressable
                      onPress={handleAddChild}
                      style={({ pressed }) => [
                        kidList.length > 0 && { marginLeft: -8 },
                        pressed && { opacity: 0.7 },
                      ]}
                    >
                      <View style={s.avatarAdd}>
                        <Text style={s.avatarAddText}>+</Text>
                      </View>
                    </Pressable>
                  </View>
                  <Text style={s.childrenNames}>
                    {kidList.map((kid: any) => `${kid.name}, ${kid.childAge}`).join(' · ')}
                  </Text>
                  <Pressable onPress={handleAddChild} style={({ pressed }) => [pressed && { opacity: 0.7 }]}>
                    <Text style={s.childrenManage}>manage</Text>
                  </Pressable>
                </View>
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
  root: { flex: 1, backgroundColor: '#231c14' },
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

  // ─── Input ───
  inputArea: {
    backgroundColor: 'rgba(244,200,120,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(244,200,120,0.09)',
    borderRadius: 18,
    padding: 18,
    paddingBottom: 14,
    marginBottom: 14,
  },
  inputAreaFocused: {
    borderColor: 'rgba(244,200,120,0.15)',
  },
  textarea: {
    fontFamily: F.body,
    fontSize: 15,
    color: 'rgba(255,255,255,0.88)',
    lineHeight: 22,
    minHeight: 80,
    padding: 0,
  },
  inputHint: {
    fontFamily: F.body,
    fontSize: 11,
    color: 'rgba(244,200,120,0.32)',      // bumped from 0.24
    marginTop: 10,
  },
  errorText: {
    fontFamily: F.body,
    fontSize: 14,
    color: C.sos,
    textAlign: 'center',
    marginBottom: 8,
  },

  // ─── CTA ───
  ctaBtn: {
    minHeight: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 36,
  },
  ctaBtnText: {
    fontFamily: F.subheading,
    fontSize: 15,
    color: '#140f0a',
    letterSpacing: 0.3,
  },

  // ─── Mode cards ───
  modesSection: { marginBottom: 32 },
  modesLabel: {
    fontFamily: F.label,
    fontSize: 10,
    letterSpacing: 1.5,
    color: 'rgba(255,255,255,0.25)',      // bumped from 0.18
    marginBottom: 14,
  },
  modesCarousel: { paddingRight: 24, gap: 10 },
  modeCard: {
    width: 140,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
  },
  modeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginBottom: 12,
  },
  modeName: {
    fontFamily: F.bodySemi,
    fontSize: 14,
    marginBottom: 4,
  },
  modeDesc: {
    fontFamily: F.body,
    fontSize: 10,
    color: 'rgba(255,255,255,0.40)',      // bumped from 0.32
    lineHeight: 14,
  },

  // ─── Scroll dots ───
  scrollDots: {
    flexDirection: 'row',
    gap: 5,
    justifyContent: 'center',
    marginTop: 12,
  },
  scrollDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.10)',
  },
  scrollDotActive: {
    backgroundColor: 'rgba(244,200,120,0.45)',
    width: 16,
  },

  // ─── Children ───
  childrenSection: {
    paddingTop: 20,
    borderTopWidth: 0.5,
    borderTopColor: 'rgba(244,200,120,0.07)',
  },
  childrenRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarStack: { flexDirection: 'row' },
  avatarCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#362c22',
  },
  avatarText: {
    fontSize: 12,
    fontFamily: F.bodySemi,
  },
  avatarAdd: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: 'rgba(255,255,255,0.10)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarAddText: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.14)',
  },
  childrenNames: {
    fontFamily: F.body,
    fontSize: 12,
    color: 'rgba(255,240,220,0.50)',      // bumped from 0.40
    flex: 1,
  },
  childrenManage: {
    fontFamily: F.bodyMedium,
    fontSize: 11,
    color: 'rgba(244,200,120,0.34)',      // bumped from 0.25
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