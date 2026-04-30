// app/account/export.tsx
//
// Generates a 24-hour signed URL for the parent's data export and opens
// it in the system browser. Empty exports (brand-new accounts) are fine —
// the backend returns the same shape with a near-empty zip.

import { useState } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router }   from 'expo-router';
import { StatusBar }   from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { fonts as F } from '../../src/theme';
import { requestExport } from '../../src/lib/accountApi';

const BG          = '#0e0a10';
const TEXT        = 'rgba(255,255,255,0.92)';
const TEXT_SEC    = 'rgba(255,255,255,0.52)';
const TEXT_MUTED  = 'rgba(255,255,255,0.28)';
const CORAL       = '#E87461';
const AMBER_DEEP  = '#C8883A';
const AMBER_LIGHT = '#E8A855';

export default function ExportAccountScreen() {
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const onDownload = async () => {
    setLoading(true);
    setError(null);
    setSuccess(false);
    Haptics.selectionAsync();

    const result = await requestExport();
    setLoading(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    // Hand off to the system browser — it will start the download. Await
    // so a failure flips to the error branch instead of racing with the
    // synchronous success state.
    try {
      await Linking.openURL(result.url);
      setSuccess(true);
    } catch {
      setError("Couldn't open the download link. Please try again.");
    }
  };

  return (
    <SafeAreaView style={s.root} edges={['top', 'bottom']}>
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={s.scroll}>
        <Pressable onPress={() => router.back()} style={s.closeBtn} hitSlop={16}>
          <Text style={s.closeText}>‹ Back</Text>
        </Pressable>

        <View style={s.body}>
          <Text style={s.heading}>Download your data</Text>
          <Text style={s.bodyText}>
            Get a copy of everything Sturdy has stored about your account —
            child profiles, saved scripts, Question responses, and more. The
            download link expires in 24 hours.
          </Text>
        </View>

        <View style={s.actions}>
          <Pressable
            onPress={onDownload}
            disabled={loading}
            style={({ pressed }) => [pressed && { opacity: 0.92, transform: [{ scale: 0.98 }] }]}
          >
            <LinearGradient
              colors={[AMBER_DEEP, AMBER_LIGHT]}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={s.cta}
            >
              <Text style={s.ctaText}>
                {loading ? 'Preparing…' : 'Download my data'}
              </Text>
            </LinearGradient>
          </Pressable>

          {error   ? <Text style={s.errorText}>{error}</Text> : null}
          {success ? (
            <Text style={s.successText}>
              Download started. The link expires in 24 hours.
            </Text>
          ) : null}

          <Pressable onPress={() => router.back()} style={s.secondaryBtn} hitSlop={8}>
            <Text style={s.secondaryText}>Back</Text>
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

  errorText:   { fontFamily: F.body, fontSize: 14, color: CORAL,    textAlign: 'center' },
  successText: { fontFamily: F.body, fontSize: 14, color: TEXT_SEC, textAlign: 'center' },

  secondaryBtn:  { paddingVertical: 14, alignItems: 'center' },
  secondaryText: { fontFamily: F.bodyMedium, fontSize: 14, color: TEXT_MUTED },
});
