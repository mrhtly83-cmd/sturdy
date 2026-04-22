// app/saved.tsx
// v7 — Saved scripts library (grouped by child)
// Night sky + Stars + directional border glassmorphism


import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
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
import { Stars }           from '../src/components/features/Stars';
import { colors as C, fonts as F } from '../src/theme';
import { loadSavedScripts, deleteSavedScript, type SavedScriptRow } from '../src/lib/loadSavedScripts';


// ═══════════════════════════════════════════════
// GLASS CARD — Directional border glassmorphism
// ═══════════════════════════════════════════════


type GlassTint = 'standard' | 'warm' | 'sage' | 'slate';


const TINTS: Record<GlassTint, {
  colors: [string, string, string];
  borderTop: string;
  borderLeft: string;
  borderRight: string;
  borderBottom: string;
}> = {
  standard: {
    colors: ['rgba(255,255,255,0.06)', 'rgba(255,255,255,0.02)', 'rgba(0,0,0,0.10)'],
    borderTop: 'rgba(255,255,255,0.12)',
    borderLeft: 'rgba(255,255,255,0.06)',
    borderRight: 'rgba(0,0,0,0.06)',
    borderBottom: 'rgba(0,0,0,0.10)',
  },
  warm: {
    colors: ['rgba(200,136,58,0.10)', 'rgba(200,136,58,0.04)', 'rgba(0,0,0,0.10)'],
    borderTop: 'rgba(200,136,58,0.22)',
    borderLeft: 'rgba(200,136,58,0.12)',
    borderRight: 'rgba(0,0,0,0.06)',
    borderBottom: 'rgba(0,0,0,0.10)',
  },
  sage: {
    colors: ['rgba(124,154,135,0.10)', 'rgba(124,154,135,0.04)', 'rgba(0,0,0,0.10)'],
    borderTop: 'rgba(124,154,135,0.22)',
    borderLeft: 'rgba(124,154,135,0.12)',
    borderRight: 'rgba(0,0,0,0.06)',
    borderBottom: 'rgba(0,0,0,0.10)',
  },
  slate: {
    colors: ['rgba(60,90,115,0.10)', 'rgba(60,90,115,0.04)', 'rgba(0,0,0,0.10)'],
    borderTop: 'rgba(60,90,115,0.22)',
    borderLeft: 'rgba(60,90,115,0.12)',
    borderRight: 'rgba(0,0,0,0.06)',
    borderBottom: 'rgba(0,0,0,0.10)',
  },
};


function GlassCard({
  children,
  tint = 'standard',
  onPress,
  style,
}: {
  children: React.ReactNode;
  tint?: GlassTint;
  onPress?: () => void;
  style?: any;
}) {
  const t = TINTS[tint];
  const content = (
    <LinearGradient
      colors={t.colors}
      start={{ x: 0, y: 0 }}
      end={{ x: 0.8, y: 1 }}
      style={[
        s.glassCard,
        {
          borderTopColor: t.borderTop,
          borderLeftColor: t.borderLeft,
          borderRightColor: t.borderRight,
          borderBottomColor: t.borderBottom,
        },
        style,
      ]}
    >
      {children}
    </LinearGradient>
  );


  if (onPress) {
    return (
      <Pressable
        onPress={() => { Haptics.selectionAsync(); onPress(); }}
        style={({ pressed }) => [pressed && { opacity: 0.85, transform: [{ scale: 0.99 }] }]}
      >
        {content}
      </Pressable>
    );
  }
  return content;
}


// ═══════════════════════════════════════════════
// MAIN SCREEN
// ═══════════════════════════════════════════════


type ChildGroup = {
  key: string;
  childName: string;
  scripts: SavedScriptRow[];
};


export default function SavedScriptsScreen() {
  const [scripts, setScripts] = useState<SavedScriptRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');


  const fetchSaved = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await loadSavedScripts();
      setScripts(data);
    } catch {
      setError('Could not load saved scripts.');
    } finally {
      setLoading(false);
    }
  }, []);


  useFocusEffect(
    useCallback(() => {
      fetchSaved();
    }, [fetchSaved])
  );


  // Group by child, preserving newest-first order within each group
  const groups: ChildGroup[] = useMemo(() => {
    const map = new Map<string, ChildGroup>();
    scripts.forEach(s => {
      const key = s.child_name || 'Unassigned';
      const existing = map.get(key);
      if (existing) {
        existing.scripts.push(s);
      } else {
        map.set(key, { key, childName: key, scripts: [s] });
      }
    });
    return Array.from(map.values());
  }, [scripts]);


  const handleDelete = (scriptId: string, title: string | null) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    Alert.alert(
      'Delete script?',
      `Remove "${title || 'this script'}" from your saved scripts?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteSavedScript(scriptId);
              setScripts(prev => prev.filter(s => s.id !== scriptId));
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            } catch {
              // Silent fail
            }
          },
        },
      ]
    );
  };


  const handleOpenScript = (item: SavedScriptRow) => {
    const d = item.structured;
    if (!d) return;
    Haptics.selectionAsync();


    router.push({
      pathname: '/result',
      params: {
        situationSummary: d.situation_summary || '',
        regulateAction: d.regulate?.parent_action || '',
        regulateScript: d.regulate?.script || '',
        regulateCoaching: d.regulate?.coaching || '',
        regulateStrategies: JSON.stringify(d.regulate?.strategies || []),
        connectAction: d.connect?.parent_action || '',
        connectScript: d.connect?.script || '',
        connectCoaching: d.connect?.coaching || '',
        connectStrategies: JSON.stringify(d.connect?.strategies || []),
        guideAction: d.guide?.parent_action || '',
        guideScript: d.guide?.script || '',
        guideCoaching: d.guide?.coaching || '',
        guideStrategies: JSON.stringify(d.guide?.strategies || []),
        avoid: JSON.stringify(d.avoid || []),
        mode: 'sos',
      },
    });
  };


  function formatDate(dateStr: string): string {
    const d = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const days = Math.floor(diff / 86400000);
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
  }


  return (
    <SafeAreaView style={s.root} edges={['top', 'bottom']}>
      <StatusBar style="light" />


      {/* ─── Night sky background (canonical) ─── */}
      <LinearGradient
        colors={['#0e0a10', '#14101a', '#1a1622', '#1e1a28', '#201c2a', '#1e1a24', '#1a1620', '#18141e', '#14101a']}
        locations={[0, 0.10, 0.22, 0.35, 0.48, 0.60, 0.72, 0.85, 1]}
        style={StyleSheet.absoluteFill}
      />
      <Stars />


      {/* ─── Warm ambient glow ─── */}
      <LinearGradient
        colors={['transparent', 'rgba(212,148,74,0.03)', 'rgba(212,148,74,0.06)']}
        locations={[0, 0.5, 1]}
        style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '35%', zIndex: 1 }}
        pointerEvents="none"
      />


      <ScrollView
        contentContainerStyle={s.scroll}
        showsVerticalScrollIndicator={false}
        style={{ zIndex: 2 }}
      >
        {/* Header */}
        <View style={s.backRow}>
          <Pressable onPress={() => router.back()} style={s.back}>
            <Text style={s.backText}>← Back</Text>
          </Pressable>
          <Pressable onPress={() => router.replace('/(tabs)')} style={s.homeBtn}>
            <Text style={s.homeBtnText}>🏠</Text>
          </Pressable>
        </View>


        <View style={s.header}>
          <Text style={s.title}>Saved Scripts</Text>
          {!loading && (
            <Text style={s.subtitle}>
              {scripts.length} script{scripts.length !== 1 ? 's' : ''}
              {groups.length > 1 ? ` · ${groups.length} children` : ''}
            </Text>
          )}
        </View>


        {/* Content */}
        {loading ? (
          <View style={s.center}>
            <ActivityIndicator color={C.coral} size="large" />
          </View>
        ) : error ? (
          <View style={s.center}>
            <Text style={s.errorText}>{error}</Text>
            <Pressable onPress={fetchSaved}>
              <Text style={s.retryText}>Try again</Text>
            </Pressable>
          </View>
        ) : scripts.length === 0 ? (
          <GlassCard tint="standard" style={{ alignItems: 'center', paddingVertical: 40, gap: 12 }}>
            <Text style={s.emptyIcon}>📌</Text>
            <Text style={s.emptyTitle}>No saved scripts yet</Text>
            <Text style={s.emptyBody}>
              When you find a script that works, tap Save to keep it here for next time.
            </Text>
            <Pressable
              onPress={() => router.replace('/(tabs)')}
              style={({ pressed }) => [pressed && { opacity: 0.85 }]}
            >
              <LinearGradient
                colors={['#C8883A', '#E8A855']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={s.emptyCta}
              >
                <Text style={s.emptyCtaText}>Go to SOS</Text>
              </LinearGradient>
            </Pressable>
          </GlassCard>
        ) : (
          <View style={s.groupsWrap}>
            {groups.map(group => (
              <View key={group.key} style={s.group}>
                {/* Group header */}
                <View style={s.groupHeader}>
                  <Text style={s.groupName}>{group.childName}</Text>
                  <Text style={s.groupCount}>
                    {group.scripts.length} script{group.scripts.length !== 1 ? 's' : ''}
                  </Text>
                </View>


                {/* Script cards */}
                <View style={s.list}>
                  {group.scripts.map(item => (
                    <GlassCard
                      key={item.id}
                      tint="slate"
                      onPress={() => handleOpenScript(item)}
                    >
                      {/* Header row */}
                      <View style={s.itemHeader}>
                        <Text style={s.itemTitle} numberOfLines={1}>
                          {item.title || 'Saved script'}
                        </Text>
                        <Text style={s.itemDate}>{formatDate(item.created_at)}</Text>
                      </View>


                      {/* Script preview */}
                      {item.structured?.regulate?.script ? (
                        <Text style={s.itemPreview} numberOfLines={2}>
                          "{item.structured.regulate.script}"
                        </Text>
                      ) : null}


                      {/* Footer: meta + delete */}
                      <View style={s.itemFooter}>
                        <View style={s.itemMeta}>
                          {item.trigger_label ? (
                            <View style={[s.metaPill, s.metaPillTrigger]}>
                              <Text style={[s.metaPillText, { color: C.peach }]}>{item.trigger_label}</Text>
                            </View>
                          ) : null}
                        </View>


                        <Pressable
                          onPress={() => handleDelete(item.id, item.title)}
                          hitSlop={12}
                          style={({ pressed }) => [pressed && { opacity: 0.6 }]}
                        >
                          <Text style={s.deleteText}>Delete</Text>
                        </Pressable>
                      </View>
                    </GlassCard>
                  ))}
                </View>
              </View>
            ))}
          </View>
        )}


        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}


// ═══════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════


const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0e0a10' },
  scroll: { paddingHorizontal: 24, paddingTop: 8, paddingBottom: 60, gap: 14 },


  // Navigation
  backRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  back: { alignSelf: 'flex-start', paddingVertical: 6 },
  backText: { fontFamily: F.bodyMedium, fontSize: 15, color: C.textMuted },
  homeBtn: { paddingVertical: 6, paddingHorizontal: 10 },
  homeBtnText: { fontSize: 20 },


  // Header
  header: { gap: 4, marginBottom: 4 },
  title: { fontFamily: F.heading, fontSize: 26, color: C.text, letterSpacing: -0.3 },
  subtitle: { fontFamily: F.body, fontSize: 14, color: C.textSub },


  // Glass card base
  glassCard: {
    borderRadius: 18,
    padding: 16,
    gap: 8,
    borderWidth: 1,
  },


  // Center states
  center: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 60,
  },
  errorText: { fontFamily: F.body, fontSize: 14, color: C.coral },
  retryText: { fontFamily: F.bodySemi, fontSize: 14, color: C.amber },


  // Empty state
  emptyIcon: { fontSize: 40, marginBottom: 4 },
  emptyTitle: { fontFamily: F.bodySemi, fontSize: 18, color: C.textBody, textAlign: 'center' },
  emptyBody: {
    fontFamily: F.body, fontSize: 14, color: C.textSub,
    textAlign: 'center', lineHeight: 21, maxWidth: 260,
  },
  emptyCta: {
    borderRadius: 14,
    paddingHorizontal: 24, paddingVertical: 12,
    marginTop: 4,
  },
  emptyCtaText: { fontFamily: F.bodySemi, fontSize: 14, color: '#FFFFFF' },


  // Groups
  groupsWrap: { gap: 20 },
  group: { gap: 10 },
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  groupName: { fontFamily: F.bodySemi, fontSize: 15, color: C.amber, letterSpacing: 0.2 },
  groupCount: { fontFamily: F.body, fontSize: 12, color: C.textMuted },


  // Script list inside a group
  list: { gap: 12 },


  // Item card content
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemTitle: {
    fontFamily: F.bodySemi, fontSize: 15, color: C.text,
    flex: 1, marginRight: 8,
  },
  itemDate: { fontFamily: F.body, fontSize: 12, color: C.textMuted },
  itemPreview: {
    fontFamily: F.scriptItalic, fontSize: 14, color: C.textSub,
    lineHeight: 21, marginTop: 2,
  },
  itemFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  itemMeta: { flexDirection: 'row', gap: 8 },
  metaPill: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    paddingHorizontal: 10, paddingVertical: 3, borderRadius: 10,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
  },
  metaPillTrigger: {
    backgroundColor: 'rgba(247,149,102,0.08)',
    borderColor: 'rgba(247,149,102,0.15)',
  },
  metaPillText: { fontFamily: F.bodyMedium, fontSize: 11, color: C.textMuted },
  deleteText: { fontFamily: F.bodyMedium, fontSize: 12, color: C.coral },
});

