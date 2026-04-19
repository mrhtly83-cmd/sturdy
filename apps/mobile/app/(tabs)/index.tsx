// app/(tabs)/index.tsx
// v7 — Final home: input-first, tone picker, intent cards, weekly insight
// Tone picker matches age picker style (arrows + fill bar)
// Tone is Sturdy+ gated — free users see locked state, default Gentle
// No grid, no paging, no YOUR CHILDREN section


import { useCallback, useState } from 'react';
import {
  Dimensions,
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
import { Stars }           from '../../src/components/features/Stars';
import { colors as C, fonts as F } from '../../src/theme';
import { useAuth }         from '../../src/context/AuthContext';
import { useChildProfile } from '../../src/context/ChildProfileContext';
import { supabase }        from '../../src/lib/supabase';


const { width: SW } = Dimensions.get('window');
const EMPTY_THRESHOLD = 3; // TODO: change back to 5 before launch


// ─── Constants ───
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


const TONES = [
  { key: 'gentle', name: 'Gentle', color: C.sage },
  { key: 'steady', name: 'Steady', color: C.amber },
  { key: 'firm', name: 'Firm', color: C.coral },
  { key: 'direct', name: 'Direct', color: C.coral },
] as const;


const INTENTS = [
  { emoji: '🧘', label: 'Help us both calm down', mode: 'sos' },
  { emoji: '🎯', label: 'Get through this together', mode: 'sos' },
  { emoji: '💡', label: 'Help me understand why', mode: 'understand' },
  { emoji: '🤝', label: 'Repair what just happened', mode: 'reconnect' },
] as const;


const CHILD_COLORS = ['#5778A3', '#8AA060', '#E87461', '#F79566'];


function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning,';
  if (h < 17) return 'Good afternoon,';
  return 'Good evening,';
}


function getDailyThought(): string {
  const dayOfYear = Math.floor(
    (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000
  );
  return THOUGHTS[dayOfYear % THOUGHTS.length];
}


// ═══════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════


export default function HubScreen() {
  const { session } = useAuth();
  const { children, activeChild, isLoadingChild } = useChildProfile() as any;


  const [situation, setSituation] = useState('');
  const [toneIndex, setToneIndex] = useState(0); // Default Gentle (free)
  const [selectedIntent, setSelectedIntent] = useState(0);
  const [inputFocused, setInputFocused] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [weekCount, setWeekCount] = useState(0);


  const IS_PREMIUM = false; // TODO: wire to real subscription check


  const fetchData = useCallback(async () => {
    if (!session?.user?.id || !activeChild?.id) return;
    try {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);


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
    } catch {}
  }, [session?.user?.id, activeChild?.id]);


  useFocusEffect(useCallback(() => { fetchData(); }, [fetchData]));


  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  }, [fetchData]);


  const greeting = getGreeting();
  const thought = getDailyThought();
  const childName = activeChild?.name ?? children?.[0]?.name ?? null;
  const canSubmit = situation.trim().length > 0;


  const handleSubmit = () => {
    if (!canSubmit) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const intent = INTENTS[selectedIntent];
    router.push({ pathname: '/now', params: { mode: intent.mode } });
  };


  const handleToneArrow = (dir: number) => {
    if (!IS_PREMIUM) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      router.push('/upgrade');
      return;
    }
    Haptics.selectionAsync();
    setToneIndex((prev) => (prev + dir + TONES.length) % TONES.length);
  };


  const handleToneTrackPress = () => {
    if (!IS_PREMIUM) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      router.push('/upgrade');
    }
  };


  const handleIntentSelect = (index: number) => {
    Haptics.selectionAsync();
    setSelectedIntent(index);
  };


  const currentTone = TONES[toneIndex];
  const toneFillPct = (toneIndex / 3) * 100;


  // ── Guest gate ──
  if (!session) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#0e0a10' }} edges={['top']}>
        <StatusBar style="light" />
        <LinearGradient
          colors={['#0e0a10', '#14101a', '#1a1622', '#1e1a28', '#14101a']}
          locations={[0, 0.25, 0.5, 0.75, 1]}
          style={StyleSheet.absoluteFill}
        />
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32, gap: 20 }}>
          <Text style={{ fontFamily: F.heading, fontSize: 28, color: '#FFFFFF', textAlign: 'center', letterSpacing: -0.3, lineHeight: 36 }}>
            Save your scripts.{'\n'}Know your child.
          </Text>
          <Text style={{ fontFamily: F.body, fontSize: 15, color: 'rgba(255,255,255,0.40)', textAlign: 'center', lineHeight: 23 }}>
            Create a free account to keep everything in one place.
          </Text>
          <Pressable onPress={() => router.push('/auth/sign-up')} style={({ pressed }) => [pressed && { opacity: 0.85 }]}>
            <LinearGradient colors={['#C8883A', '#E8A855']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              style={{ width: SW - 64, borderRadius: 18, minHeight: 56, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ fontFamily: F.subheading, fontSize: 16, color: '#FFFFFF' }}>Create free account</Text>
            </LinearGradient>
          </Pressable>
          <Pressable onPress={() => router.push('/auth/sign-in')}>
            <Text style={{ fontFamily: F.bodySemi, fontSize: 14, color: 'rgba(255,255,255,0.35)', textDecorationLine: 'underline' }}>
              Already have an account? Sign in
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }


  // ── Main hub ──
  return (
    <SafeAreaView style={s.root} edges={['top']}>
      <StatusBar style="light" />
      <LinearGradient
        colors={['#0e0a10', '#14101a', '#1a1622', '#1e1a28', '#201c2a', '#1e1a24', '#1a1620', '#18141e', '#14101a']}
        locations={[0, 0.10, 0.22, 0.35, 0.48, 0.60, 0.72, 0.85, 1]}
        style={StyleSheet.absoluteFill}
      />
      <Stars />
      <LinearGradient
        colors={['transparent', 'rgba(212,148,74,0.03)', 'rgba(212,148,74,0.06)']}
        locations={[0, 0.5, 1]}
        style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '35%', zIndex: 1 }}
        pointerEvents="none"
      />


      <ScrollView
        contentContainerStyle={s.scroll}
        showsVerticalScrollIndicator={false}
        keyboardDismissMode="interactive"
        keyboardShouldPersistTaps="handled"
        style={{ zIndex: 2 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh}
            tintColor={C.amber} progressBackgroundColor="#1a1622" />
        }
      >
        {/* ─── HEADER ─── */}
        <View style={s.headerRow}>
          <View style={{ flex: 1 }}>
            <Text style={s.greeting}>
              {greeting} <Text style={s.greetingName}>{childName ? `${childName}'s parent` : ''}</Text>
            </Text>
          </View>
        </View>


        {/* ─── SUBSCRIPTION LINE ─── */}
        <View style={s.subLine}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text style={s.subPlan}>FREE PLAN</Text>
            <Text style={s.subValue}>· Unlimited SOS</Text>
          </View>
          <Pressable onPress={() => router.push('/upgrade')} style={({ pressed }) => [s.subUpgrade, pressed && { opacity: 0.8 }]}>
            <Text style={s.subUpgradeText}>Sturdy+ →</Text>
          </Pressable>
        </View>


        {/* ─── CHILD PILLS ─── */}
        {children && children.length > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.childScroll}>
            {children.map((child: any, i: number) => {
              const isActive = child.id === activeChild?.id;
              const color = CHILD_COLORS[i % CHILD_COLORS.length];
              return (
                <Pressable
                  key={child.id}
                  onPress={() => router.push('/(tabs)/child')}
                  style={[s.childChip, isActive && s.childChipActive]}
                >
                  <LinearGradient
                    colors={['#7C9A87', '#3C5A73']}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                    style={s.childChipAva}
                  >
                    <Text style={s.childChipInitial}>{child.name?.[0]?.toUpperCase() ?? '?'}</Text>
                  </LinearGradient>
                  <View style={{ gap: 0 }}>
                    <Text style={s.childChipName}>{child.name}</Text>
                    <Text style={s.childChipAge}>Age {child.childAge ?? '?'} · {weekCount} scripts</Text>
                  </View>
                </Pressable>
              );
            })}
            <Pressable onPress={() => router.push('/child/new')} style={s.childAdd}>
              <Text style={s.childAddText}>+</Text>
            </Pressable>
          </ScrollView>
        )}


        {/* ─── No child prompt ─── */}
        {!isLoadingChild && (!children || children.length === 0) && (
          <Pressable onPress={() => router.push('/child/new')}>
            <LinearGradient
              colors={['rgba(87,120,163,0.10)', 'rgba(87,120,163,0.04)', 'rgba(0,0,0,0.10)']}
              start={{ x: 0, y: 0 }} end={{ x: 0.8, y: 1 }}
              style={s.noChildCard}
            >
              <Text style={s.noChildTitle}>Add your first child</Text>
              <Text style={s.noChildBody}>Sturdy personalizes every script to your child's age and needs.</Text>
              <Text style={s.noChildLink}>Add child →</Text>
            </LinearGradient>
          </Pressable>
        )}


        {/* ─── INPUT CARD ─── */}
        <LinearGradient
          colors={['rgba(255,255,255,0.06)', 'rgba(255,255,255,0.02)', 'rgba(0,0,0,0.10)']}
          start={{ x: 0, y: 0 }} end={{ x: 0.8, y: 1 }}
          style={s.inputCard}
        >
          {/* Quote */}
          <Text style={s.quote}>"{thought}"</Text>


          {/* Textarea */}
          <View style={[s.inputField, inputFocused && s.inputFieldFocused]}>
            <TextInput
              multiline
              placeholder="What's happening right now?"
              placeholderTextColor="rgba(255,255,255,0.22)"
              value={situation}
              onChangeText={setSituation}
              onFocus={() => setInputFocused(true)}
              onBlur={() => setInputFocused(false)}
              style={s.textarea}
              textAlignVertical="top"
            />
            <Text style={s.inputMic}>🎙️</Text>
          </View>


          {/* ─── TONE PICKER (age picker style) ─── */}
          <Pressable onPress={handleToneTrackPress} style={s.toneWrap}>
            <View style={s.tonePickerRow}>
              <Pressable onPress={() => handleToneArrow(-1)} style={s.toneArrow}>
                <Text style={s.toneArrowText}>‹</Text>
              </Pressable>
              <View style={s.toneValueWrap}>
                <Text style={[s.toneCenterLabel, { color: IS_PREMIUM ? currentTone.color : C.textMuted }]}>
                  {currentTone.name}
                </Text>
                <Text style={s.toneCenterSub}>tone {!IS_PREMIUM && '🔒'}</Text>
              </View>
              <Pressable onPress={() => handleToneArrow(1)} style={s.toneArrow}>
                <Text style={s.toneArrowText}>›</Text>
              </Pressable>
            </View>


            {/* Fill bar */}
            <View style={s.toneTrackWrap}>
              <View style={s.toneTrack} />
              <View style={[s.toneFill, {
                width: `${Math.max(toneFillPct + 4, 6)}%`,
                backgroundColor: IS_PREMIUM ? '#E8A855' : 'rgba(255,255,255,0.15)',
              }]} />
            </View>
            <View style={s.toneRange}>
              <Text style={s.toneRangeLabel}>Gentle</Text>
              <Text style={s.toneRangeLabel}>Direct</Text>
            </View>
          </Pressable>


          {/* CTA */}
          <Pressable
            onPress={handleSubmit}
            disabled={!canSubmit}
            style={({ pressed }) => [pressed && canSubmit && { opacity: 0.9, transform: [{ scale: 0.98 }] }]}
          >
            <LinearGradient
              colors={canSubmit ? ['#C8883A', '#E8A855'] : ['rgba(255,255,255,0.06)', 'rgba(255,255,255,0.04)']}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              style={s.ctaBtn}
            >
              <Text style={[s.ctaText, !canSubmit && { color: 'rgba(255,255,255,0.25)' }]}>
                Help me with this
              </Text>
            </LinearGradient>
          </Pressable>
        </LinearGradient>


        {/* ─── INTENT CARDS (horizontal swipe) ─── */}
        <View style={s.sectionRow}>
          <Text style={s.sectionLabel}>WHAT DO YOU NEED</Text>
          <View style={s.sectionLine} />
        </View>


        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.intentScroll}>
          {INTENTS.map((intent, i) => {
            const isActive = selectedIntent === i;
            return (
              <Pressable
                key={i}
                onPress={() => handleIntentSelect(i)}
                style={[s.intentCard, isActive && s.intentCardActive]}
              >
                <Text style={s.intentEmoji}>{intent.emoji}</Text>
                <Text style={s.intentLabel}>{intent.label}</Text>
              </Pressable>
            );
          })}
        </ScrollView>


        {/* ─── WEEKLY INSIGHT (locked/blurred) ─── */}
        {totalCount >= EMPTY_THRESHOLD && (
          <Pressable onPress={() => router.push('/upgrade')}>
            <LinearGradient
              colors={['rgba(124,154,135,0.08)', 'rgba(124,154,135,0.03)', 'rgba(0,0,0,0.10)']}
              start={{ x: 0, y: 0 }} end={{ x: 0.8, y: 1 }}
              style={s.insightCard}
            >
              <Text style={s.insightEye}>WEEKLY INSIGHT</Text>
              <View style={s.insightBlur}>
                <Text style={s.insightPreview}>
                  Bedtime is the pattern — but it's not really about bedtime. {childName || 'Your child'} needs reconnection after a long day apart.
                </Text>
              </View>
              <View style={s.insightLock}>
                <Text style={s.insightLockIcon}>🔒</Text>
                <Text style={s.insightLockText}>Unlock with Sturdy+ →</Text>
              </View>
            </LinearGradient>
          </Pressable>
        )}


        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}


// ═══════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════


const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0e0a10' },
  scroll: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 40, gap: 12 },


  // Header
  headerRow: { flexDirection: 'row', alignItems: 'flex-start' },
  greeting: { fontFamily: F.heading, fontSize: 22, color: C.text, letterSpacing: -0.3, lineHeight: 30 },
  greetingName: { fontFamily: F.bodySemi, fontSize: 15, color: C.amber },


  // Subscription
  subLine: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  subPlan: { fontFamily: F.label, fontSize: 10, letterSpacing: 0.5, color: C.sage },
  subValue: { fontFamily: F.body, fontSize: 11, color: C.textMuted },
  subUpgrade: {
    paddingVertical: 4, paddingHorizontal: 12, borderRadius: 8,
    backgroundColor: 'rgba(200,136,58,0.10)',
    borderWidth: 1, borderColor: 'rgba(200,136,58,0.20)',
  },
  subUpgradeText: { fontFamily: F.bodySemi, fontSize: 11, color: C.amber },


  // Child pills
  childScroll: { gap: 8, paddingVertical: 2 },
  childChip: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingVertical: 5, paddingLeft: 5, paddingRight: 14, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
  },
  childChipActive: {
    backgroundColor: 'rgba(138,160,96,0.10)', borderColor: 'rgba(138,160,96,0.25)',
  },
  childChipAva: {
    width: 26, height: 26, borderRadius: 13,
    alignItems: 'center', justifyContent: 'center',
  },
  childChipInitial: { fontFamily: F.bodySemi, fontSize: 11, color: '#fff' },
  childChipName: { fontFamily: F.bodySemi, fontSize: 13, color: C.textBody },
  childChipAge: { fontFamily: F.body, fontSize: 10, color: C.textMuted },
  childAdd: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center', justifyContent: 'center',
  },
  childAddText: { fontSize: 18, color: C.textMuted },


  // No child
  noChildCard: {
    borderRadius: 18, padding: 16, gap: 6,
    borderWidth: 1,
    borderTopColor: 'rgba(87,120,163,0.22)', borderLeftColor: 'rgba(87,120,163,0.12)',
    borderRightColor: 'rgba(0,0,0,0.06)', borderBottomColor: 'rgba(0,0,0,0.10)',
  },
  noChildTitle: { fontFamily: F.bodySemi, fontSize: 15, color: C.text },
  noChildBody: { fontFamily: F.body, fontSize: 13, color: C.textSub, lineHeight: 20 },
  noChildLink: { fontFamily: F.bodySemi, fontSize: 13, color: C.blue, marginTop: 4 },


  // Input card
  inputCard: {
    borderRadius: 20, padding: 14, gap: 12,
    borderWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.12)', borderLeftColor: 'rgba(255,255,255,0.06)',
    borderRightColor: 'rgba(0,0,0,0.06)', borderBottomColor: 'rgba(0,0,0,0.10)',
  },
  quote: {
    fontFamily: F.scriptItalic, fontSize: 13, color: C.textSub,
    textAlign: 'center', lineHeight: 20, paddingHorizontal: 4,
  },
  inputField: {
    flexDirection: 'row', alignItems: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 14, overflow: 'hidden',
  },
  inputFieldFocused: { borderColor: 'rgba(87,120,163,0.35)' },
  textarea: {
    flex: 1, padding: 12, paddingRight: 0,
    fontFamily: F.body, fontSize: 15, color: C.text,
    lineHeight: 22, minHeight: 44, maxHeight: 100,
  },
  inputMic: { fontSize: 16, opacity: 0.4, padding: 12, paddingLeft: 8 },


  // Tone picker
  toneWrap: { alignItems: 'center', gap: 0 },
  tonePickerRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 16,
    paddingVertical: 4,
  },
  toneArrow: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center', justifyContent: 'center',
  },
  toneArrowText: { fontSize: 18, color: C.textSub },
  toneValueWrap: { alignItems: 'center', minWidth: 100 },
  toneCenterLabel: { fontFamily: F.heading, fontSize: 28, letterSpacing: -0.3 },
  toneCenterSub: { fontFamily: F.body, fontSize: 11, color: C.textMuted },
  toneTrackWrap: {
    width: '100%', height: 20,
    justifyContent: 'center', marginTop: 4,
  },
  toneTrack: {
    position: 'absolute', left: 0, right: 0, height: 5, borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.10)',
  },
  toneFill: {
    position: 'absolute', left: 0, height: 5, borderRadius: 3,
  },
  toneRange: {
    flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginTop: 2,
  },
  toneRangeLabel: { fontFamily: F.body, fontSize: 10, color: C.textMuted },


  // CTA
  ctaBtn: { borderRadius: 14, paddingVertical: 14, alignItems: 'center', justifyContent: 'center' },
  ctaText: { fontFamily: F.bodySemi, fontSize: 15, color: '#FFFFFF', letterSpacing: 0.3 },


  // Section
  sectionRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  sectionLabel: { fontFamily: F.label, fontSize: 10, letterSpacing: 0.9, color: C.textMuted },
  sectionLine: { flex: 1, height: StyleSheet.hairlineWidth, backgroundColor: 'rgba(255,255,255,0.08)' },


  // Intent cards
  intentScroll: { gap: 8, paddingVertical: 2, paddingRight: 20 },
  intentCard: {
    alignItems: 'center', gap: 8,
    paddingVertical: 14, paddingHorizontal: 16, borderRadius: 16, minWidth: 140,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)',
  },
  intentCardActive: {
    backgroundColor: 'rgba(200,136,58,0.08)', borderColor: 'rgba(200,136,58,0.25)',
  },
  intentEmoji: { fontSize: 28 },
  intentLabel: { fontFamily: F.bodySemi, fontSize: 13, color: C.textBody, textAlign: 'center', lineHeight: 18 },


  // Weekly insight
  insightCard: {
    borderRadius: 18, padding: 16, gap: 8,
    borderWidth: 1,
    borderTopColor: 'rgba(124,154,135,0.18)', borderLeftColor: 'rgba(124,154,135,0.10)',
    borderRightColor: 'rgba(0,0,0,0.06)', borderBottomColor: 'rgba(0,0,0,0.10)',
    alignItems: 'center',
  },
  insightEye: { fontFamily: F.label, fontSize: 9, letterSpacing: 0.8, color: C.textMuted, alignSelf: 'flex-start' },
  insightBlur: { overflow: 'hidden' },
  insightPreview: {
    fontFamily: F.scriptItalic, fontSize: 14, color: C.textSub,
    lineHeight: 22, textAlign: 'center',
    // Note: React Native doesn't support CSS blur on text
    // Use opacity as approximation — real blur needs a BlurView overlay
    opacity: 0.3,
  },
  insightLock: { alignItems: 'center', gap: 4, marginTop: 4 },
  insightLockIcon: { fontSize: 18 },
  insightLockText: { fontFamily: F.bodySemi, fontSize: 12, color: C.amber },
});



