// app/crisis.tsx
// v7 — Safety support screen with glassmorphism 3D card system
// Night sky + Stars + directional border cards
// Calm, warm, no red, no alarm aesthetics
// Never shows scripts. Never paywalls. Never shames.
// Per SAFETY_SYSTEM.md: "invisible infrastructure — protects without alarming"


import { Pressable, ScrollView, StyleSheet, Text, View, Linking } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar }       from 'expo-status-bar';
import { SafeAreaView }    from 'react-native-safe-area-context';
import { LinearGradient }  from 'expo-linear-gradient';
import * as Haptics        from 'expo-haptics';
import { Stars }           from '../src/components/features/Stars';
import { colors as C, fonts as F } from '../src/theme';


// ═══════════════════════════════════════════════
// CRISIS CONTENT — Per crisis type
// ═══════════════════════════════════════════════


const CRISIS_CONTENT: Record<string, {
  title: string;
  message: string;
  resources: { label: string; detail: string; action?: string }[];
}> = {
  medical_emergency: {
    title: 'Medical Emergency',
    message: "If someone is hurt or not responsive, call emergency services now. You're doing the right thing by acting fast.",
    resources: [
      { label: 'Emergency Services', detail: 'Call 911 (US) or your local emergency number', action: 'tel:911' },
      { label: 'Poison Control', detail: '1-800-222-1222', action: 'tel:18002221222' },
    ],
  },
  suicidal_parent: {
    title: 'You matter',
    message: "What you're feeling right now is real, and it's heavy. You don't have to carry this alone. Please reach out to someone who can help.",
    resources: [
      { label: '988 Suicide & Crisis Lifeline', detail: 'Call or text 988 — free, confidential, 24/7', action: 'tel:988' },
      { label: 'Crisis Text Line', detail: 'Text HOME to 741741', action: 'sms:741741' },
    ],
  },
  suicidal_child: {
    title: 'Your child needs support',
    message: "Hearing your child talk about not wanting to be alive is terrifying. You're right to take it seriously. Professional help can make a real difference.",
    resources: [
      { label: '988 Suicide & Crisis Lifeline', detail: 'Call or text 988 — free, confidential, 24/7', action: 'tel:988' },
      { label: 'Crisis Text Line', detail: 'Text HOME to 741741', action: 'sms:741741' },
    ],
  },
  parent_losing_control: {
    title: "You're not a bad parent",
    message: "Feeling like you might lose control is scary — and the fact that you're here means you're trying to do the right thing. Step away if you can. Put your child somewhere safe. Then reach out.",
    resources: [
      { label: 'Childhelp National Hotline', detail: '1-800-422-4453 — no judgment, just support', action: 'tel:18004224453' },
      { label: 'Crisis Text Line', detail: 'Text HOME to 741741', action: 'sms:741741' },
    ],
  },
  violence_toward_child: {
    title: 'Getting help is strength',
    message: "Whatever happened, reaching out is the right step. These resources can help you and your child right now.",
    resources: [
      { label: 'Childhelp National Hotline', detail: '1-800-422-4453', action: 'tel:18004224453' },
      { label: 'Crisis Text Line', detail: 'Text HOME to 741741', action: 'sms:741741' },
    ],
  },
  child_aggression: {
    title: "This is hard — and it's not your fault",
    message: "When your child is physically aggressive, it can feel shocking and isolating. You deserve support too.",
    resources: [
      { label: 'Childhelp National Hotline', detail: '1-800-422-4453 — guidance for parents', action: 'tel:18004224453' },
      { label: 'Crisis Text Line', detail: 'Text HOME to 741741', action: 'sms:741741' },
    ],
  },
  domestic_violence: {
    title: 'Your safety matters',
    message: "If you're in immediate danger, get to safety first. You can get help without judgment.",
    resources: [
      { label: 'Emergency Services', detail: 'Call 911', action: 'tel:911' },
      { label: 'National Domestic Violence Hotline', detail: '1-800-799-7233', action: 'tel:18007997233' },
    ],
  },
  child_self_harm: {
    title: "You're not alone in this",
    message: "Learning your child is hurting themselves is overwhelming. Professional support can help both of you.",
    resources: [
      { label: '988 Suicide & Crisis Lifeline', detail: 'Call or text 988', action: 'tel:988' },
      { label: 'Crisis Text Line', detail: 'Text HOME to 741741', action: 'sms:741741' },
    ],
  },
  abuse_indicator: {
    title: 'Help is available',
    message: 'If a child is being harmed, support is available right now.',
    resources: [
      { label: 'Childhelp National Hotline', detail: '1-800-422-4453', action: 'tel:18004224453' },
      { label: 'Emergency Services', detail: 'Call 911 if a child is in immediate danger', action: 'tel:911' },
    ],
  },
  manual: {
    title: "Let's get you support",
    message: "You reached out — that takes courage. Here are people who can help right now.",
    resources: [
      { label: '988 Suicide & Crisis Lifeline', detail: 'Call or text 988', action: 'tel:988' },
      { label: 'Crisis Text Line', detail: 'Text HOME to 741741', action: 'sms:741741' },
      { label: 'Childhelp National Hotline', detail: '1-800-422-4453', action: 'tel:18004224453' },
    ],
  },
};


const KEY_ALIASES: Record<string, string> = {
  violence_toward_parent: 'domestic_violence',
};


// ═══════════════════════════════════════════════
// MAIN SCREEN
// ═══════════════════════════════════════════════


export default function CrisisScreen() {
  const params = useLocalSearchParams<{ crisisType?: string; riskLevel?: string }>();
  const rawType = params.crisisType || 'manual';
  const crisisType = KEY_ALIASES[rawType] || rawType;
  const content = CRISIS_CONTENT[crisisType] || CRISIS_CONTENT.manual;


  const handleResource = (action?: string) => {
    if (action) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      Linking.openURL(action);
    }
  };


  return (
    <SafeAreaView style={s.root} edges={['top', 'bottom']}>
      <StatusBar style="light" />


      {/* ─── Night sky background (canonical) ─── */}
      <LinearGradient
        colors={['#0e0a10', '#14101a', '#1a1622', '#1e1a28', '#201c2a', '#1e1a24', '#1a1620', '#18141e', '#14101a']}
        locations={[0, 0.10, 0.22, 0.35, 0.48, 0.60, 0.72, 0.85, 1]}
        style={StyleSheet.absoluteFill}
      />
      <Stars />


      {/* ─── Warm ambient glow — softer/higher on crisis screen for comfort ─── */}
      <LinearGradient
        colors={['transparent', 'rgba(87,120,163,0.04)', 'rgba(87,120,163,0.08)']}
        locations={[0, 0.4, 1]}
        style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '45%', zIndex: 1 }}
        pointerEvents="none"
      />


      <ScrollView
        contentContainerStyle={s.scroll}
        showsVerticalScrollIndicator={false}
        style={{ zIndex: 2 }}
      >
        {/* Back */}
        <Pressable
          onPress={() => router.back()}
          style={s.backBtn}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          hitSlop={12}
        >
          <Text style={s.backText}>← Back</Text>
        </Pressable>


        {/* Grounding prompt — slate glass, quiet and steady */}
        <LinearGradient
          colors={['rgba(60,90,115,0.10)', 'rgba(60,90,115,0.04)', 'rgba(0,0,0,0.10)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 0.8, y: 1 }}
          style={[s.groundingCard, {
            borderTopColor: 'rgba(60,90,115,0.22)',
            borderLeftColor: 'rgba(60,90,115,0.12)',
            borderRightColor: 'rgba(0,0,0,0.06)',
            borderBottomColor: 'rgba(0,0,0,0.10)',
          }]}
        >
          <Text style={s.groundingText}>
            Take a breath. You're in the right place.
          </Text>
        </LinearGradient>


        {/* Title + message */}
        <View style={s.header}>
          <Text style={s.title}>{content.title}</Text>
          <Text style={s.message}>{content.message}</Text>
        </View>


        {/* Resources — each a tappable slate glass card */}
        <View style={s.resources}>
          {content.resources.map((r, i) => (
            <Pressable
              key={i}
              onPress={() => handleResource(r.action)}
              disabled={!r.action}
              style={({ pressed }) => [pressed && { opacity: 0.85, transform: [{ scale: 0.99 }] }]}
              accessibilityRole="button"
              accessibilityLabel={`${r.label}: ${r.detail}`}
            >
              <LinearGradient
                colors={['rgba(87,120,163,0.10)', 'rgba(87,120,163,0.04)', 'rgba(0,0,0,0.10)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 0.8, y: 1 }}
                style={[s.resourceCard, {
                  borderTopColor: 'rgba(87,120,163,0.22)',
                  borderLeftColor: 'rgba(87,120,163,0.12)',
                  borderRightColor: 'rgba(0,0,0,0.06)',
                  borderBottomColor: 'rgba(0,0,0,0.10)',
                }]}
              >
                <View style={s.resourceRow}>
                  <View style={{ flex: 1, gap: 3 }}>
                    <Text style={s.resourceLabel}>{r.label}</Text>
                    <Text style={s.resourceDetail}>{r.detail}</Text>
                  </View>
                  {r.action && (
                    <View style={s.resourceArrow}>
                      <Text style={s.resourceArrowText}>→</Text>
                    </View>
                  )}
                </View>
              </LinearGradient>
            </Pressable>
          ))}
        </View>


        {/* Reassurance */}
        <View style={s.reassurance}>
          <Text style={s.reassuranceText}>
            Sturdy is a parenting support tool, not a crisis service.{'\n'}
            These resources connect you with trained professionals{'\n'}
            who can help right now.
          </Text>
        </View>


        {/* Actions */}
        <View style={s.actions}>
          {/* "I'm okay" — standard glass, not amber (no upsell energy on crisis) */}
          <Pressable
            onPress={() => {
              Haptics.selectionAsync();
              router.back();
            }}
            style={({ pressed }) => [pressed && { opacity: 0.85, transform: [{ scale: 0.99 }] }]}
            accessibilityRole="button"
            accessibilityLabel="I'm okay now — go back"
          >
            <LinearGradient
              colors={['rgba(255,255,255,0.06)', 'rgba(255,255,255,0.02)', 'rgba(0,0,0,0.10)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 0.8, y: 1 }}
              style={[s.safeBtn, {
                borderTopColor: 'rgba(255,255,255,0.12)',
                borderLeftColor: 'rgba(255,255,255,0.06)',
                borderRightColor: 'rgba(0,0,0,0.06)',
                borderBottomColor: 'rgba(0,0,0,0.10)',
              }]}
            >
              <Text style={s.safeBtnText}>I'm okay now</Text>
            </LinearGradient>
          </Pressable>


          <Pressable
            onPress={() => router.replace('/(tabs)')}
            accessibilityRole="link"
            accessibilityLabel="Go home"
          >
            <Text style={s.homeLink}>Go home</Text>
          </Pressable>
        </View>


        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}


// ═══════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════


const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0e0a10' },
  scroll: { paddingHorizontal: 24, paddingTop: 8, paddingBottom: 60, gap: 16 },


  // Back
  backBtn: { alignSelf: 'flex-start', paddingVertical: 6 },
  backText: { fontFamily: F.bodyMedium, fontSize: 15, color: C.textMuted },


  // Grounding card (slate glass)
  groundingCard: {
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    alignItems: 'center',
  },
  groundingText: {
    fontFamily: F.scriptItalic,
    fontSize: 16,
    color: C.textSub,
    lineHeight: 24,
    textAlign: 'center',
  },


  // Header
  header: { gap: 12, marginTop: 4 },
  title: {
    fontFamily: F.heading,
    fontSize: 28,
    color: C.text,
    letterSpacing: -0.3,
  },
  message: {
    fontFamily: F.body,
    fontSize: 16,
    color: C.textBody,
    lineHeight: 25,
  },


  // Resources
  resources: { gap: 12 },
  resourceCard: {
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
  },
  resourceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  resourceLabel: {
    fontFamily: F.bodySemi,
    fontSize: 16,
    color: C.text,
  },
  resourceDetail: {
    fontFamily: F.body,
    fontSize: 14,
    color: C.textSub,
  },
  resourceArrow: {
    width: 36, height: 36, borderRadius: 12,
    backgroundColor: 'rgba(87,120,163,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(87,120,163,0.25)',
    alignItems: 'center', justifyContent: 'center',
  },
  resourceArrowText: {
    fontSize: 16, color: C.blue, fontFamily: F.bodySemi,
  },


  // Reassurance
  reassurance: { paddingVertical: 8 },
  reassuranceText: {
    fontFamily: F.body,
    fontSize: 13,
    color: C.textMuted,
    lineHeight: 20,
    textAlign: 'center',
  },


  // Actions
  actions: { gap: 16, alignItems: 'center' },
  safeBtn: {
    borderRadius: 18,
    borderWidth: 1,
    paddingVertical: 16,
    alignItems: 'center',
    width: '100%',
  },
  safeBtnText: {
    fontFamily: F.bodySemi,
    fontSize: 16,
    color: C.textBody,
  },
  homeLink: {
    fontFamily: F.bodyMedium,
    fontSize: 14,
    color: C.textMuted,
  },
});



