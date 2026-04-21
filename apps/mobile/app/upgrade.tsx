// app/upgrade.tsx
// v2 — Journal identity: pastel gradient, frosted glass, rose CTA
// Soft, warm conversion — not aggressive
// Monthly $9.99 (3-day trial) / Yearly $79.99 (7-day trial)


import { useRef, useEffect, useState } from 'react';
import {
  Animated,
  Dimensions,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { router }         from 'expo-router';
import { StatusBar }       from 'expo-status-bar';
import { SafeAreaView }    from 'react-native-safe-area-context';
import { LinearGradient }  from 'expo-linear-gradient';
import * as Haptics        from 'expo-haptics';
import { useAuth }         from '../src/context/AuthContext';
import { useChildProfile } from '../src/context/ChildProfileContext';
import { colors as C, fonts as F } from '../src/theme';


const { width: W } = Dimensions.get('window');


const FEATURES = [
  { icon: '🧒', label: 'Child profile & insights', desc: 'See what triggers your child and what works' },
  { icon: '💡', label: 'Weekly insight', desc: 'Patterns Sturdy spots across your interactions' },
  { icon: '🎯', label: 'Follow-up coaching', desc: '"What if they refuse?" — a second script, tailored' },
  { icon: '🎨', label: 'Tone selector', desc: 'Firm, gentle, playful — match your parenting style' },
  { icon: '📚', label: 'Full interaction history', desc: 'Every script, searchable and saved' },
  { icon: '🔊', label: 'Voice on all modes', desc: 'Listen to scripts hands-free, anytime' },
];


const FREE_FEATURES = [
  'Unlimited SOS scripts',
  'Voice on SOS',
  'Regulate → Connect → Guide',
];


function BreathingGlow() {
  const opacity = useRef(new Animated.Value(0.3)).current;
  useEffect(() => {
    Animated.loop(Animated.sequence([
      Animated.timing(opacity, { toValue: 0.7, duration: 2000, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 0.3, duration: 2000, useNativeDriver: true }),
    ])).start();
  }, [opacity]);
  return (
    <Animated.View
      style={[StyleSheet.absoluteFill, {
        opacity, backgroundColor: 'transparent',
        shadowColor: C.rose, shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.3, shadowRadius: 30, elevation: 0,
      }]}
      pointerEvents="none"
    />
  );
}


export default function UpgradeScreen() {
  const { session } = useAuth();
  const { activeChild } = useChildProfile();
  const childName = activeChild?.name?.trim() || '';


  const [selectedPlan, setSelectedPlan] = useState<'yearly' | 'monthly'>('yearly');
  const [purchasing, setPurchasing] = useState(false);


  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(24)).current;


  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
    ]).start();
  }, []);


  const handlePurchase = async () => {
    setPurchasing(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    // TODO: Wire to RevenueCat / StoreKit
    setTimeout(() => { setPurchasing(false); }, 2000);
  };


  const handleRestore = () => { Haptics.selectionAsync(); /* TODO: Wire to RevenueCat restore */ };


  const isYearly = selectedPlan === 'yearly';


  return (
    <SafeAreaView style={s.root} edges={['top', 'bottom']}>
      <StatusBar style="dark" />
      <LinearGradient
        colors={[C.gradStart, C.gradMid1, C.gradMid2, C.gradEnd]}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />


      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        <Pressable onPress={() => router.back()} style={s.closeBtn} hitSlop={16}>
          <Text style={s.closeText}>✕</Text>
        </Pressable>


        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }], gap: 20 }}>


          {/* Hero */}
          <View style={s.hero}>
            <Text style={s.heroIcon}>✦</Text>
            <Text style={s.heroTitle}>Sturdy+</Text>
            <Text style={s.heroSub}>
              {childName
                ? `Unlock the full picture of how ${childName} responds — and grow as a parent.`
                : 'Unlock the full picture of how your child responds — and grow as a parent.'}
            </Text>
          </View>


          {/* Features */}
          <View style={s.featuresCard}>
            <Text style={s.featuresTitle}>Everything in Sturdy+</Text>
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


          {/* Free forever */}
          <View style={s.freeSection}>
            <Text style={s.freeTitle}>Always free</Text>
            <View style={s.freeList}>
              {FREE_FEATURES.map((f, i) => (
                <View key={i} style={s.freeRow}>
                  <Text style={s.freeCheck}>✓</Text>
                  <Text style={s.freeLabel}>{f}</Text>
                </View>
              ))}
            </View>
          </View>


          {/* Plan selector */}
          <View style={s.plans}>
            {/* Yearly */}
            <Pressable onPress={() => { Haptics.selectionAsync(); setSelectedPlan('yearly'); }}
              style={({ pressed }) => [pressed && { opacity: 0.9 }]}>
              <View style={[s.planCard, isYearly && s.planCardActive]}>
                {isYearly && (
                  <View style={s.bestBadge}>
                    <View style={s.bestBadgeInner}><Text style={s.bestBadgeText}>BEST VALUE</Text></View>
                  </View>
                )}
                <View style={s.planRow}>
                  <View style={[s.radio, isYearly && s.radioActive]}>
                    {isYearly && <View style={s.radioDot} />}
                  </View>
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text style={[s.planName, isYearly && { color: C.rose }]}>Yearly</Text>
                    <Text style={s.planPrice}>$79.99/year · $6.67/mo</Text>
                  </View>
                  <View style={s.trialBadge}><Text style={s.trialBadgeText}>7-day free trial</Text></View>
                </View>
                <Text style={s.planSave}>Save 33% vs monthly</Text>
              </View>
            </Pressable>


            {/* Monthly */}
            <Pressable onPress={() => { Haptics.selectionAsync(); setSelectedPlan('monthly'); }}
              style={({ pressed }) => [pressed && { opacity: 0.9 }]}>
              <View style={[s.planCard, !isYearly && s.planCardActive]}>
                <View style={s.planRow}>
                  <View style={[s.radio, !isYearly && s.radioActive]}>
                    {!isYearly && <View style={s.radioDot} />}
                  </View>
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text style={[s.planName, !isYearly && { color: C.rose }]}>Monthly</Text>
                    <Text style={s.planPrice}>$9.99/month</Text>
                  </View>
                  <View style={s.trialBadge}><Text style={s.trialBadgeText}>3-day free trial</Text></View>
                </View>
              </View>
            </Pressable>
          </View>


          {/* CTA */}
          <View style={s.ctaWrap}>
            <BreathingGlow />
            <Pressable onPress={handlePurchase} disabled={purchasing}
              style={({ pressed }) => [pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] }]}>
              <View style={s.ctaBtn}>
                <Text style={s.ctaText}>
                  {purchasing ? 'Starting trial…' : `Start ${isYearly ? '7' : '3'}-day free trial`}
                </Text>
                <Text style={s.ctaSub}>
                  {isYearly ? 'Then $79.99/year' : 'Then $9.99/month'} · Cancel anytime
                </Text>
              </View>
            </Pressable>
          </View>


          {/* Fine print */}
          <View style={s.fine}>
            <Pressable onPress={handleRestore}>
              <Text style={s.fineLink}>Restore purchase</Text>
            </Pressable>
            <Text style={s.fineText}>
              Payment will be charged to your App Store account at the end of the trial period. Subscription automatically renews unless cancelled at least 24 hours before the end of the current period.
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
  root: { flex: 1, backgroundColor: C.base },
  scroll: { paddingHorizontal: 24, paddingTop: 8, paddingBottom: 60 },


  closeBtn: {
    alignSelf: 'flex-end', width: 36, height: 36, borderRadius: 18,
    backgroundColor: C.cardGlass, borderWidth: 1, borderColor: C.border,
    alignItems: 'center', justifyContent: 'center', marginBottom: 8,
  },
  closeText: { fontSize: 16, color: C.textMuted },


  hero: { alignItems: 'center', gap: 8, paddingVertical: 16 },
  heroIcon: { fontSize: 32, color: C.rose, marginBottom: 4 },
  heroTitle: { fontFamily: F.heading, fontSize: 36, color: C.text, letterSpacing: -0.5 },
  heroSub: { fontFamily: F.body, fontSize: 16, color: C.textSub, textAlign: 'center', lineHeight: 24, maxWidth: 300 },


  featuresCard: {
    borderRadius: 18, padding: 18, gap: 14,
    backgroundColor: 'rgba(201,123,99,0.05)', borderWidth: 1, borderColor: 'rgba(201,123,99,0.12)',
  },
  featuresTitle: { fontFamily: F.bodySemi, fontSize: 14, color: C.rose, letterSpacing: 0.3 },
  featureRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  featureIcon: { fontSize: 18, marginTop: 1 },
  featureLabel: { fontFamily: F.bodySemi, fontSize: 15, color: C.text },
  featureDesc: { fontFamily: F.body, fontSize: 13, color: C.textMuted },


  freeSection: { alignItems: 'center', gap: 8 },
  freeTitle: { fontFamily: F.bodyMedium, fontSize: 13, color: C.textMuted },
  freeList: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 12 },
  freeRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  freeCheck: { fontFamily: F.bodySemi, fontSize: 12, color: C.sage },
  freeLabel: { fontFamily: F.body, fontSize: 13, color: C.textSub },


  plans: { gap: 10 },
  planCard: {
    borderRadius: 18, padding: 16, gap: 6,
    backgroundColor: C.cardGlass, borderWidth: 1, borderColor: C.border,
  },
  planCardActive: { borderColor: 'rgba(201,123,99,0.25)', backgroundColor: 'rgba(201,123,99,0.05)' },
  planRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  planName: { fontFamily: F.bodySemi, fontSize: 16, color: C.text },
  planPrice: { fontFamily: F.body, fontSize: 13, color: C.textMuted },
  planSave: { fontFamily: F.bodyMedium, fontSize: 12, color: C.sage, marginLeft: 34 },


  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: 'rgba(42,37,32,0.15)', alignItems: 'center', justifyContent: 'center' },
  radioActive: { borderColor: C.rose },
  radioDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: C.rose },


  bestBadge: { position: 'absolute', top: -10, right: 16, zIndex: 5 },
  bestBadgeInner: { backgroundColor: C.rose, paddingHorizontal: 10, paddingVertical: 3, borderRadius: 8 },
  bestBadgeText: { fontFamily: F.label, fontSize: 9, letterSpacing: 0.8, color: '#FFFFFF' },


  trialBadge: { backgroundColor: 'rgba(129,178,154,0.10)', borderWidth: 1, borderColor: 'rgba(129,178,154,0.18)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  trialBadgeText: { fontFamily: F.bodyMedium, fontSize: 11, color: C.sage },


  ctaWrap: { position: 'relative' },
  ctaBtn: { borderRadius: 20, paddingVertical: 18, alignItems: 'center', gap: 3, backgroundColor: C.rose },
  ctaText: { fontFamily: F.subheading, fontSize: 17, color: '#FFFFFF', letterSpacing: 0.3 },
  ctaSub: { fontFamily: F.body, fontSize: 12, color: 'rgba(255,255,255,0.70)' },


  fine: { alignItems: 'center', gap: 10, paddingTop: 4 },
  fineLink: { fontFamily: F.bodySemi, fontSize: 13, color: C.rose, textDecorationLine: 'underline' },
  fineText: { fontFamily: F.body, fontSize: 11, color: C.textMuted, textAlign: 'center', lineHeight: 16, maxWidth: 300 },
  fineLinks: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  fineLinkSmall: { fontFamily: F.bodyMedium, fontSize: 12, color: C.textMuted },
  fineDot: { fontSize: 10, color: 'rgba(42,37,32,0.15)' },
});



