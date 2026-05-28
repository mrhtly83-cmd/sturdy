// app/child-profile/[id].tsx
// v3 — Premium Conversion Hub
// Full redesign: Triggers (partial free / full premium), Session History,
// Saved Scripts, Patterns (V2 informational). Every locked section is a
// conversion moment via PaywallSheet.

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';

import { useChildProfile } from '../../src/context/ChildProfileContext';
import { supabase } from '../../src/lib/supabase';
import { loadSavedScripts, type SavedScriptRow } from '../../src/lib/loadSavedScripts';
import { loadChildInsights, type ChildInsights } from '../../src/lib/loadChildInsights';
import { colors as C, fonts as F } from '../../src/theme';
import { useSubscription } from '../../src/hooks/useSubscription';
import { PaywallSheet } from '../../src/components/ui/PaywallSheet';

// ═══════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════

type SessionItem = {
  id: string;
  mode: string;
  trigger_category: string | null;
  situation_summary: string | null;
  created_at: string;
};

// ═══════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════

const MODE_LABELS: Record<string, string> = {
  sos:          'SOS',
  reconnect:    'Reconnect',
  understand:   'Understand',
  conversation: 'Conversation',
  question:     'Question',
};

function formatDate(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

// ═══════════════════════════════════════════════
// SCREEN
// ═══════════════════════════════════════════════

export default function ChildProfileScreen() {
  const params = useLocalSearchParams<{ id?: string }>();
  const { children } = useChildProfile() as any;
  const { isPremium } = useSubscription();

  const child = useMemo(() => {
    if (!params.id || !Array.isArray(children)) return null;
    return children.find((c: any) => c?.id === params.id) ?? null;
  }, [params.id, children]);

  const [insights, setInsights]             = useState<ChildInsights | null>(null);
  const [savedScripts, setSavedScripts]     = useState<SavedScriptRow[]>([]);
  const [sessions, setSessions]             = useState<SessionItem[]>([]);
  const [isLoading, setIsLoading]           = useState(true);
  const [paywallFeature, setPaywallFeature] = useState<string | null>(null);

  // Bounce home if the child id doesn't resolve.
  useEffect(() => {
    if (Array.isArray(children) && children.length > 0 && !child && params.id) {
      router.replace('/(tabs)');
    }
  }, [children, child, params.id]);

  const refresh = useCallback(async () => {
    if (!child?.id) return;
    setIsLoading(true);
    try {
      const [ins, all, sessionData] = await Promise.all([
        loadChildInsights(child.id),
        loadSavedScripts(),
        supabase
          .from('interaction_logs')
          .select('id, mode, trigger_category, situation_summary, created_at')
          .eq('child_profile_id', child.id)
          .order('created_at', { ascending: false })
          .limit(5)
          .then(({ data }) => (data ?? []) as SessionItem[]),
      ]);
      setInsights(ins);
      setSavedScripts(all.filter((s) => s.child_profile_id === child.id));
      setSessions(sessionData);
    } catch {
      // Helpers swallow their own errors — empty states render either way.
    } finally {
      setIsLoading(false);
    }
  }, [child?.id]);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh]),
  );

  const handleBack = () => {
    Haptics.selectionAsync();
    router.back();
  };

  if (!child) {
    return (
      <View style={s.root}>
        <StatusBar style="light" />
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
        <SafeAreaView style={s.centerGate}>
          <ActivityIndicator color={C.amberMid} />
        </SafeAreaView>
      </View>
    );
  }

  const initial = (child?.name?.trim()?.[0] ?? '?').toUpperCase();
  const totalInteractions = insights?.totalInteractions ?? 0;
  const topTriggers = insights?.topTriggers ?? [];

  return (
    <View style={s.root}>
      <StatusBar style="light" />
      <LinearGradient
        colors={['#020202','#060604','#0a0906','#0d0b08','#0c0a06','#050402']}
        locations={[0, 0.16, 0.40, 0.58, 0.76, 1]}
        style={StyleSheet.absoluteFill}
      />
      <SafeAreaView style={s.safe} edges={['top']}>
        <ScrollView
          contentContainerStyle={s.scroll}
          showsVerticalScrollIndicator={false}
        >
          {/* ─── Top bar ─── */}
          <View style={s.topBar}>
            <Pressable onPress={handleBack} hitSlop={12} style={s.backBtn}>
              <Text style={s.backText}>← Back</Text>
            </Pressable>
          </View>

          {/* ─── Header ─── */}
          <View style={s.identity}>
            <View style={s.avatar}>
              <Text style={s.avatarText}>{initial}</Text>
            </View>
            <Text style={s.childName}>{child.name}</Text>
            <Text style={s.childAge}>Age {child.childAge}</Text>
            {totalInteractions > 0 ? (
              <Text style={s.sessionCount}>
                {totalInteractions} {totalInteractions === 1 ? 'session' : 'sessions'} with Sturdy
              </Text>
            ) : (
              <Text style={s.sessionCount}>Just getting started</Text>
            )}
          </View>

          {/* ══════════════════════════════════════════ */}
          {/* SECTION 1: TRIGGERS                        */}
          {/* Free: top 1 only. Premium: all 5.          */}
          {/* ══════════════════════════════════════════ */}
          <View style={s.section}>
            <Text style={s.sectionTitle}>What sets {child.name} off</Text>

            {topTriggers.length === 0 ? (
              <View style={s.emptyCard}>
                <Text style={s.emptyEmoji}>🌱</Text>
                <Text style={s.emptyTitle}>Building up</Text>
                <Text style={s.emptyBody}>
                  Use Sturdy a few more times and the patterns will start showing up here.
                </Text>
              </View>
            ) : (
              <View style={s.card}>
                {(isPremium ? topTriggers : topTriggers.slice(0, 1)).map((t) => {
                  const max = topTriggers[0]?.count || 1;
                  const widthPct = Math.max(8, Math.round((t.count / max) * 100));
                  return (
                    <View key={t.category} style={s.triggerRow}>
                      <View style={s.triggerHeader}>
                        <Text style={s.triggerLabel}>{t.label}</Text>
                        <Text style={s.triggerCount}>×{t.count}</Text>
                      </View>
                      <View style={s.triggerBarBg}>
                        <View style={[s.triggerBarFill, { width: `${widthPct}%` as any }]} />
                      </View>
                    </View>
                  );
                })}

                {!isPremium && topTriggers.length > 1 && (
                  <Pressable
                    onPress={() => setPaywallFeature('Full trigger history')}
                    style={s.lockedRow}
                  >
                    <Text style={s.lockedRowText}>
                      +{topTriggers.length - 1} more trigger{topTriggers.length - 1 > 1 ? 's' : ''} — unlock with Sturdy+
                    </Text>
                    <Text style={s.lockedRowArrow}>→</Text>
                  </Pressable>
                )}
              </View>
            )}
          </View>

          {/* ══════════════════════════════════════════ */}
          {/* SECTION 2: SESSION HISTORY                 */}
          {/* Fully locked for free users.               */}
          {/* ══════════════════════════════════════════ */}
          <View style={s.section}>
            <Text style={s.sectionTitle}>Sessions</Text>

            {!isPremium ? (
              <Pressable
                onPress={() => setPaywallFeature('Session history')}
                style={s.lockedCard}
              >
                <View style={s.lockedCardInner}>
                  <Text style={s.lockedIcon}>🔒</Text>
                  <View style={{ flex: 1, gap: 4 }}>
                    <Text style={s.lockedTitle}>Every session with {child.name}</Text>
                    <Text style={s.lockedBody}>
                      See every moment you've used Sturdy — what happened, which mode, what you said.
                    </Text>
                  </View>
                </View>
                <View style={s.premiumPill}>
                  <Text style={s.premiumPillText}>STURDY+</Text>
                </View>
              </Pressable>
            ) : sessions.length === 0 ? (
              <View style={s.emptyCard}>
                <Text style={s.emptyEmoji}>📋</Text>
                <Text style={s.emptyTitle}>No sessions yet</Text>
                <Text style={s.emptyBody}>
                  Sessions with {child.name} will appear here as you use Sturdy.
                </Text>
              </View>
            ) : (
              <View style={s.card}>
                {sessions.map((item) => (
                  <View key={item.id} style={s.sessionRow}>
                    <View style={s.sessionMeta}>
                      <View style={s.modeBadge}>
                        <Text style={s.modeBadgeText}>
                          {MODE_LABELS[item.mode] ?? item.mode}
                        </Text>
                      </View>
                      <Text style={s.sessionDate}>{formatDate(item.created_at)}</Text>
                    </View>
                    {item.situation_summary ? (
                      <Text style={s.sessionSummary} numberOfLines={2}>
                        {item.situation_summary}
                      </Text>
                    ) : null}
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* ══════════════════════════════════════════ */}
          {/* SECTION 3: SAVED SCRIPTS                   */}
          {/* Fully locked for free users.               */}
          {/* ══════════════════════════════════════════ */}
          <View style={s.section}>
            <Text style={s.sectionTitle}>What's helped before</Text>

            {!isPremium ? (
              <Pressable
                onPress={() => setPaywallFeature('Saved scripts')}
                style={s.lockedCard}
              >
                <View style={s.lockedCardInner}>
                  <Text style={s.lockedIcon}>🔒</Text>
                  <View style={{ flex: 1, gap: 4 }}>
                    <Text style={s.lockedTitle}>Scripts that worked</Text>
                    <Text style={s.lockedBody}>
                      Save scripts after a session. Find them again the next time something similar comes up.
                    </Text>
                  </View>
                </View>
                <View style={s.premiumPill}>
                  <Text style={s.premiumPillText}>STURDY+</Text>
                </View>
              </Pressable>
            ) : savedScripts.length === 0 ? (
              <View style={s.emptyCard}>
                <Text style={s.emptyEmoji}>💛</Text>
                <Text style={s.emptyTitle}>Nothing saved yet</Text>
                <Text style={s.emptyBody}>
                  When a script lands, save it. It'll show up here so you can find it again.
                </Text>
              </View>
            ) : (
              <View style={s.card}>
                {savedScripts.slice(0, 3).map((sc) => (
                  <Pressable
                    key={sc.id}
                    onPress={() => router.push('/saved')}
                    style={({ pressed }) => [s.workRow, pressed && { opacity: 0.85 }]}
                  >
                    <View style={s.workDot} />
                    <View style={{ flex: 1 }}>
                      <Text style={s.workTitle} numberOfLines={1}>
                        {sc.title || sc.structured?.situation_summary || 'Saved script'}
                      </Text>
                      {sc.structured?.regulate?.script ? (
                        <Text style={s.workQuote} numberOfLines={2}>
                          "{sc.structured.regulate.script}"
                        </Text>
                      ) : null}
                    </View>
                  </Pressable>
                ))}
                {savedScripts.length > 3 ? (
                  <Pressable onPress={() => router.push('/saved')} style={s.workSeeAll}>
                    <Text style={s.workSeeAllText}>See all {savedScripts.length} →</Text>
                  </Pressable>
                ) : null}
              </View>
            )}
          </View>

          {/* ══════════════════════════════════════════ */}
          {/* SECTION 4: PATTERNS (V2 — locked for all) */}
          {/* Informational only — no paywall on tap.   */}
          {/* ══════════════════════════════════════════ */}
          <View style={s.section}>
            <Text style={s.sectionTitle}>Patterns</Text>
            <View style={s.lockedCard}>
              <View style={s.lockedCardInner}>
                <Text style={s.lockedIcon}>🔭</Text>
                <View style={{ flex: 1, gap: 4 }}>
                  <Text style={s.lockedTitle}>What Sturdy is noticing</Text>
                  <Text style={s.lockedBody}>
                    After enough sessions, Sturdy will surface what it's seeing about {child.name} — coming soon.
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* ─── Edit link ─── */}
          <Pressable
            onPress={() => router.push(`/child/${child.id}?edit=1` as any)}
            style={s.editBtn}
          >
            <Text style={s.editText}>Edit {child.name}'s profile</Text>
          </Pressable>

          <View style={{ height: 40 }} />
        </ScrollView>
      </SafeAreaView>

      <PaywallSheet
        visible={paywallFeature !== null}
        onClose={() => setPaywallFeature(null)}
        feature={paywallFeature ?? ''}
      />
    </View>
  );
}

// ═══════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#020202' },
  safe: { flex: 1 },
  scroll: { paddingHorizontal: 24, paddingTop: 8, paddingBottom: 32, gap: 22 },
  centerGate: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  // Top bar
  topBar:   { flexDirection: 'row', alignItems: 'center', paddingTop: 4, paddingBottom: 4 },
  backBtn:  { paddingVertical: 6, paddingHorizontal: 4 },
  backText: { fontFamily: F.bodyMedium, fontSize: 15, color: C.textSecondary },

  // Identity header
  identity: { alignItems: 'center', gap: 6, paddingTop: 4 },
  avatar: {
    width: 80, height: 80, borderRadius: 40,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: C.amber,
    shadowColor: C.amber, shadowOpacity: 0.35,
    shadowRadius: 20, shadowOffset: { width: 0, height: 6 },
    elevation: 4, marginBottom: 8,
  },
  avatarText:   { fontFamily: F.heading, fontSize: 32, color: C.text, letterSpacing: -0.4 },
  childName:    { fontFamily: F.heading, fontSize: 24, color: C.text, letterSpacing: -0.3 },
  childAge:     { fontFamily: F.body, fontSize: 14, color: C.textSecondary },
  sessionCount: { fontFamily: F.body, fontSize: 12, color: C.textMuted, marginTop: 4 },

  // Sections
  section:      { gap: 10 },
  sectionTitle: { fontFamily: F.subheading, fontSize: 16, color: C.text, letterSpacing: -0.2 },

  // Generic card
  card: {
    backgroundColor: C.surface,
    borderColor: C.border, borderWidth: 1,
    borderRadius: 18, padding: 16, gap: 14,
  },

  // Empty state
  emptyCard: {
    backgroundColor: C.surface,
    borderColor: C.border, borderWidth: 1,
    borderRadius: 18, padding: 18, gap: 8,
  },
  emptyEmoji: { fontSize: 22, marginBottom: 2 },
  emptyTitle: { fontFamily: F.subheading, fontSize: 15, color: C.text, letterSpacing: -0.1 },
  emptyBody:  { fontFamily: F.body, fontSize: 14, color: C.textSecondary, lineHeight: 21 },

  // Locked card (full section lock)
  lockedCard: {
    backgroundColor: C.surface,
    borderColor: C.border, borderWidth: 1,
    borderRadius: 18, padding: 16, gap: 12,
  },
  lockedCardInner: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  lockedIcon:      { fontSize: 20, marginTop: 2 },
  lockedTitle:     { fontFamily: F.bodySemi, fontSize: 14, color: C.text },
  lockedBody:      { fontFamily: F.body, fontSize: 13, color: C.textSecondary, lineHeight: 19 },
  premiumPill: {
    alignSelf: 'flex-start',
    backgroundColor: C.amberBadge,
    borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3,
  },
  premiumPillText: {
    fontFamily: F.label, fontSize: 9, letterSpacing: 0.8, color: C.amber,
  },

  // Locked row inside partial trigger card
  lockedRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingTop: 6, borderTopWidth: 1, borderTopColor: C.divider,
  },
  lockedRowText:  { fontFamily: F.bodyMedium, fontSize: 13, color: C.amber },
  lockedRowArrow: { fontFamily: F.bodySemi, fontSize: 15, color: C.amber },

  // Triggers
  triggerRow:     { gap: 6 },
  triggerHeader:  { flexDirection: 'row', justifyContent: 'space-between' },
  triggerLabel:   { fontFamily: F.bodyMedium, fontSize: 14, color: C.text },
  triggerCount:   { fontFamily: F.body, fontSize: 13, color: C.textSecondary },
  triggerBarBg:   { height: 6, borderRadius: 3, backgroundColor: C.surface, overflow: 'hidden' },
  triggerBarFill: { height: '100%' as any, backgroundColor: C.amber, borderRadius: 3 },

  // Sessions
  sessionRow:     { gap: 6, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: C.divider },
  sessionMeta:    { flexDirection: 'row', alignItems: 'center', gap: 8 },
  modeBadge: {
    backgroundColor: C.amberBadge, borderRadius: 6,
    paddingHorizontal: 8, paddingVertical: 2,
  },
  modeBadgeText:  { fontFamily: F.label, fontSize: 10, color: C.amber, letterSpacing: 0.4 },
  sessionDate:    { fontFamily: F.body, fontSize: 12, color: C.textMuted },
  sessionSummary: { fontFamily: F.body, fontSize: 13, color: C.textSecondary, lineHeight: 19 },

  // Saved scripts
  workRow:        { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  workDot:        { width: 8, height: 8, borderRadius: 4, marginTop: 7, backgroundColor: C.sage },
  workTitle:      { fontFamily: F.bodySemi, fontSize: 14, color: C.text },
  workQuote:      { fontFamily: F.body, fontSize: 13, color: C.textSecondary, lineHeight: 19, marginTop: 2 },
  workSeeAll:     { paddingTop: 4 },
  workSeeAllText: { fontFamily: F.bodyMedium, fontSize: 13, color: C.amber },

  // Edit link
  editBtn:  { alignSelf: 'center', paddingVertical: 8 },
  editText: { fontFamily: F.bodyMedium, fontSize: 13, color: C.textMuted, textDecorationLine: 'underline' },
});
