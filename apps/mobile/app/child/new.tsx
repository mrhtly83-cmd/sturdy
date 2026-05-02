// app/child/new.tsx
// v8 — Add child profile
// Arrow age picker + slider + contextual hint + optional personality notes.
// Per docs/PRODUCT_PRINCIPLES.md §1: no neurotype selection UI.

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


// ─── Main ───
export default function NewChildScreen() {
  const { session }        = useAuth();
  const { reloadChild }    = useChildProfile();
  const [name, setName]    = useState('');
  const [age, setAge]      = useState(5);
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

      {/* Background — C-2 fast-fade gradient */}
      <LinearGradient
        colors={[
          C.gradientTop,
          C.gradientMid1,
          C.gradientMid2,
          C.gradientMid3,
          C.gradientMid4,
          C.gradientBottom,
        ]}
        locations={[0, 0.14, 0.28, 0.42, 0.58, 1]}
        style={StyleSheet.absoluteFill}
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
          <View style={st.formCard}>
            {/* Name */}
            <View style={st.field}>
              <Text style={st.fieldLabel}>Child's name</Text>
              <View style={[st.inputWrap, nameFocused && st.inputFocused]}>
                <TextInput
                  autoFocus
                  autoCapitalize="words"
                  autoCorrect={false}
                  placeholder="e.g. Emma"
                  placeholderTextColor={C.inputPlaceholder}
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
                    colors={[C.amber, C.amberMid]}
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
          </View>

          {/* ── Personality Notes ── */}
          <Pressable onPress={() => setShowNotes(v => !v)} style={st.notesToggle}>
            <Text style={st.notesToggleText}>
              {showNotes ? '▾' : '▸'} Add personality notes
              <Text style={st.notesToggleSub}> (optional)</Text>
            </Text>
          </Pressable>

          {showNotes && (
            <View style={st.notesCard}>
              <Text style={st.notesLabel}>PERSONALITY & WHAT HELPS</Text>
              <TextInput
                multiline
                numberOfLines={4}
                placeholder="e.g. Very sensitive to tone of voice. Needs 5 min warning before transitions."
                placeholderTextColor={C.inputPlaceholder}
                value={notes}
                onChangeText={setNotes}
                style={st.notesInput}
                textAlignVertical="top"
              />
              <Text style={st.notesHint}>This helps Claude write scripts that feel personal.</Text>
            </View>
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
            {canSave ? (
              <LinearGradient
                colors={[C.amber, C.amberMid]}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={st.saveBtn}
              >
                <Text style={st.saveBtnText}>{saving ? 'Saving…' : 'Add child'}</Text>
              </LinearGradient>
            ) : (
              <View style={[st.saveBtn, st.saveBtnDisabled]}>
                <Text style={[st.saveBtnText, { color: C.disabledText }]}>
                  {saving ? 'Saving…' : 'Add child'}
                </Text>
              </View>
            )}
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
  root: { flex: 1, backgroundColor: C.background },
  scroll: { paddingHorizontal: 24, paddingTop: 12, paddingBottom: 24, gap: 20 },

  back:     { alignSelf: 'flex-start', paddingVertical: 6 },
  backText: { fontFamily: F.bodyMedium, fontSize: 16, color: C.textSecondary },

  logoWrap: { alignItems: 'center' },
  logo:     { width: 44, height: 44 },

  header:   { alignItems: 'center', gap: 6 },
  title:    { fontFamily: F.heading, fontSize: 26, color: C.text, textAlign: 'center', letterSpacing: -0.3 },
  subtitle: { fontFamily: F.body, fontSize: 14, color: C.textSecondary, textAlign: 'center' },

  formCard: {
    backgroundColor: C.surface,
    borderRadius:    24,
    padding:         22,
    gap:             24,
    borderWidth:     1,
    borderColor:     C.border,
    borderTopWidth:  1,
    borderTopColor:  C.borderHi,
    shadowColor:     '#000000',
    shadowOffset:    { width: 0, height: 6 },
    shadowOpacity:   0.35,
    shadowRadius:    20,
    elevation:       4,
  },
  field:      { gap: 10 },
  fieldLabel: { fontFamily: F.bodyMedium, fontSize: 14, color: C.textSecondary },

  inputWrap: {
    borderRadius:    14,
    backgroundColor: C.inputBg,
    borderWidth:     1,
    borderColor:     C.inputBorder,
    borderTopWidth:  1,
    borderTopColor:  C.inputHighlight,
  },
  inputFocused: { borderColor: C.borderFocus },
  nameInput:    { fontFamily: F.body, fontSize: 16, color: C.text, paddingHorizontal: 16, paddingVertical: 13 },

  agePickerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 20 },
  ageArrowBtn: {
    width:           44,
    height:          44,
    borderRadius:    22,
    backgroundColor: C.chipBg,
    borderWidth:     1,
    borderColor:     C.chipBorder,
    alignItems:      'center',
    justifyContent:  'center',
  },
  ageArrowDisabled:     { opacity: 0.3 },
  ageArrowText:         { fontFamily: F.heading, fontSize: 22, color: C.text, marginTop: -2 },
  ageArrowTextDisabled: { color: C.textMuted },
  ageDisplay:           { alignItems: 'center', minWidth: 60 },
  ageNumber:            { fontFamily: F.heading, fontSize: 42, color: C.amber, lineHeight: 48 },
  ageUnit:              { fontFamily: F.body, fontSize: 13, color: C.textMuted, marginTop: -2 },

  sliderWrap:   { gap: 4 },
  sliderTrack:  { height: 4, borderRadius: 2, backgroundColor: C.divider, overflow: 'hidden' },
  sliderFill:   { height: 4, borderRadius: 2 },
  sliderLabels: { flexDirection: 'row', justifyContent: 'space-between' },
  sliderLabel:  { fontFamily: F.body, fontSize: 11, color: C.textMuted },

  hintCard: {
    flexDirection:     'row',
    alignItems:        'center',
    gap:               8,
    backgroundColor:   'rgba(200,136,58,0.08)',
    borderRadius:      12,
    borderWidth:       1,
    borderColor:       C.amberBorder,
    paddingHorizontal: 14,
    paddingVertical:   10,
  },
  hintIcon: { fontSize: 18 },
  hintText: { fontFamily: F.body, fontSize: 13, color: C.amberLight, flex: 1, lineHeight: 19 },

  notesToggle:     { paddingVertical: 4 },
  notesToggleText: { fontFamily: F.bodyMedium, fontSize: 14, color: C.textSecondary },
  notesToggleSub:  { fontFamily: F.body, fontSize: 13, color: C.textMuted },

  notesCard: {
    backgroundColor: C.surface,
    borderRadius:    24,
    padding:         22,
    gap:             12,
    borderWidth:     1,
    borderColor:     C.border,
    borderTopWidth:  1,
    borderTopColor:  C.borderHi,
  },
  notesLabel: { fontFamily: F.label, fontSize: 10, letterSpacing: 0.8, color: C.textMuted },
  notesInput: { fontFamily: F.body, fontSize: 15, color: C.text, lineHeight: 24, minHeight: 100 },
  notesHint:  { fontFamily: F.body, fontSize: 12, color: C.textMuted, fontStyle: 'italic' },

  error: { fontFamily: F.body, fontSize: 13, color: C.sos },

  footer: { paddingHorizontal: 24, paddingVertical: 14, paddingBottom: 28, gap: 10, alignItems: 'center' },
  saveBtn: {
    width:          W - 48,
    minHeight:      56,
    borderRadius:   18,
    alignItems:     'center',
    justifyContent: 'center',
    shadowColor:    C.amber,
    shadowOffset:   { width: 0, height: 6 },
    shadowOpacity:  0.35,
    shadowRadius:   20,
    elevation:      4,
  },
  saveBtnDisabled: { backgroundColor: C.disabled, shadowOpacity: 0, elevation: 0 },
  saveBtnText:     { fontFamily: F.subheading, fontSize: 16, color: '#FFFFFF', letterSpacing: 0.3 },
  skipBtn:         { paddingVertical: 8 },
  skipText:        { fontFamily: F.body, fontSize: 14, color: C.textMuted },
});