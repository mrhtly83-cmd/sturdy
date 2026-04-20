// app/(tabs)/index.tsx
// v9 — Journal identity: pastel gradient, frosted glass, Manrope + Cormorant
// EMPTY_THRESHOLD = 3 for testing — TODO: change back to 5 before launch

import { useCallback, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { StatusBar }       from 'expo-status-bar';
import { SafeAreaView }    from 'react-native-safe-area-context';
import { LinearGradient }  from 'expo-linear-gradient';
import * as Haptics        from 'expo-haptics';
import { colors as C, fonts as F } from '../../src/theme';
import { useAuth }         from '../../src/context/AuthContext';
import { useChildProfile } from '../../src/context/ChildProfileContext';
import { supabase }        from '../../src/lib/supabase';
import { getParentingScript, CrisisDetectedError } from '../../src/lib/api';
import { detectCrisis } from '../../src/hooks/useCrisisMode';

const { width: SW } = Dimensions.get('window');
const EMPTY_THRESHOLD = 3; // TODO: change back to 5 before launch

// ─── Data ───
const THOUGHTS = [
  "You don't have to get it right every time. You just have to keep showing up.",
  "The fact that you're looking for better words means you're already a good parent.",
  "Children don't need perfect parents. They need present ones.",
  "Your calm is your child's anchor.",
  "Repair is more powerful than perfection.",
  "Every hard moment is a chance to model what regulation looks like.",
  "You are your child's safe place, even when it doesn't feel like it.",
  "The hardest parenting moments are often the most important ones.",
  "Your child isn't giving you a hard time. They're having a hard time.",
  "It's okay to pause before you respond. That pause is parenting.",
];

const TIPS = [
  { text: "When your child refuses to leave, they're not being defiant — they're struggling with transitions.", source: 'The Whole-Brain Child' },
  { text: "Name the emotion before trying to solve the problem. It reduces amygdala activity.", source: 'No-Drama Discipline' },
  { text: "Children do well when they can. If they're not doing well, something is getting in the way.", source: 'The Explosive Child' },
  { text: "Your triggers are your history. When you lose it, that's your childhood talking.", source: 'Raising Good Humans' },
  { text: "Less stuff, fewer choices, more rhythm. Environment shapes behaviour.", source: 'Simplicity Parenting' },
  { text: "Repair matters more than perfection. Coming back after a rupture builds trust.", source: 'The Book You Wish Your Parents Had Read' },
  { text: "Acknowledge feelings before solving problems. Always.", source: 'How to Talk So Kids Will Listen' },
];

const INTENTS = [
  { emoji: '🧘', label: 'Calm down', mode: 'sos', bg: C.catPink, color: '#8B3A4A' },
  { emoji: '🎯', label: 'Get through', mode: 'sos', bg: C.catBlue, color: '#2E5C7B' },
  { emoji: '💡', label: 'Understand', mode: 'understand', bg: C.catGreen, color: '#3B6B3A' },
  { emoji: '🤝', label: 'Repair', mode: 'reconnect', bg: C.catYellow, color: '#8B6530' },
] as const;

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning,';
  if (h < 17) return 'Good afternoon,';
  return 'Good evening,';
}

function getDailyIndex(mod: number): number {
  const dayOfYear = Math.floor(
    (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000
  );
  return dayOfYear % mod;
}

type LastSession = {
  id: string;
  summary: string;
  mode: string;
  created_at: string;
};

// ═══════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════

export default function HubScreen() {
  const { session } = useAuth();
  const { children, activeChild, isLoadingChild } = useChildProfile() as any;

  const [situation, setSituation] = useState('');
  const [selectedIntent, setSelectedIntent] = useState(0);
  const [inputFocused, setInputFocused] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [weekCount, setWeekCount] = useState(0);
  const [lastSession, setLastSession] = useState<LastSession | null>(null);

  const IS_PREMIUM = false; // TODO: wire to real subscription

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(10)).current;

  const fetchData = useCallback(async () => {
    if (!session?.user?.id) return;
    try {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);

      if (activeChild?.id) {
        const { count: total } = await supabase
          .from('interaction_logs').select('id', { count: 'exact', head: true })
          .eq('user_id', session.user.id).eq('child_profile_id', activeChild.id)
          .eq('is_followup', false);

        const { count: week } = await supabase
          .from('interaction_logs').select('id', { count: 'exact', head: true })
          .eq('user_id', session.user.id).eq('child_profile_id', activeChild.id)
          .eq('is_followup', false).gte('created_at', weekAgo.toISOString());

        setTotalCount(total ?? 0);
        setWeekCount(week ?? 0);
      }

      const { data: lastLog } = await supabase
        .from('interaction_logs')
        .select('id, situation_summary, mode, created_at')
        .eq('user_id', session.user.id)
        .eq('is_followup', false)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (lastLog) {
        setLastSession({
          id: lastLog.id,
          summary: lastLog.situation_summary || 'A hard moment',
          mode: lastLog.mode || 'SOS',
          created_at: lastLog.created_at,
        });
      }
    } catch {}
  }, [session?.user?.id, activeChild?.id]);

  useFocusEffect(useCallback(() => {
    fetchData();
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 400, useNativeDriver: true }),
    ]).start();
  }, [fetchData]));

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  }, [fetchData]);

  const greeting = getGreeting();
  const thought = THOUGHTS[getDailyIndex(THOUGHTS.length)];
  const tip = TIPS[getDailyIndex(TIPS.length)];
  const childName = activeChild?.name ?? children?.[0]?.name ?? null;
  const canSubmit = situation.trim().length > 0;

  const handleSubmit = async () => {
    const msg = situation.trim();
    if (!msg) return;

    const crisisCheck = detectCrisis(msg);
    if (crisisCheck.isCrisis) {
      router.push({ pathname: '/crisis', params: { crisisType: crisisCheck.crisisType, riskLevel: crisisCheck.riskLevel } });
      return;
    }

    const childNameFinal = activeChild?.name?.trim() || 'My child';
    const childAgeFinal = activeChild?.childAge ?? 4;
    const intent = INTENTS[selectedIntent];

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setError(''); setLoading(true);

    try {
      const script = await getParentingScript({
        childName: childNameFinal, childAge: childAgeFinal,
        message: msg, userId: session?.user?.id,
        intensity: null, mode: intent.mode,
      } as any);

      router.push({
        pathname: '/result',
        params: {
          situationSummary: script.situation_summary,
          regulateAction: script.regulate.parent_action,
          regulateScript: script.regulate.script,
          regulateCoaching: script.regulate.coaching ?? '',
          regulateStrategies: JSON.stringify(script.regulate.strategies ?? []),
          connectAction: script.connect.parent_action,
          connectScript: script.connect.script,
          connectCoaching: script.connect.coaching ?? '',
          connectStrategies: JSON.stringify(script.connect.strategies ?? []),
          guideAction: script.guide.parent_action,
          guideScript: script.guide.script,
          guideCoaching: script.guide.coaching ?? '',
          guideStrategies: JSON.stringify(script.guide.strategies ?? []),
          avoid: JSON.stringify(script.avoid),
          childMessage: msg, mode: intent.mode,
        },
      });
      setSituation('');
    } catch (err) {
      if (err instanceof CrisisDetectedError) {
        router.push({ pathname: '/crisis', params: { crisisType: err.crisisType, riskLevel: err.riskLevel } });
        return;
      }
      setError("Couldn't get a script. Try again.");
    } finally { setLoading(false); }
  };

  const handleTonePress = () => {
    if (!IS_PREMIUM) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      router.push('/upgrade');
    }
  };

  function formatTimeAgo(iso: string): string {
    const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
    if (diff < 60) return `${diff}m ago`;
    if (diff < 1440) return `${Math.floor(diff / 60)}h ago`;
    return `${Math.floor(diff / 1440)}d ago`;
  }

  // ── Guest gate ──
  if (!session) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: C.base }} edges={['top']}>
        <StatusBar style="dark" />
        <LinearGradient
          colors={[C.gradStart, C.gradMid1, C.gradMid2, C.gradEnd]}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32, gap: 20 }}>
          <Text style={{ fontFamily: F.display, fontSize: 30, color: C.text, textAlign: 'center', lineHeight: 38 }}>
            Save your scripts.{'\n'}Know your child.
          </Text>
          <Text style={{ fontFamily: F.body, fontSize: 15, color: C.textSub, textAlign: 'center', lineHeight: 23 }}>
            Create a free account to keep everything in one place.
          </Text>
          <Pressable onPress={() => router.push('/auth/sign-up')} style={({ pressed }) => [pressed && { opacity: 0.85 }]}>
            <View style={{ width: SW - 64, borderRadius: 18, minHeight: 56, alignItems: 'center', justifyContent: 'center', backgroundColor: C.rose }}>
              <Text style={{ fontFamily: F.subheading, fontSize: 16, color: '#FFFFFF' }}>Create free account</Text>
            </View>
          </Pressable>
          <Pressable onPress={() => router.push('/auth/sign-in')}>
            <Text style={{ fontFamily: F.bodySemi, fontSize: 14, color: C.textMuted, textDecorationLine: 'underline' }}>
              Already have an account? Sign in
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  // ── Hub ──
  return (
    <SafeAreaView style={s.root} edges={['top']}>
      <StatusBar style="dark" />

      {/* Pastel gradient background */}
      <LinearGradient
        colors={[C.gradStart, C.gradMid1, C.gradMid2, C.gradEnd]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      <ScrollView
        contentContainerStyle={s.scroll}
        showsVerticalScrollIndicator={false}
        keyboardDismissMode="interactive"
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh}
            tintColor={C.rose} progressBackgroundColor={C.base} />
        }
      >
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }], gap: 12 }}>

          {/* ─── LOGO ─── */}
          <View style={s.logoWrap}>
            <Image
              source={require('../../assets/logo.png')}
              style={{ width: 56, height: 56 }}
              resizeMode="contain"
            />
          </View>

          {/* ─── HEADER ─── */}
          <View style={s.headerRow}>
            <View style={{ flex: 1 }}>
              <Text style={s.greeting}>{greeting}</Text>
              <Text style={s.greetingName}>{childName ? `${childName}'s parent` : 'Welcome'}</Text>
            </View>
            <Pressable onPress={() => router.push('/upgrade')} style={({ pressed }) => [s.upgradePill, pressed && { opacity: 0.8 }]}>
              <Text style={s.upgradePillText}>Sturdy+ →</Text>
            </Pressable>
          </View>

          {/* ─── CHILD PILLS ─── */}
          {children && children.length > 0 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.childRow}>
              {children.map((child: any, i: number) => {
                const isActive = child.id === activeChild?.id;
                return (
                  <Pressable key={child.id} onPress={() => router.push('/(tabs)/child')}
                    style={[s.childChip, isActive && s.childChipActive]}>
                    <View style={[s.childAva, { backgroundColor: isActive ? C.sage : C.rose }]}>
                      <Text style={s.childAvaText}>{child.name?.[0]?.toUpperCase() ?? '?'}</Text>
                    </View>
                    <Text style={s.childChipName}>{child.name}</Text>
                    <Text style={s.childChipMeta}>· {child.childAge ?? '?'}</Text>
                  </Pressable>
                );
              })}
              <Pressable onPress={() => router.push('/child/new')} style={s.childAdd}>
                <Text style={s.childAddText}>+</Text>
              </Pressable>
            </ScrollView>
          )}

          {/* ─── No child ─── */}
          {!isLoadingChild && (!children || children.length === 0) && (
            <Pressable onPress={() => router.push('/child/new')}>
              <View style={s.noChildCard}>
                <Text style={s.noChildTitle}>Add your first child</Text>
                <Text style={s.noChildLink}>Add child →</Text>
              </View>
            </Pressable>
          )}

          {/* ─── HERO BANNER ─── */}
          <View style={s.heroBanner}>
            <View style={s.heroBlob1} />
            <View style={s.heroBlob2} />
            <Text style={s.heroTitle}>Your Parenting Journey,{'\n'}Step by Step</Text>
            <Text style={s.heroSub}>Bonding starts with small moments. Try today's tip when you get a quiet minute.</Text>
          </View>

          {/* ─── INPUT CARD ─── */}
          <View style={s.inputCard}>
            <View style={[s.inputField, inputFocused && s.inputFieldFocused]}>
              <TextInput
                multiline
                placeholder="What's happening right now?"
                placeholderTextColor={C.textMuted}
                value={situation}
                onChangeText={setSituation}
                onFocus={() => setInputFocused(true)}
                onBlur={() => setInputFocused(false)}
                style={s.textarea}
                textAlignVertical="top"
              />
              <Text style={s.inputMic}>🎙️</Text>
            </View>

            {/* Tone — compact line */}
            <Pressable onPress={handleTonePress} style={s.toneLine}>
              <Text style={s.toneLabel}>TONE</Text>
              <Text style={s.toneValue}>Gentle</Text>
              <Text style={s.toneLock}>🔒</Text>
              <View style={s.toneBar}><View style={s.toneBarFill} /></View>
              <Text style={s.toneEnd}>Direct</Text>
            </Pressable>

            {/* CTA */}
            <Pressable
              onPress={handleSubmit}
              disabled={!canSubmit || loading}
              style={({ pressed }) => [pressed && canSubmit && !loading && { opacity: 0.9, transform: [{ scale: 0.98 }] }]}
            >
              <View style={[s.ctaBtn, (!canSubmit || loading) && s.ctaBtnDisabled]}>
                <Text style={[s.ctaText, (!canSubmit || loading) && s.ctaTextDisabled]}>
                  {loading ? 'Getting script…' : 'Help me with this'}
                </Text>
              </View>
            </Pressable>

            {error ? <Text style={s.errorText}>{error}</Text> : null}
          </View>

          {/* ─── INTENT CARDS — colorful ─── */}
          <View style={s.secRow}>
            <Text style={s.secLabel}>TODAY'S PLAN</Text>
            <View style={s.secLine} />
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.intentRow}>
            {INTENTS.map((intent, i) => (
              <Pressable key={i} onPress={() => { Haptics.selectionAsync(); setSelectedIntent(i); }}
                style={[s.intentCard, { backgroundColor: intent.bg }, selectedIntent === i && s.intentCardActive]}>
                <Text style={s.intentEmoji}>{intent.emoji}</Text>
                <Text style={[s.intentLabel, { color: intent.color }]}>{intent.label}</Text>
              </Pressable>
            ))}
          </ScrollView>

          {/* ─── LAST SESSION ─── */}
          {lastSession && (
            <>
              <View style={s.secRow}>
                <Text style={s.secLabel}>RECENT</Text>
                <View style={s.secLine} />
              </View>
              <Pressable onPress={() => router.push('/(tabs)/child')} style={({ pressed }) => [pressed && { opacity: 0.85 }]}>
                <View style={s.sessionCard}>
                  <Text style={s.sessionIcon}>📋</Text>
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text style={s.sessionTitle} numberOfLines={1}>{lastSession.summary}</Text>
                    <Text style={s.sessionMeta}>
                      {childName || 'Child'} · {formatTimeAgo(lastSession.created_at)} · {lastSession.mode.toUpperCase()}
                    </Text>
                  </View>
                  <Text style={s.sessionArrow}>→</Text>
                </View>
              </Pressable>
            </>
          )}

          {/* ─── WEEKLY INSIGHT (locked) ─── */}
          {totalCount >= EMPTY_THRESHOLD && (
            <Pressable onPress={() => router.push('/upgrade')} style={({ pressed }) => [pressed && { opacity: 0.85 }]}>
              <View style={s.insightCard}>
                <View style={{ flex: 1, gap: 2 }}>
                  <Text style={s.insightLabel}>WEEKLY INSIGHT</Text>
                  <Text style={s.insightPreview}>
                    Bedtime is the pattern — but it's not really about bedtime...
                  </Text>
                </View>
                <View style={{ alignItems: 'center', gap: 2 }}>
                  <Text style={{ fontSize: 14 }}>🔒</Text>
                  <Text style={s.insightLockText}>Sturdy+</Text>
                </View>
              </View>
            </Pressable>
          )}

          {/* ─── TIP OF THE DAY ─── */}
          <View style={s.tipCard}>
            <Text style={s.tipIcon}>💡</Text>
            <View style={{ flex: 1 }}>
              <Text style={s.tipLabel}>TODAY'S TIP</Text>
              <Text style={s.tipText}>{tip.text}</Text>
              <Text style={s.tipSource}>From: {tip.source}</Text>
            </View>
          </View>

          {/* ─── PLAN FOOTER ─── */}
          <Text style={s.planFooter}>Free plan · Unlimited SOS scripts</Text>

          <View style={{ height: 80 }} />
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ═══════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.base },
  scroll: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 40 },

  // Logo
  logoWrap: { alignItems: 'center', paddingTop: 8,paddingBottom: 8 },

  // Header
  headerRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  greeting: { fontFamily: F.display, fontSize: 26, color: '#1A1714', letterSpacing: -0.3 },
  greetingName: { fontFamily: F.subheading, fontSize: 15, color: C.rose },
  upgradePill: {
    paddingVertical: 5, paddingHorizontal: 12, borderRadius: 10,
    backgroundColor: C.roseMuted, borderWidth: 1, borderColor: 'rgba(201,123,99,0.20)',
  },
  upgradePillText: { fontFamily: F.bodySemi, fontSize: 10, color: C.rose },

  // Child pills
  childRow: { gap: 8, paddingVertical: 2 },
  childChip: {
    flexDirection: 'row', alignItems: 'center', gap: 7,
    paddingVertical: 5, paddingLeft: 5, paddingRight: 12, borderRadius: 18,
    backgroundColor: C.cardGlass, borderWidth: 1, borderColor: C.border,
  },
  childChipActive: { borderColor: 'rgba(129,178,154,0.3)', backgroundColor: C.cardGlassStrong },
  childAva: {
    width: 24, height: 24, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
  },
  childAvaText: { fontFamily: F.bodySemi, fontSize: 10, color: '#fff' },
  childChipName: { fontFamily: F.bodySemi, fontSize: 12, color: C.text },
  childChipMeta: { fontFamily: F.body, fontSize: 10, color: C.textMuted },
  childAdd: {
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: C.cardGlass, borderWidth: 1, borderColor: C.border,
    alignItems: 'center', justifyContent: 'center',
  },
  childAddText: { fontSize: 16, color: C.textMuted },

  // No child
  noChildCard: {
    borderRadius: 16, padding: 14, gap: 4,
    backgroundColor: C.cardGlass, borderWidth: 1, borderColor: C.border,
  },
  noChildTitle: { fontFamily: F.bodySemi, fontSize: 14, color: C.text },
  noChildLink: { fontFamily: F.bodySemi, fontSize: 12, color: C.sage },

  // Hero banner — pastel gradient card
  heroBanner: {
    borderRadius: 20, padding: 20, overflow: 'hidden', position: 'relative',
    backgroundColor: 'rgba(255,255,255,0.6)',
  },
  heroBlob1: {
    position: 'absolute', top: -20, right: -20, width: 120, height: 120,
    borderRadius: 60, backgroundColor: 'rgba(212,232,209,0.5)',
  },
  heroBlob2: {
    position: 'absolute', bottom: -30, left: 20, width: 80, height: 80,
    borderRadius: 40, backgroundColor: 'rgba(253,221,230,0.5)',
  },
  heroTitle: {
    fontFamily: F.display, fontSize: 20, color: C.text,
    lineHeight: 28, position: 'relative', zIndex: 1,
  },
  heroSub: {
    fontFamily: F.body, fontSize: 12, color: C.textSub,
    marginTop: 6, lineHeight: 18, position: 'relative', zIndex: 1,
  },

  // Input card
  inputCard: {
    borderRadius: 18, padding: 14, gap: 10,
    backgroundColor: C.cardGlass, borderWidth: 1, borderColor: C.border,
  },
  inputField: {
    flexDirection: 'row', alignItems: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.6)',
    borderWidth: 1, borderColor: C.border,
    borderRadius: 14, overflow: 'hidden',
  },
  inputFieldFocused: { borderColor: 'rgba(129,178,154,0.40)' },
  textarea: {
    flex: 1, padding: 12, paddingRight: 0,
    fontFamily: F.body, fontSize: 15, color: C.text,
    lineHeight: 22, minHeight: 56, maxHeight: 120,
  },
  inputMic: { fontSize: 14, opacity: 0.3, padding: 14, paddingLeft: 6 },

  // Tone
  toneLine: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 2 },
  toneLabel: { fontFamily: F.label, fontSize: 10, letterSpacing: 0.3, color: C.textMuted },
  toneValue: { fontFamily: F.bodySemi, fontSize: 12, color: C.textSub },
  toneLock: { fontSize: 9, marginLeft: -2 },
  toneBar: { flex: 1, height: 3, borderRadius: 2, backgroundColor: 'rgba(0,0,0,0.06)', overflow: 'hidden' },
  toneBarFill: { width: '10%', height: 3, borderRadius: 2, backgroundColor: 'rgba(201,123,99,0.3)' },
  toneEnd: { fontFamily: F.body, fontSize: 10, color: 'rgba(42,37,32,0.15)' },

  // CTA
  ctaBtn: { borderRadius: 14, paddingVertical: 13, alignItems: 'center', justifyContent: 'center', backgroundColor: C.rose },
  ctaBtnDisabled: { backgroundColor: 'rgba(0,0,0,0.06)' },
  ctaText: { fontFamily: F.bodySemi, fontSize: 14, color: '#FFFFFF', letterSpacing: 0.2 },
  ctaTextDisabled: { color: C.textMuted },
  errorText: { fontFamily: F.body, fontSize: 12, color: C.rose, textAlign: 'center' },

  // Section
  secRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  secLabel: { fontFamily: F.label, fontSize: 9, letterSpacing: 0.8, color: C.textMuted },
  secLine: { flex: 1, height: StyleSheet.hairlineWidth, backgroundColor: 'rgba(0,0,0,0.08)' },

  // Intent cards — colorful pastel
  intentRow: { gap: 8, paddingVertical: 2 },
  intentCard: {
    paddingVertical: 14, paddingHorizontal: 18, borderRadius: 16, minWidth: 110,
    alignItems: 'center', gap: 6,
  },
  intentCardActive: { borderWidth: 2, borderColor: 'rgba(0,0,0,0.10)' },
  intentEmoji: { fontSize: 24 },
  intentLabel: { fontFamily: F.bodySemi, fontSize: 13, textAlign: 'center' },

  // Session
  sessionCard: {
    borderRadius: 14, padding: 12, backgroundColor: C.cardGlass,
    borderWidth: 1, borderColor: C.border,
    flexDirection: 'row', alignItems: 'center', gap: 12,
  },
  sessionIcon: { fontSize: 20 },
  sessionTitle: { fontFamily: F.bodySemi, fontSize: 13, color: C.text },
  sessionMeta: { fontFamily: F.body, fontSize: 11, color: C.textMuted },
  sessionArrow: { fontFamily: F.bodySemi, fontSize: 12, color: C.textMuted },

  // Insight
  insightCard: {
    borderRadius: 14, padding: 12, backgroundColor: C.cardGlass,
    borderWidth: 1, borderColor: 'rgba(129,178,154,0.15)',
    flexDirection: 'row', alignItems: 'center', gap: 12,
  },
  insightLabel: { fontFamily: F.label, fontSize: 9, letterSpacing: 0.6, color: C.textMuted },
  insightPreview: { fontFamily: F.scriptItalic, fontSize: 13, color: C.textSub, opacity: 0.4, lineHeight: 18 },
  insightLockText: { fontFamily: F.bodySemi, fontSize: 9, color: C.rose },

  // Tip
  tipCard: {
    borderRadius: 14, padding: 12, backgroundColor: 'rgba(255,255,255,0.5)',
    borderWidth: 1, borderColor: 'rgba(201,123,99,0.10)',
    flexDirection: 'row', alignItems: 'flex-start', gap: 10,
  },
  tipIcon: { fontSize: 16, marginTop: 1 },
  tipLabel: { fontFamily: F.label, fontSize: 9, letterSpacing: 0.6, color: C.rose, marginBottom: 2 },
  tipText: { fontFamily: F.body, fontSize: 13, color: C.textBody, lineHeight: 19 },
  tipSource: { fontFamily: F.body, fontSize: 10, color: C.textMuted, marginTop: 3, fontStyle: 'italic' },

  // Plan footer
  planFooter: { fontFamily: F.body, fontSize: 10, color: C.textMuted, textAlign: 'center', marginTop: 4 },
});


