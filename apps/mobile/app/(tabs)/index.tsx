// app/(tabs)/index.tsx
// v3 — New Home (Parent Hub)
// Rotating greeting + child selector. Single-child users pass through to their hub.
// Journal identity: pastel gradient, frosted glass, rose accents.
// Reserved space below the selector for Question mode input (Phase 2).

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
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
import { colors as C, fonts as F } from '../../src/theme';


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
// SCREEN
// ═══════════════════════════════════════════════

export default function HomeScreen() {
  const { session } = useAuth();
  const { children, isLoadingChild } = useChildProfile() as any;

  const [firstName, setFirstName] = useState<string | null>(null);

  // ─── Fetch parent's name (full_name from profiles, falls back to email) ───
  const fetchName = useCallback(async () => {
    if (!session?.user?.id) return;
    try {
      const { data } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', session.user.id)
        .single();

      if (data?.full_name) {
        // Use first word only for a friendlier feel: "Mary Smith" → "Mary"
        const first = String(data.full_name).trim().split(/\s+/)[0];
        if (first) {
          setFirstName(first);
          return;
        }
      }

      // Fallback: extract from email ("mary.smith@..." → "mary")
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

  useFocusEffect(
    useCallback(() => {
      fetchName();
    }, [fetchName])
  );

  // ─── Single-child passthrough: route straight to their hub ───
  useEffect(() => {
    if (!isLoadingChild && Array.isArray(children) && children.length === 1) {
      const only = children[0];
      if (only?.id) {
        router.replace(`/child/${only.id}` as any);
      }
    }
  }, [children, isLoadingChild]);

  // ─── Pick a greeting once per mount (simple randomizer) ───
  const greeting = useMemo(() => {
    return GREETINGS[Math.floor(Math.random() * GREETINGS.length)];
  }, []);

  // ─── Handlers ───
  const handleOpenChild = (childId: string) => {
    Haptics.selectionAsync();
    router.push(`/child/${childId}` as any);
  };

  const handleAddChild = () => {
    Haptics.selectionAsync();
    router.push('/child/new');
  };

  // ─── Helpers ───
  const displayName = firstName ?? 'there';
  const kidList = Array.isArray(children) ? children : [];

  // ─── Loading gate ───
  if (isLoadingChild) {
    return (
      <View style={s.root}>
        <StatusBar style="dark" />
        <LinearGradient
          colors={[C.gradStart, C.gradMid1, C.gradMid2, C.gradEnd]}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <SafeAreaView style={s.centerGate}>
          <ActivityIndicator color={C.rose} />
        </SafeAreaView>
      </View>
    );
  }

  // ─── Empty state: 0 children (safety fallback — shouldn't normally hit) ───
  if (kidList.length === 0) {
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
          <View style={s.emptyWrap}>
            <Text style={s.greeting}>{greeting}, {displayName}.</Text>
            <Text style={s.emptyTitle}>Let's add your first child.</Text>
            <Text style={s.emptyBody}>
              Sturdy tailors every response to your child's age and world. Start by telling us a little about them.
            </Text>
            <Pressable onPress={handleAddChild} style={({ pressed }) => [pressed && { opacity: 0.9 }]}>
              <View style={s.primaryBtn}>
                <Text style={s.primaryBtnText}>Add a child</Text>
              </View>
            </Pressable>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  // ─── Single child — show loading while redirect fires ───
  if (kidList.length === 1) {
    return (
      <View style={s.root}>
        <StatusBar style="dark" />
        <LinearGradient
          colors={[C.gradStart, C.gradMid1, C.gradMid2, C.gradEnd]}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <SafeAreaView style={s.centerGate}>
          <ActivityIndicator color={C.rose} />
        </SafeAreaView>
      </View>
    );
  }

  // ─── Multi-child: selector view ───
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
          {/* ─── Greeting ─── */}
          <View style={s.greetingWrap}>
            <Text style={s.greeting}>{greeting}, {displayName}.</Text>
            <Text style={s.subGreeting}>Who would you like to focus on?</Text>
          </View>

          {/* ─── Child selector ─── */}
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

          {/* ─── Reserved space for Question mode (Phase 2) ─── */}
          <View style={s.reservedWrap}>
            <View style={s.reservedCard}>
              <Text style={s.reservedTitle}>What's on your mind?</Text>
              <Text style={s.reservedBody}>
                Soon, you'll be able to ask Sturdy anything about your children — right here.
              </Text>
              <View style={s.reservedBadge}>
                <Text style={s.reservedBadgeText}>Coming soon</Text>
              </View>
            </View>
          </View>

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
  scroll: { paddingHorizontal: 24, paddingTop: 16, paddingBottom: 20, gap: 28 },

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
    fontFamily: F.heading, fontSize: 32, color: C.text,
    letterSpacing: -0.5, lineHeight: 38,
  },
  subGreeting: {
    fontFamily: F.body, fontSize: 15, color: C.textSub, lineHeight: 22,
  },

  // Child row
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
    shadowOpacity: 0.25,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
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

  // Reserved (Question mode placeholder)
  reservedWrap: { gap: 8 },
  reservedCard: {
    padding: 20, gap: 10,
    borderRadius: 20,
    backgroundColor: C.cardGlass,
    borderWidth: 1, borderColor: C.border,
  },
  reservedTitle: {
    fontFamily: F.heading, fontSize: 20, color: C.text, letterSpacing: -0.3,
  },
  reservedBody: {
    fontFamily: F.body, fontSize: 14, color: C.textSub, lineHeight: 21,
  },
  reservedBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(129,178,154,0.15)',
    borderWidth: 1, borderColor: 'rgba(129,178,154,0.30)',
    marginTop: 4,
  },
  reservedBadgeText: {
    fontFamily: F.bodyMedium, fontSize: 11, color: C.sage, letterSpacing: 0.3,
  },

  // Empty state (0 children safety fallback)
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
