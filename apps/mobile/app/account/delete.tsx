// app/account/delete.tsx
//
// Permanent account deletion. Requires the parent to type the literal
// string "DELETE" (exact, case-sensitive) into the input — this is the
// only way to enable the CTA. On success, local tokens are cleared,
// signOut is fired-and-forgotten, and we route to welcome.

import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import AsyncStorage  from '@react-native-async-storage/async-storage';
import { router }    from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView }   from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { colors as C, fonts as F } from '../../src/theme';
import { supabase } from '../../src/lib/supabase';
import { deleteAccount } from '../../src/lib/accountApi';
import { resetOnboarding } from '../../src/utils/onboarding';

const GUEST_SEEN_KEY = 'sturdy_guest_seen_v1';


const CONFIRMATION = 'DELETE';

async function clearAuthStorage() {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const supabaseKeys = keys.filter(k => k.startsWith('sb-') || k.includes('supabase'));
    if (supabaseKeys.length > 0) await AsyncStorage.multiRemove(supabaseKeys);
  } catch {
    // best-effort
  }
}

export default function DeleteAccountScreen() {
  const [confirmText, setConfirmText] = useState('');
  const [submitting,  setSubmitting]  = useState(false);
  const [error,       setError]       = useState<string | null>(null);

  // Exact-match, case-sensitive — Delete / delete / DELETED all stay disabled.
  const canSubmit = confirmText === CONFIRMATION && !submitting;

  const onSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);

    const result = await deleteAccount(CONFIRMATION);
    if (!result.ok) {
      setError(result.error);
      setSubmitting(false);
      return;
    }

    // Deleted account → device should feel like a fresh install. Reset the
    // onboarding-complete flag and the guest-seen flag so when AuthGate
    // re-evaluates after the session drops, it sees done=false and routes
    // to /welcome (instead of /auth?mode=signin). Then clear Supabase
    // tokens and fire signOut to trigger AuthGate. No explicit router
    // call — AuthGate is the single source of truth for auth-based routing.
    await resetOnboarding();
    await AsyncStorage.removeItem(GUEST_SEEN_KEY).catch(() => {});
    await clearAuthStorage();
    await supabase.auth.signOut().catch(() => {});
  };

  return (
    <View style={s.root}>
      <StatusBar style="light" />
      <LinearGradient
        colors={[
          C.gradientResultTop,
          C.gradientResultMid1,
          C.gradientResultMid2,
          C.gradientResultMid3,
          C.gradientMid4,
          C.gradientBottom,
        ]}
        locations={[0, 0.10, 0.25, 0.42, 0.58, 1]}
        style={StyleSheet.absoluteFill}
      />
      <SafeAreaView style={s.safe} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
        <Pressable onPress={() => router.back()} style={s.closeBtn} hitSlop={16}>
          <Text style={s.closeText}>‹ Back</Text>
        </Pressable>

        <View style={s.body}>
          <Text style={s.heading}>Delete your account</Text>
          <Text style={s.bodyText}>
            This will permanently delete your account and all your data. This cannot be undone.
          </Text>
          <Text style={s.subText}>
            To confirm, type <Text style={s.subTextBold}>DELETE</Text> below.
          </Text>

          <TextInput
            value={confirmText}
            onChangeText={setConfirmText}
            autoCapitalize="characters"
            autoCorrect={false}
            spellCheck={false}
            textContentType="none"
            importantForAutofill="no"
            placeholder="DELETE"
            placeholderTextColor={C.textMuted}
            style={[
              s.input,
              { borderColor: confirmText ? 'rgba(232,116,97,0.40)' : 'rgba(255,255,255,0.07)' },
            ]}
          />
        </View>

        <View style={s.actions}>
          <Pressable
            onPress={onSubmit}
            disabled={!canSubmit}
            style={({ pressed }) => [
              s.cta,
              !canSubmit && s.ctaDisabled,
              canSubmit && pressed && { opacity: 0.92, transform: [{ scale: 0.98 }] },
            ]}
          >
            <Text style={[s.ctaText, !canSubmit && s.ctaTextDisabled]}>
              {submitting ? 'Deleting…' : 'Delete my account'}
            </Text>
          </Pressable>

          {error ? <Text style={s.errorText}>{error}</Text> : null}

          <Pressable onPress={() => router.back()} style={s.secondaryBtn} hitSlop={8}>
            <Text style={s.secondaryText}>Cancel</Text>
          </Pressable>
        </View>
      </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const s = StyleSheet.create({
  root:   { flex: 1, backgroundColor: C.background },
  safe:   { flex: 1, backgroundColor: 'transparent' },
  scroll: { padding: 24, paddingBottom: 40, gap: 24 },

  closeBtn:  { alignSelf: 'flex-start', paddingVertical: 8 },
  closeText: { fontFamily: F.bodyMedium, fontSize: 15, color: C.textMuted },

  body:        { gap: 14, paddingTop: 12 },
  heading:     { fontFamily: F.heading, fontSize: 28, color: C.text, letterSpacing: -0.4, lineHeight: 34 },
  bodyText:    { fontFamily: F.body, fontSize: 16, color: C.textSecondary, lineHeight: 24 },
  subText:     { fontFamily: F.body, fontSize: 14, color: C.textSecondary, lineHeight: 20, marginTop: 4 },
  subTextBold: { fontFamily: F.bodySemi, color: C.text },

  input: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    color: C.text,
    fontFamily: F.bodySemi,
    fontSize: 16,
    letterSpacing: 1.2,
    marginTop: 8,
  },

  actions: { gap: 12, marginTop: 12 },

  cta: {
    backgroundColor: C.sos,
    borderRadius: 18,
    paddingVertical: 16,
    alignItems: 'center',
  },
  ctaDisabled: {
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  ctaText:         { fontFamily: F.subheading, fontSize: 16, color: '#FFFFFF', letterSpacing: 0.3 },
  ctaTextDisabled: { color: 'rgba(255,255,255,0.20)' },

  errorText: { fontFamily: F.body, fontSize: 14, color: C.sos, textAlign: 'center' },

  secondaryBtn:  { paddingVertical: 14, alignItems: 'center' },
  secondaryText: { fontFamily: F.bodyMedium, fontSize: 14, color: C.textMuted },
});
