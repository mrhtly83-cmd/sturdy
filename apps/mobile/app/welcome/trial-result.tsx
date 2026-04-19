// app/welcome/trial-result.tsx
// v7 — Night sky + amber CTA + glassmorphism pitch card
// Removed dark backgrounds, rewrote pitch copy
// Routes: Create account → /welcome/child-setup
//         Continue as guest → /(tabs) + marks GUEST_SEEN_KEY

import { useMemo, useState } from 'react';
import {
  Dimensions,
  LayoutAnimation,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  UIManager,
  View,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar }      from 'expo-status-bar';
import { SafeAreaView }   from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics       from 'expo-haptics';
import AsyncStorage       from '@react-native-async-storage/async-storage';
import { ScriptCard }     from '../../src/components/ui/ScriptCard';
import { Stars }          from '../../src/components/features/Stars';
import { colors as C, fonts as F } from '../../src/theme';

const { width: W } = Dimensions.get('window');
const GUEST_SEEN_KEY = 'sturdy_guest_seen_v1';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const FALLBACK = {
  situation_summary: 'A hard moment is happening right now.',
  regulate: { parent_action: 'Take one breath. Move closer.', script: "You're really upset right now.", coaching: '', strategies: [] as string[] },
  connect:  { parent_action: 'Stay calm. Hold the limit.',    script: "I can see this is hard. I'm here.", coaching: '', strategies: [] as string[] },
  guide:    { parent_action: 'Give one clear option.',        script: "Let's take one step at a time.", coaching: '', strategies: [] as string[] },
  avoid: ["Stop this right now", "Calm down", "You're fine"],
};

function isValid(v: unknown): boolean { return typeof v === 'string' && (v as string).trim().length > 4; }
type Params = {
  situationSummary?: string;
  regulateAction?: string; regulateScript?: string; regulateCoaching?: string; regulateStrategies?: string;
  connectAction?: string;  connectScript?: string;  connectCoaching?: string;  connectStrategies?: string;
  guideAction?: string;    guideScript?: string;    guideCoaching?: string;    guideStrategies?: string;
  avoid?: string;
};
const val = (v?: string | string[]) => Array.isArray(v) ? v[0] : v;
function parseStrategies(raw?: string): string[] {
  if (!raw) return [];
  try { const p = JSON.parse(raw); return Array.isArray(p) ? p : []; } catch { return []; }
}

export default function TrialResultScreen() {
  const params = useLocalSearchParams<Params>();
  const [avoidOpen, setAvoidOpen] = useState(false);

  const isFallback = !isValid(val(params.regulateScript));

  const script = {
    situation_summary: isValid(val(params.situationSummary)) ? val(params.situationSummary)! : FALLBACK.situation_summary,
    regulate: isValid(val(params.regulateScript))
      ? { parent_action: val(params.regulateAction) ?? '', script: val(params.regulateScript)!, coaching: val(params.regulateCoaching) ?? '', strategies: parseStrategies(val(params.regulateStrategies)) }
      : FALLBACK.regulate,
    connect: isValid(val(params.connectScript))
      ? { parent_action: val(params.connectAction) ?? '', script: val(params.connectScript)!, coaching: val(params.connectCoaching) ?? '', strategies: parseStrategies(val(params.connectStrategies)) }
      : FALLBACK.connect,
    guide: isValid(val(params.guideScript))
      ? { parent_action: val(params.guideAction) ?? '', script: val(params.guideScript)!, coaching: val(params.guideCoaching) ?? '', strategies: parseStrategies(val(params.guideStrategies)) }
      : FALLBACK.guide,
    avoid: (() => {
      try { const raw = val(params.avoid); if (!raw) return FALLBACK.avoid; const p = JSON.parse(raw); return Array.isArray(p) ? p : FALLBACK.avoid; }
      catch { return FALLBACK.avoid; }
    })(),
  };

  const scriptId = useMemo(() => `trial-${Date.now()}`, [params.regulateScript]);

  const toggleAvoid = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setAvoidOpen(prev => !prev);
  };

  const handleCreateAccount = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/welcome/child-setup');
  };

  const handleGuest = async () => {
    await AsyncStorage.setItem(GUEST_SEEN_KEY, 'true');
    router.replace('/(tabs)');
  };

  return (
    <SafeAreaView style={s.root} edges={['top', 'bottom']}>
      <StatusBar style="light" />

      {/* Background */}
      <LinearGradient
        colors={['#0e0a10', '#14101a', '#1a1622', '#1e1a28', '#201c2a', '#1e1a24', '#1a1620', '#18141e', '#14101a']}
        locations={[0, 0.10, 0.22, 0.35, 0.48, 0.60, 0.72, 0.85, 1]}
        style={StyleSheet.absoluteFill}
      />
      <Stars />
      <LinearGradient
        colors={['transparent', 'rgba(212,148,74,0.03)', 'rgba(212,148,74,0.06)']}
        locations={[0, 0.5, 1]}
        style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '40%', zIndex: 1 }}
        pointerEvents="none"
      />

      <ScrollView
        contentContainerStyle={s.scroll}
        showsVerticalScrollIndicator={false}
        style={{ zIndex: 2 }}
      >
        {/* Back */}
        <Pressable onPress={() => router.back()} style={s.back}>
          <Text style={s.backText}>← Back</Text>
        </Pressable>

        {/* Fallback notice */}
        {isFallback ? (
          <LinearGradient
            colors={['rgba(138,160,96,0.10)', 'rgba(138,160,96,0.04)']}
            style={s.fallbackCard}
          >
            <Text style={{ fontSize: 18 }}>🌿</Text>
            <View style={{ flex: 1, gap: 3 }}>
              <Text style={s.fallbackTitle}>Couldn't connect right now</Text>
              <Text style={s.fallbackBody}>Here's a general script to start with.</Text>
            </View>
          </LinearGradient>
        ) : null}

        {/* Situation summary */}
        <Text style={s.summary}>{script.situation_summary}</Text>

        {/* Avoid */}
        <Pressable onPress={toggleAvoid} style={s.avoidHeader}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Text style={{ fontSize: 14 }}>⚠️</Text>
            <Text style={s.avoidLabel}>AVOID SAYING</Text>
          </View>
          <Text style={s.avoidChev}>{avoidOpen ? '▲' : '▼'}</Text>
        </Pressable>
        {avoidOpen ? (
          <View style={s.avoidBody}>
            {script.avoid.map((phrase, i) => (
              <View key={i} style={{ flexDirection: 'row', gap: 8, alignItems: 'flex-start' }}>
                <Text style={s.avoidX}>✕</Text>
                <Text style={s.avoidText}>{phrase}</Text>
              </View>
            ))}
          </View>
        ) : null}

        {/* Script cards */}
        <ScriptCard key={`r-${scriptId}`} step="Regulate" parent_action={script.regulate.parent_action} script={script.regulate.script} coaching={script.regulate.coaching} strategies={script.regulate.strategies} delay={0}   defaultOpen coachingOpen={false} />
        <ScriptCard key={`c-${scriptId}`} step="Connect"  parent_action={script.connect.parent_action}  script={script.connect.script}  coaching={script.connect.coaching}  strategies={script.connect.strategies}  delay={150} defaultOpen={false} coachingOpen={false} />
        <ScriptCard key={`g-${scriptId}`} step="Guide"    parent_action={script.guide.parent_action}    script={script.guide.script}    coaching={script.guide.coaching}    strategies={script.guide.strategies}    delay={300} defaultOpen={false} coachingOpen={false} />

        {/* ── Pitch card — sage/amber glassmorphism, no dark BG ── */}
        <LinearGradient
          colors={['rgba(138,160,96,0.10)', 'rgba(212,148,74,0.08)', 'rgba(212,148,74,0.04)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={s.pitchCard}
        >
          <View style={s.pitchIconRow}>
            <View style={s.pitchIcon}><Text style={s.pitchEmoji}>✨</Text></View>
          </View>
          <Text style={s.pitchTitle}>This is just the start.</Text>
          <Text style={s.pitchBody}>
            Sturdy learns your child over time — their triggers, what calms them, what works.
          </Text>
          <Text style={s.pitchSubline}>Your next script will be even more personal.</Text>
        </LinearGradient>

        <View style={{ height: 200 }} />
      </ScrollView>

      {/* ── Sticky footer — amber gradient CTA ── */}
      <View style={s.footer}>
        <LinearGradient
          colors={['transparent', 'rgba(14,10,16,0.95)', '#0e0a10']}
          locations={[0, 0.35, 0.75]}
          style={s.footerFade}
          pointerEvents="none"
        />
        <View style={s.footerContent}>
          <View style={s.btnGlow} />
          <Pressable
            onPress={handleCreateAccount}
            style={({ pressed }) => [pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] }]}
          >
            <LinearGradient
              colors={['#C8883A', '#E8A855']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={s.primaryBtn}
            >
              <Text style={s.primaryBtnText}>Create your free account</Text>
            </LinearGradient>
          </Pressable>

          <Pressable onPress={handleGuest} style={s.guestBtn}>
            <Text style={s.guestText}>Continue as guest</Text>
          </Pressable>

          <View style={s.siRow}>
            <Text style={s.siGrey}>Already have an account? </Text>
            <Pressable onPress={() => router.push('/auth/sign-in')}>
              <Text style={s.siLink}>Sign in</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0e0a10' },
  scroll: { paddingHorizontal: 24, paddingTop: 8, paddingBottom: 24, gap: 14 },

  back: { alignSelf: 'flex-start', paddingVertical: 6 },
  backText: { fontFamily: F.bodyMedium, fontSize: 15, color: C.textMuted },

  fallbackCard: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 10,
    borderRadius: 16, padding: 14,
    borderWidth: 1, borderColor: 'rgba(138,160,96,0.20)',
  },
  fallbackTitle: { fontFamily: F.bodySemi, fontSize: 14, color: C.sage },
  fallbackBody:  { fontFamily: F.body, fontSize: 13, color: C.textSub },

  summary: {
    fontFamily: F.scriptItalic,
    fontSize: 20, color: C.peach, lineHeight: 29,
    paddingVertical: 4,
  },

  avoidHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: 14, borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)',
  },
  avoidLabel: { fontFamily: F.bodySemi, fontSize: 12, letterSpacing: 0.6, color: C.coral },
  avoidChev: { fontSize: 10, color: C.textMuted },
  avoidBody: { paddingHorizontal: 16, paddingVertical: 8, gap: 8 },
  avoidX: { fontFamily: F.bodySemi, fontSize: 11, color: C.coral, marginTop: 3 },
  avoidText: { fontFamily: F.body, fontSize: 14, color: C.textSub, lineHeight: 21, flex: 1 },

  // ── Pitch card ──
  pitchCard: {
    borderRadius: 24,
    paddingVertical: 28, paddingHorizontal: 22,
    alignItems: 'center', gap: 10,
    borderWidth: 1,
    borderTopColor: 'rgba(212,148,74,0.25)',
    borderLeftColor: 'rgba(212,148,74,0.12)',
    borderRightColor: 'rgba(0,0,0,0.10)',
    borderBottomColor: 'rgba(0,0,0,0.12)',
    marginTop: 8,
  },
  pitchIconRow: { alignItems: 'center', marginBottom: 4 },
  pitchIcon: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: 'rgba(212,148,74,0.15)',
    borderWidth: 1, borderColor: 'rgba(212,148,74,0.30)',
    alignItems: 'center', justifyContent: 'center',
  },
  pitchEmoji: { fontSize: 22 },
  pitchTitle: {
    fontFamily: F.heading, fontSize: 22, color: C.text,
    textAlign: 'center', letterSpacing: -0.3,
  },
  pitchBody: {
    fontFamily: F.body, fontSize: 14, color: C.textBody,
    textAlign: 'center', lineHeight: 22, paddingHorizontal: 4,
  },
  pitchSubline: {
    fontFamily: F.scriptItalic, fontSize: 14,
    color: C.amber, textAlign: 'center', marginTop: 4,
  },

  // ── Footer ──
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 10 },
  footerFade: { height: 40 },
  footerContent: {
    backgroundColor: '#0e0a10',
    paddingHorizontal: 24, paddingBottom: 28, paddingTop: 4,
    gap: 10, alignItems: 'center',
  },
  btnGlow: {
    position: 'absolute', top: 0, alignSelf: 'center',
    width: W * 0.6, height: 60, borderRadius: 30,
    backgroundColor: 'rgba(200,136,58,0.12)',
  },
  primaryBtn: {
    width: W - 48, minHeight: 56, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center',
  },
  primaryBtnText: { fontFamily: F.subheading, fontSize: 16, color: '#FFFFFF', letterSpacing: 0.3 },

  guestBtn: { paddingVertical: 6 },
  guestText: { fontFamily: F.bodyMedium, fontSize: 14, color: C.textMuted },

  siRow: { flexDirection: 'row', alignItems: 'center' },
  siGrey: { fontFamily: F.body, fontSize: 13, color: C.textMuted },
  siLink: { fontFamily: F.bodySemi, fontSize: 13, color: C.amber, textDecorationLine: 'underline' },
});

