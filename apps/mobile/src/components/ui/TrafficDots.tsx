// src/components/ui/TrafficDots.tsx
//
// Two tiny color-coded dots showing quota health at a glance.
// Green (<60%), amber (60-80%), red (>80%).
// Tap to expand overlay with actual numbers + progress bars.
// Hidden for Sturdy+ users and guests.

import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useQuota } from '../../hooks/useQuota';
import { useSubscription } from '../../hooks/useSubscription';
import { useAuth } from '../../context/AuthContext';
import { colors as C, fonts as F } from '../../theme';

function getDotColor(used: number, max: number): string {
  const pct = used / max;
  if (pct >= 0.8) return '#D4544A';
  if (pct >= 0.6) return C.amber;
  return '#6B9E6B';
}

export function TrafficDots() {
  const { session } = useAuth();
  const { isPremium } = useSubscription();
  const { counts, loading } = useQuota();
  const [expanded, setExpanded] = useState(false);

  if (isPremium || !session || loading) return null;

  const scriptColor = getDotColor(counts.scriptsUsed, counts.scriptsCap);
  const questionColor = getDotColor(counts.questionsUsed, counts.questionsCap);
  const isLow =
    counts.scriptsUsed / counts.scriptsCap >= 0.8 ||
    counts.questionsUsed / counts.questionsCap >= 0.8;

  return (
    <View style={s.root}>
      <Pressable
        onPress={() => setExpanded(!expanded)}
        style={[s.dotsWrap, expanded && s.dotsWrapExpanded]}
        hitSlop={12}
      >
        <View style={s.dotCol}>
          <View style={[s.dot, { backgroundColor: scriptColor }]} />
          <Text style={s.dotLabel}>S</Text>
        </View>
        <View style={s.dotCol}>
          <View style={[s.dot, { backgroundColor: questionColor }]} />
          <Text style={s.dotLabel}>Q</Text>
        </View>
      </Pressable>

      {expanded && (
        <Pressable style={s.tooltip} onPress={() => setExpanded(false)}>
          <View style={s.tooltipRow}>
            <Text style={s.tooltipLabel}>Scripts</Text>
            <Text style={[s.tooltipValue, { color: scriptColor }]}>
              {counts.scriptsUsed}/{counts.scriptsCap}
            </Text>
          </View>
          <View style={s.tooltipTrack}>
            <View
              style={[
                s.tooltipFill,
                {
                  width: `${Math.round((counts.scriptsUsed / counts.scriptsCap) * 100)}%` as any,
                  backgroundColor: scriptColor,
                },
              ]}
            />
          </View>

          <View style={[s.tooltipRow, { marginTop: 8 }]}>
            <Text style={s.tooltipLabel}>Questions</Text>
            <Text style={[s.tooltipValue, { color: questionColor }]}>
              {counts.questionsUsed}/{counts.questionsCap}
            </Text>
          </View>
          <View style={s.tooltipTrack}>
            <View
              style={[
                s.tooltipFill,
                {
                  width: `${Math.round((counts.questionsUsed / counts.questionsCap) * 100)}%` as any,
                  backgroundColor: questionColor,
                },
              ]}
            />
          </View>

          <Text style={s.tooltipReset}>Resets {counts.resetDate}</Text>

          {isLow && (
            <Pressable
              onPress={() => {
                setExpanded(false);
                router.push('/upgrade' as any);
              }}
            >
              <Text style={s.tooltipCta}>Unlock unlimited →</Text>
            </Pressable>
          )}
        </Pressable>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  root: { position: 'relative' },
  dotsWrap: {
    flexDirection: 'row',
    gap: 5,
    padding: 6,
    paddingHorizontal: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  dotsWrapExpanded: {
    backgroundColor: C.surface,
    borderColor: C.border,
  },
  dotCol: { alignItems: 'center', gap: 2 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  dotLabel: { fontFamily: F.body, fontSize: 7, color: 'rgba(255,248,230,0.2)' },
  tooltip: {
    position: 'absolute',
    top: '100%',
    right: 0,
    marginTop: 6,
    backgroundColor: 'rgba(20,15,10,0.95)',
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 12,
    padding: 14,
    minWidth: 180,
    zIndex: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 24,
    elevation: 8,
  },
  tooltipRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  tooltipLabel: { fontFamily: F.body, fontSize: 12, color: 'rgba(255,248,230,0.55)' },
  tooltipValue: { fontFamily: F.bodySemi, fontSize: 12 },
  tooltipTrack: {
    height: 3,
    backgroundColor: C.surface,
    borderRadius: 2,
    overflow: 'hidden',
  },
  tooltipFill: { height: '100%', borderRadius: 2 },
  tooltipReset: {
    fontFamily: F.body,
    fontSize: 10,
    color: 'rgba(255,248,230,0.2)',
    textAlign: 'center',
    marginTop: 8,
  },
  tooltipCta: {
    fontFamily: F.bodyMedium,
    fontSize: 11,
    color: C.amber,
    textAlign: 'center',
    marginTop: 6,
  },
});
