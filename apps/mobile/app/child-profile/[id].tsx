// app/child-profile/[id].tsx
// "Your Child" profile screen — Master Blueprint's explicit conversion
// trigger ("parents pay when they see Sturdy knows their child").
//
// Sections:
//   1. Header — avatar, name, age
//   2. Common triggers — top 5 trigger categories from interaction_logs
//   3. What works — saved scripts for this child (proxy for "what helped")
//   4. Emerging patterns — placeholder + lock (table not built yet)
//   5. Weekly insight — locked teaser + Coming-soon pill
//   6. Profile basics — read-only name / age / neurotype (editing TBD)
//
// Empty states are load-bearing: they tell the parent the profile gets
// smarter the more they use Sturdy. That IS the conversion hook.

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
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
import { loadSavedScripts, type SavedScriptRow } from '../../src/lib/loadSavedScripts';
import { loadChildInsights, type ChildInsights } from '../../src/lib/loadChildInsights';
import { colors as C, fonts as F } from '../../src/theme';

const HORIZON_PHOTO = require('../../assets/images/welcome/welcome-horizon.jpg');

// ═══════════════════════════════════════════════
// SCREEN
// ═══════════════════════════════════════════════

export default function ChildProfileScreen() {
  const params = useLocalSearchParams<{ id?: string }>();
  const { children } = useChildProfile() as any;

  const child = useMemo(() => {
    if (!params.id || !Array.isArray(children)) return null;
    return children.find((c: any) => c?.id === params.id) ?? null;
  }, [params.id, children]);

  const [insights, setInsights]     = useState<ChildInsights | null>(null);
  const [savedScripts, setSavedScripts] = useState<SavedScriptRow[]>([]);
  const [isLoading, setIsLoading]   = useState(true);

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
      const [ins, all] = await Promise.all([
        loadChildInsights(child.id),
        loadSavedScripts(),
      ]);
      setInsights(ins);
      setSavedScripts(all.filter((s) => s.child_profile_id === child.id));
    } catch {
      // Both helpers swallow their own errors — empty states render either way.
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
        <Image source={HORIZON_PHOTO} style={StyleSheet.absoluteFill} resizeMode="cover" />
        <LinearGradient
          colors={['rgba(15,10,18,0.45)', 'rgba(15,10,18,0.65)', 'rgba(15,10,18,0.82)']}
          style={StyleSheet.absoluteFill}
        />
        <SafeAreaView style={s.centerGate}>
          <ActivityIndicator color={'#E8A855'} />
        </SafeAreaView>
      </View>
    );
  }

  const initial = (child?.name?.trim()?.[0] ?? '?').toUpperCase();
  const totalInteractions = insights?.totalInteractions ?? 0;
  const topTriggers = insights?.topTriggers ?? [];
  const isNewProfile = totalInteractions < 3 && !isLoading;
  const neurotypeText = Array.isArray(child?.neurotype) && child.neurotype.length > 0
    ? child.neurotype.join(', ')
    : null;

  return (
    <View style={s.root}>
      <StatusBar style="light" />
      <Image source={HORIZON_PHOTO} style={StyleSheet.absoluteFill} resizeMode="cover" />
      <LinearGradient
        colors={['rgba(15,10,18,0.45)', 'rgba(15,10,18,0.65)', 'rgba(15,10,18,0.82)']}
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
            <Text style={s.childName}>{child.name}'s profile</Text>
            <Text style={s.childAge}>Age {child.childAge}</Text>
            {totalInteractions > 0 ? (
              <Text style={s.interactionMeta}>
                {totalInteractions} {totalInteractions === 1 ? 'interaction' : 'interactions'} so far
              </Text>
            ) : null}
          </View>

          {/* ─── 1. Common triggers ─── */}
          <View style={s.section}>
            <Text style={s.sectionTitle}>What sets {child.name} off</Text>
            {topTriggers.length === 0 ? (
              <View style={s.emptyCard}>
                <Text style={s.emptyEmoji}>🌱</Text>
                <Text style={s.emptyTitle}>Sturdy is just getting started</Text>
                <Text style={s.emptyBody}>
                  Use Sturdy a few more times and this section will fill in with the moments
                  that come up most for {child.name}.
                </Text>
              </View>
            ) : (
              <View style={s.card}>
                {topTriggers.map((t) => {
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
              </View>
            )}
          </View>

          {/* ─── 2. What works ─── */}
          <View style={s.section}>
            <Text style={s.sectionTitle}>What's helped before</Text>
            {savedScripts.length === 0 ? (
              <View style={s.emptyCard}>
                <Text style={s.emptyEmoji}>💛</Text>
                <Text style={s.emptyTitle}>Nothing saved yet</Text>
                <Text style={s.emptyBody}>
                  When a script lands, save it. They'll show up here so you can find them
                  again the next time something similar comes up.
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

          {/* ─── 3. Emerging patterns (locked / coming soon) ─── */}
          <View style={s.section}>
            <Text style={s.sectionTitle}>Emerging patterns</Text>
            <View style={[s.lockedCard]}>
              <View style={s.lockedHeader}>
                <Text style={s.lockedIcon}>🔒</Text>
                <Text style={s.lockedPill}>COMING SOON</Text>
              </View>
              <Text style={s.lockedBody}>
                Sturdy will start noticing things like "worst moments around 4–6pm" or
                "{child.name} responds to repair quickly" once we have enough to go on.
              </Text>
            </View>
          </View>

          {/* ─── 4. Weekly insight (locked / coming soon) ─── */}
          <View style={s.section}>
            <Text style={s.sectionTitle}>This week's insight</Text>
            <View style={[s.lockedCard]}>
              <View style={s.lockedHeader}>
                <Text style={s.lockedIcon}>🔒</Text>
                <Text style={s.lockedPill}>COMING SOON</Text>
              </View>
              <Text style={s.lockedBody}>
                A short audio reflection every Sunday — what showed up for {child.name} this
                week, what worked, and one thing to try next.
              </Text>
            </View>
          </View>

          {/* ─── 5. Profile basics (read-only for now) ─── */}
          <View style={s.section}>
            <Text style={s.sectionTitle}>Profile</Text>
            <View style={s.card}>
              <View style={s.basicRow}>
                <Text style={s.basicLabel}>Name</Text>
                <Text style={s.basicValue}>{child.name ?? '—'}</Text>
              </View>
              <View style={s.divider} />
              <View style={s.basicRow}>
                <Text style={s.basicLabel}>Age</Text>
                <Text style={s.basicValue}>{child.childAge}</Text>
              </View>
              {neurotypeText ? (
                <>
                  <View style={s.divider} />
                  <View style={s.basicRow}>
                    <Text style={s.basicLabel}>Neurotype</Text>
                    <Text style={s.basicValue}>{neurotypeText}</Text>
                  </View>
                </>
              ) : null}
              <Text style={s.basicHint}>Editing coming soon.</Text>
            </View>
          </View>

          <View style={{ height: 32 }} />
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
  scroll: { paddingHorizontal: 24, paddingTop: 8, paddingBottom: 32, gap: 22 },
  centerGate: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  // Top bar
  topBar: { flexDirection: 'row', alignItems: 'center', paddingTop: 4, paddingBottom: 4 },
  backBtn: { paddingVertical: 6, paddingHorizontal: 4 },
  backText: { fontFamily: F.bodyMedium, fontSize: 15, color: C.text },

  // Identity header
  identity: { alignItems: 'center', gap: 6, paddingTop: 4 },
  avatar: {
    width: 80, height: 80, borderRadius: 40,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: C.sage,
    shadowColor: C.sage, shadowOpacity: 0.30, shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 }, elevation: 4,
    marginBottom: 8,
  },
  avatarText: {
    fontFamily: F.heading, fontSize: 32, color: '#FFFFFF', letterSpacing: -0.4,
  },
  childName: {
    fontFamily: F.heading, fontSize: 24, color: C.text,
    letterSpacing: -0.3, textAlign: 'center',
  },
  childAge: {
    fontFamily: F.body, fontSize: 14, color: C.textSub,
  },
  interactionMeta: {
    fontFamily: F.body, fontSize: 12, color: C.textMuted, marginTop: 4,
  },

  // Sections
  section: { gap: 10 },
  sectionTitle: {
    fontFamily: F.subheading, fontSize: 16, color: C.text, letterSpacing: -0.2,
  },

  // Generic card
  card: {
    backgroundColor: C.cardGlass,
    borderColor: C.border, borderWidth: 1,
    borderRadius: 18, padding: 16, gap: 14,
  },

  // Empty state card (warm, not punitive)
  emptyCard: {
    backgroundColor: C.cardGlass,
    borderColor: C.border, borderWidth: 1,
    borderRadius: 18, padding: 18, gap: 8,
    alignItems: 'flex-start',
  },
  emptyEmoji: { fontSize: 22, marginBottom: 2 },
  emptyTitle: {
    fontFamily: F.subheading, fontSize: 15, color: C.text, letterSpacing: -0.1,
  },
  emptyBody: {
    fontFamily: F.body, fontSize: 14, color: C.textSub, lineHeight: 21,
  },

  // Triggers
  triggerRow: { gap: 6 },
  triggerHeader: { flexDirection: 'row', justifyContent: 'space-between' },
  triggerLabel: { fontFamily: F.bodyMedium, fontSize: 14, color: C.text },
  triggerCount: { fontFamily: F.body, fontSize: 13, color: C.textSub },
  triggerBarBg: {
    height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.06)',
    overflow: 'hidden',
  },
  triggerBarFill: {
    height: '100%', backgroundColor: C.amber, borderRadius: 3,
  },

  // What works
  workRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  workDot: {
    width: 8, height: 8, borderRadius: 4, marginTop: 7,
    backgroundColor: C.sage,
  },
  workTitle: { fontFamily: F.bodySemi, fontSize: 14, color: C.text },
  workQuote: { fontFamily: F.body, fontSize: 13, color: C.textSub, lineHeight: 19, marginTop: 2 },
  workSeeAll: { paddingTop: 4 },
  workSeeAllText: { fontFamily: F.bodyMedium, fontSize: 13, color: C.amber },

  // Locked / coming-soon card
  lockedCard: {
    backgroundColor: C.cardGlass,
    borderColor: C.border, borderWidth: 1,
    borderRadius: 18, padding: 16, gap: 8,
  },
  lockedHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  lockedIcon: { fontSize: 16 },
  lockedPill: {
    fontFamily: F.label, fontSize: 9, letterSpacing: 0.8,
    color: C.amber, backgroundColor: 'rgba(247,149,102,0.12)',
    paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: 999, overflow: 'hidden',
  },
  lockedBody: {
    fontFamily: F.body, fontSize: 13, color: C.textSub, lineHeight: 19,
  },

  // Profile basics (read-only)
  basicRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  basicLabel: { fontFamily: F.bodyMedium, fontSize: 13, color: C.textMuted, letterSpacing: 0.3 },
  basicValue: { fontFamily: F.bodySemi, fontSize: 15, color: C.text },
  divider:    { height: 1, backgroundColor: C.divider },
  basicHint:  { fontFamily: F.body, fontSize: 12, color: C.textMuted, marginTop: 4 },
});
