// app/thought/[id].tsx
// v1 — Question mode result screen.
// Loads a parent_thoughts row by id from Supabase, shows skeleton
// while loading, then renders the response in flowing prose.
// Actions: Pin (toggle), Delete, Ask another (back to Home).
// Special case: id === 'inline' means use params.fallbackResponse
// (covers unauthenticated edge case where backend returned null id).
//
// Journal identity: pastel gradient, frosted glass, rose accents.

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';

import { useAuth } from '../../src/context/AuthContext';
  import { useChildProfile } from '../../src/context/ChildProfileContext';
  import { supabase } from '../../src/lib/supabase';
  import { colors as C, fonts as F } from '../../src/theme';


// ═══════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════

type ThoughtRow = {
  id:               string;
  prompt_text:      string;
  response_text:    string;
  child_profile_id: string | null;
  pinned_at:        string | null;
  created_at:       string;
};


// ═══════════════════════════════════════════════
// SCREEN
// ═══════════════════════════════════════════════

export default function ThoughtScreen() {
  const { session } = useAuth();
    const { children } = useChildProfile() as any;
  const params = useLocalSearchParams<{
    id?:               string;
    fallbackResponse?: string;
    prompt?:           string;
  }>();

  const isInline = params.id === 'inline';

  const [thought, setThought]     = useState<ThoughtRow | null>(null);
  const [loading, setLoading]     = useState(!isInline);
  const [error, setError]         = useState('');
  const [pinning, setPinning]     = useState(false);
  const [deleting, setDeleting]   = useState(false);

  const skeletonOpacity = useRef(new Animated.Value(0.4)).current;

  // ─── Skeleton pulse animation ───
  useEffect(() => {
    if (!loading) return;
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(skeletonOpacity, { toValue: 0.8, duration: 800, useNativeDriver: true }),
        Animated.timing(skeletonOpacity, { toValue: 0.4, duration: 800, useNativeDriver: true }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [loading, skeletonOpacity]);

  // ─── Fetch the thought by id ───
  const fetchThought = useCallback(async () => {
    if (isInline) return; // Inline mode uses params, no DB fetch

    const id = typeof params.id === 'string' ? params.id : null;
    if (!id || !session?.user?.id) {
      setError("Couldn't load this thought.");
      setLoading(false);
      return;
    }

    try {
      const { data, error: dbError } = await supabase
        .from('parent_thoughts')
        .select('id, prompt_text, response_text, child_profile_id, pinned_at, created_at')
        .eq('id', id)
        .eq('user_id', session.user.id)
        .single();

      if (dbError || !data) {
        setError("This thought couldn't be found.");
      } else {
        setThought(data as ThoughtRow);
      }
    } catch {
      setError("Something went wrong loading this thought.");
    } finally {
      setLoading(false);
    }
  }, [params.id, session?.user?.id, isInline]);

  useEffect(() => {
    fetchThought();
  }, [fetchThought]);

  // ─── Resolve display values (DB or fallback params) ───
  const displayPrompt = isInline
    ? (typeof params.prompt === 'string' ? params.prompt : '')
    : (thought?.prompt_text ?? '');

  const displayResponse = isInline
    ? (typeof params.fallbackResponse === 'string' ? params.fallbackResponse : '')
    : (thought?.response_text ?? '');

  const isPinned = !!thought?.pinned_at;

    // Look up the matched child's name (if this thought was tied to one)
    const matchedChildName = useMemo(() => {
      const childId = thought?.child_profile_id;
      if (!childId || !Array.isArray(children)) return null;
      const match = children.find((c: any) => c?.id === childId);
      return match?.name?.trim() ?? null;
    }, [thought?.child_profile_id, children]);
 
    // ─── Format the response into paragraphs ───
  const paragraphs = useMemo(() => {
    return displayResponse
      .split(/\n\n+/)
      .map((p) => p.trim())
      .filter((p) => p.length > 0);
  }, [displayResponse]);

  // ─── Handlers ───
  const handleBack = () => {
    Haptics.selectionAsync();
    router.replace('/(tabs)');
  };

  const handleAskAnother = () => {
    Haptics.selectionAsync();
    router.replace('/(tabs)');
  };

  const handlePin = async () => {
    if (!thought || pinning || isInline) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setPinning(true);

    try {
      const newPinnedAt = isPinned ? null : new Date().toISOString();
      const { error: dbError } = await supabase
        .from('parent_thoughts')
        .update({ pinned_at: newPinnedAt })
        .eq('id', thought.id)
        .eq('user_id', session!.user.id);

      if (!dbError) {
        setThought({ ...thought, pinned_at: newPinnedAt });
      }
    } catch {
      // Silent fail — non-critical
    } finally {
      setPinning(false);
    }
  };

  const handleDelete = () => {
    if (!thought || deleting || isInline) return;

    Alert.alert(
      'Delete this thought?',
      'This will remove it from your history.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            setDeleting(true);
            try {
              await supabase
                .from('parent_thoughts')
                .delete()
                .eq('id', thought.id)
                .eq('user_id', session!.user.id);
              router.replace('/(tabs)');
            } catch {
              setDeleting(false);
            }
          },
        },
      ]
    );
  };

  // ═══════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════

  return (
    <View style={s.root}>
      <StatusBar style="dark" />

      <LinearGradient
        colors={[C.gradStart, C.gradMid1, C.gradMid2, C.gradEnd]}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      <View style={[s.blob, s.blob1]} />
      <View style={[s.blob, s.blob2]} />

      <SafeAreaView style={s.safe} edges={['top']}>
        <ScrollView
          contentContainerStyle={s.scroll}
          showsVerticalScrollIndicator={false}
        >
          {/* ─── Top bar ─── */}
          <View style={s.topBar}>
            <Pressable onPress={handleBack} hitSlop={12} style={s.backBtn}>
              <Text style={s.backText}>← Home</Text>
            </Pressable>
          </View>

          {/* ─── Original question (small, muted) ─── */}
          {displayPrompt ? (
            <View style={s.promptWrap}>
              <Text style={s.promptLabel}>You asked</Text>
              <Text style={s.promptText} numberOfLines={3}>
                {displayPrompt}
              </Text>
              {matchedChildName ? (
                <Text style={s.savedTo}>
                  📎 Saved to {matchedChildName}'s notes
                </Text>
              ) : null}
            </View>
          ) : null}

          {/* ─── Response ─── */}
          {loading ? (
            <View style={s.responseCard}>
              <Animated.View style={[s.skeletonLine, { opacity: skeletonOpacity, width: '95%' }]} />
              <Animated.View style={[s.skeletonLine, { opacity: skeletonOpacity, width: '88%' }]} />
              <Animated.View style={[s.skeletonLine, { opacity: skeletonOpacity, width: '92%' }]} />
              <View style={{ height: 8 }} />
              <Animated.View style={[s.skeletonLine, { opacity: skeletonOpacity, width: '90%' }]} />
              <Animated.View style={[s.skeletonLine, { opacity: skeletonOpacity, width: '70%' }]} />
            </View>
          ) : error ? (
            <View style={s.responseCard}>
              <Text style={s.errorText}>{error}</Text>
              <Pressable onPress={handleBack} style={s.errorBackBtn}>
                <Text style={s.errorBackText}>← Back to Home</Text>
              </Pressable>
            </View>
          ) : (
            <View style={s.responseCard}>
              {paragraphs.map((para, idx) => (
                <Text key={idx} style={s.responseText}>
                  {para}
                </Text>
              ))}
            </View>
          )}

          {/* ─── Action row (only when thought is loaded) ─── */}
          {!loading && !error ? (
            <View style={s.actionRow}>
              {!isInline ? (
                <>
                  <Pressable
                    onPress={handlePin}
                    disabled={pinning}
                    style={({ pressed }) => [
                      s.actionBtn,
                      isPinned && s.actionBtnActive,
                      pressed && { opacity: 0.85 },
                    ]}
                  >
                    <Text style={[s.actionIcon, isPinned && { color: C.rose }]}>
                      {isPinned ? '📌' : '📍'}
                    </Text>
                    <Text style={[s.actionLabel, isPinned && { color: C.rose }]}>
                      {isPinned ? 'Pinned' : 'Pin'}
                    </Text>
                  </Pressable>

                  <Pressable
                    onPress={handleDelete}
                    disabled={deleting}
                    style={({ pressed }) => [
                      s.actionBtn,
                      pressed && { opacity: 0.85 },
                    ]}
                  >
                    <Text style={s.actionIcon}>🗑</Text>
                    <Text style={s.actionLabel}>Delete</Text>
                  </Pressable>
                </>
              ) : null}

              <Pressable
                onPress={handleAskAnother}
                style={({ pressed }) => [
                  s.actionBtn,
                  pressed && { opacity: 0.85 },
                ]}
              >
                <Text style={s.actionIcon}>↺</Text>
                <Text style={s.actionLabel}>Ask another</Text>
              </Pressable>
            </View>
          ) : null}

          <View style={{ height: 40 }} />
        </ScrollView>
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
  topBar: {
    flexDirection: 'row', alignItems: 'center',
    paddingTop: 8, paddingBottom: 4,
  },
  backBtn: { paddingVertical: 6 },
  backText: {
    fontFamily: F.bodyMedium, fontSize: 15, color: C.textMuted,
  },

  // Prompt
  promptWrap: { gap: 4, marginTop: 4 },
  promptLabel: {
    fontFamily: F.bodyMedium, fontSize: 11, color: C.textMuted,
    letterSpacing: 0.5, textTransform: 'uppercase',
  },
  promptText: {
      fontFamily: F.scriptItalic, fontSize: 15, color: C.textSub,
      lineHeight: 22,
    },
    savedTo: {
      fontFamily: F.bodyMedium, fontSize: 12, color: C.sage,
      letterSpacing: 0.3, marginTop: 6,
    },


  // Response
  responseCard: {
    padding: 24, gap: 14,
    borderRadius: 22,
    backgroundColor: C.cardGlass,
    borderWidth: 1, borderColor: C.border,
    minHeight: 200,
  },
  responseText: {
    fontFamily: F.body, fontSize: 17, color: C.text,
    lineHeight: 28, letterSpacing: 0.1,
  },

  // Skeleton
  skeletonLine: {
    height: 14, borderRadius: 7,
    backgroundColor: 'rgba(0,0,0,0.08)',
    marginVertical: 4,
  },

  // Error
  errorText: {
    fontFamily: F.body, fontSize: 15, color: C.rose,
    textAlign: 'center', lineHeight: 22,
  },
  errorBackBtn: {
    alignSelf: 'center', paddingVertical: 10, paddingHorizontal: 18, marginTop: 8,
  },
  errorBackText: {
    fontFamily: F.bodyMedium, fontSize: 14, color: C.textSub,
  },

  // Action row
  actionRow: {
    flexDirection: 'row', gap: 10, justifyContent: 'space-between',
  },
  actionBtn: {
    flex: 1, gap: 4,
    paddingVertical: 14, paddingHorizontal: 8,
    alignItems: 'center', justifyContent: 'center',
    borderRadius: 14,
    backgroundColor: C.cardGlass,
    borderWidth: 1, borderColor: C.border,
  },
  actionBtnActive: {
    backgroundColor: 'rgba(201,123,99,0.10)',
    borderColor: 'rgba(201,123,99,0.30)',
  },
  actionIcon: { fontSize: 20 },
  actionLabel: {
    fontFamily: F.bodyMedium, fontSize: 12, color: C.textSub,
  },
});
