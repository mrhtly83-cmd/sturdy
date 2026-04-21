// src/components/ui/ScriptCard.tsx
// v5 — Journal identity: frosted glass cards, dark text, Manrope

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
  num: string;
  dotColor: string;
  numBg: string;
  cardBg: string;
  cardBorder: string;
  tintBg: string;
}> = {
  Regulate: {
    num: '1', dotColor: '#C97B63', numBg: '#C97B63',
    cardBg: 'rgba(201,123,99,0.06)', cardBorder: 'rgba(201,123,99,0.15)',
    tintBg: 'rgba(201,123,99,0.04)',
  },
  Connect: {
    num: '2', dotColor: '#5778A3', numBg: '#5778A3',
    cardBg: 'rgba(87,120,163,0.06)', cardBorder: 'rgba(87,120,163,0.15)',
    tintBg: 'rgba(87,120,163,0.04)',
  },
  Guide: {
    num: '3', dotColor: '#81B29A', numBg: '#81B29A',
    cardBg: 'rgba(129,178,154,0.06)', cardBorder: 'rgba(129,178,154,0.15)',
    tintBg: 'rgba(129,178,154,0.04)',
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
        backgroundColor: expanded ? c.cardBg : 'rgba(255,255,255,0.5)',
        borderColor: expanded ? c.cardBorder : 'rgba(0,0,0,0.06)',
      },
      { opacity, transform: [{ translateY }] },
    ]}>
      {/* Header */}
      <Pressable onPress={handleToggle} style={st.header}>
        <View style={st.headerLeft}>
          <View style={[st.stepNum, { backgroundColor: c.numBg }]}>
            <Text style={st.stepNumText}>{c.num}</Text>
          </View>
          <View style={st.badge}>
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
            <View style={[st.actionBar, { backgroundColor: `${c.dotColor}30` }]} />
            <Text style={st.action}>👋 {parent_action}</Text>
          </View>
          <Text style={st.sayLabel}>SAY THIS</Text>
          <Text style={st.script}>"{script}"</Text>

          {hasCoaching ? (
            <>
              <Pressable onPress={handleCoachToggle} style={({ pressed }) => [st.coachToggle, pressed && { opacity: 0.7 }]}>
                <View style={[st.coachIcon, { backgroundColor: `${c.dotColor}15` }]}>
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
    borderRadius: 20, overflow: 'hidden',
  },

  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, paddingHorizontal: 18 },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1, justifyContent: 'flex-end' },

  stepNum: {
    width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 6, elevation: 3,
  },
  stepNumText: { fontFamily: 'Manrope-Bold', fontSize: 13, color: '#FFFFFF' },

  badge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingVertical: 5, paddingHorizontal: 12, borderRadius: 10,
    backgroundColor: 'rgba(0,0,0,0.03)', borderWidth: 1, borderColor: 'rgba(0,0,0,0.04)',
  },
  badgeDot: {
    width: 8, height: 8, borderRadius: 4,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.10, shadowRadius: 2, elevation: 1,
  },
  badgeText: { fontFamily: 'Manrope-SemiBold', fontSize: 10, letterSpacing: 0.8, color: 'rgba(42,37,32,0.45)' },

  preview: { fontFamily: 'Manrope-Medium', fontSize: 13, color: 'rgba(42,37,32,0.35)', maxWidth: 140 },
  chevron: { fontSize: 10, color: 'rgba(42,37,32,0.20)' },

  body: { paddingHorizontal: 18, paddingBottom: 18, gap: 10 },

  actionWrap: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  actionBar: { width: 2, alignSelf: 'stretch', borderRadius: 1, marginTop: 2, marginBottom: 2 },
  action: { fontFamily: 'Manrope-Medium', fontSize: 13, color: 'rgba(42,37,32,0.55)', lineHeight: 20, flex: 1 },

  sayLabel: { fontFamily: 'Manrope-SemiBold', fontSize: 9, letterSpacing: 0.8, color: 'rgba(42,37,32,0.25)', marginTop: 4 },
  script: { fontFamily: 'Manrope-Medium', fontSize: 18, color: '#2A2520', lineHeight: 28 },

  coachToggle: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingTop: 14, borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.04)', marginTop: 4,
  },
  coachIcon: { width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  coachToggleText: { fontFamily: 'Manrope-Medium', fontSize: 12, color: 'rgba(42,37,32,0.40)', flex: 1 },
  coachChev: { fontSize: 8, color: 'rgba(42,37,32,0.20)' },

  coachBody: { gap: 8, marginTop: 4 },
  coachText: { fontFamily: 'Manrope-Medium', fontSize: 14, color: 'rgba(42,37,32,0.60)', lineHeight: 22 },
  strats: { gap: 5 },
  stratRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  stratDot: { width: 5, height: 5, borderRadius: 3, marginTop: 7, opacity: 0.6 },
  stratText: { fontFamily: 'Manrope-Medium', fontSize: 13, color: 'rgba(42,37,32,0.45)', lineHeight: 20, flex: 1 },
});


