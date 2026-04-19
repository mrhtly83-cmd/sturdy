// app/now.tsx
// v6 — Tone-style intensity pills + night sky + glassmorphism + amber CTAs
// Updated: crisis detection via shared useCrisisMode hook
// Logo palette: Blue #5778A3, Coral #E87461, Sage #8AA060, Amber #D4944A




import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { router, useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar }     from 'expo-status-bar';
import { SafeAreaView }  from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics     from 'expo-haptics';
import { useAuth }         from '../src/context/AuthContext';
import { useChildProfile } from '../src/context/ChildProfileContext';
import { getParentingScript, CrisisDetectedError } from '../src/lib/api';
import { colors as C, fonts as F } from '../src/theme';
import { Stars }        from '../src/components/features/Stars';
import { detectCrisis } from '../src/hooks/useCrisisMode';




const { width: W } = Dimensions.get('window');




// ── Mode config
const MODE_CONFIG = {
  sos: {
    title: "What's happening\nright now?",
    sub: 'Describe the moment and get calm words to say.',
    placeholder: 'My child is screaming because we have to leave the park.',
    hint: 'A simple snapshot is enough.',
    showCrisis: true,
    showIntensity: true,
    btnLabel: 'Get Script',
  },
  reconnect: {
    title: "What's been\nhappening between you?",
    sub: 'Describe how things have been off — Sturdy will help you reconnect.',
    placeholder: 'My 14 year old hasn\'t spoken to me properly in three days after I set a limit.',
    hint: 'Include how long things have been off and what triggered it.',
    showCrisis: false,
    showIntensity: false,
    btnLabel: 'Get Script',
  },
  understand: {
    title: "What does your\nchild keep doing?",
    sub: 'Describe the pattern — Sturdy will explain what\'s driving it.',
    placeholder: 'My child always melts down at transitions. Every single time we have to leave somewhere.',
    hint: 'The more detail you share, the better the explanation.',
    showCrisis: false,
    showIntensity: false,
    btnLabel: 'Help me understand',
  },
  conversation: {
    title: "What do you need\nto talk to them about?",
    sub: 'Describe the topic — Sturdy will help you open the conversation.',
    placeholder: 'I need to talk to my 12 year old about screen time. Every conversation turns into a fight.',
    hint: 'Include their age and how past conversations have gone.',
    showCrisis: false,
    showIntensity: false,
    btnLabel: 'Help me say it',
  },
} as const;




type Mode = keyof typeof MODE_CONFIG;




// ── Intensity pills matching tone selector style
const INTENSITY_OPTIONS = [
  { level: 1, label: 'Mild',     color: C.sage },
  { level: 2, label: 'Building', color: C.blue },
  { level: 3, label: 'Hard',     color: C.peach },
  { level: 4, label: 'Intense',  color: C.amber },
] as const;




const TIMEOUT_MS = 20 * 60 * 1000;




export default function NowScreen() {
  const navigation = useRouter();
  const params = useLocalSearchParams<{ mode?: string; reset?: string; trial?: string }>();
  const { session, signOut } = useAuth();
  const childCtx = useChildProfile() as any;
  const draft = childCtx.draft ?? childCtx.activeChild ?? {};




  const rawMode = params.mode ?? 'sos';
  const mode: Mode = (rawMode in MODE_CONFIG ? rawMode : 'sos') as Mode;
  const cfg = MODE_CONFIG[mode];




  const [situation, setSituation] = useState('');
  const [intensity, setIntensity] = useState<number | null>(null);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState('');
  const [crisisFlag, setCrisisFlag] = useState(false);
  const [inputFocused, setInputFocused] = useState(false);




  const crisisOpacity = useRef(new Animated.Value(0)).current;
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);




  const childName = draft?.name?.trim() ?? null;
  const childAge  = draft?.childAge ?? null;
  const userId    = session?.user?.id ?? undefined;
  const isTrial   = params.trial === 'true';
  const canSubmit = (isTrial || (Boolean(childName) && childAge !== null)) && situation.trim().length > 0;




  const resetTimeout = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (!session) return;
    timeoutRef.current = setTimeout(async () => {
      await signOut();
      router.replace('/welcome');
    }, TIMEOUT_MS);
  }, [session, signOut]);




  useEffect(() => {
    resetTimeout();
    return () => { if (timeoutRef.current) clearTimeout(timeoutRef.current); };
  }, [resetTimeout]);




  const resetParam = Array.isArray(params.reset) ? params.reset[0] : params.reset;
  useEffect(() => {
    if (!resetParam) return;
    setSituation(''); setIntensity(null); setError(''); setCrisisFlag(false);
  }, [resetParam]);




  const handleTextChange = (text: string) => {
    setSituation(text);
    if (error) setError('');
    resetTimeout();
    if (!cfg.showCrisis) return;


    // ── Crisis detection via shared hook ──
    const crisisCheck = detectCrisis(text);
    if (crisisCheck.isCrisis !== crisisFlag) {
      setCrisisFlag(crisisCheck.isCrisis);
      Animated.timing(crisisOpacity, {
        toValue: crisisCheck.isCrisis ? 1 : 0, duration: 300, useNativeDriver: true,
      }).start();
    }
  };




  const handleSelectIntensity = (level: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIntensity(intensity === level ? null : level);
    resetTimeout();
  };




  const handleGetScript = async () => {
    const msg = situation.trim();
    if (!msg) return;




    const finalName = childName || 'My child';
    const finalAge = childAge ?? 4;




    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setError(''); setLoading(true); resetTimeout();




    try {
      const script = await getParentingScript({
        childName: finalName,
        childAge: finalAge,
        message: msg,
        userId,
        intensity: cfg.showIntensity ? intensity : null,
        mode,
      } as any);




      const resultPath = isTrial ? '/welcome/trial-result' : '/result';




      navigation.push({
        pathname: resultPath,
        params: {
          situationSummary: script.situation_summary,
          regulateAction: script.regulate.parent_action,
          regulateScript: script.regulate.script,
          regulateCoaching: script.regulate.coaching ?? '',
          regulateStrategies: JSON.stringify(script.regulate.strategies ?? []),
          connectAction: script.connect.parent_action,
          connectScript: script.connect.script,
          connectCoaching: script.connect.coaching ?? '',
          connectStrategies: JSON.stringify(script.connect.strategies ?? []),
          guideAction: script.guide.parent_action,
          guideScript: script.guide.script,
          guideCoaching: script.guide.coaching ?? '',
          guideStrategies: JSON.stringify(script.guide.strategies ?? []),
          avoid: JSON.stringify(script.avoid),
          childMessage: msg,
          mode,
        },
      });
    } catch (err) {
      if (err instanceof CrisisDetectedError) {
        router.push({ pathname: '/crisis', params: { crisisType: err.crisisType, riskLevel: err.riskLevel } });
        return;
      }
      setError("Couldn't get a script right now. Please try again.");
    } finally { setLoading(false); }
  };




  const handleUnsafe = () => {
    router.push({ pathname: '/crisis', params: { crisisType: 'manual', riskLevel: 'ELEVATED_RISK' } });
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
        style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '35%', zIndex: 1 }}
        pointerEvents="none"
      />


      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1, zIndex: 2 }}
      >
        <ScrollView
          contentContainerStyle={s.content}
          keyboardDismissMode="interactive"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          onScrollBeginDrag={resetTimeout}
        >
          {/* Back */}
          <Pressable onPress={() => router.back()} style={({ pressed }) => [s.back, pressed && { opacity: 0.65 }]}>
            <Text style={s.backText}>← Back</Text>
          </Pressable>




          {/* Header */}
          <View style={s.header}>
            {childName && childAge !== null ? (
              <View style={s.contextPill}>
                <Text style={s.contextPillText}>🧒 {childName} · Age {childAge}</Text>
              </View>
            ) : null}
            <Text style={s.title}>{cfg.title}</Text>
            <Text style={s.sub}>{cfg.sub}</Text>
          </View>




          {/* No child warning */}
          {(!childName || childAge === null) && !isTrial ? (
            <View style={s.noChildCard}>
              <Text style={s.noChildText}>Add a child profile so Sturdy can tailor the script.</Text>
              <Pressable onPress={() => router.push(session ? '/child/new' : '/child-setup')}>
                <Text style={s.noChildLink}>Add child →</Text>
              </Pressable>
            </View>
          ) : null}




          {/* Textarea */}
          <View style={[s.textareaCard, inputFocused && s.textareaFocused]}>
            <TextInput
              autoFocus={Boolean(childName) && childAge !== null}
              multiline
              numberOfLines={5}
              placeholder={cfg.placeholder}
              placeholderTextColor="rgba(255,255,255,0.22)"
              value={situation}
              onChangeText={handleTextChange}
              onFocus={() => setInputFocused(true)}
              onBlur={() => setInputFocused(false)}
              style={s.textarea}
              textAlignVertical="top"
            />
            <Text style={s.textareaHint}>{cfg.hint}</Text>




            {cfg.showCrisis ? (
              <Animated.View style={[s.crisisBanner, { opacity: crisisOpacity }]}>
                <Pressable onPress={handleUnsafe} style={s.crisisBannerInner}>
                  <Text style={s.crisisIcon}>⚠️</Text>
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text style={s.crisisTitle}>This sounds serious</Text>
                    <Text style={s.crisisSub}>Tap here if you need immediate help →</Text>
                  </View>
                </Pressable>
              </Animated.View>
            ) : null}
          </View>




          {/* ── Intensity — Tone-style pills ── */}
          {cfg.showIntensity ? (
            <View style={s.intensitySection}>
              <View style={s.intensityHeader}>
                <Text style={s.intensityLabel}>How intense?</Text>
                <Text style={s.intensityOpt}>optional</Text>
              </View>
              <View style={s.intensityRow}>
                {INTENSITY_OPTIONS.map(opt => {
                  const sel = intensity === opt.level;
                  return (
                    <Pressable
                      key={opt.level}
                      onPress={() => handleSelectIntensity(opt.level)}
                      style={({ pressed }) => [
                        s.intensityPill,
                        sel && { backgroundColor: `${opt.color}18`, borderColor: `${opt.color}45` },
                        pressed && { opacity: 0.8 },
                      ]}
                    >
                      <Text style={[s.intensityPillText, sel && { color: opt.color }]}>
                        {opt.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          ) : null}




          {error ? <Text style={s.errorText}>{error}</Text> : null}




          {/* CTA — Amber gradient */}
          <Pressable
            onPress={handleGetScript}
            disabled={!canSubmit || loading}
            style={({ pressed }) => [
              pressed && canSubmit && !loading && { opacity: 0.9, transform: [{ scale: 0.98 }] },
            ]}
          >
            <LinearGradient
              colors={canSubmit && !loading ? ['#C8883A', '#E8A855'] : ['rgba(255,255,255,0.06)', 'rgba(255,255,255,0.04)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={s.ctaBtn}
            >
              <Text style={[s.ctaLabel, (!canSubmit || loading) && { color: 'rgba(255,255,255,0.25)' }]}>
                {loading ? 'Getting script…' : cfg.btnLabel}
              </Text>
            </LinearGradient>
          </Pressable>




          {cfg.showCrisis ? (
            <Pressable onPress={handleUnsafe} style={s.emergencyBtn}>
              <Text style={s.emergencyText}>
                This feels like an emergency → Get help now
              </Text>
            </Pressable>
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}




const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0e0a10' },
  content: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 40,
    gap: 22,
  },


  back: { alignSelf: 'flex-start', paddingVertical: 6 },
  backText: { fontFamily: F.bodyMedium, fontSize: 16, color: C.textMuted },


  header: { gap: 10 },
  contextPill: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(138,160,96,0.12)',
    borderWidth: 1, borderColor: 'rgba(138,160,96,0.25)',
    borderRadius: 999, paddingHorizontal: 12, paddingVertical: 5,
  },
  contextPillText: { fontFamily: F.bodySemi, fontSize: 12, color: C.sage },
  title: { fontFamily: F.heading, fontSize: 28, color: C.text, lineHeight: 34, letterSpacing: -0.3 },
  sub: { fontFamily: F.body, fontSize: 15, color: C.textSub, lineHeight: 22 },


  noChildCard: {
    backgroundColor: 'rgba(212,148,74,0.08)',
    borderRadius: 16, padding: 14, gap: 4,
    borderWidth: 1, borderColor: 'rgba(212,148,74,0.20)',
  },
  noChildText: { fontFamily: F.body, fontSize: 14, color: C.amber },
  noChildLink: { fontFamily: F.bodySemi, fontSize: 14, color: C.amber, marginTop: 4 },


  textareaCard: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 18, overflow: 'hidden',
  },
  textareaFocused: {
    borderColor: 'rgba(87,120,163,0.35)',
  },
  textarea: {
    padding: 16,
    fontFamily: F.body,
    fontSize: 16,
    color: C.text,
    lineHeight: 24,
    minHeight: 130,
  },
  textareaHint: {
    fontFamily: F.body, fontSize: 12,
    color: C.textMuted, fontStyle: 'italic',
    paddingHorizontal: 16, paddingBottom: 12,
  },
  crisisBanner: {
    borderTopWidth: 1, borderTopColor: 'rgba(212,148,74,0.25)',
    backgroundColor: 'rgba(212,148,74,0.08)',
  },
  crisisBannerInner: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    padding: 12, paddingHorizontal: 16,
  },
  crisisIcon: { fontSize: 16 },
  crisisTitle: { fontFamily: F.bodySemi, fontSize: 13, color: C.amber },
  crisisSub: { fontFamily: F.body, fontSize: 11, color: C.textSub },


  // ── Intensity (tone-style pills) ──
  intensitySection: { gap: 10 },
  intensityHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  intensityLabel: { fontFamily: F.bodyMedium, fontSize: 14, color: C.textBody },
  intensityOpt: { fontFamily: F.body, fontSize: 12, color: C.textMuted, fontStyle: 'italic' },
  intensityRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  intensityPill: {
    flex: 1, minWidth: 60,
    paddingVertical: 10, paddingHorizontal: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center', justifyContent: 'center',
  },
  intensityPillText: {
    fontFamily: F.bodyMedium, fontSize: 12,
    color: C.textSub,
  },


  errorText: { fontFamily: F.body, fontSize: 14, color: C.coral, textAlign: 'center' },


  ctaBtn: {
    borderRadius: 18, minHeight: 56,
    alignItems: 'center', justifyContent: 'center',
  },
  ctaLabel: { fontFamily: F.subheading, fontSize: 17, color: '#FFFFFF', letterSpacing: 0.3 },


  emergencyBtn: { alignSelf: 'center', paddingVertical: 6 },
  emergencyText: { fontFamily: F.body, fontSize: 12, color: C.textMuted, textDecorationLine: 'underline' },
});



