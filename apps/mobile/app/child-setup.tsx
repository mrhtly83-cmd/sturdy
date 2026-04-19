// app/child-setup.tsx
// v8 — Arrow age picker + slider + neurotype carousel
// Logo palette: Blue #5778A3, Coral #E87461, Sage #8AA060, Amber #D4944A

import { useState } from 'react';
import {
  Dimensions,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import AsyncStorage      from '@react-native-async-storage/async-storage';
import { router }        from 'expo-router';
import { StatusBar }     from 'expo-status-bar';
import { SafeAreaView }  from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics      from 'expo-haptics';
import { useAuth }         from '../src/context/AuthContext';
import { useChildProfile } from '../src/context/ChildProfileContext';
import { supabase }        from '../src/lib/supabase';
import { colors as C, fonts as F } from '../src/theme/colors';

const { width: W } = Dimensions.get('window');
const MIN_AGE = 0;
const MAX_AGE = 17;

// ─── Neurotype data ───
const NEUROTYPES = [
  { key: 'ADHD',    icon: '⚡', label: 'ADHD',              desc: 'Moves fast, acts first, hard to wait',   color: C.coral,     bg: 'rgba(232,116,97,0.07)' },
  { key: 'Autism',  icon: '🧩', label: 'Autistic',          desc: 'Loves routine, notices everything',       color: C.blue,      bg: 'rgba(87,120,163,0.07)' },
  { key: 'Anxiety', icon: '🌧️', label: 'Anxiety',           desc: 'Worries deeply, needs safety first',      color: C.peach,     bg: 'rgba(247,149,102,0.07)' },
  { key: 'Sensory', icon: '🎧', label: 'Sensory',           desc: 'Overwhelmed by noise, texture, crowds',   color: C.amber,     bg: 'rgba(212,148,74,0.07)' },
  { key: 'PDA',     icon: '🛡️', label: 'PDA',               desc: 'Fights any demand, needs autonomy',       color: C.sage,      bg: 'rgba(138,160,96,0.07)' },
  { key: '2e',      icon: '🌟', label: 'Twice exceptional', desc: 'Brilliant mind, big emotions',            color: C.blueLight, bg: 'rgba(107,141,184,0.07)' },
] as const;

type NeurotypeKey = typeof NEUROTYPES[number]['key'];

// ─── Age hint ───
function getAgeHint(age: number): string {
  if (age <= 1) return 'Sturdy will use soothing tones and simple comfort';
  if (age <= 3) return 'Sturdy will use simple language and playful approaches';
  if (age <= 5) return 'Sturdy will use short sentences and concrete choices';
  if (age <= 8) return 'Sturdy will use clear explanations and respectful tone';
  if (age <= 11) return 'Sturdy will use reasoning and responsibility language';
  if (age <= 14) return 'Sturdy will use collaborative and respectful dialogue';
  return 'Sturdy will use near-adult tone with warmth and respect';
}

// ─── Stars ───
function Stars({ count = 30 }: { count?: number }) {
  const [stars] = useState(() =>
    Array.from({ length: count }, () => ({
      top: Math.random() * 40, left: Math.random() * 100,
      size: Math.random() * 1.8 + 0.4, opacity: Math.random() * 0.2 + 0.04,
    }))
  );
  return (
    <View style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '40%', zIndex: 1 }} pointerEvents="none">
      {stars.map((s, i) => (
        <View key={i} style={{ position: 'absolute', top: `${s.top}%` as any, left: `${s.left}%` as any, width: s.size, height: s.size, opacity: s.opacity, borderRadius: 10, backgroundColor: '#FFF' }} />
      ))}
    </View>
  );
}

// ─── Main ───
export default function ChildSetupScreen() {
  const { session }        = useAuth();
  const { setActiveChild } = useChildProfile();
  const [name, setName]    = useState('');
  const [age, setAge]      = useState(5);
  const [neurotypes, setNeurotypes] = useState<NeurotypeKey[]>([]);
  const [error, setError]  = useState('');
  const [saving, setSaving] = useState(false);
  const [nameFocused, setNameFocused] = useState(false);

  const canContinue = age >= MIN_AGE && age <= MAX_AGE;
  const sliderProgress = (age / MAX_AGE) * 100;

  const adjustAge = (delta: number) => {
    const next = age + delta;
    if (next < MIN_AGE || next > MAX_AGE) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setAge(next);
  };

  const toggleNeurotype = (key: NeurotypeKey) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setNeurotypes(prev =>
      prev.includes(key) ? prev.filter(n => n !== key) : [...prev, key]
    );
  };

  const handleContinue = async () => {
    if (!canContinue || saving) return;
    const trimmed = name.trim();
    setSaving(true);
    setError('');
    try {
      if (session) {
        const { error: dbErr } = await supabase
          .from('child_profiles')
          .insert({
            user_id: session.user.id,
            name: trimmed || 'My child',
            child_age: age,
            age_band: age <= 4 ? '2-4' : age <= 7 ? '5-7' : '8-12',
            neurotype: neurotypes,
          });
        if (dbErr) throw dbErr;
      } else {
        await AsyncStorage.setItem(
          'sturdy_guest_child',
          JSON.stringify({ name: trimmed, childAge: age, neurotype: neurotypes }),
        );
      }
      setActiveChild({ name: trimmed || '', childAge: age, neurotype: null });
      router.replace('/(tabs)');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleSkip = async () => {
    await AsyncStorage.setItem('sturdy_guest_child', JSON.stringify({ name: '', childAge: 5 }));
    setActiveChild({ name: '', childAge: 5, neurotype: null });
    router.replace('/(tabs)');
  };

  return (
    <SafeAreaView style={s.root} edges={['top', 'bottom']}>
      <StatusBar style="light" />

      <LinearGradient
        colors={['#0e0a10', '#14101a', '#1a1622', '#1e1a28', '#201c2a', '#1e1a24', '#1a1620', '#18141e', '#14101a']}
        locations={[0, 0.10, 0.22, 0.35, 0.48, 0.60, 0.72, 0.85, 1]}
        style={StyleSheet.absoluteFill}
      />
      <Stars />
      <LinearGradient
        colors={['transparent', 'rgba(212,148,74,0.03)', 'rgba(212,148,74,0.06)']}
        locations={[0, 0.5, 1]}
        style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '45%', zIndex: 1 }}
        pointerEvents="none"
      />

      <ScrollView
        contentContainerStyle={s.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        style={{ zIndex: 2 }}
      >
        {/* Logo */}
        <View style={s.logoWrap}>
          <Image source={require('../assets/logo.png')} style={s.logo} resizeMode="contain" />
        </View>

        {/* Header */}
        <View style={s.header}>
          <Text style={s.title}>Tell us about your child</Text>
          <Text style={s.subtitle}>This helps Sturdy give age-specific guidance</Text>
        </View>

        {/* ── Form Card ── */}
        <LinearGradient
          colors={['rgba(255,255,255,0.08)', 'rgba(255,255,255,0.02)', 'rgba(0,0,0,0.12)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 0.8, y: 1 }}
          style={s.formCard}
        >
          {/* Name */}
          <View style={s.field}>
            <Text style={s.fieldLabel}>Child's name</Text>
            <View style={[s.inputWrap, nameFocused && s.inputFocused]}>
              <TextInput
                autoCapitalize="words"
                autoCorrect={false}
                placeholder="e.g. Emma"
                placeholderTextColor="rgba(255,255,255,0.18)"
                value={name}
                onChangeText={(v) => { setName(v); if (error) setError(''); }}
                onFocus={() => setNameFocused(true)}
                onBlur={() => setNameFocused(false)}
                style={s.nameInput}
              />
            </View>
          </View>

          {/* Age picker */}
          <View style={s.field}>
            <Text style={s.fieldLabel}>Age</Text>

            <View style={s.agePickerRow}>
              <Pressable
                onPress={() => adjustAge(-1)}
                disabled={age <= MIN_AGE}
                style={({ pressed }) => [s.ageArrowBtn, age <= MIN_AGE && s.ageArrowDisabled, pressed && age > MIN_AGE && { opacity: 0.7 }]}
              >
                <Text style={[s.ageArrowText, age <= MIN_AGE && s.ageArrowTextDisabled]}>‹</Text>
              </Pressable>

              <View style={s.ageDisplay}>
                <Text style={s.ageNumber}>{age}</Text>
                <Text style={s.ageUnit}>years old</Text>
              </View>

              <Pressable
                onPress={() => adjustAge(1)}
                disabled={age >= MAX_AGE}
                style={({ pressed }) => [s.ageArrowBtn, age >= MAX_AGE && s.ageArrowDisabled, pressed && age < MAX_AGE && { opacity: 0.7 }]}
              >
                <Text style={[s.ageArrowText, age >= MAX_AGE && s.ageArrowTextDisabled]}>›</Text>
              </Pressable>
            </View>

            <View style={s.sliderWrap}>
              <View style={s.sliderTrack}>
                <LinearGradient
                  colors={[C.amber, C.peach]}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                  style={[s.sliderFill, { width: `${sliderProgress}%` as any }]}
                />
              </View>
              <View style={s.sliderLabels}>
                <Text style={s.sliderLabel}>{MIN_AGE}</Text>
                <Text style={s.sliderLabel}>{MAX_AGE}</Text>
              </View>
            </View>

            <View style={s.hintCard}>
              <Text style={s.hintIcon}>😊</Text>
              <Text style={s.hintText}>{getAgeHint(age)}</Text>
            </View>
          </View>

          {error ? <Text style={s.error}>{error}</Text> : null}
        </LinearGradient>

        {/* ── Neurotype Carousel ── */}
        <View style={s.neuroSection}>
          <Text style={s.neuroSectionTitle}>Does your child have any of these?</Text>
          <Text style={s.neuroSectionSub}>Optional · swipe to browse, tap to select</Text>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={s.neuroCarousel}
            decelerationRate="fast"
            snapToInterval={W * 0.42 + 10}
          >
            {NEUROTYPES.map(n => {
              const sel = neurotypes.includes(n.key);
              return (
                <Pressable
                  key={n.key}
                  onPress={() => toggleNeurotype(n.key)}
                  style={({ pressed }) => [
                    s.neuroTile,
                    sel && { borderColor: `${n.color}50`, backgroundColor: n.bg },
                    pressed && { opacity: 0.8 },
                  ]}
                >
                  <View style={[s.neuroTileIconWrap, { backgroundColor: sel ? `${n.color}20` : 'rgba(255,255,255,0.06)' }]}>
                    <Text style={s.neuroTileIcon}>{n.icon}</Text>
                  </View>
                  <Text style={[s.neuroTileLabel, sel && { color: n.color }]}>{n.label}</Text>
                  <Text style={[s.neuroTileDesc, sel && { color: 'rgba(255,255,255,0.50)' }]}>{n.desc}</Text>
                  {sel && (
                    <View style={[s.neuroTileCheck, { backgroundColor: n.color }]}>
                      <Text style={s.neuroTileCheckText}>✓</Text>
                    </View>
                  )}
                  <View style={[s.neuroTileBar, { backgroundColor: sel ? n.color : 'rgba(255,255,255,0.06)' }]} />
                </Pressable>
              );
            })}
          </ScrollView>

          {neurotypes.length > 0 && (
            <View style={s.neuroNote}>
              <Text style={s.neuroNoteIcon}>🤫</Text>
              <Text style={s.neuroNoteText}>
                Scripts will quietly adapt for {neurotypes.join(' + ')} — your child is never labelled.
              </Text>
            </View>
          )}
        </View>

        {/* ── CTA ── */}
        <Pressable
          onPress={handleContinue}
          disabled={!canContinue || saving}
          style={({ pressed }) => [
            pressed && canContinue && { opacity: 0.9, transform: [{ scale: 0.98 }] },
          ]}
        >
          <LinearGradient
            colors={canContinue ? ['#C8883A', '#E8A855'] : ['rgba(255,255,255,0.06)', 'rgba(255,255,255,0.04)']}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={s.ctaBtn}
          >
            <Text style={[s.ctaText, !canContinue && { color: 'rgba(255,255,255,0.20)' }]}>
              {saving ? 'Saving…' : 'Continue'}
            </Text>
          </LinearGradient>
        </Pressable>

        {/* Skip */}
        <Pressable onPress={handleSkip} style={s.skipBtn}>
          <Text style={s.skipText}>Skip for now</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0e0a10' },
  content: { paddingHorizontal: 28, paddingTop: 24, paddingBottom: 40, gap: 24 },

  logoWrap: { alignItems: 'center' },
  logo: { width: 48, height: 48 },

  header: { alignItems: 'center', gap: 6 },
  title: { fontFamily: F.heading, fontSize: 26, color: C.text, textAlign: 'center', letterSpacing: -0.3, lineHeight: 34 },
  subtitle: { fontFamily: F.body, fontSize: 14, color: C.textSub, textAlign: 'center' },

  formCard: {
    borderRadius: 24, padding: 22, gap: 24, borderWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.18)', borderLeftColor: 'rgba(255,255,255,0.08)',
    borderRightColor: 'rgba(0,0,0,0.08)', borderBottomColor: 'rgba(0,0,0,0.12)',
  },

  field: { gap: 10 },
  fieldLabel: { fontFamily: F.bodyMedium, fontSize: 14, color: C.textBody },

  inputWrap: { borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  inputFocused: { borderColor: 'rgba(87,120,163,0.35)' },
  nameInput: { fontFamily: F.body, fontSize: 16, color: C.text, paddingHorizontal: 16, paddingVertical: 13 },

  agePickerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 20 },
  ageArrowBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)', alignItems: 'center', justifyContent: 'center' },
  ageArrowDisabled: { opacity: 0.3 },
  ageArrowText: { fontFamily: F.heading, fontSize: 22, color: C.textBody, marginTop: -2 },
  ageArrowTextDisabled: { color: C.textMuted },
  ageDisplay: { alignItems: 'center', minWidth: 60 },
  ageNumber: { fontFamily: F.heading, fontSize: 42, color: C.amber, lineHeight: 48 },
  ageUnit: { fontFamily: F.body, fontSize: 13, color: C.textMuted, marginTop: -2 },

  sliderWrap: { gap: 4 },
  sliderTrack: { height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.08)', overflow: 'hidden' },
  sliderFill: { height: 4, borderRadius: 2 },
  sliderLabels: { flexDirection: 'row', justifyContent: 'space-between' },
  sliderLabel: { fontFamily: F.body, fontSize: 11, color: C.textMuted },

  hintCard: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(138,160,96,0.08)', borderRadius: 12, borderWidth: 1, borderColor: 'rgba(138,160,96,0.15)', paddingHorizontal: 14, paddingVertical: 10 },
  hintIcon: { fontSize: 18 },
  hintText: { fontFamily: F.body, fontSize: 13, color: C.sage, flex: 1, lineHeight: 19 },

  error: { fontFamily: F.body, fontSize: 14, color: C.coral },

  // Neurotype carousel
  neuroSection: { gap: 12 },
  neuroSectionTitle: { fontFamily: F.bodyMedium, fontSize: 16, color: C.textBody },
  neuroSectionSub: { fontFamily: F.body, fontSize: 13, color: C.textMuted, marginTop: -6 },
  neuroCarousel: { paddingHorizontal: 4, gap: 10 },
  neuroTile: {
    width: W * 0.42, borderRadius: 20, padding: 16,
    backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)',
    gap: 10, alignItems: 'center', overflow: 'hidden',
  },
  neuroTileIconWrap: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  neuroTileIcon: { fontSize: 24 },
  neuroTileLabel: { fontFamily: F.bodySemi, fontSize: 14, color: C.textSub, textAlign: 'center' },
  neuroTileDesc: { fontFamily: F.body, fontSize: 12, color: C.textMuted, textAlign: 'center', lineHeight: 17 },
  neuroTileCheck: { position: 'absolute', top: 10, right: 10, width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  neuroTileCheckText: { fontSize: 12, color: '#FFFFFF', fontWeight: '700' },
  neuroTileBar: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 3, borderBottomLeftRadius: 20, borderBottomRightRadius: 20 },
  neuroNote: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, backgroundColor: 'rgba(87,120,163,0.08)', borderRadius: 14, padding: 14, borderWidth: 1, borderColor: 'rgba(87,120,163,0.15)' },
  neuroNoteIcon: { fontSize: 18, marginTop: 1 },
  neuroNoteText: { fontFamily: F.body, fontSize: 13, color: C.textSub, flex: 1, lineHeight: 20 },

  ctaBtn: { borderRadius: 18, minHeight: 56, alignItems: 'center', justifyContent: 'center' },
  ctaText: { fontFamily: F.subheading, fontSize: 17, color: '#FFFFFF', letterSpacing: 0.3 },

  skipBtn: { alignItems: 'center', paddingVertical: 4 },
  skipText: { fontFamily: F.body, fontSize: 14, color: C.textMuted },
});