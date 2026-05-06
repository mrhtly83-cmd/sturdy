// app/(tabs)/index.tsx
// v5 — Deep Warm v5.2 home (Parent Hub)
//
// Visual identity:
//   - C-2 fast-fade gradient (warm parchment top → near-black bottom)
//   - Greeting in dark text (sits on warm zone)
//   - Dark glass cards (3D floating: transparent fill + bright top edge + strong shadow)
//   - Icon-badge outcome grid: 46x46 gradient square + title/subtitle, horizontal layout
//   - Amber CTA + amber empty-state button (no more pink)
//
// Behavior preserved verbatim from v4:
//   - Rotating greeting (re-rolls each focus)
//   - 0 children → empty state with "Add a child" CTA (no auto-redirect)
//   - 1 child → lite view: greeting + input + Open hub link
//   - 2+ children → full selector + outcome → child picker modal
//   - "What's on your mind?" input wired to getQuestionResponse
//   - detectChildFromMessage scans the message for an exact name match

import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
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

// Rotating gradient pairs for child avatars (Deep Warm icon palette).
const CHILD_GRADIENTS: Array<[string, string]> = [
  [C.iconTalkStart,       C.iconTalkEnd],        // sage
  [C.iconSosStart,        C.iconSosEnd],         // coral
  [C.iconUnderstandStart, C.iconUnderstandEnd],  // steel
  [C.iconRepairStart,     C.iconRepairEnd],      // amber
];

// ═══════════════════════════════════════════════
// OUTCOME MODES
// 4 internal modes, surfaced as icon-badge cards below the Question input.
// Routes to /child/[id]?mode=<key>; the per-child hub reads the mode
// param and adapts its prompt + UI.
// ═══════════════════════════════════════════════

type OutcomeMode = 'sos' | 'reconnect' | 'understand' | 'conversation';

type Outcome = {
  mode:           OutcomeMode;
  emoji:          string;
  title:          string;
  subtitle:       string;
  iconGradient:   [string, string];
};

const OUTCOMES: Outcome[] = [
  { mode: 'sos',          emoji: '🆘', title: 'Right now',   subtitle: "They're melting down",   iconGradient: [C.iconSosStart,        C.iconSosEnd] },
  { mode: 'reconnect',    emoji: '🤝', title: 'Repair',      subtitle: 'After it went sideways', iconGradient: [C.iconRepairStart,     C.iconRepairEnd] },
  { mode: 'understand',   emoji: '💡', title: 'Understand',  subtitle: 'Why do they do this?',   iconGradient: [C.iconUnderstandStart, C.iconUnderstandEnd] },
  { mode: 'conversation', emoji: '💬', title: 'Plan a talk', subtitle: 'A hard conversation',    iconGradient: [C.iconTalkStart,       C.iconTalkEnd] },
];

// ═══════════════════════════════════════════════
// CHILD AUTO-DETECTION
// Returns a child id if exactly ONE child name appears in the message.
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
  const [greeting, setGreeting]   = useState<string>(GREETINGS[0]);

  const [question, setQuestion]         = useState('');
  const [inputFocused, setInputFocused] = useState(false);
  const [sending, setSending]           = useState(false);
  const [error, setError]               = useState('');

  const [pickerMode, setPickerMode] = useState<OutcomeMode | null>(null);

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
        if (first) {
          setFirstName(first);
          return;
        }
      }

      const email = session.user.email ?? '';
      const local = email.split('@')[0] ?? '';
      const cleaned = local.split(/[._+-]/)[0] ?? '';
      if (cleaned) {
        setFirstName(cleaned.charAt(0).toUpperCase() + cleaned.slice(1));
      }
    } catch {
      // non-blocking
    }
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
    if (kidList.length === 0) {
      router.push('/child/new');
      return;
    }
    if (kidList.length === 1) {
      const onlyKid = kidList[0];
      router.push({ pathname: `/child/${onlyKid.id}` as any, params: { mode } });
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
        userId:  session?.user?.id,
        childName: null,
        childAge:  null,
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
      if (err instanceof RateLimitError) {
        setError(err.message);
        return;
      }
      setError("Couldn't get a response right now. Please try again.");
    } finally {
      setSending(false);
    }
  };

  // ─── Helpers ───
  const displayName  = firstName ?? 'there';
  const kidList      = Array.isArray(children) ? children : [];
  const canSend      = question.trim().length > 0 && !sending;
  const isSingleChild = kidList.length === 1;
  const isMultiChild  = kidList.length > 1;
  const onlyChild     = isSingleChild ? kidList[0] : null;

  // ─── Shared background — single C-2 gradient (no photos) ───
  const Background = () => (
    <>
      <LinearGradient
        colors={[
          C.gradientTop,
          C.gradientMid1,
          C.gradientMid2,
          C.gradientMid3,
          C.gradientMid4,
          C.gradientBottom,
        ]}
        locations={[0, 0.14, 0.28, 0.42, 0.58, 1]}
        style={StyleSheet.absoluteFill}
      />
      {/* Atmospheric amber glow behind the greeting zone */}
      <View pointerEvents="none" style={s.amberGlow} />
    </>
  );

  // ─── Loading gate ───
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

  // ─── Empty state: 0 children ───
  if (kidList.length === 0) {
    return (
      <View style={s.root}>
        <StatusBar style="light" />
        <Background />
        <SafeAreaView style={s.safe} edges={['top']}>
          <View style={s.emptyWrap}>
            <Text style={s.greeting}>{greeting}, {displayName}.</Text>
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

  // ─── 1 or more children ───
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
            {/* ─── Greeting ─── */}
            <View style={s.greetingWrap}>
              <Text style={s.greeting}>{greeting}, {displayName}.</Text>
              <Text style={s.subGreeting}>What's happening right now?</Text>
            </View>

            {/* ─── Question input ─── */}
            <View style={[s.textareaCard, inputFocused && s.textareaFocused]}>
              <TextInput
                multiline
                numberOfLines={4}
                placeholder="Ask anything about your child — sleep, behavior, big feelings, hard conversations…"
                placeholderTextColor={C.inputPlaceholder}
                value={question}
                onChangeText={(t) => { setQuestion(t); if (error) setError(''); }}
                onFocus={() => setInputFocused(true)}
                onBlur={() => setInputFocused(false)}
                style={s.textarea}
                textAlignVertical="top"
                editable={!sending}
              />
            </View>

            {error ? <Text style={s.errorText}>{error}</Text> : null}

            {/* ─── Send button ─── */}
            <Pressable
              onPress={handleSend}
              disabled={!canSend}
              style={({ pressed }) => [
                pressed && canSend && { opacity: 0.92, transform: [{ scale: 0.98 }] },
              ]}
            >
              {canSend ? (
                <LinearGradient
                  colors={[C.amber, C.amberMid]}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                  style={s.sendBtn}
                >
                  <Text style={s.sendBtnText}>{sending ? 'Asking Sturdy…' : 'Ask Sturdy'}</Text>
                </LinearGradient>
              ) : (
                <View style={[s.sendBtn, s.sendBtnDisabled]}>
                  <Text style={[s.sendBtnText, { color: C.textMuted }]}>
                    {sending ? 'Asking Sturdy…' : 'Ask Sturdy'}
                  </Text>
                </View>
              )}
            </Pressable>

            {/* ─── Outcome icon-badge grid ─── */}
            <View style={s.outcomeWrap}>
              <Text style={s.outcomeLabel}>Or pick a mode</Text>
              <View style={s.outcomeGrid}>
                {OUTCOMES.map((o) => (
                  <Pressable
                    key={o.mode}
                    onPress={() => handleSelectOutcome(o.mode)}
                    style={({ pressed }) => [
                      s.outcomeCard,
                      pressed && { opacity: 0.92, transform: [{ scale: 0.98 }] },
                    ]}
                    accessibilityRole="button"
                    accessibilityLabel={`${o.title} — ${o.subtitle}`}
                  >
                    <LinearGradient
                      colors={o.iconGradient}
                      start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                      style={s.outcomeIcon}
                    >
                      <Text style={s.outcomeIconText}>{o.emoji}</Text>
                    </LinearGradient>
                    <View style={s.outcomeTextWrap}>
                      <Text style={s.outcomeTitle} numberOfLines={1}>{o.title}</Text>
                      <Text style={s.outcomeSubtitle} numberOfLines={1}>{o.subtitle}</Text>
                    </View>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* ─── 1 child: lite view ─── */}
            {isSingleChild && onlyChild ? (
              <View style={s.childrenSection}>
                <Text style={s.childrenLabel}>YOUR CHILDREN</Text>
                <Pressable
                  onPress={() => handleOpenChild(onlyChild.id)}
                  style={({ pressed }) => [
                    s.childRow,
                    pressed && { opacity: 0.92 },
                  ]}
                >
                  <LinearGradient
                    colors={CHILD_GRADIENTS[0]}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                    style={s.childAvatar}
                  >
                    <Text style={s.childAvatarText}>
                      {(onlyChild.name?.trim()?.[0] ?? '?').toUpperCase()}
                    </Text>
                  </LinearGradient>
                  <View style={{ flex: 1 }}>
                    <Text style={s.childName}>{onlyChild.name}</Text>
                    <Text style={s.childAge}>Age {onlyChild.childAge}</Text>
                  </View>
                  <Text style={s.chevron}>›</Text>
                </Pressable>
                <Pressable
                  onPress={handleAddChild}
                  style={({ pressed }) => [s.addRow, pressed && { opacity: 0.7 }]}
                  accessibilityRole="button"
                  accessibilityLabel="Add another child"
                >
                  <Text style={s.addRowText}>+ Add another child</Text>
                </Pressable>
              </View>
            ) : null}

            {/* ─── 2+ children: list inside section card ─── */}
            {isMultiChild ? (
              <View style={s.childrenSection}>
                <Text style={s.childrenLabel}>YOUR CHILDREN</Text>
                {kidList.map((kid: any, index: number) => {
                  const grad = CHILD_GRADIENTS[index % CHILD_GRADIENTS.length];
                  const initial = (kid?.name?.trim()?.[0] ?? '?').toUpperCase();
                  return (
                    <Pressable
                      key={kid.id}
                      onPress={() => handleOpenChild(kid.id)}
                      style={({ pressed }) => [s.childRow, pressed && { opacity: 0.92 }]}
                    >
                      <LinearGradient
                        colors={grad}
                        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                        style={s.childAvatar}
                      >
                        <Text style={s.childAvatarText}>{initial}</Text>
                      </LinearGradient>
                      <View style={{ flex: 1 }}>
                        <Text style={s.childName}>{kid.name}</Text>
                        <Text style={s.childAge}>Age {kid.childAge}</Text>
                      </View>
                      <Text style={s.chevron}>›</Text>
                    </Pressable>
                  );
                })}
                <Pressable
                  onPress={handleAddChild}
                  style={({ pressed }) => [s.addRow, pressed && { opacity: 0.7 }]}
                  accessibilityRole="button"
                  accessibilityLabel="Add another child"
                >
                  <Text style={s.addRowText}>+ Add another child</Text>
                </Pressable>
              </View>
            ) : null}

            <View style={{ height: 40 }} />
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>

      {/* ─── Outcome → multi-child picker modal ─── */}
      <Modal
        visible={pickerMode !== null}
        animationType="fade"
        transparent
        onRequestClose={handlePickerCancel}
      >
        <Pressable style={s.pickerBackdrop} onPress={handlePickerCancel}>
          <Pressable style={s.pickerSheet} onPress={() => {}}>
            <Text style={s.pickerTitle}>Which child?</Text>
            <Text style={s.pickerSub}>
              {pickerMode ? OUTCOMES.find((o) => o.mode === pickerMode)?.subtitle : ''}
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
// STYLES
// ═══════════════════════════════════════════════

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.background },
  safe: { flex: 1 },
  scroll: { paddingHorizontal: 24, paddingTop: 16, paddingBottom: 20, gap: 22 },

  centerGate: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  // Atmospheric amber glow behind the greeting zone (warm-zone tint)
  amberGlow: {
    position:        'absolute',
    top:             -120,
    left:            -80,
    right:           -80,
    height:          340,
    backgroundColor: C.amberGlow,
    opacity:         0.7,
    borderRadius:    200,
  },

  // ─── Greeting (sits on warm-parchment top zone — uses dark text) ───
  greetingWrap: { gap: 6, marginTop: 8 },
  greeting: {
    fontFamily:    F.heading,
    fontSize:      32,
    color:         C.text,
    letterSpacing: -0.5,
    lineHeight:    38,
  },
  subGreeting: {
    fontFamily: F.body,
    fontSize:   16,
    color:      'rgba(232,116,97,0.90)',
    lineHeight: 22,
  },

  // ─── Question input ───
  textareaCard: {
    backgroundColor: C.inputBg,
    borderRadius:    18,
    overflow:        'hidden',
    borderWidth:     1,
    borderColor:     C.inputBorder,
    borderTopWidth:  1,
    borderTopColor:  C.inputHighlight,
  },
  textareaFocused: { borderColor: C.borderFocus },
  textarea: {
    padding:    16,
    fontFamily: F.body,
    fontSize:   16,
    color:      C.text,
    lineHeight: 24,
    minHeight:  110,
  },

  errorText: {
    fontFamily: F.body, fontSize: 14, color: C.sos, textAlign: 'center',
  },

  // ─── Send button ───
  sendBtn: {
    minHeight:       54,
    borderRadius:    18,
    alignItems:      'center',
    justifyContent:  'center',
    shadowColor:     C.amber,
    shadowOffset:    { width: 0, height: 6 },
    shadowOpacity:   0.35,
    shadowRadius:    20,
    elevation:       4,
  },
  sendBtnDisabled: {
    backgroundColor: 'rgba(26,24,22,0.45)',
    shadowOpacity:   0,
    elevation:       0,
  },
  sendBtnText: {
    fontFamily: F.subheading, fontSize: 17, color: '#FFFFFF', letterSpacing: 0.3,
  },

  // ─── Outcome icon-badge grid ───
  outcomeWrap: { gap: 10 },
  outcomeLabel: {
    fontFamily:    F.bodyMedium,
    fontSize:      11,
    color:         C.textMuted,
    letterSpacing: 1.0,
    textTransform: 'uppercase',
  },
  outcomeGrid: {
    flexDirection: 'row',
    flexWrap:      'wrap',
    gap:           12,
  },
  outcomeCard: {
    flexBasis:       '47%',
    flexGrow:        1,
    flexDirection:   'row',
    alignItems:      'center',
    gap:             12,
    padding:         12,
    borderRadius:    18,
    backgroundColor: 'rgba(26,24,22,0.75)',
    borderWidth:     1,
    borderColor:     C.border,
    borderTopWidth:  1,
    borderTopColor:  C.borderHi,
    shadowColor:     '#000000',
    shadowOffset:    { width: 0, height: 6 },
    shadowOpacity:   0.35,
    shadowRadius:    20,
    elevation:       4,
  },
  outcomeIcon: {
    width:          46,
    height:         46,
    borderRadius:   14,
    alignItems:     'center',
    justifyContent: 'center',
  },
  outcomeIconText: { fontSize: 22 },
  outcomeTextWrap: { flex: 1 },
  outcomeTitle: {
    fontFamily: F.bodySemi, fontSize: 14, color: C.text, letterSpacing: -0.1,
  },
  outcomeSubtitle: {
    fontFamily: F.body, fontSize: 11, color: C.textSecondary, marginTop: 1,
  },

  // ─── Children section card ───
  childrenSection: {
    backgroundColor: 'rgba(26,24,22,0.75)',
    borderRadius:    18,
    borderWidth:     1,
    borderColor:     C.border,
    borderTopWidth:  1,
    borderTopColor:  C.borderHi,
    padding:         18,
    gap:             10,
    shadowColor:     '#000000',
    shadowOffset:    { width: 0, height: 6 },
    shadowOpacity:   0.35,
    shadowRadius:    20,
    elevation:       4,
  },
  childrenLabel: {
    fontFamily:    F.label,
    fontSize:      10,
    color:         C.textMuted,
    letterSpacing: 1.2,
    marginBottom:  4,
  },
  childRow: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           14,
    paddingVertical: 4,
  },
  childAvatar: {
    width:          44,
    height:         44,
    borderRadius:   22,
    alignItems:     'center',
    justifyContent: 'center',
  },
  childAvatarText: {
    fontFamily: F.heading, fontSize: 18, color: '#FFFFFF', letterSpacing: -0.3,
  },
  childName:  { fontFamily: F.bodySemi, fontSize: 16, color: C.text },
  childAge:   { fontFamily: F.body,     fontSize: 13, color: C.textSecondary, marginTop: 1 },
  chevron:    { fontFamily: F.heading,  fontSize: 22, color: C.textMuted },

  addRow: {
    paddingVertical: 8,
    alignItems:      'flex-start',
  },
  addRowText: {
    fontFamily: F.bodyMedium, fontSize: 13, color: C.amberLight, letterSpacing: 0.3,
  },

  // ─── Empty state (0 children) ───
  emptyWrap: {
    flex: 1, paddingHorizontal: 24, gap: 14,
    justifyContent: 'center',
  },
  emptyTitle: {
    fontFamily: F.heading, fontSize: 26, color: C.text, letterSpacing: -0.3,
  },
  emptyBody: {
    fontFamily: F.body, fontSize: 15, color: C.textSecondary, lineHeight: 22,
    marginBottom: 8,
  },
  primaryBtn: {
    borderRadius:    18,
    minHeight:       54,
    alignSelf:       'flex-start',
    alignItems:      'center',
    justifyContent:  'center',
    paddingHorizontal: 32,
    shadowColor:     C.amber,
    shadowOffset:    { width: 0, height: 6 },
    shadowOpacity:   0.35,
    shadowRadius:    20,
    elevation:       4,
  },
  primaryBtnText: {
    fontFamily: F.subheading, fontSize: 16, color: '#FFFFFF', letterSpacing: 0.3,
  },

  // ─── Picker modal ───
  pickerBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent:  'flex-end',
  },
  pickerSheet: {
    backgroundColor:     'rgba(26,24,22,0.98)',
    borderTopLeftRadius:  24,
    borderTopRightRadius: 24,
    padding:              24,
    paddingBottom:        36,
    gap:                  16,
    borderTopWidth:       1,
    borderTopColor:       C.borderHi,
  },
  pickerTitle: {
    fontFamily: F.heading, fontSize: 22, color: C.text, letterSpacing: -0.3,
  },
  pickerSub: {
    fontFamily: F.body, fontSize: 14, color: C.textSecondary,
  },
  pickerRow: {
    flexDirection: 'row',
    flexWrap:      'wrap',
    gap:           12,
    paddingTop:    4,
  },
  pickerChild: {
    width:           96,
    padding:         12,
    gap:             6,
    alignItems:      'center',
    justifyContent:  'center',
    borderRadius:    16,
    backgroundColor: 'rgba(26,24,22,0.75)',
    borderWidth:     1,
    borderColor:     C.border,
    borderTopWidth:  1,
    borderTopColor:  C.borderHi,
  },
  pickerAvatar: {
    width:          48,
    height:         48,
    borderRadius:   24,
    alignItems:     'center',
    justifyContent: 'center',
  },
  pickerAvatarText: {
    fontFamily: F.heading, fontSize: 20, color: '#FFFFFF', letterSpacing: -0.3,
  },
  pickerChildName: {
    fontFamily: F.bodySemi, fontSize: 13, color: C.text, textAlign: 'center',
  },
  pickerChildAge: {
    fontFamily: F.body, fontSize: 11, color: C.textSecondary,
  },
  pickerCancel: {
    paddingVertical: 12, alignItems: 'center',
  },
  pickerCancelText: {
    fontFamily: F.bodyMedium, fontSize: 15, color: C.textMuted,
  },
});
