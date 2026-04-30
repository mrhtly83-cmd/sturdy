// app/account/pause.tsx
//
// Pause account screen. 30-day reversible suspension; auto-deleted at expiry
// by the scheduled-pause-cleanup Edge Function. The pause confirmation is
// the only Alert — every other failure surfaces inline below the CTA.

import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router }   from 'expo-router';
import { StatusBar }   from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { fonts as F } from '../../src/theme';
import { supabase } from '../../src/lib/supabase';
import { pauseAccount } from '../../src/lib/accountApi';

const BG          = '#0e0a10';
const TEXT        = 'rgba(255,255,255,0.92)';
const TEXT_SEC    = 'rgba(255,255,255,0.52)';
const TEXT_MUTED  = 'rgba(255,255,255,0.28)';
const CORAL       = '#E87461';
const AMBER_DEEP  = '#C8883A';
const AMBER_LIGHT = '#E8A855';

async function clearAuthStorage() {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const supabaseKeys = keys.filter(k => k.startsWith('sb-') || k.includes('supabase'));
    if (supabaseKeys.length > 0) await AsyncStorage.multiRemove(supabaseKeys);
  } catch {
    // best-effort; sign-out fallback below
  }
}

export default function PauseAccountScreen() {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]           = useState<string | null>(null);

  const doPause = async () => {
    setSubmitting(true);
    setError(null);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);

    const result = await pauseAccount();
    if (!result.ok) {
      setError(result.error);
      setSubmitting(false);
      return;
    }

    // Clear local tokens immediately (don't wait for server-side teardown).
    await clearAuthStorage();
    // Fire-and-forget; the session may already be invalid server-side.
    supabase.auth.signOut().catch(() => {});
    router.replace('/welcome');
  };

  const onConfirm = () => {
    Alert.alert(
      'Pause your account?',
      'Your account will be paused for 30 days, then permanently deleted unless you sign back in.',
      [
        { text: 'Pause',  style: 'destructive', onPress: doPause },
        { text: 'Cancel', style: 'cancel' },
      ],
    );
  };

  return (
    <SafeAreaView style={s.root} edges={['top', 'bottom']}>
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={s.scroll}>
        <Pressable onPress={() => router.back()} style={s.closeBtn} hitSlop={16}>
          <Text style={s.closeText}>‹ Back</Text>
        </Pressable>

        <View style={s.body}>
          <Text style={s.heading}>Pause your account</Text>
          <Text style={s.bodyText}>
            Your account will be paused for 30 days. After that, it will be
            permanently deleted. If you sign back in within 30 days, you can
            restore everything.
          </Text>
        </View>

        <View style={s.actions}>
          <Pressable
            onPress={onConfirm}
            disabled={submitting}
            style={({ pressed }) => [pressed && { opacity: 0.92, transform: [{ scale: 0.98 }] }]}
          >
            <LinearGradient
              colors={[AMBER_DEEP, AMBER_LIGHT]}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={s.cta}
            >
              <Text style={s.ctaText}>
                {submitting ? 'Pausing…' : 'Pause my account'}
              </Text>
            </LinearGradient>
          </Pressable>

          {error ? <Text style={s.errorText}>{error}</Text> : null}

          <Pressable onPress={() => router.back()} style={s.secondaryBtn} hitSlop={8}>
            <Text style={s.secondaryText}>Not yet</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root:   { flex: 1, backgroundColor: BG },
  scroll: { padding: 24, paddingBottom: 40, gap: 24 },

  closeBtn:  { alignSelf: 'flex-start', paddingVertical: 8 },
  closeText: { fontFamily: F.bodyMedium, fontSize: 15, color: TEXT_MUTED },

  body:     { gap: 14, paddingTop: 12 },
  heading:  { fontFamily: F.heading, fontSize: 28, color: TEXT, letterSpacing: -0.4, lineHeight: 34 },
  bodyText: { fontFamily: F.body, fontSize: 16, color: TEXT_SEC, lineHeight: 24 },

  actions: { gap: 12, marginTop: 12 },

  cta:     { borderRadius: 18, paddingVertical: 16, alignItems: 'center' },
  ctaText: { fontFamily: F.subheading, fontSize: 16, color: '#FFFFFF', letterSpacing: 0.3 },

  errorText: { fontFamily: F.body, fontSize: 14, color: CORAL, textAlign: 'center' },

  secondaryBtn:  { paddingVertical: 14, alignItems: 'center' },
  secondaryText: { fontFamily: F.bodyMedium, fontSize: 14, color: TEXT_MUTED },
});
