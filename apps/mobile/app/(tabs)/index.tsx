// app/(tabs)/index.tsx
// v4 — New Home (Parent Hub) with Question mode
// - Rotating greeting (re-rolls each focus)
// - 0 children → empty state
// - 1 child → lite view: greeting + input + Open hub link
// - 2+ children → full selector + input
// - "What's on your mind?" input wired to getQuestionResponse
// - Skeleton-while-loading via navigation to /thought/[id]
// Journal identity: pastel gradient, frosted glass, rose accents.


import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Image,
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
import { getQuestionResponse, CrisisDetectedError } from '../../src/lib/api';
import { colors as C, fonts as F } from '../../src/theme';

const HORIZON_PHOTO = require('../../assets/images/welcome/welcome-horizon.jpg');

// ═══════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════

const GREETINGS = ['Hi', 'Hello', 'Hey', 'Welcome back', 'Good to see you'];

// Rotating color palette for child avatars
const CHILD_COLORS = [
  C.sage,
  C.rose,
  '#5778A3',
  '#F79566',
  '#C4A46C',
  '#8B7AA8',
];

 // ═══════════════════════════════════════════════
  // CHILD AUTO-DETECTION
  // Returns the child id if exactly ONE child name appears in the
  // message. Returns null otherwise (no match, multiple matches,
  // or empty input).
  // ═══════════════════════════════════════════════

  function detectChildFromMessage(
    message: string,
    children: Array<{ id: string; name?: string }>,
  ): string | null {
    if (!message || !Array.isArray(children) || children.length === 0) {
      return null;
    }

    const lower = message.toLowerCase();
    const matches: string[] = [];

    for (const child of children) {
      const name = (child?.name ?? '').trim().toLowerCase();
      if (!name || name.length < 2) continue;

      // Word-boundary match — name surrounded by non-letters or string edges
      const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const pattern = new RegExp(`(^|[^a-z])${escaped}([^a-z]|$)`, 'i');
      if (pattern.test(lower)) {
        matches.push(child.id);
      }
    }

    // Only return a single match — never guess if 2+ kids referenced
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

  // Question input state
  const [question, setQuestion]       = useState('');
  const [inputFocused, setInputFocused] = useState(false);
  const [sending, setSending]         = useState(false);
  const [error, setError]             = useState('');

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
      // Non-blocking — fall through to generic greeting
    }
  }, [session?.user?.id, session?.user?.email]);

  // ─── Re-roll greeting + refetch name on each focus ───
  useFocusEffect(
    useCallback(() => {
      setGreeting(GREETINGS[Math.floor(Math.random() * GREETINGS.length)]);
      fetchName();
    }, [fetchName])
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

      // Clear input before navigating so coming back to Home is fresh
      setQuestion('');

      // Navigate to thought screen — pass response inline as fallback if
      // thought_id is null (unauthenticated edge case)
      const responsePayload = (result as any).response ?? '';
      const thoughtId = (result as any).thought_id ?? null;

      if (thoughtId) {
        router.push({
          pathname: `/thought/${thoughtId}` as any,
          params: { fallbackResponse: responsePayload, prompt: msg },
        });
      } else {
        // No id — pass response inline. Result screen will use params.
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
      setError("Couldn't get a response right now. Please try again.");
    } finally {
      setSending(false);
    }
  };

  // ─── Helpers ───
  const displayName = firstName ?? 'there';
  const kidList = Array.isArray(children) ? children : [];
  const canSend = question.trim().length > 0 && !sending;
  const isSingleChild = kidList.length === 1;
  const isMultiChild = kidList.length > 1;
  const onlyChild = isSingleChild ? kidList[0] : null;


  // ─── Loading gate ───
  if (isLoadingChild) {
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
        <SafeAreaView style={s.centerGate}>
         <ActivityIndicator color={'#E8A855'} />
        </SafeAreaView>
      </View>
    );
  }

  // ─── Empty state: 0 children ───
  if (kidList.length === 0) {
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
          <View style={s.emptyWrap}>
            <Text style={s.greeting}>{greeting}, {displayName}.</Text>
            <Text style={s.emptyTitle}>Let's add your first child.</Text>
            <Text style={s.emptyBody}>
              Sturdy tailors every response to your child's age and world. Start by telling us a little about them.
            </Text>
            <Pressable
              onPress={handleAddChild}
              style={({ pressed }) => [pressed && { opacity: 0.9 }]}
            >
              <View style={s.primaryBtn}>
                <Text style={s.primaryBtnText}>Add a child</Text>
              </View>
            </Pressable>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  // ─── 1 or more children: question input is always visible ───
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
          >
            {/* ─── Greeting ─── */}
            <View style={s.greetingWrap}>
              <Text style={s.greeting}>{greeting}, {displayName}.</Text>
              <Text style={s.subGreeting}>What's on your mind?</Text>
            </View>

            {/* ─── Question input ─── */}
            <View style={[s.textareaCard, inputFocused && s.textareaFocused]}>
              <TextInput
                multiline
                numberOfLines={4}
                placeholder="Ask anything about your child — sleep, behavior, big feelings, hard conversations…"
                placeholderTextColor={C.textMuted}
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
                pressed && canSend && { opacity: 0.9, transform: [{ scale: 0.98 }] },
              ]}
            >
              <View style={[s.sendBtn, !canSend && s.sendBtnDisabled]}>
                <Text style={[s.sendBtnText, !canSend && { color: C.textMuted }]}>
                  {sending ? 'Asking Sturdy…' : 'Ask Sturdy'}
                </Text>
              </View>
            </Pressable>

            {/* ─── 1 child: lite view shows quick link to their hub ─── */}
            {isSingleChild && onlyChild ? (
              <Pressable
                onPress={() => handleOpenChild(onlyChild.id)}
                style={({ pressed }) => [
                  s.singleChildCard,
                  pressed && { opacity: 0.92, transform: [{ scale: 0.99 }] },
                ]}
              >
                <View style={[s.singleChildAvatar, { backgroundColor: CHILD_COLORS[0] }]}>
                  <Text style={s.singleChildAvatarText}>
                    {(onlyChild.name?.trim()?.[0] ?? '?').toUpperCase()}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.singleChildName}>Open {onlyChild.name}'s hub</Text>
                  <Text style={s.singleChildSub}>Saved scripts, history, and SOS</Text>
                </View>
                <Text style={s.singleChildArrow}>→</Text>
              </Pressable>
            ) : null}

            {/* ─── 2+ children: child selector ─── */}
            {isMultiChild ? (
              <View style={s.selectorWrap}>
                <Text style={s.selectorLabel}>Or open a child's hub</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={s.childRow}
                >
                  {kidList.map((kid: any, index: number) => {
                    const color = CHILD_COLORS[index % CHILD_COLORS.length];
                    const initial = (kid?.name?.trim()?.[0] ?? '?').toUpperCase();
                    return (
                      <Pressable
                        key={kid.id}
                        onPress={() => handleOpenChild(kid.id)}
                        style={({ pressed }) => [
                          s.childCard,
                          pressed && { opacity: 0.92, transform: [{ scale: 0.98 }] },
                        ]}
                      >
                        <View style={[s.childAvatar, { backgroundColor: color, shadowColor: color }]}>
                          <Text style={s.childAvatarText}>{initial}</Text>
                        </View>
                        <Text style={s.childCardName} numberOfLines={1}>{kid.name}</Text>
                        <Text style={s.childCardAge}>Age {kid.childAge}</Text>
                      </Pressable>
                    );
                  })}

                  {/* Add child card */}
                  <Pressable
                    onPress={handleAddChild}
                    style={({ pressed }) => [
                      s.addCard,
                      pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] },
                    ]}
                  >
                    <View style={s.addAvatar}>
                      <Text style={s.addAvatarText}>+</Text>
                    </View>
                    <Text style={s.addCardText}>Add child</Text>
                  </Pressable>
                </ScrollView>
              </View>
            ) : null}

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
  scroll: { paddingHorizontal: 24, paddingTop: 16, paddingBottom: 20, gap: 22 },

  centerGate: { flex: 1, alignItems: 'center', justifyContent: 'center' },

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

  // Greeting
  greetingWrap: { gap: 6, marginTop: 8 },
  greeting: {
    fontFamily: F.heading, fontSize: 32, color: '#FFFFFF',
    letterSpacing: -0.5, lineHeight: 38,
  },
  subGreeting: {
    fontFamily: F.body, fontSize: 16, color: 'rgba(255,255,255,0.78)', lineHeight: 22,
  },

  // Question input
  textareaCard: {
    backgroundColor: C.cardGlass,
    borderWidth: 1, borderColor: C.border,
    borderRadius: 18, overflow: 'hidden',
  },
  textareaFocused: { borderColor: 'rgba(129,178,154,0.40)' },
  textarea: {
    padding: 16,
    fontFamily: F.body, fontSize: 16,
    color: C.text, lineHeight: 24, minHeight: 110,
  },

  errorText: {
    fontFamily: F.body, fontSize: 14, color: C.rose, textAlign: 'center',
  },

  // Send button
 sendBtn: {
    backgroundColor: '#C8883A',
    shadowColor:     '#D4944A',
    shadowOffset:    { width: 0, height: 4 },
    shadowOpacity:   0.40,
    shadowRadius:    12,
    elevation:       8,
  },

  sendBtnDisabled: { backgroundColor: 'rgba(0,0,0,0.06)' },
  sendBtnText: {
    fontFamily: F.subheading, fontSize: 17, color: '#FFFFFF', letterSpacing: 0.3,
  },

  // Single-child lite link card
  singleChildCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 16,
    borderRadius: 18,
    backgroundColor: C.cardGlass,
    borderWidth: 1, borderColor: C.border,
  },
  singleChildAvatar: {
    width: 48, height: 48, borderRadius: 24,
    alignItems: 'center', justifyContent: 'center',
  },
  singleChildAvatarText: {
    fontFamily: F.heading, fontSize: 20, color: '#FFFFFF', letterSpacing: -0.3,
  },
  singleChildName: {
    fontFamily: F.bodySemi, fontSize: 15, color: C.text,
  },
  singleChildSub: {
    fontFamily: F.body, fontSize: 13, color: C.textSub,
  },
  singleChildArrow: {
    fontFamily: F.bodySemi, fontSize: 20, color: C.rose,
  },

  // Multi-child selector
  selectorWrap: { gap: 10 },
  selectorLabel: {
    fontFamily: F.bodyMedium, fontSize: 13, color: C.textMuted, letterSpacing: 0.3,
  },
  childRow: { gap: 12, paddingRight: 8 },
  childCard: {
    width: 130,
    padding: 16, gap: 8,
    alignItems: 'center', justifyContent: 'center',
    borderRadius: 18,
    backgroundColor: C.cardGlass,
    borderWidth: 1, borderColor: C.border,
  },
  childAvatar: {
    width: 56, height: 56, borderRadius: 28,
    alignItems: 'center', justifyContent: 'center',
    shadowOpacity: 0.25, shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 }, elevation: 3,
  },
  childAvatarText: {
    fontFamily: F.heading, fontSize: 24, color: '#FFFFFF', letterSpacing: -0.3,
  },
  childCardName: {
    fontFamily: F.bodySemi, fontSize: 14, color: C.text, textAlign: 'center',
  },
  childCardAge: {
    fontFamily: F.body, fontSize: 12, color: C.textSub,
  },

  // Add card
  addCard: {
    width: 130,
    padding: 16, gap: 8,
    alignItems: 'center', justifyContent: 'center',
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.02)',
    borderWidth: 1, borderColor: C.border,
    borderStyle: 'dashed',
  },
  addAvatar: {
    width: 56, height: 56, borderRadius: 28,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.04)',
  },
  addAvatarText: {
    fontFamily: F.heading, fontSize: 28, color: C.textMuted,
  },
  addCardText: {
    fontFamily: F.bodyMedium, fontSize: 13, color: C.textMuted,
  },

  // Empty state (0 children)
  emptyWrap: {
    flex: 1, paddingHorizontal: 8, gap: 14,
    justifyContent: 'center',
  },
  emptyTitle: {
    fontFamily: F.heading, fontSize: 24, color: C.text, letterSpacing: -0.3,
  },
  emptyBody: {
    fontFamily: F.body, fontSize: 14, color: C.textSub, lineHeight: 21,
    marginBottom: 8,
  },
  primaryBtn: {
    borderRadius: 18, minHeight: 54, alignSelf: 'flex-start',
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: C.rose,
    paddingHorizontal: 28,
  },
  primaryBtnText: {
    fontFamily: F.subheading, fontSize: 16, color: '#FFFFFF', letterSpacing: 0.3,
  },
});
