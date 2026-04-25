// app/history.tsx
// v5 — Conversation history list

import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Screen } from '../src/components/ui/Screen';
import { Card } from '../src/components/ui/Card';
import { colors, fonts as F } from '../src/theme/colors';
import { useAuth } from '../src/context/AuthContext';
import { supabase } from '../src/lib/supabase';

type HistoryItem = {
  id: string;
  conversation_id: string;
  child_profile_id: string | null;
  mode: string;
  trigger_category: string | null;
  situation_summary: string | null;
  intensity: number | null;
  created_at: string;
  child_name?: string;
};

const MODE_LABELS: Record<string, string> = {
  sos: '🔥 SOS',
  reconnect: '🤝 Reconnect',
  understand: '🔍 Understand',
  conversation: '💬 Conversation',
};

const TRIGGER_LABELS: Record<string, string> = {
  leaving_places: 'Leaving places',
  bedtime: 'Bedtime',
  homework: 'Homework',
  screen_time: 'Screen time',
  mealtime: 'Mealtime',
  sharing: 'Sharing',
  sibling: 'Sibling conflict',
  morning_routine: 'Morning routine',
  public_meltdown: 'Public meltdown',
  separation: 'Separation',
};

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const days = Math.floor(diff / 86400000);

  if (days === 0) {
    return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  }
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

export default function HistoryScreen() {
  const { session } = useAuth();
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchHistory = useCallback(async () => {
    if (!session?.user?.id) return;
    setLoading(true);
    setError('');

    try {
      // Fetch interaction logs with child name
      const { data, error: fetchErr } = await supabase
        .from('interaction_logs')
        .select(`
          id,
          conversation_id,
          child_profile_id,
          mode,
          trigger_category,
          situation_summary,
          intensity,
          created_at
        `)
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (fetchErr) throw fetchErr;

      // Get child names
      const childIds = [...new Set((data || []).map(d => d.child_profile_id).filter(Boolean))];
      let childMap: Record<string, string> = {};

      if (childIds.length > 0) {
        const { data: children } = await supabase
          .from('child_profiles')
          .select('id, name')
          .in('id', childIds);

        if (children) {
          childMap = Object.fromEntries(children.map(c => [c.id, c.name]));
        }
      }

      const enriched = (data || []).map(item => ({
        ...item,
        child_name: item.child_profile_id ? childMap[item.child_profile_id] : undefined,
      }));

      setItems(enriched);
    } catch {
      setError('Could not load history.');
    } finally {
      setLoading(false);
    }
  }, [session?.user?.id]);

  useFocusEffect(
    useCallback(() => {
      fetchHistory();
    }, [fetchHistory])
  );

  return (
    <Screen edges={['top', 'bottom']}>
      {/* Header */}
      <View style={st.header}>
        <Pressable onPress={() => router.back()} style={st.back}>
          <Text style={st.backText}>← Back</Text>
        </Pressable>
        <Text style={st.title}>History</Text>
        <Text style={st.subtitle}>{items.length} sessions</Text>
      </View>

      {/* Loading */}
      {loading ? (
        <View style={st.center}>
          <ActivityIndicator color={colors.coral} size="large" />
        </View>
      ) : error ? (
        <View style={st.center}>
          <Text style={st.errorText}>{error}</Text>
          <Pressable onPress={fetchHistory}>
            <Text style={st.retryText}>Try again</Text>
          </Pressable>
        </View>
      ) : items.length === 0 ? (
        <View style={st.center}>
          <Text style={st.emptyIcon}>📝</Text>
          <Text style={st.emptyTitle}>No sessions yet</Text>
          <Text style={st.emptyBody}>
            Your script history will appear here after your first session.
          </Text>
          <Pressable
           onPress={() => router.push('/(tabs)')}
            style={({ pressed }) => [st.emptyBtn, pressed && { opacity: 0.85 }]}
          >
            <Text style={st.emptyBtnText}>Get your first script</Text>
          </Pressable>
        </View>
      ) : (
        <View style={st.list}>
          {items.map((item) => (
            <Card
              key={item.id}
              accent={item.mode === 'sos' ? 'coral' : item.mode === 'reconnect' ? 'blue' : item.mode === 'understand' ? 'amber' : 'sage'}
              onPress={() => {
                if (item.conversation_id) {
                  router.push({
                    pathname: '/result',
                    params: { conversation_id: item.conversation_id },
                  });
                }
              }}
            >
              <View style={st.itemHeader}>
                <Text style={st.itemMode}>
                  {MODE_LABELS[item.mode] || item.mode}
                </Text>
                <Text style={st.itemDate}>{formatDate(item.created_at)}</Text>
              </View>

              <Text style={st.itemSummary} numberOfLines={2}>
                {item.situation_summary || 'View session'}
              </Text>

              <View style={st.itemMeta}>
                {item.child_name ? (
                  <Text style={st.itemChild}>{item.child_name}</Text>
                ) : null}
                {item.trigger_category ? (
                  <Text style={st.itemTrigger}>
                    {TRIGGER_LABELS[item.trigger_category] || item.trigger_category}
                  </Text>
                ) : null}
              </View>
            </Card>
          ))}
        </View>
      )}
    </Screen>
  );
}

const st = StyleSheet.create({
  header: {
    gap: 4,
    marginBottom: 8,
  },
  back: { alignSelf: 'flex-start', paddingVertical: 4 },
  backText: { fontFamily: F.bodyMedium, fontSize: 15, color: colors.textMuted },
  title: { fontFamily: F.heading, fontSize: 26, color: colors.text },
  subtitle: { fontFamily: F.body, fontSize: 14, color: colors.textSub },

  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 60,
  },
  errorText: { fontFamily: F.body, fontSize: 14, color: colors.danger },
  retryText: { fontFamily: F.bodySemi, fontSize: 14, color: colors.coral },

  emptyIcon: { fontSize: 40, marginBottom: 8 },
  emptyTitle: { fontFamily: F.bodySemi, fontSize: 18, color: colors.text },
  emptyBody: {
    fontFamily: F.body, fontSize: 14, color: colors.textSub,
    textAlign: 'center', lineHeight: 20, maxWidth: 260,
  },
  emptyBtn: {
    backgroundColor: colors.coral,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 24,
    marginTop: 8,
  },
  emptyBtnText: { fontFamily: F.bodySemi, fontSize: 15, color: '#FFF' },

  list: { gap: 12 },

  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemMode: { fontFamily: F.bodySemi, fontSize: 13, color: colors.textBody },
  itemDate: { fontFamily: F.body, fontSize: 12, color: colors.textMuted },
  itemSummary: {
    fontFamily: F.body, fontSize: 15, color: colors.textBody,
    lineHeight: 22, marginTop: 4,
  },
  itemMeta: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 6,
  },
  itemChild: {
    fontFamily: F.bodyMedium, fontSize: 12, color: colors.textMuted,
    backgroundColor: colors.subtle,
    paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8,
  },
  itemTrigger: {
    fontFamily: F.bodyMedium, fontSize: 12, color: colors.textMuted,
    backgroundColor: colors.subtle,
    paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8,
  },
});