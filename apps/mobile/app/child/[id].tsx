// app/child/[id].tsx
// v2 — Child hub. Each child has their own SOS experience.
// Journal identity: pastel gradient, frosted glass, rose accents.
// Replaces the old standalone now.tsx — SOS lives here, scoped per child.

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { router, useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';

import { useAuth } from '../../src/context/AuthContext';
import { useChildProfile } from '../../src/context/ChildProfileContext';
import { getParentingScript, CrisisDetectedError } from '../../src/lib/api';
import { detectCrisis } from '../../src/hooks/useCrisisMode';
import { loadSavedScripts, type SavedScriptRow } from '../../src/lib/loadSavedScripts';
import { colors as C, fonts as F } from '../../src/theme';

const HORIZON_PHOTO = require('../../assets/images/welcome/welcome-horizon.jpg');

// ═══════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════

const INTENSITY_OPTIONS = [
  { level: 1, label: 'Mild',     color: C.sage },
  { level: 2, label: 'Building', color: '#5778A3' },
  { level: 3, label: 'Hard',     color: '#F79566' },
  { level: 4, label: 'Intense',  color: C.rose },
] as const;

const TIMEOUT_MS = 20 * 60 * 1000; // 20 min idle → sign out

// ═══════════════════════════════════════════════
// MODE COPY
// The hub serves all 4 outcome modes (SOS / Reconnect / Understand /
// Conversation). The mode comes from the URL `mode` param (set when the
// parent taps an outcome card on Home). All four backend prompts return
// the same R/C/G shape — we just adapt the input copy + intensity gating
// so the parent knows what they're getting.
// Intensity only matters for SOS — buildPrompt ignores it for the others.
// ═══════════════════════════════════════════════

type HubMode = 'sos' | 'reconnect' | 'understand' | 'conversation';

const MODE_COPY: Record<HubMode, {
  placeholder: (name: string) => string;
  hint:        string;
  cta:         string;
  ctaLoading:  string;
  showIntensity: boolean;
}> = {
  sos: {
    placeholder: (n) => `What's happening with ${n} right now?`,
    hint:        'A simple snapshot is enough.',
    cta:         'Get Script',
    ctaLoading:  'Getting script…',
    showIntensity: true,
  },
  reconnect: {
    placeholder: (n) => `What needs repair with ${n}?`,
    hint:        'A few sentences about what just happened.',
    cta:         'Find the words',
    ctaLoading:  'Finding the words…',
    showIntensity: false,
  },
  understand: {
    placeholder: (n) => `What are you trying to understand about ${n}?`,
    hint:        'Describe the pattern or behaviour.',
    cta:         'Help me see it',
    ctaLoading:  'Reading the pattern…',
    showIntensity: false,
  },
  conversation: {
    placeholder: (n) => `What conversation are you preparing with ${n}?`,
    hint:        'Tell Sturdy the topic and what makes it hard.',
    cta:         'Plan it with me',
    ctaLoading:  'Planning…',
    showIntensity: false,
  },
};

function isHubMode(v: unknown): v is HubMode {
  return v === 'sos' || v === 'reconnect' || v === 'understand' || v === 'conversation';
}


// ═══════════════════════════════════════════════
// SCREEN
// ═══════════════════════════════════════════════

export default function ChildHubScreen() {
  const navigation = useRouter();
  const params = useLocalSearchParams<{ id?: string; mode?: string }>();
  const { session, signOut } = useAuth();
  const { children, activeChild, setActiveChild } = useChildProfile() as any;

  // ─── Mode (defaults to 'sos' if param absent or invalid) ───
  const mode: HubMode = isHubMode(params.mode) ? params.mode : 'sos';
  const copy = MODE_COPY[mode];

  // ─── Resolve the child from the URL id ───
  const child = useMemo(() => {
    if (!params.id || !Array.isArray(children)) return null;
    return children.find((c: any) => c?.id === params.id) ?? null;
  }, [params.id, children]);

  // ─── Keep activeChild in sync with the URL ───
  useEffect(() => {
    if (child && child.id !== activeChild?.id) {
      setActiveChild(child);
    }
  }, [child, activeChild, setActiveChild]);

  // ─── If child not found (stale URL, deleted child), bounce home ───
  useEffect(() => {
    if (Array.isArray(children) && children.length > 0 && !child && params.id) {
      router.replace('/(tabs)');
    }
  }, [children, child, params.id]);

  // ─── State: input ───
  const [situation, setSituation]       = useState('');
  const [intensity, setIntensity]       = useState<number | null>(null);
  const [loading, setLoading]           = useState(false);
  const [error, setError]               = useState('');
  const [crisisFlag, setCrisisFlag]     = useState(false);
  const [inputFocused, setInputFocused] = useState(false);

  // ─── State: saved scripts ───
  const [savedScripts, setSavedScripts] = useState<SavedScriptRow[]>([]);
  const [refreshing, setRefreshing]     = useState(false);

  // ─── Refs ───
  const crisisOpacity = useRef(new Animated.Value(0)).current;
  const timeoutRef    = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ─── Session timeout ───
  const resetTimeout = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (!session) return;
    timeoutRef.current = setTimeout(async () => {
      await signOut();
      router.replace('/welcome');
    }, TIMEOUT_MS);
  }, [session, signOut]);

  useEffect(() => {
    resetTimeout();
    return () => { if (timeoutRef.current) clearTimeout(timeoutRef.current); };
  }, [resetTimeout]);

  // ─── Load saved scripts for this child only ───
  const fetchSaved = useCallback(async () => {
    if (!child?.id) return;
    try {
      const all = await loadSavedScripts();
      setSavedScripts(all.filter((s) => s.child_profile_id === child.id));
    } catch {
      // Non-blocking — silently fall through with empty state
    }
  }, [child?.id]);

  useFocusEffect(
    useCallback(() => {
      fetchSaved();
    }, [fetchSaved])
  );

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    Haptics.selectionAsync();
    await fetchSaved();
    setRefreshing(false);
  }, [fetchSaved]);

  // ─── Input handlers ───
  const handleTextChange = (text: string) => {
    setSituation(text);
    if (error) setError('');
    resetTimeout();

    const crisisCheck = detectCrisis(text);
    if (crisisCheck.isCrisis !== crisisFlag) {
      setCrisisFlag(crisisCheck.isCrisis);
      Animated.timing(crisisOpacity, {
        toValue: crisisCheck.isCrisis ? 1 : 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  };

  const handleSelectIntensity = (level: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIntensity(intensity === level ? null : level);
    resetTimeout();
  };

  const handleGetScript = async () => {
    const msg = situation.trim();
    if (!msg || !child) return;

    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setError('');
    setLoading(true);
    resetTimeout();

    try {
      const script = await getParentingScript({
        childName: child.name || 'My child',
        childAge:  child.childAge ?? 4,
        message:   msg,
        userId:    session?.user?.id,
        // Intensity is only meaningful for SOS — buildPrompt ignores it
        // for the other modes anyway, but keep the request body clean.
        intensity: mode === 'sos' ? intensity : null,
        mode,
      } as any);

      navigation.push({
        pathname: '/result',
        params: {
          childId: child.id,
          situationSummary:   script.situation_summary,
          regulateAction:     script.regulate.parent_action,
          regulateScript:     script.regulate.script,
          regulateCoaching:   script.regulate.coaching ?? '',
          regulateStrategies: JSON.stringify(script.regulate.strategies ?? []),
          connectAction:      script.connect.parent_action,
          connectScript:      script.connect.script,
          connectCoaching:    script.connect.coaching ?? '',
          connectStrategies:  JSON.stringify(script.connect.strategies ?? []),
          guideAction:        script.guide.parent_action,
          guideScript:        script.guide.script,
          guideCoaching:      script.guide.coaching ?? '',
          guideStrategies:    JSON.stringify(script.guide.strategies ?? []),
          avoid:              JSON.stringify(script.avoid),
          childMessage:       msg,
          mode,
        },
      });

      // Clear local state so coming back to hub is fresh
      setSituation('');
      setIntensity(null);
    } catch (err) {
      if (err instanceof CrisisDetectedError) {
        router.push({
          pathname: '/crisis',
          params: { crisisType: err.crisisType, riskLevel: err.riskLevel },
        });
        return;
      }
      setError("Couldn't get a script right now. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleUnsafe = () => {
    router.push({
      pathname: '/crisis',
      params: { crisisType: 'manual', riskLevel: 'ELEVATED_RISK' },
    });
  };

  const handleBack = () => {
    Haptics.selectionAsync();
    router.back();
  };

  // ─── Helpers ───
  const initial = (child?.name?.trim()?.[0] ?? '?').toUpperCase();
  const canSubmit = situation.trim().length > 0 && !!child;
  const hasMultipleChildren = Array.isArray(children) && children.length > 1;

  const formatDate = (iso: string): string => {
    const d = new Date(iso);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const days = Math.floor(diff / 86400000);
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  // ─── Loading gate (child profile not yet resolved) ───
  if (!child) {
    return (
      <View style={s.root}>
        <StatusBar style="light" />
        <Image
          source={HORIZON_PHOTO}
          style={StyleSheet.absoluteFill}
          resizeMode="cover"
        />
        <LinearGradient
          colors={[
            'rgba(15,10,18,0.45)',
            'rgba(15,10,18,0.65)',
            'rgba(15,10,18,0.82)',
          ]}
          style={StyleSheet.absoluteFill}
        />
      </View>
    );
  }

  return (
    <View style={s.root}>
      <StatusBar style="light" />

      <Image
        source={HORIZON_PHOTO}
        style={StyleSheet.absoluteFill}
        resizeMode="cover"
      />
      <LinearGradient
        colors={[
          'rgba(15,10,18,0.45)',
          'rgba(15,10,18,0.65)',
          'rgba(15,10,18,0.82)',
        ]}
        style={StyleSheet.absoluteFill}
      />

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
            onScrollBeginDrag={resetTimeout}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                tintColor={C.rose}
              />
            }
          >
            {/* ─── Top bar ─── */}
            {hasMultipleChildren ? (
              <View style={s.topBar}>
                <Pressable onPress={handleBack} hitSlop={12} style={s.backBtn}>
                  <Text style={s.backText}>← Back</Text>
                </Pressable>
              </View>
            ) : <View style={{ height: 8 }} />}

            {/* ─── Child identity ─── */}
            <View style={s.identityWrap}>
              <View style={s.avatar}>
                <Text style={s.avatarText}>{initial}</Text>
              </View>
              <Text style={s.childName}>{child.name}</Text>
              <Text style={s.childAge}>Age {child.childAge}</Text>
            </View>

            {/* ─── Message input ─── */}
            <View style={[s.textareaCard, inputFocused && s.textareaFocused]}>
              <TextInput
                multiline
                numberOfLines={5}
                placeholder={copy.placeholder(child.name ?? 'them')}
                placeholderTextColor={C.textMuted}
                value={situation}
                onChangeText={handleTextChange}
                onFocus={() => setInputFocused(true)}
                onBlur={() => setInputFocused(false)}
                style={s.textarea}
                textAlignVertical="top"
              />
              <Text style={s.textareaHint}>{copy.hint}</Text>

              {/* Inline crisis banner */}
              <Animated.View style={[s.crisisBanner, { opacity: crisisOpacity }]}>
                <Pressable onPress={handleUnsafe} style={s.crisisBannerInner}>
                  <Text style={s.crisisIcon}>⚠️</Text>
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text style={s.crisisTitle}>This sounds serious</Text>
                    <Text style={s.crisisSub}>Tap here if you need immediate help →</Text>
                  </View>
                </Pressable>
              </Animated.View>
            </View>

            {/* ─── Intensity (SOS mode only) ─── */}
            {copy.showIntensity ? (
              <View style={s.intensitySection}>
                <View style={s.intensityHeader}>
                  <Text style={s.intensityLabel}>How intense?</Text>
                  <Text style={s.intensityOpt}>optional</Text>
                </View>
                <View style={s.intensityRow}>
                  {INTENSITY_OPTIONS.map((opt) => {
                    const sel = intensity === opt.level;
                    return (
                      <Pressable
                        key={opt.level}
                        onPress={() => handleSelectIntensity(opt.level)}
                        style={({ pressed }) => [
                          s.intensityPill,
                          sel && { backgroundColor: `${opt.color}18`, borderColor: `${opt.color}45` },
                          pressed && { opacity: 0.8 },
                        ]}
                      >
                        <Text style={[s.intensityPillText, sel && { color: opt.color }]}>
                          {opt.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            ) : null}

            {error ? <Text style={s.errorText}>{error}</Text> : null}

            {/* ─── CTA ─── */}
            <Pressable
              onPress={handleGetScript}
              disabled={!canSubmit || loading}
              style={({ pressed }) => [
                pressed && canSubmit && !loading && { opacity: 0.9, transform: [{ scale: 0.98 }] },
              ]}
            >
              <View style={[s.ctaBtn, (!canSubmit || loading) && s.ctaBtnDisabled]}>
                <Text style={[s.ctaLabel, (!canSubmit || loading) && { color: C.textMuted }]}>
                  {loading ? copy.ctaLoading : copy.cta}
                </Text>
              </View>
            </Pressable>

            {/* ─── Emergency link ─── */}
            <Pressable onPress={handleUnsafe} style={s.emergencyBtn}>
              <Text style={s.emergencyText}>
                This feels like an emergency → Get help now
              </Text>
            </Pressable>

            {/* ─── Saved scripts section ─── */}
            {savedScripts.length > 0 ? (
              <View style={s.savedSection}>
                <View style={s.sectionHeader}>
                  <Text style={s.sectionTitle}>Saved for {child.name}</Text>
                  <Pressable onPress={() => router.push('/saved')} hitSlop={10}>
                    <Text style={s.sectionLink}>See all →</Text>
                  </Pressable>
                </View>

                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={s.savedScroll}
                >
                  {savedScripts.slice(0, 5).map((item) => (
                    <Pressable
                      key={item.id}
                      onPress={() => router.push('/saved')}
                      style={({ pressed }) => [
                        s.savedCard,
                        pressed && { opacity: 0.92, transform: [{ scale: 0.99 }] },
                      ]}
                    >
                      <Text style={s.savedDate}>{formatDate(item.created_at)}</Text>
                      <Text style={s.savedTitle} numberOfLines={2}>
                        {item.title || 'Saved script'}
                      </Text>
                      {item.structured?.regulate?.script ? (
                        <Text style={s.savedPreview} numberOfLines={2}>
                          "{item.structured.regulate.script}"
                        </Text>
                      ) : null}
                    </Pressable>
                  ))}
                </ScrollView>
              </View>
            ) : null}

            {/* ─── Profile link (replaces static placeholder) ─── */}
            {/* Doubles as the discoverable entry to the Your Child profile
                screen (Feature 2) — patterns, what works, weekly insight. */}
            <Pressable
              onPress={() => router.push(`/child-profile/${child.id}` as any)}
              style={({ pressed }) => [
                s.insightsSection,
                pressed && { opacity: 0.92, transform: [{ scale: 0.99 }] },
              ]}
              accessibilityRole="button"
              accessibilityLabel={`Open ${child.name}'s profile`}
            >
              <View style={s.insightsRow}>
                <View style={{ flex: 1, gap: 4 }}>
                  <Text style={s.insightsTitle}>{child.name}'s profile</Text>
                  <Text style={s.insightsBody}>
                    Triggers, what works, and what Sturdy is noticing about {child.name}.
                  </Text>
                </View>
                <Text style={s.insightsArrow}>→</Text>
              </View>
            </Pressable>

            {/* ─── Edit profile link ─── */}
            <Pressable
              onPress={() => router.push(`/child/${child.id}?edit=1` as any)}
              style={s.editBtn}
            >
              <Text style={s.editText}>Edit {child.name}'s profile</Text>
            </Pressable>

            <View style={{ height: 40 }} />
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
  root: { flex: 1, backgroundColor: C.base },
  safe: { flex: 1 },
  scroll: { paddingHorizontal: 24, paddingBottom: 20, gap: 22 },

  // Blobs
  blob: { position: 'absolute', borderRadius: 999 },
  blob1: {
    top: -80, right: -60, width: 280, height: 280,
    backgroundColor: 'rgba(253, 221, 230, 0.55)',
  },
  blob2: {
    bottom: -60, left: -80, width: 240, height: 240,
    backgroundColor: 'rgba(212, 232, 209, 0.50)',
  },

  // Top bar
  topBar: { flexDirection: 'row', alignItems: 'center', paddingTop: 4, paddingBottom: 4 },
  backBtn: { paddingVertical: 6 },
  backText: { fontFamily: F.bodyMedium, fontSize: 15, color: C.textMuted },

  // Identity
  identityWrap: { alignItems: 'center', gap: 10, marginTop: 8 },
  avatar: {
    width: 88, height: 88, borderRadius: 44,
    backgroundColor: C.sage,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: C.sage,
    shadowOpacity: 0.25,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  avatarText: { fontFamily: F.heading, fontSize: 36, color: '#FFFFFF', letterSpacing: -0.5 },
  childName: { fontFamily: F.heading, fontSize: 28, color: '#FFFFFF', letterSpacing: -0.3, marginTop: 4 },
  childAge: { fontFamily: F.body, fontSize: 14, color: 'rgba(255,255,255,0.72)' },

  // Textarea
  textareaCard: {
    backgroundColor: C.cardGlass,
    borderWidth: 1, borderColor: C.border,
    borderRadius: 18, overflow: 'hidden',
  },
  textareaFocused: { borderColor: 'rgba(129,178,154,0.40)' },
  textarea: {
    padding: 16, fontFamily: F.body, fontSize: 16,
    color: C.text, lineHeight: 24, minHeight: 130,
  },
  textareaHint: {
    fontFamily: F.body, fontSize: 12,
    color: C.textMuted, fontStyle: 'italic',
    paddingHorizontal: 16, paddingBottom: 12,
  },

  // Crisis banner
  crisisBanner: {
    borderTopWidth: 1, borderTopColor: 'rgba(201,123,99,0.20)',
    backgroundColor: 'rgba(201,123,99,0.06)',
  },
  crisisBannerInner: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    padding: 12, paddingHorizontal: 16,
  },
  crisisIcon: { fontSize: 16 },
  crisisTitle: { fontFamily: F.bodySemi, fontSize: 13, color: C.rose },
  crisisSub: { fontFamily: F.body, fontSize: 11, color: C.textSub },

  // Intensity
  intensitySection: { gap: 10 },
  intensityHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  intensityLabel: { fontFamily: F.bodyMedium, fontSize: 14, color: C.text },
  intensityOpt: { fontFamily: F.body, fontSize: 12, color: C.textMuted, fontStyle: 'italic' },
  intensityRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  intensityPill: {
    flex: 1, minWidth: 60,
    paddingVertical: 10, paddingHorizontal: 8, borderRadius: 12,
    backgroundColor: C.cardGlass,
    borderWidth: 1, borderColor: C.border,
    alignItems: 'center', justifyContent: 'center',
  },
  intensityPillText: { fontFamily: F.bodyMedium, fontSize: 12, color: C.textSub },

  // Error
  errorText: { fontFamily: F.body, fontSize: 14, color: C.rose, textAlign: 'center' },

  // CTA
 ctaBtn: {
    backgroundColor: '#C8883A',
    shadowColor:     '#D4944A',
    shadowOffset:    { width: 0, height: 4 },
    shadowOpacity:   0.40,
    shadowRadius:    12,
    elevation:       8,
  },
  ctaBtnDisabled: { backgroundColor: 'rgba(0,0,0,0.06)' },
  ctaLabel: { fontFamily: F.subheading, fontSize: 17, color: '#FFFFFF', letterSpacing: 0.3 },

  emergencyBtn: { alignSelf: 'center', paddingVertical: 6 },
  emergencyText: { fontFamily: F.body, fontSize: 12, color: C.textMuted, textDecorationLine: 'underline' },

  // Saved scripts
  savedSection: { gap: 10, marginTop: 8 },
  sectionHeader: {
    flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between',
  },
  sectionTitle: { fontFamily: F.bodySemi, fontSize: 15, color: C.text },
  sectionLink: { fontFamily: F.bodyMedium, fontSize: 13, color: C.rose },

  savedScroll: { gap: 10, paddingRight: 4 },
  savedCard: {
    width: 220,
    padding: 14, gap: 6,
    borderRadius: 16,
    backgroundColor: C.cardGlass,
    borderWidth: 1, borderColor: C.border,
  },
  savedDate: { fontFamily: F.body, fontSize: 11, color: C.textMuted },
  savedTitle: { fontFamily: F.bodySemi, fontSize: 14, color: C.text, lineHeight: 20 },
  savedPreview: {
    fontFamily: F.scriptItalic, fontSize: 13, color: C.textBody, lineHeight: 19,
  },

  // Insights / profile-link card
  insightsSection: {
    padding: 16, gap: 6,
    borderRadius: 16,
    backgroundColor: 'rgba(129,178,154,0.08)',
    borderWidth: 1, borderColor: 'rgba(129,178,154,0.18)',
  },
  insightsRow:    { flexDirection: 'row', alignItems: 'center', gap: 12 },
  insightsTitle:  { fontFamily: F.bodySemi, fontSize: 14, color: C.sage },
  insightsBody:   { fontFamily: F.body, fontSize: 13, color: C.textBody, lineHeight: 20 },
  insightsArrow:  { fontFamily: F.bodySemi, fontSize: 18, color: C.sage },

  // Edit
  editBtn: { alignSelf: 'center', paddingVertical: 8 },
  editText: {
    fontFamily: F.bodyMedium, fontSize: 13, color: C.textMuted,
    textDecorationLine: 'underline',
  },
});
