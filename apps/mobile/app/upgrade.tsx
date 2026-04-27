// app/upgrade.tsx
// v3 — Dark identity: solid #0e0a10 base, glass cards, amber gradient CTA.
// Replaces the v2 Journal pastel-gradient + rose-coral accents.
//
// Pricing (locked):
//   Monthly  $9.99/month   · 3-day free trial
//   Annual   $69.99/year   · 7-day free trial · 5 months free vs monthly

import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { router }        from 'expo-router';
import { StatusBar }     from 'expo-status-bar';
import { SafeAreaView }  from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics      from 'expo-haptics';
import { useChildProfile } from '../src/context/ChildProfileContext';
import { fonts as F } from '../src/theme';

// ═══════════════════════════════════════════════
// V3 DARK IDENTITY TOKENS (hardcoded per spec)
// ═══════════════════════════════════════════════

const BG          = '#0e0a10';
const SURFACE     = 'rgba(255,255,255,0.055)';
const BORDER      = 'rgba(255,255,255,0.07)';
const BORDER_HI   = 'rgba(255,255,255,0.13)';
const TEXT        = 'rgba(255,255,255,0.92)';
const TEXT_SEC    = 'rgba(255,255,255,0.52)';
const TEXT_MUTED  = 'rgba(255,255,255,0.28)';
const AMBER       = '#D4944A';                       // selected-plan accents
const AMBER_DEEP  = '#C8883A';                       // CTA gradient start
const AMBER_LIGHT = '#E8A855';                       // CTA gradient end
const SAGE        = '#8DB89A';                       // checkmarks + savings badge
const SAGE_BG     = 'rgba(141,184,154,0.12)';

const FEATURES = [
  { icon: '🧒', label: 'Child profile & insights', desc: 'See what triggers your child and what works' },
  { icon: '💡', label: 'Weekly insight',           desc: 'Patterns Sturdy spots across your interactions' },
  { icon: '🎯', label: 'Follow-up coaching',       desc: '"What if they refuse?" — a second script, tailored' },
  { icon: '🎨', label: 'Tone selector',            desc: 'Soft, gentle, direct — match your parenting style' },
  { icon: '📚', label: 'Full interaction history', desc: 'Every script, searchable and saved' },
  { icon: '🔊', label: 'Voice on all modes',       desc: 'Listen to scripts hands-free, anytime' },
];

const FREE_FEATURES = [
  'Unlimited SOS scripts',
  'Voice on SOS',
  'Regulate → Connect → Guide',
];


export default function UpgradeScreen() {
  const { activeChild } = useChildProfile();
  const childName = activeChild?.name?.trim() || '';

  const [selectedPlan, setSelectedPlan] = useState<'yearly' | 'monthly'>('yearly');
  const [purchasing, setPurchasing]     = useState(false);

  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(24)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
    ]).start();
  }, []);

  const handlePurchase = async () => {
    setPurchasing(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    // TODO: Wire to RevenueCat / StoreKit
    setTimeout(() => { setPurchasing(false); }, 2000);
  };

  const handleRestore = () => {
    Haptics.selectionAsync();
    // TODO: Wire to RevenueCat restore
  };

  const isYearly = selectedPlan === 'yearly';

  return (
    <SafeAreaView style={s.root} edges={['top', 'bottom']}>
      <StatusBar style="light" />

      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        <Pressable onPress={() => router.back()} style={s.closeBtn} hitSlop={16}>
          <Text style={s.closeText}>✕</Text>
        </Pressable>

        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }], gap: 20 }}>

          {/* ─── Hero ─── */}
          <View style={s.hero}>
            <Text style={s.heroIcon}>✦</Text>
            <Text style={s.heroTitle}>Sturdy+</Text>
            <Text style={s.heroSub}>
              {childName
                ? `Unlock the full picture of how ${childName} responds — and grow as a parent.`
                : 'Unlock the full picture of how your child responds — and grow as a parent.'}
            </Text>
          </View>

          {/* ─── Features ─── */}
          <View style={s.featuresCard}>
            <Text style={s.featuresTitle}>EVERYTHING IN STURDY+</Text>
            {FEATURES.map((f, i) => (
              <View key={i} style={s.featureRow}>
                <Text style={s.featureIcon}>{f.icon}</Text>
                <View style={{ flex: 1, gap: 1 }}>
                  <Text style={s.featureLabel}>{f.label}</Text>
                  <Text style={s.featureDesc}>{f.desc}</Text>
                </View>
              </View>
            ))}
          </View>

          {/* ─── Always free ─── */}
          <View style={s.freeSection}>
            <Text style={s.freeTitle}>ALWAYS FREE</Text>
            <View style={s.freeList}>
              {FREE_FEATURES.map((f, i) => (
                <View key={i} style={s.freeRow}>
                  <Text style={s.freeCheck}>✓</Text>
                  <Text style={s.freeLabel}>{f}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* ─── Plans ─── */}
          <View style={s.plans}>
            {/* Yearly */}
            <Pressable
              onPress={() => { Haptics.selectionAsync(); setSelectedPlan('yearly'); }}
              style={({ pressed }) => [pressed && { opacity: 0.92 }]}
            >
              <View style={[s.planCard, isYearly && s.planCardActive]}>
                {isYearly ? (
                  <View style={s.bestBadge}>
                    <View style={s.bestBadgeInner}><Text style={s.bestBadgeText}>BEST VALUE</Text></View>
                  </View>
                ) : null}
                <View style={s.planRow}>
                  <View style={[s.radio, isYearly && s.radioActive]}>
                    {isYearly ? <View style={s.radioDot} /> : null}
                  </View>
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text style={[s.planName, isYearly && { color: AMBER }]}>Yearly</Text>
                    <Text style={s.planPrice}>$69.99/year · $5.83/mo</Text>
                  </View>
                  <View style={s.trialBadge}>
                    <Text style={s.trialBadgeText}>7-day free trial</Text>
                  </View>
                </View>
                <View style={s.savingsRow}>
                  <View style={s.savingsBadge}>
                    <Text style={s.savingsBadgeText}>5 months free</Text>
                  </View>
                </View>
              </View>
            </Pressable>

            {/* Monthly */}
            <Pressable
              onPress={() => { Haptics.selectionAsync(); setSelectedPlan('monthly'); }}
              style={({ pressed }) => [pressed && { opacity: 0.92 }]}
            >
              <View style={[s.planCard, !isYearly && s.planCardActive]}>
                <View style={s.planRow}>
                  <View style={[s.radio, !isYearly && s.radioActive]}>
                    {!isYearly ? <View style={s.radioDot} /> : null}
                  </View>
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text style={[s.planName, !isYearly && { color: AMBER }]}>Monthly</Text>
                    <Text style={s.planPrice}>$9.99/month</Text>
                  </View>
                  <View style={s.trialBadge}>
                    <Text style={s.trialBadgeText}>3-day free trial</Text>
                  </View>
                </View>
              </View>
            </Pressable>
          </View>

          {/* ─── CTA ─── */}
          <Pressable
            onPress={handlePurchase}
            disabled={purchasing}
            style={({ pressed }) => [pressed && { opacity: 0.92, transform: [{ scale: 0.98 }] }]}
          >
            <LinearGradient
              colors={[AMBER_DEEP, AMBER_LIGHT]}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={s.ctaBtn}
            >
              <Text style={s.ctaText}>
                {purchasing ? 'Starting trial…' : `Start ${isYearly ? '7' : '3'}-day free trial`}
              </Text>
              <Text style={s.ctaSub}>
                {isYearly ? 'Then $69.99/year' : 'Then $9.99/month'} · Cancel anytime
              </Text>
            </LinearGradient>
          </Pressable>

          {/* ─── Fine print ─── */}
          <View style={s.fine}>
            <Pressable onPress={handleRestore} style={s.restoreBtn}>
              <Text style={s.restoreLink}>Restore purchase</Text>
            </Pressable>
            <Text style={s.fineText}>
              Payment will be charged to your App Store account at the end of the trial period.
              Subscription automatically renews unless cancelled at least 24 hours before the end
              of the current period.
            </Text>
            <View style={s.fineLinks}>
              <Pressable onPress={() => router.push('/legal/terms-of-service')}>
                <Text style={s.fineLinkSmall}>Terms</Text>
              </Pressable>
              <Text style={s.fineDot}>·</Text>
              <Pressable onPress={() => router.push('/legal/privacy-policy')}>
                <Text style={s.fineLinkSmall}>Privacy</Text>
              </Pressable>
            </View>
          </View>

          <View style={{ height: 30 }} />
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}


const s = StyleSheet.create({
  root:   { flex: 1, backgroundColor: BG },
  scroll: { paddingHorizontal: 24, paddingTop: 8, paddingBottom: 60 },

  // Close button
  closeBtn: {
    alignSelf: 'flex-end',
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: SURFACE,
    borderWidth: 1, borderColor: BORDER_HI,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 8,
  },
  closeText: { fontSize: 16, color: TEXT_MUTED },

  // Hero
  hero:      { alignItems: 'center', gap: 8, paddingVertical: 16 },
  heroIcon:  { fontSize: 32, color: AMBER, marginBottom: 4 },
  heroTitle: { fontFamily: F.heading, fontSize: 36, color: TEXT, letterSpacing: -0.5 },
  heroSub:   { fontFamily: F.body, fontSize: 16, color: TEXT_SEC, textAlign: 'center', lineHeight: 24, maxWidth: 320 },

  // Features card
  featuresCard: {
    borderRadius: 20, padding: 18, gap: 14,
    backgroundColor: SURFACE,
    borderWidth: 1, borderColor: BORDER,
  },
  featuresTitle: { fontFamily: F.label, fontSize: 11, letterSpacing: 0.8, color: AMBER },
  featureRow:    { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  featureIcon:   { fontSize: 18, marginTop: 1 },
  featureLabel:  { fontFamily: F.bodySemi, fontSize: 15, color: TEXT },
  featureDesc:   { fontFamily: F.body, fontSize: 13, color: TEXT_SEC, lineHeight: 18 },

  // Always-free
  freeSection: { alignItems: 'center', gap: 10, paddingTop: 4 },
  freeTitle:   { fontFamily: F.label, fontSize: 11, letterSpacing: 0.8, color: TEXT_MUTED },
  freeList:    { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 14 },
  freeRow:     { flexDirection: 'row', alignItems: 'center', gap: 5 },
  freeCheck:   { fontFamily: F.bodySemi, fontSize: 13, color: SAGE },
  freeLabel:   { fontFamily: F.body, fontSize: 13, color: TEXT_SEC },

  // Plans
  plans:    { gap: 10 },
  planCard: {
    borderRadius: 20, padding: 16, gap: 8,
    backgroundColor: SURFACE,
    borderWidth: 1, borderColor: BORDER,
  },
  planCardActive: {
    borderColor: 'rgba(212,148,74,0.45)',
    backgroundColor: 'rgba(212,148,74,0.06)',
  },
  planRow:   { flexDirection: 'row', alignItems: 'center', gap: 12 },
  planName:  { fontFamily: F.bodySemi, fontSize: 16, color: TEXT },
  planPrice: { fontFamily: F.body, fontSize: 13, color: TEXT_SEC },

  // Radio
  radio: {
    width: 22, height: 22, borderRadius: 11,
    borderWidth: 2, borderColor: BORDER_HI,
    alignItems: 'center', justifyContent: 'center',
  },
  radioActive: { borderColor: AMBER },
  radioDot:    { width: 10, height: 10, borderRadius: 5, backgroundColor: AMBER },

  // BEST VALUE badge (active yearly)
  bestBadge:      { position: 'absolute', top: -10, right: 16, zIndex: 5 },
  bestBadgeInner: { backgroundColor: AMBER, paddingHorizontal: 10, paddingVertical: 3, borderRadius: 8 },
  bestBadgeText:  { fontFamily: F.label, fontSize: 9, letterSpacing: 0.8, color: '#0e0a10' },

  // Trial / savings badges
  trialBadge: {
    backgroundColor: SAGE_BG,
    paddingHorizontal: 8, paddingVertical: 4,
    borderRadius: 8,
  },
  trialBadgeText: { fontFamily: F.bodyMedium, fontSize: 11, color: SAGE },
  savingsRow:     { paddingLeft: 34 },
  savingsBadge: {
    alignSelf: 'flex-start',
    backgroundColor: SAGE_BG,
    paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: 8,
  },
  savingsBadgeText: { fontFamily: F.bodyMedium, fontSize: 11, color: SAGE, letterSpacing: 0.2 },

  // CTA
  ctaBtn: {
    borderRadius: 20,
    paddingVertical: 18,
    alignItems: 'center',
    gap: 3,
  },
  ctaText: { fontFamily: F.subheading, fontSize: 17, color: '#FFFFFF', letterSpacing: 0.3 },
  ctaSub:  { fontFamily: F.body, fontSize: 12, color: 'rgba(255,255,255,0.78)' },

  // Fine print
  fine:        { alignItems: 'center', gap: 10, paddingTop: 4 },
  restoreBtn:  { paddingVertical: 4 },
  restoreLink: { fontFamily: F.bodyMedium, fontSize: 13, color: TEXT_MUTED, textDecorationLine: 'underline' },
  fineText:    { fontFamily: F.body, fontSize: 11, color: TEXT_MUTED, textAlign: 'center', lineHeight: 16, maxWidth: 320 },
  fineLinks:   { flexDirection: 'row', alignItems: 'center', gap: 8 },
  fineLinkSmall: { fontFamily: F.bodyMedium, fontSize: 12, color: TEXT_MUTED },
  fineDot:     { fontSize: 10, color: TEXT_MUTED },
});
