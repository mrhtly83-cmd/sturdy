// app/child/new.tsx
// v7 — Add child profile
// Arrow age picker + slider + contextual hint
// Neurotype: illustrated cards with icons + colored accent bars
// Logo palette throughout

import { useState } from 'react';
import {
  Dimensions,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { router }           from 'expo-router';
import { StatusBar }        from 'expo-status-bar';
import { SafeAreaView }     from 'react-native-safe-area-context';
import { LinearGradient }   from 'expo-linear-gradient';
import * as Haptics         from 'expo-haptics';
import { useAuth }          from '../../src/context/AuthContext';
import { useChildProfile }  from '../../src/context/ChildProfileContext';
import { supabase }         from '../../src/lib/supabase';
import { colors as C, fonts as F } from '../../src/theme/colors';

const { width: W } = Dimensions.get('window');
const MIN_AGE = 0;
const MAX_AGE = 17;

// ─── Neurotype data with icons + unique colors ───
const NEUROTYPES = [
  { key: 'ADHD',    icon: '⚡', label: 'ADHD',              desc: 'Moves fast, acts first, hard to wait',          color: C.coral,  bg: 'rgba(232,116,97,0.07)' },
  { key: 'Autism',  icon: '🧩', label: 'Autistic',          desc: 'Loves routine, notices everything',              color: C.blue,   bg: 'rgba(87,120,163,0.07)' },
  { key: 'Anxiety', icon: '🌧️', label: 'Anxiety',           desc: "Worries deeply, needs safety first",             color: C.peach,  bg: 'rgba(247,149,102,0.07)' },
  { key: 'Sensory', icon: '🎧', label: 'Sensory',           desc: 'Overwhelmed by noise, texture, crowds',          color: C.amber,  bg: 'rgba(212,148,74,0.07)' },
  { key: 'PDA',     icon: '🛡️', label: 'PDA',               desc: 'Fights any demand, needs autonomy',              color: C.sage,   bg: 'rgba(138,160,96,0.07)' },
  { key: '2e',      icon: '🌟', label: 'Twice exceptional', desc: 'Brilliant mind, big emotions',                   color: C.blueLight, bg: 'rgba(107,141,184,0.07)' },
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
function Stars({ count = 25 }: { count?: number }) {
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
export default function NewChildScreen() {
  const { session }        = useAuth();
  const { reloadChild }    = useChildProfile();
  const [name, setName]    = useState('');
  const [age, setAge]      = useState(5);
  const [neurotypes, setNeurotypes] = useState<NeurotypeKey[]>([]);
  const [notes, setNotes]  = useState('');
  const [error, setError]  = useState('');
  const [saving, setSaving] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [nameFocused, setNameFocused] = useState(false);

  const canSave = name.trim().length > 0;
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

  const handleSave = async () => {
    if (!canSave || saving || !session) return;
    setSaving(true); setError('');
    try {
      const preferences: Record<string, string> = {};
      if (notes.trim()) preferences.personality_notes = notes.trim();

      const { error: dbErr } = await supabase
        .from('child_profiles')
        .insert({
          user_id: session.user.id,
          name: name.trim(),
          child_age: age,
          age_band: age <= 4 ? '2-4' : age <= 7 ? '5-7' : '8-12',
          neurotype: neurotypes,
          preferences,
        });
      if (dbErr) throw dbErr;
      await reloadChild();
      router.replace('/(tabs)');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save. Please try again.');
    } finally { setSaving(false); }
  };

  return (
    <SafeAreaView style={st.root} edges={['top', 'bottom']}>
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

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={st.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          style={{ zIndex: 2 }}
        >
          {/* Back */}
          <Pressable onPress={() => router.back()} style={({ pressed }) => [st.back, pressed && { opacity: 0.6 }]}>
            <Text style={st.backText}>← Back</Text>
          </Pressable>

          {/* Logo + Header */}
          <View style={st.logoWrap}>
            <Image source={require('../../assets/logo.png')} style={st.logo} resizeMode="contain" />
          </View>
          <View style={st.header}>
            <Text style={st.title}>Add a child</Text>
            <Text style={st.subtitle}>The more Sturdy knows, the better the scripts.</Text>
          </View>

          {/* ── Name + Age Card ── */}
          <LinearGradient
            colors={['rgba(255,255,255,0.08)', 'rgba(255,255,255,0.02)', 'rgba(0,0,0,0.12)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 0.8, y: 1 }}
            style={st.formCard}
          >
            {/* Name */}
            <View style={st.field}>
              <Text style={st.fieldLabel}>Child's name</Text>
              <View style={[st.inputWrap, nameFocused && st.inputFocused]}>
                <TextInput
                  autoFocus
                  autoCapitalize="words"
                  autoCorrect={false}
                  placeholder="e.g. Emma"
                  placeholderTextColor="rgba(255,255,255,0.18)"
                  value={name}
                  onChangeText={v => { setName(v); if (error) setError(''); }}
                  onFocus={() => setNameFocused(true)}
                  onBlur={() => setNameFocused(false)}
                  style={st.nameInput}
                  returnKeyType="done"
                />
              </View>
            </View>

            {/* Age picker */}
            <View style={st.field}>
              <Text style={st.fieldLabel}>Age</Text>

              <View style={st.agePickerRow}>
                <Pressable
                  onPress={() => adjustAge(-1)}
                  disabled={age <= MIN_AGE}
                  style={({ pressed }) => [st.ageArrowBtn, age <= MIN_AGE && st.ageArrowDisabled, pressed && age > MIN_AGE && { opacity: 0.7 }]}
                >
                  <Text style={[st.ageArrowText, age <= MIN_AGE && st.ageArrowTextDisabled]}>‹</Text>
                </Pressable>

                <View style={st.ageDisplay}>
                  <Text style={st.ageNumber}>{age}</Text>
                  <Text style={st.ageUnit}>years old</Text>
                </View>

                <Pressable
                  onPress={() => adjustAge(1)}
                  disabled={age >= MAX_AGE}
                  style={({ pressed }) => [st.ageArrowBtn, age >= MAX_AGE && st.ageArrowDisabled, pressed && age < MAX_AGE && { opacity: 0.7 }]}
                >
                  <Text style={[st.ageArrowText, age >= MAX_AGE && st.ageArrowTextDisabled]}>›</Text>
                </Pressable>
              </View>

              {/* Slider */}
              <View style={st.sliderWrap}>
                <View style={st.sliderTrack}>
                  <LinearGradient
                    colors={[C.amber, C.peach]}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                    style={[st.sliderFill, { width: `${sliderProgress}%` as any }]}
                  />
                </View>
                <View style={st.sliderLabels}>
                  <Text style={st.sliderLabel}>{MIN_AGE}</Text>
                  <Text style={st.sliderLabel}>{MAX_AGE}</Text>
                </View>
              </View>

              {/* Hint */}
              <View style={st.hintCard}>
                <Text style={st.hintIcon}>😊</Text>
                <Text style={st.hintText}>{getAgeHint(age)}</Text>
              </View>
            </View>
          </LinearGradient>

        {/* ── Neurotype Section ── */}
          <View style={st.neuroSection}>
            <Text style={st.neuroSectionTitle}>Does your child have any of these?</Text>
            <Text style={st.neuroSectionSub}>Optional · swipe to browse, tap to select</Text>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={st.neuroCarousel}
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
                      st.neuroTile,
                      sel && { borderColor: `${n.color}50`, backgroundColor: n.bg },
                      pressed && { opacity: 0.8 },
                    ]}
                  >
                    {/* Top icon */}
                    <View style={[st.neuroTileIconWrap, { backgroundColor: sel ? `${n.color}20` : 'rgba(255,255,255,0.06)' }]}>
                      <Text style={st.neuroTileIcon}>{n.icon}</Text>
                    </View>

                    {/* Label */}
                    <Text style={[st.neuroTileLabel, sel && { color: n.color }]}>{n.label}</Text>

                    {/* Description */}
                    <Text style={[st.neuroTileDesc, sel && { color: 'rgba(255,255,255,0.50)' }]}>{n.desc}</Text>

                    {/* Selected indicator */}
                    {sel && (
                      <View style={[st.neuroTileCheck, { backgroundColor: n.color }]}>
                        <Text style={st.neuroTileCheckText}>✓</Text>
                      </View>
                    )}

                    {/* Bottom color bar */}
                    <View style={[st.neuroTileBar, { backgroundColor: sel ? n.color : 'rgba(255,255,255,0.06)' }]} />
                  </Pressable>
                );
              })}
            </ScrollView>

            {neurotypes.length > 0 && (
              <View style={st.neuroNote}>
                <Text style={st.neuroNoteIcon}>🤫</Text>
                <Text style={st.neuroNoteText}>
                  Scripts will quietly adapt for {neurotypes.join(' + ')} — your child is never labelled.
                </Text>
              </View>
            )}
          </View>

          {/* ── Personality Notes ── */}
          <Pressable onPress={() => setShowNotes(v => !v)} style={st.notesToggle}>
            <Text style={st.notesToggleText}>
              {showNotes ? '▾' : '▸'} Add personality notes
              <Text style={st.notesToggleSub}> (optional)</Text>
            </Text>
          </Pressable>

          {showNotes && (
            <LinearGradient
              colors={['rgba(255,255,255,0.06)', 'rgba(255,255,255,0.02)', 'rgba(0,0,0,0.10)']}
              start={{ x: 0, y: 0 }} end={{ x: 0.8, y: 1 }}
              style={st.notesCard}
            >
              <Text style={st.notesLabel}>PERSONALITY & WHAT HELPS</Text>
              <TextInput
                multiline
                numberOfLines={4}
                placeholder="e.g. Very sensitive to tone of voice. Needs 5 min warning before transitions."
                placeholderTextColor="rgba(255,255,255,0.18)"
                value={notes}
                onChangeText={setNotes}
                style={st.notesInput}
                textAlignVertical="top"
              />
              <Text style={st.notesHint}>This helps Claude write scripts that feel personal.</Text>
            </LinearGradient>
          )}

          {error ? <Text style={st.error}>{error}</Text> : null}

          <View style={{ height: 100 }} />
        </ScrollView>

        {/* ── Fixed Footer ── */}
        <View style={st.footer}>
          <Pressable
            onPress={handleSave}
            disabled={!canSave || saving}
            style={({ pressed }) => [
              pressed && canSave && { opacity: 0.9, transform: [{ scale: 0.98 }] },
              (!canSave || saving) && { opacity: 0.35 },
            ]}
          >
            <LinearGradient
              colors={canSave ? ['#C8883A', '#E8A855'] : ['rgba(255,255,255,0.06)', 'rgba(255,255,255,0.04)']}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              style={st.saveBtn}
            >
              <Text style={st.saveBtnText}>{saving ? 'Saving…' : 'Add child'}</Text>
            </LinearGradient>
          </Pressable>

          <Pressable onPress={() => router.replace('/(tabs)')} style={st.skipBtn}>
            <Text style={st.skipText}>Skip for now</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ─── Styles ───
const st = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0e0a10' },
  scroll: { paddingHorizontal: 24, paddingTop: 12, paddingBottom: 24, gap: 20 },

  back: { alignSelf: 'flex-start', paddingVertical: 6 },
  backText: { fontFamily: F.bodyMedium, fontSize: 16, color: 'rgba(255,255,255,0.30)' },

  logoWrap: { alignItems: 'center' },
  logo: { width: 44, height: 44 },

  header: { alignItems: 'center', gap: 6 },
  title: { fontFamily: F.heading, fontSize: 26, color: C.text, textAlign: 'center', letterSpacing: -0.3 },
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

  // ── Neurotype carousel (these 5 were missing) ──
  neuroSection: { gap: 12 },
  neuroSectionTitle: { fontFamily: F.bodyMedium, fontSize: 16, color: C.textBody },
  neuroSectionSub: { fontFamily: F.body, fontSize: 13, color: C.textMuted, marginTop: -6 },
  neuroNote: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, backgroundColor: 'rgba(87,120,163,0.08)', borderRadius: 14, padding: 14, borderWidth: 1, borderColor: 'rgba(87,120,163,0.15)' },
  neuroNoteIcon: { fontSize: 18, marginTop: 1 },
  neuroNoteText: { fontFamily: F.body, fontSize: 13, color: C.textSub, flex: 1, lineHeight: 20 },

  neuroCarousel: { paddingHorizontal: 4, gap: 10 },
  neuroTile: { width: W * 0.42, borderRadius: 20, padding: 16, backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)', gap: 10, alignItems: 'center', overflow: 'hidden' },
  neuroTileIconWrap: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  neuroTileIcon: { fontSize: 24 },
  neuroTileLabel: { fontFamily: F.bodySemi, fontSize: 14, color: C.textSub, textAlign: 'center' },
  neuroTileDesc: { fontFamily: F.body, fontSize: 12, color: C.textMuted, textAlign: 'center', lineHeight: 17 },
  neuroTileCheck: { position: 'absolute', top: 10, right: 10, width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  neuroTileCheckText: { fontSize: 12, color: '#FFFFFF', fontWeight: '700' },
  neuroTileBar: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 3, borderBottomLeftRadius: 20, borderBottomRightRadius: 20 },

  notesToggle: { paddingVertical: 4 },
  notesToggleText: { fontFamily: F.bodyMedium, fontSize: 14, color: C.textMuted },
  notesToggleSub: { fontFamily: F.body, fontSize: 13, color: C.textGhost },

  notesCard: { borderRadius: 24, padding: 22, gap: 12, borderWidth: 1, borderTopColor: 'rgba(255,255,255,0.12)', borderLeftColor: 'rgba(255,255,255,0.06)', borderRightColor: 'rgba(0,0,0,0.06)', borderBottomColor: 'rgba(0,0,0,0.10)' },
  notesLabel: { fontFamily: F.label, fontSize: 10, letterSpacing: 0.8, color: C.textMuted },
  notesInput: { fontFamily: F.body, fontSize: 15, color: C.text, lineHeight: 24, minHeight: 100 },
  notesHint: { fontFamily: F.body, fontSize: 12, color: C.textMuted, fontStyle: 'italic' },

  error: { fontFamily: F.body, fontSize: 13, color: C.coral },

  footer: { paddingHorizontal: 24, paddingVertical: 14, paddingBottom: 28, gap: 10, alignItems: 'center' },
  saveBtn: { width: W - 48, minHeight: 56, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  saveBtnText: { fontFamily: F.subheading, fontSize: 16, color: '#FFFFFF', letterSpacing: 0.3 },
  skipBtn: { paddingVertical: 8 },
  skipText: { fontFamily: F.body, fontSize: 14, color: C.textMuted },
});