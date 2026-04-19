// src/components/features/TypingDemo.tsx
// Live typing demo: scenario types out, then Regulate/Connect/Guide cascade in
// Cycles through SCENARIOS automatically

import { useEffect, useRef, useState, useCallback } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { colors as C, fonts as F } from '../../theme';
import { SCENARIOS, type Scenario, type ScenarioStep } from '../../data/scenarios';export function TypingDemo() {
  const [scenarioIdx, setScenarioIdx]   = useState(0);
  const [displayText, setDisplayText]   = useState('');
  const [typingDone, setTypingDone]     = useState(false);
  const [visibleSteps, setVisibleSteps] = useState<boolean[]>([false, false, false]);

  const stepAnims = useRef([
    { opacity: new Animated.Value(0), slide: new Animated.Value(12) },
    { opacity: new Animated.Value(0), slide: new Animated.Value(12) },
    { opacity: new Animated.Value(0), slide: new Animated.Value(12) },
  ]).current;

  const cursorAnim  = useRef(new Animated.Value(1)).current;
  const fadeAnim    = useRef(new Animated.Value(1)).current;
  const mountedRef  = useRef(true);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    const blink = Animated.loop(
      Animated.sequence([
        Animated.timing(cursorAnim, { toValue: 0, duration: 400, useNativeDriver: true }),
        Animated.timing(cursorAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
      ])
    );
    blink.start();
    return () => { mountedRef.current = false; blink.stop(); };
  }, []);

  const clearAll = useCallback(() => {
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
    timeoutsRef.current.forEach(t => clearTimeout(t));
    timeoutsRef.current = [];
  }, []);

  const showStep = useCallback((idx: number) => {
    setVisibleSteps(prev => { const n = [...prev]; n[idx] = true; return n; });
    Animated.parallel([
      Animated.timing(stepAnims[idx].opacity, { toValue: 1, duration: 350, useNativeDriver: true }),
      Animated.timing(stepAnims[idx].slide, { toValue: 0, duration: 350, useNativeDriver: true }),
    ]).start();
  }, [stepAnims]);

  const resetAnims = useCallback(() => {
    stepAnims.forEach(a => { a.opacity.setValue(0); a.slide.setValue(12); });
    fadeAnim.setValue(1);
    setVisibleSteps([false, false, false]);
    setDisplayText('');
    setTypingDone(false);
  }, [stepAnims, fadeAnim]);

  const runScenario = useCallback((idx: number) => {
    clearAll(); resetAnims(); setScenarioIdx(idx);
    const text = SCENARIOS[idx].text;
    let charIdx = 0;
    intervalRef.current = setInterval(() => {
      if (!mountedRef.current) { clearAll(); return; }
      charIdx++;
      if (charIdx <= text.length) {
        setDisplayText(text.slice(0, charIdx));
      } else {
        if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
        setTypingDone(true);
        const t1 = setTimeout(() => { if (mountedRef.current) showStep(0); }, 500);
        const t2 = setTimeout(() => { if (mountedRef.current) showStep(1); }, 1200);
        const t3 = setTimeout(() => { if (mountedRef.current) showStep(2); }, 1900);
        const t4 = setTimeout(() => {
          if (!mountedRef.current) return;
          Animated.timing(fadeAnim, { toValue: 0, duration: 400, useNativeDriver: true }).start(() => {
            if (mountedRef.current) runScenario((idx + 1) % SCENARIOS.length);
          });
        }, 5500);
        timeoutsRef.current = [t1, t2, t3, t4];
      }
    }, 38);
  }, [clearAll, resetAnims, showStep, fadeAnim]);

  useEffect(() => {
    const t = setTimeout(() => { if (mountedRef.current) runScenario(0); }, 600);
    return () => { clearTimeout(t); clearAll(); mountedRef.current = false; };
  }, []);

  const scenario = SCENARIOS[scenarioIdx];

  return (
    <Animated.View style={[s.wrap, { opacity: fadeAnim }]}>
      {/* Scenario progress dots */}
      <View style={s.dots}>
        {SCENARIOS.map((_: unknown, i: number) => (
          <View key={i} style={[s.dot, scenarioIdx === i && s.dotActive]} />
        ))}
      </View>

      {/* Input card — the typing area */}
      <View style={s.inputCard}>
        <Text style={s.inputLabel}>WHAT'S HAPPENING</Text>
        <Text style={s.inputText}>
          {displayText}
          {!typingDone && (
            <Animated.Text style={[s.cursor, { opacity: cursorAnim }]}>|</Animated.Text>
          )}
        </Text>
      </View>

      {/* Cascading step cards */}
      {scenario.steps.map((step: typeof scenario.steps[number], i: number) => {
        if (!visibleSteps[i]) return null;
        return (
          <Animated.View
            key={`${scenarioIdx}-${i}`}
            style={{ opacity: stepAnims[i].opacity, transform: [{ translateY: stepAnims[i].slide }] }}
          >
            <View style={[s.stepCard, { backgroundColor: step.bg, borderColor: step.border }]}>
              <View style={s.stepHeader}>
                <View style={[s.stepDot, { backgroundColor: step.dot }]} />
                <Text style={[s.stepLabel, { color: step.dot }]}>{step.label}</Text>
              </View>
              <Text style={s.stepAction}>{step.action}</Text>
              <Text style={s.stepScript}>{step.script}</Text>
            </View>
          </Animated.View>
        );
      })}
    </Animated.View>
  );
}

const s = StyleSheet.create({
  wrap: { gap: 10 },

  dots: { flexDirection: 'row', gap: 6, justifyContent: 'center', marginBottom: 4 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.12)' },
  dotActive: { backgroundColor: C.coral },

  inputCard: {
    backgroundColor: 'rgba(255,255,255,0.055)',
    borderRadius: 18, padding: 16, gap: 8,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)',
  },
  inputLabel: { fontFamily: F.label, fontSize: 10, letterSpacing: 0.8, color: 'rgba(255,255,255,0.25)' },
  inputText: { fontFamily: F.bodyMedium, fontSize: 16, color: 'rgba(255,255,255,0.92)', lineHeight: 24, minHeight: 40 },
  cursor: { fontFamily: F.body, color: C.coral },

  stepCard: { borderRadius: 18, padding: 16, gap: 6, borderWidth: 1 },
  stepHeader: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  stepDot: { width: 7, height: 7, borderRadius: 4 },
  stepLabel: { fontFamily: F.label, fontSize: 10, letterSpacing: 0.7, fontWeight: '700' },
  stepAction: { fontFamily: F.body, fontSize: 13, color: 'rgba(255,255,255,0.45)', fontStyle: 'italic' },
  stepScript: { fontFamily: F.bodyMedium, fontSize: 16, color: 'rgba(255,255,255,0.88)', lineHeight: 24 },
});