// app/(tabs)/index.tsx
// v5 — Hub with 3×3 swipeable grid + SOS input bar + children + last session

import { useCallback, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  FlatList,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
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
import { Screen }          from '../../src/components/ui/Screen';
import { Card }            from '../../src/components/ui/Card';
import { colors, fonts as F } from '../../src/theme/colors';
import { useAuth }         from '../../src/context/AuthContext';
import { useChildProfile } from '../../src/context/ChildProfileContext';
import { supabase }        from '../../src/lib/supabase';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const GRID_PADDING = 20;
const GRID_WIDTH = SCREEN_WIDTH - GRID_PADDING * 2;

// ─── Types ───
type GridTile = {
  icon: string;
  label: string;
  desc: string;
  color: string;
  action: () => void;
};

// ─── Constants ───
const CHILD_COLORS = ['#5778A3', '#8AA060', '#E87461', '#F79566'];

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

// ─── Grid pages ───
const GRID_PAGES: GridTile[][] = [
  [
    { icon: '🔥', label: 'Right Now',    desc: 'SOS',     color: colors.coral,  action: () => router.push({ pathname: '/now', params: { mode: 'sos' } }) },
    { icon: '🤝', label: 'Reconnect',   desc: 'After',   color: colors.blue,   action: () => router.push({ pathname: '/now', params: { mode: 'reconnect' } }) },
    { icon: '🔍', label: 'Understand',  desc: 'Why',     color: colors.amber,  action: () => router.push({ pathname: '/now', params: { mode: 'understand' } }) },
    { icon: '🌙', label: 'Bedtime',     desc: 'Script',  color: '#6B5B95',     action: () => router.push({ pathname: '/now', params: { mode: 'sos', preset: 'bedtime' } }) },
    { icon: '🏃', label: "Won't Leave", desc: 'Script',  color: '#E8975B',     action: () => router.push({ pathname: '/now', params: { mode: 'sos', preset: 'leaving' } }) },
    { icon: '👊', label: 'Hitting',     desc: 'Script',  color: '#C75B5B',     action: () => router.push({ pathname: '/now', params: { mode: 'sos', preset: 'hitting' } }) },
    { icon: '💬', label: 'Conversation',desc: 'Plan',    color: colors.sage,   action: () => router.push({ pathname: '/now', params: { mode: 'conversation' } }) },
    { icon: '📱', label: 'Screen Time', desc: 'Script',  color: '#5B8FC7',     action: () => router.push({ pathname: '/now', params: { mode: 'sos', preset: 'screen_time' } }) },
    { icon: '😤', label: 'Siblings',    desc: 'Script',  color: '#C7995B',     action: () => router.push({ pathname: '/now', params: { mode: 'sos', preset: 'sibling' } }) },
  ],
  [
    { icon: '🍽️', label: 'Mealtime',   desc: 'Script',  color: '#7BA05E',     action: () => router.push({ pathname: '/now', params: { mode: 'sos', preset: 'mealtime' } }) },
    { icon: '☀️', label: 'Morning',     desc: 'Script',  color: '#D4944A',     action: () => router.push({ pathname: '/now', params: { mode: 'sos', preset: 'morning_routine' } }) },
    { icon: '😭', label: 'Meltdown',    desc: 'Public',  color: '#E87461',     action: () => router.push({ pathname: '/now', params: { mode: 'sos', preset: 'public_meltdown' } }) },
    { icon: '👋', label: 'Separation',  desc: 'Script',  color: '#5778A3',     action: () => router.push({ pathname: '/now', params: { mode: 'sos', preset: 'separation' } }) },
    { icon: '📚', label: 'Homework',    desc: 'Script',  color: '#8AA060',     action: () => router.push({ pathname: '/now', params: { mode: 'sos', preset: 'homework' } }) },
    { icon: '🤝', label: 'Sharing',     desc: 'Script',  color: '#C4A46C',     action: () => router.push({ pathname: '/now', params: { mode: 'sos', preset: 'sharing' } }) },
    { icon: '📌', label: 'Saved',       desc: 'Scripts', color: '#6B8DB8',     action: () => router.push('/saved') },
    { icon: '📝', label: 'History',     desc: 'Sessions',color: '#8FA8BC',     action: () => router.push('/history') },
    { icon: '👤', label: 'Profile',     desc: 'Child',   color: '#8AA060',     action: () => router.push('/child-profile') },
  ],
];

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

function getDailyThought(): string {
  const dayOfYear = Math.floor(
    (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000
  );
  return THOUGHTS[dayOfYear % THOUGHTS.length];
}

// ─── Usage Dots ───
function UsageDots({ count }: { count: number }) {
  return (
    <View style={st.dotsRow}>
      {[0, 1, 2, 3, 4].map((i) => (
        <View key={i} style={[st.usageDot, i < count && st.usageDotFilled]} />
      ))}
    </View>
  );
}

// ─── Grid Tile ───
function Tile({ tile }: { tile: GridTile }) {
  return (
    <Pressable
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        tile.action();
      }}
      style={({ pressed }) => [st.tile, pressed && st.tilePressed]}
      accessibilityRole="button"
      accessibilityLabel={tile.label}
    >
      <View style={[st.tileIcon, { backgroundColor: tile.color }]}>
        <Text style={st.tileEmoji}>{tile.icon}</Text>
      </View>
      <Text style={st.tileLabel}>{tile.label}</Text>
    </Pressable>
  );
}

// ─── Page Dots ───
function PageDots({ count, active }: { count: number; active: number }) {
  return (
    <View style={st.pageDots}>
      {Array.from({ length: count }).map((_, i) => (
        <View key={i} style={[st.pageDot, i === active && st.pageDotActive]} />
      ))}
    </View>
  );
}

// ─── Child Avatar ───
function ChildAvatar({ name, color, onPress }: {
  name: string; color: string; onPress: () => void;
}) {
  const initial = name.charAt(0).toUpperCase();
  return (
    <Pressable onPress={onPress} style={st.childWrap}>
      <View style={[st.childCircle, { backgroundColor: color }]}>
        <Text style={st.childInitial}>{initial}</Text>
      </View>
      <Text style={st.childName} numberOfLines={1}>{name}</Text>
    </Pressable>
  );
}

// ─── Main Hub ───
export default function HubScreen() {
  const { session }               = useAuth();
  const { children, activeChild } = useChildProfile();
  const [usageCount,  setUsageCount]  = useState(0);
  const [lastSession, setLastSession] = useState<any>(null);
  const [gridPage,    setGridPage]    = useState(0);
  const flatListRef                   = useRef<FlatList>(null);

  // ── All hooks must run before any conditional return ──

  const fetchData = useCallback(async () => {
    if (!session?.user?.id) return;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const { count } = await supabase
      .from('usage_events')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', session.user.id)
      .gte('created_at', today.toISOString());
    setUsageCount(Math.min(count || 0, 5));

    const { data } = await supabase
      .from('interaction_logs')
      .select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    if (data) setLastSession(data);
  }, [session?.user?.id]);

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [fetchData])
  );

  const handleGridScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const page = Math.round(e.nativeEvent.contentOffset.x / GRID_WIDTH);
    setGridPage(page);
  };

  const greeting  = getGreeting();
  const thought   = getDailyThought();
  const firstName = activeChild?.name;

  // ── Gate — after ALL hooks ──
  if (!session) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#0e0a10' }} edges={['top']}>
        <StatusBar style="light" />
        <LinearGradient
          colors={['#0e0a10','#14101a','#1a1622','#1e1a28','#14101a']}
          locations={[0,0.25,0.5,0.75,1]}
          style={StyleSheet.absoluteFill}
        />
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32, gap: 20 }}>
          <Text style={{ fontFamily: F.heading, fontSize: 28, color: '#FFFFFF', textAlign: 'center', letterSpacing: -0.3, lineHeight: 36 }}>
            Save your scripts.{'\n'}Know your child.
          </Text>
          <Text style={{ fontFamily: F.body, fontSize: 15, color: 'rgba(255,255,255,0.40)', textAlign: 'center', lineHeight: 23 }}>
            Create a free account to keep everything in one place.
          </Text>
          <Pressable
            onPress={() => router.push('/auth/sign-up')}
            style={({ pressed }) => [{
              width: '100%', backgroundColor: '#E87461',
              borderRadius: 18, minHeight: 56,
              alignItems: 'center', justifyContent: 'center',
              shadowColor: '#E87461', shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.35, shadowRadius: 16, elevation: 8,
            }, pressed && { opacity: 0.85 }]}
          >
            <Text style={{ fontFamily: F.subheading, fontSize: 16, color: '#FFFFFF' }}>
              Create free account
            </Text>
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

  // ── Main hub return ──
  return (
    <Screen
      edges={['top']}
      scrollable
      >
      
      {/* ─── Header ─── */}
      <View style={st.header}>
        <View>
          <Text style={st.greeting}>
            {greeting}{firstName ? `, ${firstName}'s parent` : ''}
          </Text>
          <Text style={st.greetingSub}>What do you need?</Text>
        </View>
        <UsageDots count={usageCount} />
      </View>

      {/* ─── 3×3 Swipeable Grid ─── */}
      <View>
        <FlatList
          ref={flatListRef}
          data={GRID_PAGES}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={handleGridScroll}
          scrollEventThrottle={16}
          keyExtractor={(_, i) => `page-${i}`}
          renderItem={({ item: tiles }) => (
            <View style={[st.gridPage, { width: GRID_WIDTH }]}>
              {tiles.map((tile: GridTile, i: number) => (
                <Tile key={i} tile={tile} />
              ))}
            </View>
          )}
        />
        <PageDots count={GRID_PAGES.length} active={gridPage} />
      </View>

      {/* ─── Your Children ─── */}
      {children && children.length > 0 ? (
        <View style={st.section}>
          <View style={st.sectionHeader}>
            <Text style={st.sectionTitle}>YOUR CHILDREN</Text>
            <Pressable onPress={() => router.push('/child/new')}>
              <Text style={st.sectionAction}>+ Add</Text>
            </Pressable>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={st.childScroll}
          >
            {children.map((child: any, i: number) => (
              <ChildAvatar
                key={child.id || `child-${i}`}
                name={child.name}
                color={CHILD_COLORS[i % CHILD_COLORS.length]}
                onPress={() => router.push({ pathname: '/child-profile', params: { id: child.id } })}
              />
            ))}
          </ScrollView>
        </View>
      ) : (
        <Card onPress={() => router.push('/child/new')} accent="blue">
          <Text style={st.emptyChildTitle}>Add your first child</Text>
          <Text style={st.emptyChildBody}>
            Sturdy personalizes every script to your child's age and needs.
          </Text>
        </Card>
      )}

      {/* ─── Last Session ─── */}
      {lastSession && (
        <Card
          accent="blue"
          onPress={() => router.push({ pathname: '/result', params: { conversation_id: lastSession.conversation_id } })}
        >
          <Text style={st.cardLabel}>LAST SESSION</Text>
          <Text style={st.cardBody} numberOfLines={2}>
            {lastSession.situation_summary || 'View your last script'}
          </Text>
          <Text style={st.cardMeta}>
            {lastSession.mode} · {lastSession.trigger_category || 'general'}
          </Text>
        </Card>
      )}

      {/* ─── Daily Thought ─── */}
      <View style={st.thoughtWrap}>
        <Text style={st.thoughtText}>"{thought}"</Text>
      </View>

    </Screen>
  );
}

// ─── Styles ───
const st = StyleSheet.create({
  header:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 },
  greeting:    { fontFamily: F.subheading, fontSize: 22, color: colors.text },
  greetingSub: { fontFamily: F.body, fontSize: 15, color: colors.textSub, marginTop: 2 },
  dotsRow:         { flexDirection: 'row', gap: 6, marginTop: 6 },
  usageDot:        { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.textGhost },
  usageDotFilled:  { backgroundColor: colors.coral },

  gridPage:    { flexDirection: 'row', flexWrap: 'wrap', gap: 10, paddingVertical: 4 },
  tile: {
    width: '31%' as any, aspectRatio: 1,
    backgroundColor: colors.raised, borderRadius: 18,
    borderWidth: 1, borderColor: colors.border,
    alignItems: 'center', justifyContent: 'center', gap: 6,
  },
  tilePressed: { backgroundColor: colors.subtle },
  tileIcon:    { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  tileEmoji:   { fontSize: 20 },
  tileLabel:   { fontFamily: F.bodySemi, fontSize: 11, color: colors.text, textAlign: 'center' },

  pageDots:      { flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: 8 },
  pageDot:       { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.textGhost },
  pageDotActive: { backgroundColor: colors.coral, width: 18 },

  section:       { gap: 12 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle:  { fontFamily: F.label, fontSize: 11, color: colors.textMuted, letterSpacing: 1.5 },
  sectionAction: { fontFamily: F.bodySemi, fontSize: 13, color: colors.coral },

  childScroll:  { gap: 16 },
  childWrap:    { alignItems: 'center', gap: 6, width: 64 },
  childCircle:  { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
  childInitial: { fontFamily: F.subheading, fontSize: 20, color: '#FFFFFF' },
  childName:    { fontFamily: F.bodyMedium, fontSize: 12, color: colors.textSub },

  emptyChildTitle: { fontFamily: F.bodySemi, fontSize: 15, color: colors.text },
  emptyChildBody:  { fontFamily: F.body, fontSize: 13, color: colors.textSub, marginTop: 4 },

  cardLabel: { fontFamily: F.label, fontSize: 11, color: colors.textMuted, letterSpacing: 1.5 },
  cardBody:  { fontFamily: F.body, fontSize: 15, color: colors.textBody, lineHeight: 22 },
  cardMeta:  { fontFamily: F.bodyMedium, fontSize: 12, color: colors.textMuted, marginTop: 4 },

  thoughtWrap: { paddingVertical: 16, paddingHorizontal: 4 },
  thoughtText: { fontFamily: F.scriptItalic, fontSize: 16, color: colors.textSub, textAlign: 'center', lineHeight: 24 },

  inputBar: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.raised, borderRadius: 16,
    borderWidth: 1, borderColor: colors.borderLight,
    paddingHorizontal: 16, paddingVertical: 14, gap: 12,
  },
  inputPlaceholder: { flex: 1, fontFamily: F.body, fontSize: 15, color: colors.textMuted },
  inputIcon:        { fontSize: 18 },
});
