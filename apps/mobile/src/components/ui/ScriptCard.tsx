// src/components/ui/ScriptCard.tsx
// v6 — Deep Warm v5.2: dark glass cards differentiated by colored
// left-border stripe + badge pill. Numbered dot + label, expandable.

import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  LayoutAnimation,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  UIManager,
  View,
} from 'react-native';
import { colors as C, fonts as F } from '../../theme/colors';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

type Step = 'Regulate' | 'Connect' | 'Guide';

type Props = {
  step:          Step;
  parent_action: string;
  script:        string;
  coaching?:     string;
  strategies?:   string[];
  delay?:        number;
  defaultOpen?:  boolean;
  coachingOpen?: boolean;
};

const STEP_CONFIG: Record<Step, {
  num:          string;
  dotColor:     string;
  numBg:        string;
  cardBg:       string;
  cardBorder:   string;
  tintBg:       string;
  accentBorder: string;
}> = {
  Regulate: {
    num: '1',
    dotColor:     C.amber,
    numBg:        C.amber,
    cardBg:       C.surface,
    cardBorder:   C.border,
    tintBg:       C.amberBadge,
    accentBorder: C.amberBorder,
  },
  Connect: {
    num: '2',
    dotColor:     C.sage,
    numBg:        C.sage,
    cardBg:       C.surface,
    cardBorder:   C.border,
    tintBg:       C.sageBadge,
    accentBorder: C.sageBorder,
  },
  Guide: {
    num: '3',
    dotColor:     C.steel,
    numBg:        C.steel,
    cardBg:       C.surface,
    cardBorder:   C.border,
    tintBg:       C.steelBadge,
    accentBorder: C.steelBorder,
  },
};

export function ScriptCard({ step, parent_action, script, coaching, strategies, delay = 0, defaultOpen = false, coachingOpen = false }: Props) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(18)).current;
  const [expanded, setExpanded] = useState(defaultOpen);
  const [coachExpanded, setCoachExpanded] = useState(coachingOpen);
  const hasCoaching = Boolean(coaching?.trim()) || (strategies && strategies.length > 0);
  const c = STEP_CONFIG[step];

  useEffect(() => {
    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(opacity, { toValue: 1, duration: 450, useNativeDriver: true }),
        Animated.timing(translateY, { toValue: 0, duration: 450, useNativeDriver: true }),
      ]).start();
    }, delay);
    return () => clearTimeout(timer);
  }, [delay, opacity, translateY]);

  const handleToggle = () => { LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut); setExpanded(p => !p); };
  const handleCoachToggle = () => { LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut); setCoachExpanded(p => !p); };

  const preview = script.length > 28 ? `"${script.slice(0, 26)}..."` : `"${script}"`;

  return (
    <Animated.View style={[
      st.card,
      {
        backgroundColor:  c.cardBg,
        borderColor:      c.cardBorder,
        borderLeftWidth:  3,
        borderLeftColor:  c.accentBorder,
      },
      { opacity, transform: [{ translateY }] },
    ]}>
      {/* Header */}
      <Pressable onPress={handleToggle} style={st.header}>
        <View style={st.headerLeft}>
          <View style={[st.stepNum, { backgroundColor: c.numBg }]}>
            <Text style={st.stepNumText}>{c.num}</Text>
          </View>
          <View style={[st.badge, { backgroundColor: c.tintBg }]}>
            <View style={[st.badgeDot, { backgroundColor: c.dotColor }]} />
            <Text style={st.badgeText}>{step.toUpperCase()}</Text>
          </View>
        </View>
        <View style={st.headerRight}>
          {!expanded ? <Text style={st.preview} numberOfLines={1}>{preview}</Text> : null}
          <Text style={st.chevron}>{expanded ? '▲' : '▼'}</Text>
        </View>
      </Pressable>

      {/* Expanded */}
      {expanded ? (
        <View style={st.body}>
          <View style={st.actionWrap}>
            <View style={[st.actionBar, { backgroundColor: c.dotColor, opacity: 0.4 }]} />
            <Text style={st.action}>👋 {parent_action}</Text>
          </View>
          <Text style={st.sayLabel}>SAY THIS</Text>
          <Text style={st.script}>"{script}"</Text>

          {hasCoaching ? (
            <>
              <Pressable onPress={handleCoachToggle} style={({ pressed }) => [st.coachToggle, pressed && { opacity: 0.7 }]}>
                <View style={[st.coachIcon, { backgroundColor: c.tintBg }]}>
                  <Text style={{ fontSize: 12 }}>💡</Text>
                </View>
                <Text style={st.coachToggleText}>Why this works</Text>
                <Text style={st.coachChev}>{coachExpanded ? '▼' : '▶'}</Text>
              </Pressable>
              {coachExpanded ? (
                <View style={st.coachBody}>
                  {coaching ? <Text style={st.coachText}>{coaching}</Text> : null}
                  {strategies && strategies.length > 0 ? (
                    <View style={st.strats}>
                      {strategies.map((s, i) => (
                        <View key={i} style={st.stratRow}>
                          <View style={[st.stratDot, { backgroundColor: c.dotColor }]} />
                          <Text style={st.stratText}>{s}</Text>
                        </View>
                      ))}
                    </View>
                  ) : null}
                </View>
              ) : null}
            </>
          ) : null}
        </View>
      ) : null}
    </Animated.View>
  );
}

const st = StyleSheet.create({
  card: {
    borderRadius:    18,
    overflow:        'hidden',
    borderWidth:     1,
    borderTopColor:  C.borderHi,
    borderTopWidth:  1,
    shadowColor:     '#000000',
    shadowOffset:    { width: 0, height: 6 },
    shadowOpacity:   0.35,
    shadowRadius:    20,
    elevation:       4,
  },

  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, paddingHorizontal: 18 },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1, justifyContent: 'flex-end' },

  stepNum: {
    width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center',
  },
  stepNumText: { fontFamily: F.bold, fontSize: 13, color: '#FFFFFF' },

  badge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingVertical: 5, paddingHorizontal: 12, borderRadius: 10,
  },
  badgeDot: { width: 8, height: 8, borderRadius: 4 },
  badgeText: { fontFamily: F.label, fontSize: 10, letterSpacing: 0.8, color: C.text },

  preview: { fontFamily: F.bodyMedium, fontSize: 13, color: C.textMuted, maxWidth: 140 },
  chevron: { fontSize: 10, color: C.textFaint },

  body: { paddingHorizontal: 18, paddingBottom: 18, gap: 10 },

  actionWrap: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  actionBar: { width: 2, alignSelf: 'stretch', borderRadius: 1, marginTop: 2, marginBottom: 2 },
  action: { fontFamily: F.body, fontSize: 13, color: C.textSecondary, lineHeight: 20, flex: 1, fontStyle: 'italic' },

  sayLabel: { fontFamily: F.label, fontSize: 9, letterSpacing: 0.8, color: C.textMuted, marginTop: 4 },
  script: { fontFamily: F.script, fontSize: 18, color: C.text, lineHeight: 28 },

  coachToggle: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingTop: 14, borderTopWidth: 1, borderTopColor: C.divider, marginTop: 4,
  },
  coachIcon: { width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  coachToggleText: { fontFamily: F.bodyMedium, fontSize: 12, color: C.textMuted, flex: 1 },
  coachChev: { fontSize: 8, color: C.textFaint },

  coachBody: { gap: 8, marginTop: 4 },
  coachText: { fontFamily: F.body, fontSize: 14, color: C.textSecondary, lineHeight: 22 },
  strats: { gap: 5 },
  stratRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  stratDot: { width: 5, height: 5, borderRadius: 3, marginTop: 7, opacity: 0.7 },
  stratText: { fontFamily: F.body, fontSize: 13, color: C.textSecondary, lineHeight: 20, flex: 1 },
});
