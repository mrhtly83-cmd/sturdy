import { useCallback, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';

import { useChildProfile } from '../../src/context/ChildProfileContext';
import { loadChildInsights, type ChildInsights } from '../../src/lib/loadChildInsights';
import { colors as C, fonts as F, TAB_BAR_HEIGHT } from '../../src/theme';

const CHILD_GRADIENTS: Array<[string, string]> = [
  [C.iconTalkStart, C.iconTalkEnd],
  [C.iconSosStart, C.iconSosEnd],
  [C.iconUnderstandStart, C.iconUnderstandEnd],
  [C.iconRepairStart, C.iconRepairEnd],
];

export default function FamilyScreen() {
  const { children } = useChildProfile() as any;
  const kidList = Array.isArray(children) ? children : [];
  const [childInsights, setChildInsights] = useState<Record<string, ChildInsights>>({});

  useFocusEffect(
    useCallback(() => {
      const load = async () => {
        const results: Record<string, ChildInsights> = {};
        await Promise.all(
          kidList.map(async (kid: any) => {
            const insights = await loadChildInsights(kid.id);
            results[kid.id] = insights;
          })
        );
        setChildInsights(results);
      };
      load();
    }, [kidList]),
  );

  return (
    <View style={s.root}>
      <SafeAreaView style={s.safe} edges={['top', 'bottom']}>
        <ScrollView
          contentContainerStyle={s.scroll}
          showsVerticalScrollIndicator={false}
        >
          <Text style={s.header}>Your family</Text>

          {kidList.map((kid: any, index: number) => {
            const grad = CHILD_GRADIENTS[index % CHILD_GRADIENTS.length] as [string, string];
            const initial = (kid?.name?.trim()?.[0] ?? '?').toUpperCase();
            const insights = childInsights[kid.id];
            const topTrigger = insights?.topTriggers?.[0] ?? null;
            const totalSessions = insights?.totalInteractions ?? 0;

            return (
              <Pressable
                key={kid.id}
                onPress={() => {
                  Haptics.selectionAsync();
                  router.push(`/child/${kid.id}` as any);
                }}
                style={({ pressed }) => [s.card, pressed && { opacity: 0.85 }]}
                accessibilityRole="button"
                accessibilityLabel={`View ${kid.name}'s profile`}
              >
                <View style={s.cardRow}>
                  <LinearGradient
                    colors={grad}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={s.avatar}
                  >
                    <Text style={s.avatarInitial}>{initial}</Text>
                  </LinearGradient>

                  <View style={s.cardInfo}>
                    <View style={s.nameRow}>
                      <Text style={s.childName}>{kid.name}</Text>
                      {topTrigger ? (
                        <View style={s.triggerBadge}>
                          <Text style={s.triggerBadgeText}>{topTrigger.label}</Text>
                        </View>
                      ) : null}
                    </View>
                    <Text style={s.childMeta}>
                      Age {kid.childAge}
                      {totalSessions > 0
                        ? `  ·  ${totalSessions} session${totalSessions === 1 ? '' : 's'}`
                        : ''}
                    </Text>
                  </View>

                  <Text style={s.chevron}>›</Text>
                </View>
              </Pressable>
            );
          })}

          {kidList.length === 0 && (
            <View style={s.emptyWrap}>
              <Text style={s.emptyText}>No children added yet.</Text>
            </View>
          )}
        </ScrollView>

        <View style={s.footer}>
          <Pressable
            onPress={() => {
              Haptics.selectionAsync();
              router.push('/child/new');
            }}
            style={({ pressed }) => [pressed && { opacity: 0.92, transform: [{ scale: 0.98 }] }]}
          >
            <LinearGradient
              colors={[C.amber, C.amberMid]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={s.addBtn}
            >
              <Text style={s.addBtnText}>Add a child</Text>
            </LinearGradient>
          </Pressable>
        </View>
      </SafeAreaView>
    </View>
  );
}

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#1E1D25',
  },
  safe: { flex: 1 },
  scroll: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 24,
  },
  header: {
    fontFamily: F.headingItalic,
    fontSize: 30,
    color: 'rgba(255,248,230,0.92)',
    letterSpacing: -0.5,
    marginBottom: 24,
  },
  card: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderColor: 'rgba(255,255,255,0.07)',
    borderRadius: 14,
    borderWidth: 1,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    fontFamily: F.heading,
    fontSize: 20,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  cardInfo: {
    flex: 1,
    gap: 4,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  childName: {
    fontFamily: F.bodySemi,
    fontSize: 15,
    color: 'rgba(255,248,230,0.92)',
  },
  triggerBadge: {
    backgroundColor: 'rgba(200,136,58,0.22)',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  triggerBadgeText: {
    fontFamily: F.body,
    fontSize: 11,
    color: C.amberMid,
  },
  childMeta: {
    fontFamily: F.body,
    fontSize: 13,
    color: 'rgba(255,255,255,0.40)',
  },
  chevron: {
    fontSize: 20,
    color: 'rgba(255,255,255,0.20)',
    lineHeight: 24,
  },
  emptyWrap: {
    paddingTop: 60,
    alignItems: 'center',
  },
  emptyText: {
    fontFamily: F.body,
    fontSize: 14,
    color: 'rgba(255,255,255,0.30)',
    fontStyle: 'italic',
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 8,
    paddingTop: 8,
    marginBottom: TAB_BAR_HEIGHT,
  },
  addBtn: {
    borderRadius: 14,
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBtnText: {
    fontFamily: F.subheading,
    fontSize: 15,
    color: '#140f0a',
    letterSpacing: 0.3,
  },
});
