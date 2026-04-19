// app/(tabs)/child.tsx
// v1 — Child tab: profile + saved scripts + history in one screen
// Glassmorphism 3D cards, night sky, pull-to-refresh
// Center tab in 3-tab layout: Home · Child · Settings

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { StatusBar }       from 'expo-status-bar';
import { SafeAreaView }    from 'react-native-safe-area-context';
import { LinearGradient }  from 'expo-linear-gradient';
import * as Haptics        from 'expo-haptics';
import { Stars }           from '../../src/components/features/Stars';
import { useAuth }         from '../../src/context/AuthContext';
import { useChildProfile } from '../../src/context/ChildProfileContext';
import { supabase }        from '../../src/lib/supabase';
import { loadSavedScripts, deleteSavedScript, type SavedScriptRow } from '../../src/lib/loadSavedScripts';
import { colors as C, fonts as F } from '../../src/theme';

// ═══════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════

type TriggerData = { label: string; count: number; pct: number; color: string };
type FeedbackSummary = {
  total: number; helpful: number; helpfulPct: number;
  topOutcome: string | null; topStep: string | null;
};
type SessionPreview = {
  id: string; date: string; mode: string;
  summary: string; regulateScript: string; structured: any;
};

const TRIGGER_COLORS = ['#E87461', '#F79566', '#8AA060', '#5778A3', '#C4A46C'];
const TRIGGER_LABELS: Record<string, string> = {
  leaving_places: 'Leaving places', bedtime: 'Bedtime', homework: 'Homework',
  screen_time: 'Screen time', mealtime: 'Mealtime', sharing: 'Sharing',
  sibling: 'Sibling conflict', morning_routine: 'Morning routine',
  public_meltdown: 'Public meltdown', separation: 'Separation',
};
const MODE_LABELS: Record<string, string> = {
  sos: 'SOS', reconnect: 'Reconnect', understand: 'Understand',
  conversation: 'Conversation', hard_moment: 'SOS',
};
const OUTCOME_LABELS: Record<string, string> = {
  calmed: 'Calmed down', escalated: 'Escalated',
  ignored: 'Ignored', ongoing: 'Still going',
};
const CHILD_COLORS = ['#5778A3', '#8AA060', '#E87461', '#F79566'];
const EMPTY_THRESHOLD = 5;

function formatDate(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diff = Math.floor((now.getTime() - d.getTime()) / 86400000);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Yesterday';
  if (diff < 7) return `${diff} days ago`;
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

// ═══════════════════════════════════════════════
// GLASS CARD
// ═══════════════════════════════════════════════

type GlassTint = 'standard' | 'warm' | 'sage' | 'slate';
const TINTS: Record<GlassTint, {
  colors: [string, string, string];
  borderTop: string; borderLeft: string;
  borderRight: string; borderBottom: string;
}> = {
  standard: {
    colors: ['rgba(255,255,255,0.06)', 'rgba(255,255,255,0.02)', 'rgba(0,0,0,0.10)'],
    borderTop: 'rgba(255,255,255,0.12)', borderLeft: 'rgba(255,255,255,0.06)',
    borderRight: 'rgba(0,0,0,0.06)', borderBottom: 'rgba(0,0,0,0.10)',
  },
  warm: {
    colors: ['rgba(200,136,58,0.10)', 'rgba(200,136,58,0.04)', 'rgba(0,0,0,0.10)'],
    borderTop: 'rgba(200,136,58,0.22)', borderLeft: 'rgba(200,136,58,0.12)',
    borderRight: 'rgba(0,0,0,0.06)', borderBottom: 'rgba(0,0,0,0.10)',
  },
  sage: {
    colors: ['rgba(124,154,135,0.10)', 'rgba(124,154,135,0.04)', 'rgba(0,0,0,0.10)'],
    borderTop: 'rgba(124,154,135,0.22)', borderLeft: 'rgba(124,154,135,0.12)',
    borderRight: 'rgba(0,0,0,0.06)', borderBottom: 'rgba(0,0,0,0.10)',
  },
  slate: {
    colors: ['rgba(60,90,115,0.10)', 'rgba(60,90,115,0.04)', 'rgba(0,0,0,0.10)'],
    borderTop: 'rgba(60,90,115,0.22)', borderLeft: 'rgba(60,90,115,0.12)',
    borderRight: 'rgba(0,0,0,0.06)', borderBottom: 'rgba(0,0,0,0.10)',
  },
};

function GlassCard({ children, tint = 'standard', onPress, style }: {
  children: React.ReactNode; tint?: GlassTint; onPress?: () => void; style?: any;
}) {
  const t = TINTS[tint];
  const card = (
    <LinearGradient colors={t.colors} start={{ x: 0, y: 0 }} end={{ x: 0.8, y: 1 }}
      style={[s.glassCard, { borderTopColor: t.borderTop, borderLeftColor: t.borderLeft,
        borderRightColor: t.borderRight, borderBottomColor: t.borderBottom }, style]}>
      {children}
    </LinearGradient>
  );
  if (onPress) {
    return (
      <Pressable onPress={() => { Haptics.selectionAsync(); onPress(); }}
        style={({ pressed }) => [pressed && { opacity: 0.85, transform: [{ scale: 0.99 }] }]}>
        {card}
      </Pressable>
    );
  }
  return card;
}

function SectionHeader({ label }: { label: string }) {
  return (
    <View style={s.sectionRow}>
      <Text style={s.sectionLabel}>{label}</Text>
      <View style={s.sectionLine} />
    </View>
  );
}

// ═══════════════════════════════════════════════
// AVATAR
// ═══════════════════════════════════════════════

function AvatarBreath({ initial, color }: { initial: string; color: string }) {
  const scale = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    Animated.loop(Animated.sequence([
      Animated.timing(scale, { toValue: 1.04, duration: 2000, useNativeDriver: true }),
      Animated.timing(scale, { toValue: 1, duration: 2000, useNativeDriver: true }),
    ])).start();
  }, [scale]);
  return (
    <Animated.View style={[s.avatar, { backgroundColor: color, shadowColor: color, transform: [{ scale }] }]}>
      <Text style={s.avatarText}>{initial}</Text>
    </Animated.View>
  );
}

// ═══════════════════════════════════════════════
// MAIN SCREEN
// ═══════════════════════════════════════════════

export default function ChildTab() {
  const { session } = useAuth();
  const { activeChild, children } = useChildProfile();

  const childIndex = children.findIndex(c => c.id === activeChild?.id);
  const childColor = CHILD_COLORS[Math.max(childIndex, 0) % CHILD_COLORS.length];
  const childName = activeChild?.name?.trim() ?? 'Your child';
  const childAge = activeChild?.childAge ?? null;
  const initial = childName[0]?.toUpperCase() ?? '?';

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [weekCount, setWeekCount] = useState(0);
  const [savedScripts, setSavedScripts] = useState<SavedScriptRow[]>([]);
  const [triggers, setTriggers] = useState<TriggerData[]>([]);
  const [feedback, setFeedback] = useState<FeedbackSummary | null>(null);
  const [recentSessions, setRecentSessions] = useState<SessionPreview[]>([]);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(16)).current;

  const loadAll = useCallback(async () => {
    if (!session?.user || !activeChild?.id) { setLoading(false); return; }

    try {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);

      // Counts
      const { count: total } = await supabase
        .from('interaction_logs').select('id', { count: 'exact', head: true })
        .eq('user_id', session.user.id).eq('child_profile_id', activeChild.id).eq('is_followup', false);
      const { count: week } = await supabase
        .from('interaction_logs').select('id', { count: 'exact', head: true })
        .eq('user_id', session.user.id).eq('child_profile_id', activeChild.id)
        .eq('is_followup', false).gte('created_at', weekAgo.toISOString());
      setTotalCount(total ?? 0);
      setWeekCount(week ?? 0);

      // Saved scripts
      try {
        const saved = await loadSavedScripts();
        const filtered = saved.filter(s => s.child_profile_id === activeChild.id);
        setSavedScripts(filtered);
      } catch { setSavedScripts([]); }

      // Triggers
      const { data: triggerData } = await supabase
        .from('interaction_logs').select('trigger_category')
        .eq('user_id', session.user.id).eq('child_profile_id', activeChild.id)
        .eq('is_followup', false).not('trigger_category', 'is', null);
      if (triggerData && triggerData.length > 0) {
        const counts: Record<string, number> = {};
        triggerData.forEach(row => {
          if (row.trigger_category) counts[row.trigger_category] = (counts[row.trigger_category] ?? 0) + 1;
        });
        const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 4);
        const maxCount = sorted[0]?.[1] ?? 1;
        setTriggers(sorted.map(([key, count], i) => ({
          label: TRIGGER_LABELS[key] ?? key.replace(/_/g, ' '),
          count, pct: Math.round((count / maxCount) * 100),
          color: TRIGGER_COLORS[i % TRIGGER_COLORS.length],
        })));
      }

      // Feedback
      const { data: feedbackData } = await supabase
        .from('script_feedback').select('helpful, outcome, most_helpful_step')
        .eq('user_id', session.user.id).eq('child_profile_id', activeChild.id);
      if (feedbackData && feedbackData.length >= 3) {
        const totalFb = feedbackData.length;
        const helpfulCount = feedbackData.filter(f => f.helpful === 'yes').length;
        const outcomeCounts: Record<string, number> = {};
        feedbackData.forEach(f => { if (f.outcome) outcomeCounts[f.outcome] = (outcomeCounts[f.outcome] ?? 0) + 1; });
        const topOutcome = Object.entries(outcomeCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
        const stepCounts: Record<string, number> = {};
        feedbackData.forEach(f => { if (f.most_helpful_step) stepCounts[f.most_helpful_step] = (stepCounts[f.most_helpful_step] ?? 0) + 1; });
        const topStep = Object.entries(stepCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
        setFeedback({ total: totalFb, helpful: helpfulCount, helpfulPct: Math.round((helpfulCount / totalFb) * 100), topOutcome, topStep });
      }

      // Recent sessions
      const { data: convos } = await supabase
        .from('conversations').select('id, mode, summary, updated_at')
        .eq('user_id', session.user.id).eq('child_profile_id', activeChild.id)
        .eq('archived', false).order('updated_at', { ascending: false }).limit(5);
      if (convos && convos.length > 0) {
        const sessions: SessionPreview[] = [];
        for (const convo of convos) {
          const { data: msg } = await supabase
            .from('messages').select('structured')
            .eq('conversation_id', convo.id).eq('role', 'assistant')
            .order('created_at', { ascending: false }).limit(1).single();
          if (msg?.structured) {
            const sr = msg.structured;
            sessions.push({
              id: convo.id, date: formatDate(convo.updated_at),
              mode: MODE_LABELS[convo.mode] ?? 'SOS',
              summary: sr.situation_summary ?? convo.summary ?? 'A hard moment',
              regulateScript: sr.regulate?.script ?? '', structured: sr,
            });
          }
        }
        setRecentSessions(sessions);
      }
    } catch (e) {
      console.warn('[ChildTab] load error', e);
    } finally {
      setLoading(false);
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 0, duration: 400, useNativeDriver: true }),
      ]).start();
    }
  }, [session?.user, activeChild?.id]);

  useFocusEffect(useCallback(() => { loadAll(); }, [loadAll]));

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadAll();
    setRefreshing(false);
  }, [loadAll]);

  const handleDeleteScript = (scriptId: string, title: string | null) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    Alert.alert('Delete script?', `Remove "${title || 'this script'}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try { await deleteSavedScript(scriptId); setSavedScripts(prev => prev.filter(s => s.id !== scriptId));
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } catch {} }},
    ]);
  };

  const openScript = (item: SavedScriptRow) => {
    const d = item.structured; if (!d) return;
    router.push({ pathname: '/result', params: {
      situationSummary: d.situation_summary || '', regulateAction: d.regulate?.parent_action || '',
      regulateScript: d.regulate?.script || '', regulateCoaching: d.regulate?.coaching || '',
      regulateStrategies: JSON.stringify(d.regulate?.strategies || []),
      connectAction: d.connect?.parent_action || '', connectScript: d.connect?.script || '',
      connectCoaching: d.connect?.coaching || '', connectStrategies: JSON.stringify(d.connect?.strategies || []),
      guideAction: d.guide?.parent_action || '', guideScript: d.guide?.script || '',
      guideCoaching: d.guide?.coaching || '', guideStrategies: JSON.stringify(d.guide?.strategies || []),
      avoid: JSON.stringify(d.avoid || []), mode: 'sos',
    }});
  };

  const openSession = (sess: SessionPreview) => {
    const d = sess.structured;
    router.push({ pathname: '/result', params: {
      situationSummary: d.situation_summary ?? '', regulateAction: d.regulate?.parent_action ?? '',
      regulateScript: d.regulate?.script ?? '', regulateCoaching: d.regulate?.coaching ?? '',
      regulateStrategies: JSON.stringify(d.regulate?.strategies ?? []),
      connectAction: d.connect?.parent_action ?? '', connectScript: d.connect?.script ?? '',
      connectCoaching: d.connect?.coaching ?? '', connectStrategies: JSON.stringify(d.connect?.strategies ?? []),
      guideAction: d.guide?.parent_action ?? '', guideScript: d.guide?.script ?? '',
      guideCoaching: d.guide?.coaching ?? '', guideStrategies: JSON.stringify(d.guide?.strategies ?? []),
      avoid: JSON.stringify(d.avoid ?? []),
    }});
  };

  const isEmpty = totalCount < EMPTY_THRESHOLD;

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
        style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '30%', zIndex: 1 }}
        pointerEvents="none"
      />

      <ScrollView
        contentContainerStyle={s.scroll}
        showsVerticalScrollIndicator={false}
        style={{ zIndex: 2 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh}
            tintColor={C.amber} progressBackgroundColor="#1a1622" />
        }
      >
        {/* Hero */}
        <View style={s.hero}>
          <AvatarBreath initial={initial} color={childColor} />
          <Text style={s.heroName}>{childName}</Text>
          {childAge !== null && <Text style={s.heroAge}>Age {childAge}</Text>}
          {!loading && (
            <Text style={s.heroStats}>
              {totalCount} interaction{totalCount !== 1 ? 's' : ''}
              {weekCount > 0 ? ` · ${weekCount} this week` : ''}
              {savedScripts.length > 0 ? ` · ${savedScripts.length} saved` : ''}
            </Text>
          )}
          <Pressable onPress={() => router.push('/child/new')} style={{ marginTop: 4 }}>
            <Text style={s.editLink}>Edit profile</Text>
          </Pressable>
        </View>

        {/* Usage bar */}
        {!loading && totalCount > 0 && (
          <View style={s.usageWrap}>
            <View style={s.usageHeader}>
              <Text style={s.usageLabel}>SCRIPTS THIS WEEK</Text>
              <Text style={s.usageCount}>{weekCount}</Text>
            </View>
            <View style={s.usageTrack}>
              <View style={[s.usageFill, { width: `${Math.min((weekCount / 20) * 100, 100)}%` }]} />
            </View>
          </View>
        )}

        {loading ? (
          <View style={s.loadingWrap}><ActivityIndicator color={C.coral} /></View>
        ) : (
          <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }], gap: 20 }}>

            {/* ═══ EMPTY STATE ═══ */}
            {isEmpty ? (
              <GlassCard tint="standard" style={{ alignItems: 'center', paddingVertical: 32, gap: 12 }}>
                <Text style={{ fontSize: 36, opacity: 0.4 }}>🌱</Text>
                <Text style={s.emptyTitle}>Getting to know {childName}</Text>
                <Text style={s.emptyBody}>
                  After {EMPTY_THRESHOLD - totalCount} more interaction{EMPTY_THRESHOLD - totalCount !== 1 ? 's' : ''}, Sturdy will show you patterns and what works.
                </Text>
                <View style={s.emptyProgress}>
                  {Array.from({ length: EMPTY_THRESHOLD }).map((_, i) => (
                    <View key={i} style={[s.emptyDot, i < totalCount && { backgroundColor: childColor, opacity: 1 }]} />
                  ))}
                </View>
                <Text style={[s.emptyCount, { color: childColor }]}>{totalCount} of {EMPTY_THRESHOLD}</Text>
              </GlassCard>
            ) : (
              <>
                {/* ═══ FEEDBACK INSIGHTS ═══ */}
                {feedback && (
                  <>
                    <SectionHeader label="HOW SCRIPTS ARE WORKING" />
                    <GlassCard tint="sage">
                      <View style={s.feedbackGrid}>
                        <View style={s.feedbackStat}>
                          <Text style={[s.feedbackNum, { color: C.sage }]}>{feedback.helpfulPct}%</Text>
                          <Text style={s.feedbackLabel}>helpful</Text>
                        </View>
                        <View style={s.feedbackStat}>
                          <Text style={[s.feedbackNum, { color: C.blue }]}>{feedback.total}</Text>
                          <Text style={s.feedbackLabel}>rated</Text>
                        </View>
                        {feedback.topOutcome && (
                          <View style={s.feedbackStat}>
                            <Text style={[s.feedbackNum, { color: C.peach }]}>
                              {feedback.topOutcome === 'calmed' ? '😌' : feedback.topOutcome === 'escalated' ? '📈' : feedback.topOutcome === 'ignored' ? '😶' : '⏳'}
                            </Text>
                            <Text style={s.feedbackLabel}>{OUTCOME_LABELS[feedback.topOutcome] || feedback.topOutcome}</Text>
                          </View>
                        )}
                      </View>
                      {feedback.topStep && (
                        <Text style={s.feedbackInsight}>{feedback.topStep.charAt(0).toUpperCase() + feedback.topStep.slice(1)} tends to help {childName} most.</Text>
                      )}
                    </GlassCard>
                  </>
                )}

                {/* ═══ TRIGGERS ═══ */}
                {triggers.length > 0 && (
                  <>
                    <SectionHeader label="COMMON TRIGGERS" />
                    <GlassCard tint="standard">
                      {triggers.map(t => (
                        <View key={t.label} style={s.triggerRow}>
                          <View style={{ flex: 1, gap: 4 }}>
                            <Text style={s.triggerLabel}>{t.label}</Text>
                            <View style={s.triggerBg}>
                              <View style={[s.triggerFill, { width: `${t.pct}%` as any, backgroundColor: t.color }]} />
                            </View>
                          </View>
                          <Text style={s.triggerCount}>{t.count}×</Text>
                        </View>
                      ))}
                    </GlassCard>
                  </>
                )}
              </>
            )}

            {/* ═══ SAVED SCRIPTS ═══ */}
            <SectionHeader label={`SAVED SCRIPTS${savedScripts.length > 0 ? ` (${savedScripts.length})` : ''}`} />
            {savedScripts.length === 0 ? (
              <GlassCard tint="standard" style={{ alignItems: 'center', paddingVertical: 24, gap: 8 }}>
                <Text style={{ fontSize: 24, opacity: 0.4 }}>📌</Text>
                <Text style={s.emptyBody}>Scripts you save will appear here.</Text>
              </GlassCard>
            ) : (
              savedScripts.slice(0, 5).map(item => (
                <GlassCard key={item.id} tint="slate" onPress={() => openScript(item)}>
                  <View style={s.itemHeader}>
                    <Text style={s.itemTitle} numberOfLines={1}>{item.title || 'Saved script'}</Text>
                    <Text style={s.itemDate}>{formatDate(item.created_at)}</Text>
                  </View>
                  {item.structured?.regulate?.script ? (
                    <Text style={s.itemPreview} numberOfLines={2}>"{item.structured.regulate.script}"</Text>
                  ) : null}
                  <View style={s.itemFooter}>
                    <View style={{ flexDirection: 'row', gap: 8 }}>
                      {item.trigger_label ? (
                        <View style={s.metaPill}><Text style={s.metaPillText}>{item.trigger_label}</Text></View>
                      ) : null}
                    </View>
                    <Pressable onPress={() => handleDeleteScript(item.id, item.title)} hitSlop={12}>
                      <Text style={s.deleteText}>Delete</Text>
                    </Pressable>
                  </View>
                </GlassCard>
              ))
            )}
            {savedScripts.length > 5 && (
              <Pressable onPress={() => router.push('/saved')}>
                <Text style={s.viewAllLink}>View all {savedScripts.length} saved scripts →</Text>
              </Pressable>
            )}

            {/* ═══ RECENT SESSIONS ═══ */}
            {recentSessions.length > 0 && (
              <>
                <SectionHeader label="RECENT SESSIONS" />
                {recentSessions.map(sess => (
                  <GlassCard key={sess.id} tint="slate" onPress={() => openSession(sess)}>
                    <View style={s.itemHeader}>
                      <Text style={s.itemDate}>{sess.date}</Text>
                      <View style={s.sessionBadge}><Text style={s.sessionBadgeText}>{sess.mode}</Text></View>
                    </View>
                    <Text style={s.sessionSummary} numberOfLines={2}>{sess.summary}</Text>
                    {sess.regulateScript ? (
                      <Text style={s.itemPreview} numberOfLines={2}>"{sess.regulateScript}"</Text>
                    ) : null}
                  </GlassCard>
                ))}
              </>
            )}

            {/* ═══ WHAT WORKS — Sturdy+ teaser ═══ */}
            {!isEmpty && (
              <>
                <SectionHeader label={`WHAT WORKS FOR ${childName.toUpperCase()}`} />
                <GlassCard tint="warm">
                  <View style={s.lockedRow}>
                    <Text style={s.lockedItem}>One clear direction works better than choices when tired</Text>
                    <Text style={s.lockedIcon}>🔒</Text>
                  </View>
                  <View style={[s.lockedRow, { opacity: 0.45 }]}>
                    <Text style={s.lockedItem}>Sitting close calms faster than words</Text>
                    <Text style={s.lockedIcon}>🔒</Text>
                  </View>
                  <LinearGradient colors={['rgba(200,136,58,0.14)', 'rgba(200,136,58,0.06)']} style={s.paywallBanner}>
                    <View style={{ flex: 1, gap: 2 }}>
                      <Text style={s.paywallTitle}>{childName}'s profile is growing</Text>
                      <Text style={s.paywallSub}>Unlock full insights with Sturdy+</Text>
                    </View>
                    <Pressable onPress={() => router.push('/upgrade')}
                      style={({ pressed }) => [pressed && { opacity: 0.85 }]}>
                      <LinearGradient colors={['#C8883A', '#E8A855']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.paywallBtn}>
                        <Text style={s.paywallBtnText}>Sturdy+ →</Text>
                      </LinearGradient>
                    </Pressable>
                  </LinearGradient>
                </GlassCard>
              </>
            )}

            {/* Multi-child switcher */}
            {children.length > 1 && (
              <>
                <SectionHeader label="SWITCH CHILD" />
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
                  {children.map((child, i) => {
                    const isActive = child.id === activeChild?.id;
                    const color = CHILD_COLORS[i % CHILD_COLORS.length];
                    return (
                      <GlassCard key={child.id} tint={isActive ? 'sage' : 'standard'}
                        onPress={() => { /* switch active child */ }}
                        style={{ paddingHorizontal: 20, paddingVertical: 14, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                        <View style={[s.switchAva, { backgroundColor: color }]}>
                          <Text style={s.switchAvaText}>{child.name?.[0]?.toUpperCase() ?? '?'}</Text>
                        </View>
                        <Text style={[s.switchName, isActive && { color: C.sage }]}>{child.name}</Text>
                      </GlassCard>
                    );
                  })}
                </ScrollView>
              </>
            )}

            <View style={{ height: 100 }} />
          </Animated.View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// ═══════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0e0a10' },
  scroll: { paddingHorizontal: 24, paddingTop: 8, paddingBottom: 40, gap: 14 },

  glassCard: { borderRadius: 18, padding: 16, gap: 8, borderWidth: 1 },

  // Hero
  hero: { alignItems: 'center', gap: 8, paddingVertical: 20 },
  heroName: { fontFamily: F.heading, fontSize: 28, color: C.text, letterSpacing: -0.4, marginTop: 8 },
  heroAge: { fontFamily: F.body, fontSize: 14, color: C.textSub },
  heroStats: { fontFamily: F.body, fontSize: 13, color: C.textMuted, marginTop: 2 },
  editLink: { fontFamily: F.bodySemi, fontSize: 13, color: C.textMuted, textDecorationLine: 'underline' },
  avatar: { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center',
    shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.35, shadowRadius: 20, elevation: 10 },
  avatarText: { fontFamily: F.heading, fontSize: 30, color: '#FFF' },

  // Usage
  usageWrap: { gap: 6, paddingHorizontal: 4 },
  usageHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  usageLabel: { fontFamily: F.label, fontSize: 10, letterSpacing: 0.8, color: C.textMuted },
  usageCount: { fontFamily: F.bodySemi, fontSize: 12, color: C.sage },
  usageTrack: { height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.06)', overflow: 'hidden' },
  usageFill: { height: 4, borderRadius: 2, backgroundColor: C.sage },

  loadingWrap: { alignItems: 'center', paddingTop: 60 },

  // Section headers
  sectionRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  sectionLabel: { fontFamily: F.label, fontSize: 10, letterSpacing: 0.8, color: C.textMuted },
  sectionLine: { flex: 1, height: StyleSheet.hairlineWidth, backgroundColor: 'rgba(255,255,255,0.08)' },

  // Empty
  emptyTitle: { fontFamily: F.bodySemi, fontSize: 17, color: C.textBody, textAlign: 'center' },
  emptyBody: { fontFamily: F.body, fontSize: 14, color: C.textSub, textAlign: 'center', lineHeight: 21 },
  emptyProgress: { flexDirection: 'row', gap: 8, marginTop: 4 },
  emptyDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: 'rgba(255,255,255,0.12)', opacity: 0.5 },
  emptyCount: { fontFamily: F.bodySemi, fontSize: 13 },

  // Feedback
  feedbackGrid: { flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 8 },
  feedbackStat: { alignItems: 'center', gap: 4 },
  feedbackNum: { fontFamily: F.heading, fontSize: 24 },
  feedbackLabel: { fontFamily: F.body, fontSize: 12, color: C.textMuted },
  feedbackInsight: { fontFamily: F.bodyMedium, fontSize: 13, color: C.textSub, textAlign: 'center', marginTop: 8 },

  // Triggers
  triggerRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 3 },
  triggerLabel: { fontFamily: F.bodyMedium, fontSize: 14, color: C.textBody },
  triggerBg: { height: 5, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.06)', overflow: 'hidden', marginTop: 3 },
  triggerFill: { height: 5, borderRadius: 3 },
  triggerCount: { fontFamily: F.bodySemi, fontSize: 13, color: C.textMuted, minWidth: 28, textAlign: 'right' },

  // Saved + Sessions shared
  itemHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  itemTitle: { fontFamily: F.bodySemi, fontSize: 15, color: C.text, flex: 1, marginRight: 8 },
  itemDate: { fontFamily: F.body, fontSize: 12, color: C.textMuted },
  itemPreview: { fontFamily: F.scriptItalic, fontSize: 14, color: C.textSub, lineHeight: 21, marginTop: 2 },
  itemFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 },
  metaPill: { backgroundColor: 'rgba(247,149,102,0.08)', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 10,
    borderWidth: 1, borderColor: 'rgba(247,149,102,0.15)' },
  metaPillText: { fontFamily: F.bodyMedium, fontSize: 11, color: C.peach },
  deleteText: { fontFamily: F.bodyMedium, fontSize: 12, color: C.coral },
  viewAllLink: { fontFamily: F.bodySemi, fontSize: 13, color: C.amber, textAlign: 'center' },

  // Sessions
  sessionBadge: { backgroundColor: 'rgba(232,116,97,0.12)', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 8,
    borderWidth: 1, borderColor: 'rgba(232,116,97,0.20)' },
  sessionBadgeText: { fontFamily: F.label, fontSize: 10, letterSpacing: 0.6, color: C.coral },
  sessionSummary: { fontFamily: F.bodyMedium, fontSize: 14, color: C.textBody, lineHeight: 20 },

  // Locked / paywall
  lockedRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 },
  lockedItem: { fontFamily: F.bodyMedium, fontSize: 14, color: C.textBody, flex: 1, lineHeight: 20 },
  lockedIcon: { fontSize: 14, opacity: 0.35 },
  paywallBanner: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 14, padding: 14, marginTop: 4,
    borderWidth: 1, borderColor: 'rgba(200,136,58,0.20)' },
  paywallTitle: { fontFamily: F.bodySemi, fontSize: 13, color: C.amber },
  paywallSub: { fontFamily: F.body, fontSize: 12, color: C.textMuted },
  paywallBtn: { borderRadius: 12, paddingHorizontal: 16, paddingVertical: 10 },
  paywallBtnText: { fontFamily: F.bodySemi, fontSize: 12, color: '#FFFFFF' },

  // Switch child
  switchAva: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  switchAvaText: { fontFamily: F.bodySemi, fontSize: 12, color: '#FFF' },
  switchName: { fontFamily: F.bodyMedium, fontSize: 14, color: C.textBody },
});

