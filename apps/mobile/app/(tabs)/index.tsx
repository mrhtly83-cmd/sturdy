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
// RECENT LOGS
// ═══════════════════════════════════════════════

type RecentLog = {
  id: string;
  mode: string;
  trigger_category: string | null;
  situation_summary: string | null;
  created_at: string;
  child_profile_id: string | null;
};

function formatTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const h = Math.floor(diff / 3_600_000);
  const d = Math.floor(diff / 86_400_000);
  if (h < 1) return 'Just now';
  if (h < 24) return `${h}h ago`;
  if (d === 1) return 'Yesterday';
  if (d < 7) return `${d}d ago`;
  return new Date(dateStr).toLocaleDateString([], { month: 'short', day: 'numeric' });
}

const RECENT_MODE_LABELS: Record<string, string> = {
  sos: 'SOS', reconnect: 'Repair', understand: 'Understand', conversation: 'Plan a talk',
};

const RECENT_TRIGGER_LABELS: Record<string, string> = {
  leaving_places: 'Leaving places', bedtime: 'Bedtime', homework: 'Homework',
  screen_time: 'Screen time', mealtime: 'Mealtime', sharing: 'Sharing',
  sibling: 'Sibling conflict', morning_routine: 'Morning routine',
  public_meltdown: 'Public meltdown', separation: 'Separation',
};

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
  const [activeChildId, setActiveChildId] = useState<string | null>(null);
  const [recentLogs, setRecentLogs] = useState<RecentLog[]>([]);

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

  // ─── Fetch recent interaction logs ───
  const fetchRecentLogs = useCallback(async () => {
    if (!session?.user?.id) return;
    try {
      const { data } = await supabase
        .from('interaction_logs')
        .select('id, mode, trigger_category, situation_summary, created_at, child_profile_id')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false })
        .limit(3);
      if (data) setRecentLogs(data);
    } catch { /* non-blocking */ }
  }, [session?.user?.id]);

  useFocusEffect(
    useCallback(() => {
      setGreeting(GREETINGS[Math.floor(Math.random() * GREETINGS.length)]);
      fetchName();
      fetchRecentLogs();
    }, [fetchName, fetchRecentLogs]),
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
    const targetId = activeChildId ?? (kidList.length === 1 ? kidList[0].id : null);
    if (targetId) {
      router.push({ pathname: `/child/${targetId}` as any, params: { mode } });
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

  // Auto-select sole child so chips + routing work without manual tap
  useEffect(() => {
    if (kidList.length === 1 && activeChildId === null) {
      setActiveChildId(kidList[0].id);
    }
  }, [kidList.length]);

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
            363:  <View style={s.greetingWrap}>
364:    <Text style={s.greetingText}>{greeting}, {displayName}.</Text>
365:    <Text style={s.subGreeting}>What's happening right now?</Text>
366:  </View>

            {/* ─── Child selector chips ─── */}
            {kidList.length > 0 && (
  <View style={s.avatarSection}>
    <View style={s.avatarDivider}>
      <Text style={s.avatarDividerLabel}>Your children</Text>
      <View style={s.avatarDividerLine} />
    </View>
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={s.avatarRow}
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
              setActiveChildId(isActive ? null : kid.id);
            }}
            style={s.avatarChip}
            accessibilityRole="button"
            accessibilityLabel={`Select ${kid.name}`}
          >
            <LinearGradient
              colors={grad}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              style={[s.avatarCircle, isActive && s.avatarCircleActive]}
            >
              <Text style={s.avatarInitial}>{initial}</Text>
              {isActive && <View style={s.avatarActiveDot} />}
            </LinearGradient>
            <Text style={[s.avatarName, isActive && s.avatarNameActive]}>
              {kid.name} · {kid.childAge}
            </Text>
          </Pressable>
        );
      })}
      <Pressable onPress={handleAddChild} style={s.avatarChip}>
        <View style={s.avatarAdd}>
          <Text style={s.avatarAddPlus}>+</Text>
        </View>
        <Text style={s.avatarName}>Add</Text>
      </Pressable>
    </ScrollView>
  </View>
)}

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

            {/* ─── Dashboard hook cards ─── */}
            <View style={s.hookStack}>

              {/* Card 1 — Last Session */}
              <Text style={s.hookSubheader}>RECENT</Text>
              <Pressable
                onPress={() => {
                  const sid = recentLogs[0]?.child_profile_id ?? null;
                  const child = sid ? kidList.find((k: any) => k.id === sid) : null;
                  if (child) router.push(`/child/${child.id}` as any);
                }}
                style={({ pressed }) => [s.hookCard, pressed && { opacity: 0.82 }]}
                accessibilityRole="button"
                accessibilityLabel="View last session"
              >
                <View style={s.hookCardRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={s.hookTitle} numberOfLines={1}>
                      {recentLogs[0]
                        ? (recentLogs[0].trigger_category
                            ? (RECENT_TRIGGER_LABELS[recentLogs[0].trigger_category] ?? recentLogs[0].trigger_category)
                            : (recentLogs[0].situation_summary ?? '').slice(0, 45))
                        : 'Leaving the park — screaming'}
                    </Text>
                    <Text style={s.hookMeta}>
                      {recentLogs[0]
                        ? `${RECENT_MODE_LABELS[recentLogs[0].mode] ?? recentLogs[0].mode} · ${formatTimeAgo(recentLogs[0].created_at)}`
                        : '2 hours ago'}
                    </Text>
                  </View>
                  <Text style={s.hookArrow}>→</Text>
                </View>
              </Pressable>

              {/* Card 2 — Common Triggers */}
              <Text style={[s.hookSubheader, { marginTop: 22 }]}>PATTERNS</Text>
              <View style={s.hookCard}>
                <Text style={s.hookTitle}>Transitions, Hunger</Text>
                <Text style={s.hookMeta}>Most common triggers this week</Text>
              </View>

              {/* Card 3 — Sturdy+ Locked Insight */}
              <Text style={[s.hookSubheader, { marginTop: 22, color: 'rgba(200,136,58,0.55)' }]}>STURDY+</Text>
              <Pressable
                onPress={() => { Haptics.selectionAsync(); router.push('/upgrade' as any); }}
                style={({ pressed }) => [s.hookCardLocked, pressed && { opacity: 0.85 }]}
                accessibilityRole="button"
                accessibilityLabel="Unlock weekly insight with Sturdy+"
              >
                <View style={s.hookCardRow}>
                  <Text style={s.hookLockedIcon}>🔒</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={s.hookLockedTitle} numberOfLines={2}>
                      Bedtime is the pattern — but it's not really about bedtime...
                    </Text>
                    <Text style={s.hookLockedMeta}>Unlock weekly insight with Sturdy+</Text>
                  </View>
                </View>
              </Pressable>

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

  // ─── Ask Sturdy pill (prominent premium search bar) ───
  inputPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(14,10,6,0.78)',
    borderWidth: 1,
    borderColor: 'rgba(255,248,231,0.14)',
    borderRadius: 22,
    paddingLeft: 20,
    paddingRight: 8,
    paddingVertical: 10,
    marginBottom: 24,
    gap: 10,
    shadowColor: '#F4C878',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.06,
    shadowRadius: 18,
  },
  inputPillFocused: {
    borderColor: 'rgba(232,168,85,0.60)',
    backgroundColor: 'rgba(14,10,6,0.92)',
    shadowOpacity: 0.14,
  },
  pillInput: {
    flex: 1,
    color: '#FFF8E7',
    fontSize: 16,
    fontFamily: F.body,
    paddingVertical: 10,
    lineHeight: 22,
  },
  pillSendBtn: {
    borderRadius: 18,
    overflow: 'hidden',
  },
  pillSendGradient: {
    width: 46,
    height: 46,
    borderRadius: 18,
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

  // ─── Dashboard hook cards ───
  hookStack: { gap: 0 },
  hookSubheader: {
    fontFamily: F.label,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.4,
    color: 'rgba(255,255,255,0.28)',
    marginBottom: 8,
  },
  hookCard: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  hookCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  hookTitle: {
    fontFamily: F.bodySemi,
    fontSize: 14,
    color: 'rgba(255,248,230,0.88)',
    marginBottom: 3,
  },
  hookMeta: {
    fontFamily: F.body,
    fontSize: 12,
    color: 'rgba(255,255,255,0.36)',
  },
  hookArrow: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.22)',
    marginLeft: 4,
  },
  hookCardLocked: {
    backgroundColor: 'rgba(200,136,58,0.07)',
    borderWidth: 1,
    borderColor: 'rgba(200,136,58,0.20)',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  hookLockedIcon: { fontSize: 16, marginRight: 2 },
  hookLockedTitle: {
    fontFamily: F.body,
    fontStyle: 'italic',
    fontSize: 13,
    color: 'rgba(200,136,58,0.68)',
    lineHeight: 19,
    marginBottom: 4,
  },
  hookLockedMeta: {
    fontFamily: F.body,
    fontSize: 11,
    color: 'rgba(200,136,58,0.40)',
  },
  // ─── Child chips (sleek, scaled) ───
  chipsScroll: { marginBottom: 16 },
  chipsRow: { flexDirection: 'row', gap: 6, paddingRight: 4 },
  childChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderColor: 'rgba(255,255,255,0.09)',
  },
  childChipActive: {
    backgroundColor: 'rgba(200,136,58,0.13)',
    borderColor: 'rgba(200,136,58,0.38)',
  },
  chipDot: { width: 6, height: 6, borderRadius: 3 },
  chipLabel: {
    fontFamily: F.bodyMedium,
    fontSize: 11,
    color: 'rgba(255,248,230,0.48)',
  },
  chipLabelActive: { color: 'rgba(255,248,230,0.90)' },

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
  avatarSection: { marginBottom: 20 },
avatarDivider: {
  flexDirection: 'row',
  alignItems: 'center',
  gap: 10,
  marginBottom: 14,
},
avatarDividerLabel: {
  fontFamily: F.label,
  fontSize: 10,
  fontWeight: '700',
  letterSpacing: 0.09,
  textTransform: 'uppercase',
  color: 'rgba(255,255,255,0.22)',
},
avatarDividerLine: {
  flex: 1,
  height: 1,
  backgroundColor: 'rgba(255,255,255,0.06)',
},
avatarRow: {
  flexDirection: 'row',
  gap: 18,
  paddingRight: 4,
  paddingBottom: 4,
},
avatarChip: {
  alignItems: 'center',
  gap: 7,
},
avatarCircle: {
  width: 54,
  height: 54,
  borderRadius: 27,
  alignItems: 'center',
  justifyContent: 'center',
  position: 'relative',
},
avatarCircleActive: {
  shadowColor: '#D4944A',
  shadowOffset: { width: 0, height: 0 },
  shadowOpacity: 0.5,
  shadowRadius: 10,
  borderWidth: 2.5,
  borderColor: '#D4944A',
},
avatarInitial: {
  fontFamily: F.heading,
  fontSize: 18,
  color: '#FFFFFF',
  fontWeight: '600',
},
avatarActiveDot: {
  position: 'absolute',
  bottom: 1,
  right: 1,
  width: 10,
  height: 10,
  borderRadius: 5,
  backgroundColor: '#D4944A',
  borderWidth: 2,
  borderColor: '#0d0b08',
},
avatarName: {
  fontFamily: F.bodyMedium,
  fontSize: 11,
  color: 'rgba(255,255,255,0.28)',
  textAlign: 'center',
},
avatarNameActive: {
  color: '#D4944A',
  fontWeight: '700',
},
avatarAdd: {
  width: 54,
  height: 54,
  borderRadius: 27,
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: 'rgba(255,255,255,0.04)',
  borderWidth: 1.5,
  borderColor: 'rgba(255,255,255,0.12)',
  borderStyle: 'dashed',
},
avatarAddPlus: {
  fontSize: 22,
  color: 'rgba(255,255,255,0.20)',
  fontWeight: '300',
  lineHeight: 26,
},
});