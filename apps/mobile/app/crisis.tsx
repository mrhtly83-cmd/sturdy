// app/crisis.tsx
// v9 — Deep Warm v5.2: result-variant gradient, dark glass cards with calm
// steel accents. No red, no alarm. "Invisible infrastructure" still applies.

import { Pressable, ScrollView, StyleSheet, Text, View, Linking } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar }       from 'expo-status-bar';
import { SafeAreaView }    from 'react-native-safe-area-context';
import { LinearGradient }  from 'expo-linear-gradient';
import * as Haptics        from 'expo-haptics';
import { colors as C, fonts as F } from '../src/theme';

const CRISIS_CONTENT: Record<string, {
  title: string; message: string;
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

const KEY_ALIASES: Record<string, string> = { violence_toward_parent: 'domestic_violence' };

export default function CrisisScreen() {
  const params = useLocalSearchParams<{ crisisType?: string; riskLevel?: string }>();
  const rawType = params.crisisType || 'manual';
  const crisisType = KEY_ALIASES[rawType] || rawType;
  const content = CRISIS_CONTENT[crisisType] || CRISIS_CONTENT.manual;

  const handleResource = (action?: string) => {
    if (action) { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); Linking.openURL(action); }
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
      <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>

      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        <Pressable onPress={() => router.back()} style={s.backBtn} hitSlop={12}>
          <Text style={s.backText}>← Back</Text>
        </Pressable>

        {/* Grounding */}
        <View style={s.groundingCard}>
          <Text style={s.groundingText}>Take a breath. You're in the right place.</Text>
        </View>

        {/* Title + message */}
        <View style={s.header}>
          <Text style={s.title}>{content.title}</Text>
          <Text style={s.message}>{content.message}</Text>
        </View>

        {/* Resources */}
        <View style={s.resources}>
          {content.resources.map((r, i) => (
            <Pressable key={i} onPress={() => handleResource(r.action)} disabled={!r.action}
              style={({ pressed }) => [pressed && { opacity: 0.85, transform: [{ scale: 0.99 }] }]}>
              <View style={s.resourceCard}>
                <View style={{ flex: 1, gap: 3 }}>
                  <Text style={s.resourceLabel}>{r.label}</Text>
                  <Text style={s.resourceDetail}>{r.detail}</Text>
                </View>
                {r.action && (
                  <View style={s.resourceArrow}><Text style={s.resourceArrowText}>→</Text></View>
                )}
              </View>
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
          <Pressable onPress={() => { Haptics.selectionAsync(); router.back(); }}
            style={({ pressed }) => [pressed && { opacity: 0.85 }]}>
            <View style={s.safeBtn}><Text style={s.safeBtnText}>I'm okay now</Text></View>
          </Pressable>
          <Pressable onPress={() => router.replace('/(tabs)')}>
            <Text style={s.homeLink}>Go home</Text>
          </Pressable>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const card = {
  backgroundColor: C.surface,
  borderWidth:     1,
  borderColor:     C.border,
  borderTopWidth:  1,
  borderTopColor:  C.borderHi,
  borderRadius:    18,
  shadowColor:     '#000000',
  shadowOffset:    { width: 0, height: 6 },
  shadowOpacity:   0.35,
  shadowRadius:    20,
  elevation:       4,
} as const;

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.background },
  scroll: { paddingHorizontal: 24, paddingTop: 8, paddingBottom: 60, gap: 16 },

  backBtn:  { alignSelf: 'flex-start', paddingVertical: 6 },
  backText: { fontFamily: F.bodyMedium, fontSize: 15, color: C.textDarkSecondary },

  groundingCard: {
    ...card,
    padding:    18,
    alignItems: 'center',
    backgroundColor: C.steelLight,
    borderColor:     'rgba(87,120,163,0.20)',
  },
  groundingText: { fontFamily: F.bodyMedium, fontSize: 16, color: C.text, lineHeight: 24, textAlign: 'center' },

  header:  { gap: 12, marginTop: 4 },
  title:   { fontFamily: F.heading, fontSize: 28, color: C.textDark, letterSpacing: -0.3 },
  message: { fontFamily: F.body, fontSize: 16, color: C.textDark, lineHeight: 25 },

  resources: { gap: 12 },
  resourceCard: {
    ...card,
    padding:        18,
    flexDirection:  'row',
    alignItems:     'center',
    gap:            12,
    borderColor:    'rgba(87,120,163,0.20)',
  },
  resourceLabel:  { fontFamily: F.bodySemi, fontSize: 16, color: C.text },
  resourceDetail: { fontFamily: F.body,     fontSize: 14, color: C.textSecondary },
  resourceArrow: {
    width:           36,
    height:          36,
    borderRadius:    12,
    backgroundColor: C.steelLight,
    borderWidth:     1,
    borderColor:     'rgba(87,120,163,0.30)',
    alignItems:      'center',
    justifyContent:  'center',
  },
  resourceArrowText: { fontSize: 16, color: C.steel, fontFamily: F.bodySemi },

  reassurance:     { paddingVertical: 8 },
  reassuranceText: { fontFamily: F.body, fontSize: 13, color: C.textMuted, lineHeight: 20, textAlign: 'center' },

  actions: { gap: 16, alignItems: 'center' },
  safeBtn: {
    ...card,
    paddingVertical: 16,
    alignItems:      'center',
    width:           '100%',
  },
  safeBtnText: { fontFamily: F.bodySemi, fontSize: 16, color: C.text },
  homeLink:    { fontFamily: F.bodyMedium, fontSize: 14, color: C.textMuted },
});

