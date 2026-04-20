// app/result.tsx
// v9 — Journal identity: pastel gradient, frosted glass, rose accents
// All logic preserved: progressive disclosure, voice, feedback, follow-up, safety

import { useMemo, useEffect, useState, useRef, useCallback } from 'react';
import {
  Animated,
  Dimensions,
  LayoutAnimation,
  Platform,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  UIManager,
  View,
} from 'react-native';
import { router, useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar }      from 'expo-status-bar';
import { SafeAreaView }   from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics       from 'expo-haptics';
import * as Speech        from 'expo-speech';
import * as Clipboard     from 'expo-clipboard';
import { ScriptCard }     from '../src/components/ui/ScriptCard';
import { useAuth }        from '../src/context/AuthContext';
import { useChildProfile } from '../src/context/ChildProfileContext';
import { getFollowUpResponse, CrisisDetectedError, type FollowUpResponse } from '../src/lib/api';
import { supabase }       from '../src/lib/supabase';
import { saveScript }     from '../src/lib/saveScript';
import { detectCrisis } from '../src/hooks/useCrisisMode';
import { colors as C, fonts as F } from '../src/theme';

const { width: W } = Dimensions.get('window');

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const FALLBACKS = [
  { situation_summary: 'A hard moment is happening right now.',
    regulate: { parent_action: 'Take one breath. Move closer.', script: "You're really upset right now.", coaching: '', strategies: [] as string[] },
    connect:  { parent_action: 'Stay calm. Hold the limit.', script: "I can see this is hard. I'm here.", coaching: '', strategies: [] as string[] },
    guide:    { parent_action: 'Give one clear option.', script: "Let's take one step at a time.", coaching: '', strategies: [] as string[] },
    avoid: ["Stop this right now", "Calm down", "You're fine"] },
  { situation_summary: 'Your child is struggling right now.',
    regulate: { parent_action: 'Lower your voice. Get low.', script: 'That was really hard.', coaching: '', strategies: [] as string[] },
    connect:  { parent_action: "Stay close. Don't rush.", script: "I hear you. I'm not going anywhere.", coaching: '', strategies: [] as string[] },
    guide:    { parent_action: 'One step. Keep it simple.', script: "We'll figure this out together.", coaching: '', strategies: [] as string[] },
    avoid: ['Why would you do that?', 'You always do this', 'Just stop'] },
];

function isValid(v: unknown): boolean { return typeof v === 'string' && (v as string).trim().length > 4; }
type Params = { situationSummary?: string; regulateAction?: string; regulateScript?: string; regulateCoaching?: string; regulateStrategies?: string; connectAction?: string; connectScript?: string; connectCoaching?: string; connectStrategies?: string; guideAction?: string; guideScript?: string; guideCoaching?: string; guideStrategies?: string; avoid?: string; childMessage?: string; mode?: string; conversation_id?: string };
const val = (v?: string | string[]) => Array.isArray(v) ? v[0] : v;
function parseStrategies(raw?: string): string[] { if (!raw) return []; try { const p = JSON.parse(raw); return Array.isArray(p) ? p : []; } catch { return []; } }

// ─── Voice Player ───
type VoiceState = 'idle' | 'playing';
type VoiceStep = 'regulate' | 'connect' | 'guide' | null;

function useVoicePlayer(script: { regulate: { parent_action: string; script: string }; connect: { parent_action: string; script: string }; guide: { parent_action: string; script: string }; }) {
  const [state, setState] = useState<VoiceState>('idle');
  const [currentStep, setCurrentStep] = useState<VoiceStep>(null);
  const mountedRef = useRef(true);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const queueRef = useRef<{ step: VoiceStep; text: string }[]>([]);
  const queueIdxRef = useRef(0);

  useEffect(() => { return () => { mountedRef.current = false; Speech.stop(); if (timeoutRef.current) clearTimeout(timeoutRef.current); }; }, []);

  const buildQueue = useCallback(() => [
    { step: 'regulate' as VoiceStep, text: `Regulate. ... ${script.regulate.parent_action} ... ${script.regulate.script}` },
    { step: 'connect' as VoiceStep,  text: `Connect. ... ${script.connect.parent_action} ... ${script.connect.script}` },
    { step: 'guide' as VoiceStep,    text: `Guide. ... ${script.guide.parent_action} ... ${script.guide.script}` },
  ], [script]);

  const speakNext = useCallback(() => {
    if (!mountedRef.current) return;
    const idx = queueIdxRef.current;
    if (idx >= queueRef.current.length) { setState('idle'); setCurrentStep(null); queueIdxRef.current = 0; return; }
    const item = queueRef.current[idx];
    setCurrentStep(item.step);
    Speech.speak(item.text, {
      language: 'en', rate: 0.85, pitch: 1.0,
      onDone: () => { if (!mountedRef.current) return; queueIdxRef.current = idx + 1; timeoutRef.current = setTimeout(() => { if (mountedRef.current) speakNext(); }, 1200); },
      onError: () => { if (!mountedRef.current) return; setState('idle'); setCurrentStep(null); },
    });
  }, []);

  const play = useCallback(() => { queueRef.current = buildQueue(); queueIdxRef.current = 0; setState('playing'); speakNext(); }, [buildQueue, speakNext]);
  const stop = useCallback(() => { Speech.stop(); if (timeoutRef.current) clearTimeout(timeoutRef.current); setState('idle'); setCurrentStep(null); queueIdxRef.current = 0; }, []);
  const toggle = useCallback(() => { if (state === 'playing') stop(); else play(); }, [state, play, stop]);
  return { state, currentStep, toggle, stop };
}

function PulsingDot() {
  const anim = useRef(new Animated.Value(0.4)).current;
  useEffect(() => { Animated.loop(Animated.sequence([
    Animated.timing(anim, { toValue: 1, duration: 600, useNativeDriver: true }),
    Animated.timing(anim, { toValue: 0.4, duration: 600, useNativeDriver: true }),
  ])).start(); }, [anim]);
  return <Animated.View style={[{ width: 6, height: 6, borderRadius: 3, backgroundColor: C.rose }, { opacity: anim }]} />;
}

// ═══════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════

export default function ResultScreen() {
  const navigation = useRouter();
  const params = useLocalSearchParams<Params>();
  const { session } = useAuth();
  const { activeChild } = useChildProfile();

  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveErr, setSaveErr] = useState('');
  const [avoidOpen, setAvoidOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [followUpLoading, setFollowUpLoading] = useState<string | null>(null);
  const [followUpError, setFollowUpError] = useState('');
  const [followUpResult, setFollowUpResult] = useState<FollowUpResponse | null>(null);
  const [feedbackGiven, setFeedbackGiven] = useState(false);
  const [feedbackStep, setFeedbackStep] = useState<'helpful' | 'outcome' | 'done'>('helpful');
  const [feedbackHelpful, setFeedbackHelpful] = useState<string | null>(null);

  const isFallback = !isValid(val(params.regulateScript));
  const mode = val(params.mode) ?? 'sos';
  const coachingDefaultOpen = mode !== 'sos';
  const childName = activeChild?.name?.trim() ?? '';
  const childAge = activeChild?.childAge;
  const childInitial = childName ? childName[0].toUpperCase() : '?';
  const fallbackIndex = useMemo(() => Math.floor(Math.random() * FALLBACKS.length), [params.regulateScript]);
  const fallback = FALLBACKS[fallbackIndex];

  const script = {
    situation_summary: isValid(val(params.situationSummary)) ? val(params.situationSummary)! : fallback.situation_summary,
    regulate: isValid(val(params.regulateScript)) ? { parent_action: val(params.regulateAction) ?? '', script: val(params.regulateScript)!, coaching: val(params.regulateCoaching) ?? '', strategies: parseStrategies(val(params.regulateStrategies)) } : fallback.regulate,
    connect: isValid(val(params.connectScript)) ? { parent_action: val(params.connectAction) ?? '', script: val(params.connectScript)!, coaching: val(params.connectCoaching) ?? '', strategies: parseStrategies(val(params.connectStrategies)) } : fallback.connect,
    guide: isValid(val(params.guideScript)) ? { parent_action: val(params.guideAction) ?? '', script: val(params.guideScript)!, coaching: val(params.guideCoaching) ?? '', strategies: parseStrategies(val(params.guideStrategies)) } : fallback.guide,
    avoid: (() => { try { const raw = val(params.avoid); if (!raw) return fallback.avoid; const p = JSON.parse(raw); return Array.isArray(p) ? p : fallback.avoid; } catch { return fallback.avoid; } })(),
  };

  useEffect(() => {
    const childMessage = val(params.childMessage);
    if (childMessage) {
      const crisisCheck = detectCrisis(childMessage);
      if (crisisCheck.isCrisis) logSafetyEvent(childMessage, crisisCheck.crisisType!, crisisCheck.riskLevel!);
    }
  }, [params.childMessage]);

  const scriptId = useMemo(() => `r-${Date.now()}`, [params.regulateScript]);
  const voice = useVoicePlayer(script);

  useEffect(() => {
    setSaved(false); setSaving(false); setSaveErr(''); setAvoidOpen(false);
    setFollowUpResult(null); setFollowUpError(''); setCopied(false);
    setFeedbackGiven(false); setFeedbackStep('helpful'); setFeedbackHelpful(null);
    return () => { voice.stop(); };
  }, [params.regulateScript]);

  const logSafetyEvent = async (excerpt: string, crisisType: string, riskLevel: string) => {
    if (!session?.user?.id) return;
    try { await supabase.from('safety_events').insert({ user_id: session.user.id, child_profile_id: activeChild?.id || null, conversation_id: val(params.conversation_id) || null, message_excerpt: excerpt.slice(0, 120), risk_level: riskLevel, policy_route: 'safety_support', classifier_version: 'v1-keyword', resolved_with: crisisType }); } catch {}
  };

  const handleGetHelp = () => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); logSafetyEvent('User tapped safety link', 'manual', 'ELEVATED_RISK'); router.push({ pathname: '/crisis', params: { crisisType: 'manual', riskLevel: 'ELEVATED_RISK' } }); };
  const handleCopy = () => { const text = [`Regulate: ${script.regulate.script}`, `Connect: ${script.connect.script}`, `Guide: ${script.guide.script}`].join('\n\n'); Clipboard.setStringAsync(text); setCopied(true); Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); setTimeout(() => setCopied(false), 2000); };
  const handleRetry = () => { voice.stop(); navigation.push({ pathname: '/now', params: { reset: Date.now().toString(), mode } }); };
  const handleSave = async () => { if (saved || saving) return; setSaving(true); setSaveErr(''); try { await saveScript({ situation_summary: script.situation_summary, regulate: script.regulate, connect: script.connect, guide: script.guide, avoid: script.avoid, childProfileId: activeChild?.id, conversationId: val(params.conversation_id), triggerLabel: null }); setSaved(true); Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); } catch { setSaveErr('Could not save.'); } finally { setSaving(false); } };
  const handleShare = async () => { const text = [`Regulate: ${script.regulate.script}`, `Connect: ${script.connect.script}`, `Guide: ${script.guide.script}`, '', '— Generated by Sturdy'].join('\n\n'); try { await Share.share({ message: text }); } catch {} };

  const handleFeedbackHelpful = async (value: string) => { setFeedbackHelpful(value); Haptics.selectionAsync(); if (value === 'yes') { await saveFeedback(value, null); setFeedbackGiven(true); } else { setFeedbackStep('outcome'); } };
  const handleFeedbackOutcome = async (outcome: string) => { Haptics.selectionAsync(); await saveFeedback(feedbackHelpful!, outcome); setFeedbackGiven(true); };
  const saveFeedback = async (helpful: string, outcome: string | null) => { if (!session?.user?.id) return; try { await supabase.from('script_feedback').insert({ user_id: session.user.id, child_profile_id: activeChild?.id || null, conversation_id: val(params.conversation_id) || null, helpful, outcome, most_helpful_step: null, parent_notes: null }); } catch {} };
  const toggleAvoid = () => { LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut); setAvoidOpen(prev => !prev); };

  const handleFollowUp = async (followUpType: string) => {
    if (followUpLoading) return; voice.stop(); setFollowUpLoading(followUpType); setFollowUpError(''); setFollowUpResult(null);
    try {
      const result = await getFollowUpResponse({ childName: childName || 'My child', childAge: childAge ?? 5, message: val(params.childMessage) ?? script.situation_summary, userId: session?.user?.id, intensity: null, mode, isFollowUp: true, followUpType, originalScript: { situation_summary: script.situation_summary, regulate: script.regulate.script, connect: script.connect.script, guide: script.guide.script } });
      setFollowUpResult(result);
    } catch (err) { if (err instanceof CrisisDetectedError) { logSafetyEvent(val(params.childMessage) || '', err.crisisType, err.riskLevel); router.push({ pathname: '/crisis', params: { crisisType: err.crisisType, riskLevel: err.riskLevel } }); return; } setFollowUpError("Couldn't get a response."); }
    finally { setFollowUpLoading(null); }
  };

  const isPlaying = voice.state === 'playing';
  const showEscalationHelp = feedbackGiven && feedbackHelpful === 'no';

  return (
    <SafeAreaView style={s.root} edges={['top']}>
      <StatusBar style="dark" />
      <LinearGradient colors={[C.gradStart, C.gradMid1, C.gradMid2, C.gradEnd]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />

      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        {/* Back */}
        <View style={s.backRow}>
          <Pressable onPress={() => { voice.stop(); router.back(); }} style={s.back}><Text style={s.backText}>← Back</Text></Pressable>
          <Pressable onPress={() => { voice.stop(); router.replace('/(tabs)'); }} style={s.homeBtn}><Text style={s.homeBtnText}>🏠</Text></Pressable>
        </View>

        {/* Fallback */}
        {isFallback ? (
          <View style={s.fallbackCard}>
            <Text style={{ fontSize: 18 }}>🌿</Text>
            <View style={{ flex: 1, gap: 3 }}><Text style={s.fallbackTitle}>Couldn't connect right now</Text><Text style={s.fallbackBody}>Here's a general script to start with.</Text></View>
          </View>
        ) : null}

        {/* Header */}
        <View>
          <Text style={s.summary}>{script.situation_summary}</Text>
          <View style={s.tagRow}>
            <View style={s.ava}><Text style={s.avaText}>{childInitial}</Text></View>
            <Text style={s.tagText}>{childName || 'Your child'}{childAge ? `, age ${childAge}` : ''}</Text>
          </View>
        </View>

        {/* Safety */}
        <Pressable onPress={handleGetHelp} style={s.safetyLink}>
          <Text style={s.safetyIcon}>·</Text>
          <Text style={s.safetyText}>If this feels unsafe, <Text style={s.safetyLinkText}>get immediate help →</Text></Text>
        </Pressable>

        {/* Voice */}
        <Pressable onPress={voice.toggle}>
          <View style={s.voiceCard}>
            <View style={[s.playBtn, isPlaying && s.playBtnActive]}>
              <Text style={{ color: '#FFF', fontSize: 14, marginLeft: isPlaying ? 0 : 2 }}>{isPlaying ? '⏹' : '▶'}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={s.voiceTitle}>{isPlaying ? 'Playing script…' : 'Listen to this script'}</Text>
                {isPlaying && <PulsingDot />}
              </View>
              <Text style={s.voiceSub}>{isPlaying ? `Now: ${voice.currentStep === 'regulate' ? 'Regulate' : voice.currentStep === 'connect' ? 'Connect' : 'Guide'}` : 'Put in your earbuds — Sturdy walks you through it'}</Text>
            </View>
          </View>
        </Pressable>

        {/* Avoid */}
        <Pressable onPress={toggleAvoid} style={s.avoidHeader}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}><Text style={{ fontSize: 14 }}>⚠️</Text><Text style={s.avoidLabel}>AVOID SAYING</Text></View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}><Text style={s.avoidCount}>{script.avoid.length} phrases</Text><Text style={{ fontSize: 10, color: C.textMuted }}>{avoidOpen ? '▲' : '▼'}</Text></View>
        </Pressable>
        {avoidOpen ? (<View style={s.avoidBody}>{script.avoid.map((phrase, i) => (<View key={i} style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8 }}><Text style={s.avoidX}>✕</Text><Text style={s.avoidText}>{phrase}</Text></View>))}</View>) : null}

        {/* Script cards */}
        <ScriptCard key={`r-${scriptId}`} step="Regulate" parent_action={script.regulate.parent_action} script={script.regulate.script} coaching={script.regulate.coaching} strategies={script.regulate.strategies} delay={0} defaultOpen={true} coachingOpen={coachingDefaultOpen} />
        <ScriptCard key={`c-${scriptId}`} step="Connect" parent_action={script.connect.parent_action} script={script.connect.script} coaching={script.connect.coaching} strategies={script.connect.strategies} delay={150} defaultOpen={false} coachingOpen={coachingDefaultOpen} />
        <ScriptCard key={`g-${scriptId}`} step="Guide" parent_action={script.guide.parent_action} script={script.guide.script} coaching={script.guide.coaching} strategies={script.guide.strategies} delay={300} defaultOpen={false} coachingOpen={coachingDefaultOpen} />

        {/* Feedback */}
        {!feedbackGiven ? (
          <View style={s.feedbackCard}>
            {feedbackStep === 'helpful' ? (<><Text style={s.feedbackQuestion}>Did this help?</Text><View style={s.feedbackRow}>{[{ value: 'yes', label: '👍 Yes' }, { value: 'somewhat', label: '🤷 Somewhat' }, { value: 'no', label: '👎 No' }].map(opt => (<Pressable key={opt.value} onPress={() => handleFeedbackHelpful(opt.value)} style={({ pressed }) => [s.feedbackChip, pressed && { opacity: 0.7 }]}><Text style={s.feedbackChipText}>{opt.label}</Text></Pressable>))}</View></>) : feedbackStep === 'outcome' ? (<><Text style={s.feedbackQuestion}>What happened?</Text><View style={s.feedbackRow}>{[{ value: 'calmed', label: '😌 Calmed down' }, { value: 'escalated', label: '📈 Escalated' }, { value: 'ignored', label: '😶 Ignored' }, { value: 'ongoing', label: '⏳ Still going' }].map(opt => (<Pressable key={opt.value} onPress={() => handleFeedbackOutcome(opt.value)} style={({ pressed }) => [s.feedbackChip, pressed && { opacity: 0.7 }]}><Text style={s.feedbackChipText}>{opt.label}</Text></Pressable>))}</View></>) : null}
          </View>
        ) : (<View style={s.feedbackThanks}><Text style={s.feedbackThanksText}>Thanks — this helps Sturdy learn ✓</Text></View>)}

        {/* Escalation */}
        {showEscalationHelp ? (
          <View style={s.escalationCard}>
            <Text style={s.escalationTitle}>We hear you.</Text>
            <Text style={s.escalationBody}>Some moments need more than a script. If this situation is getting worse or feels unsafe, you don't have to handle it alone.</Text>
            <Pressable onPress={handleGetHelp} style={s.escalationBtn}><Text style={s.escalationBtnText}>Talk to someone now →</Text></Pressable>
          </View>
        ) : null}

        {/* Follow-up */}
        <View style={s.followup}>
          <Text style={s.followupLabel}>What if...</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.followupScroll}>
            {[{ emoji: '🚫', text: "They won't budge", type: 'refused', color: C.rose },
              { emoji: '📈', text: 'Getting worse', type: 'escalated', color: '#F79566' },
              { emoji: '😶', text: 'Shut down', type: 'shutdown', color: '#5778A3' },
              { emoji: '🗣️', text: 'Pushing back', type: 'pushback', color: C.rose },
              { emoji: '💛', text: 'Starting to work', type: 'worked', color: C.sage },
            ].map((item, i) => {
              const isLoading = followUpLoading === item.type;
              const anyLoading = followUpLoading !== null;
              const isActive = followUpResult?.followup_type === item.type;
              const active = isActive || isLoading;
              return (<Pressable key={i} onPress={() => handleFollowUp(item.type)} disabled={anyLoading} style={[s.followupChip, active && { backgroundColor: `${item.color}15`, borderColor: `${item.color}40` }, anyLoading && !isLoading && !isActive && { opacity: 0.4 }]}><Text style={{ fontSize: 14 }}>{isLoading ? '⏳' : item.emoji}</Text><Text style={[s.followupChipText, active && { color: item.color }]}>{item.text}</Text></Pressable>);
            })}
          </ScrollView>

          {followUpResult ? (<View style={s.followUpResultCard}><Text style={s.followUpBody}>{followUpResult.what_happened}{followUpResult.what_to_do ? ` ${followUpResult.what_to_do}` : ''}</Text><View style={s.followUpSayThis}><Text style={s.followUpSayLabel}>SAY THIS</Text><Text style={s.followUpSayText}>"{followUpResult.say_this}"</Text></View></View>) : null}
          {followUpError ? <Text style={s.followupError}>{followUpError}</Text> : null}
        </View>

        {/* Nudge */}
        <View style={s.nudgeCard}>
          <Text style={s.nudgeText}>Sturdy is learning how {childName || 'your child'} responds.</Text>
          <Pressable onPress={() => router.push('/(tabs)/child')}><Text style={s.nudgeLink}>See {childName ? `${childName}'s` : 'their'} profile →</Text></Pressable>
        </View>

        <Pressable onPress={handleShare} style={{ alignSelf: 'center', paddingVertical: 8 }}><Text style={s.shareText}>Share script</Text></Pressable>
        {saveErr ? <Text style={s.errorText}>{saveErr}</Text> : null}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Footer */}
      <View style={s.footer}>
        <LinearGradient colors={['transparent', 'rgba(253,250,245,0.95)', C.base]} locations={[0, 0.35, 0.75]} style={s.footerFade} pointerEvents="none" />
        <View style={s.footerContent}>
          <View style={s.footerRow}>
            <Pressable onPress={handleSave} disabled={saved || saving} style={({ pressed }) => [s.footerGhost, pressed && { opacity: 0.7 }]}>
              <Text style={s.footerGhostText}>{saved ? '✓ Saved' : saving ? 'Saving…' : 'Save'}</Text>
            </Pressable>
            <Pressable onPress={handleCopy} style={({ pressed }) => [s.footerGhost, pressed && { opacity: 0.7 }]}>
              <Text style={s.footerGhostText}>{copied ? '✓ Copied' : 'Copy'}</Text>
            </Pressable>
            <Pressable onPress={handleRetry} style={({ pressed }) => [pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] }]}>
              <View style={s.footerPrimary}><Text style={s.footerPrimaryText}>Retry</Text></View>
            </Pressable>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.base },
  scroll: { paddingHorizontal: 24, paddingTop: 8, paddingBottom: 40, gap: 14 },

  backRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  back: { alignSelf: 'flex-start', paddingVertical: 6 },
  backText: { fontFamily: F.bodyMedium, fontSize: 15, color: C.textMuted },
  homeBtn: { paddingVertical: 6, paddingHorizontal: 10 },
  homeBtnText: { fontSize: 20 },

  fallbackCard: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, borderRadius: 16, padding: 14, backgroundColor: 'rgba(129,178,154,0.08)', borderWidth: 1, borderColor: 'rgba(129,178,154,0.15)' },
  fallbackTitle: { fontFamily: F.bodySemi, fontSize: 14, color: C.sage },
  fallbackBody: { fontFamily: F.body, fontSize: 13, color: C.textSub },

  summary: { fontFamily: F.scriptItalic, fontSize: 21, color: C.rose, lineHeight: 30, marginBottom: 8 },
  tagRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  ava: { width: 22, height: 22, borderRadius: 11, backgroundColor: C.sage, alignItems: 'center', justifyContent: 'center' },
  avaText: { fontFamily: F.bodySemi, fontSize: 10, color: '#FFF' },
  tagText: { fontFamily: F.body, fontSize: 12, color: C.textMuted },

  safetyLink: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 2 },
  safetyIcon: { color: C.rose, fontSize: 16 },
  safetyText: { fontFamily: F.body, fontSize: 12, color: C.textMuted },
  safetyLinkText: { fontFamily: F.bodySemi, color: C.rose, textDecorationLine: 'underline' },

  voiceCard: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 18, backgroundColor: C.cardGlass, borderWidth: 1, borderColor: C.border },
  playBtn: { width: 42, height: 42, borderRadius: 21, backgroundColor: C.sage, alignItems: 'center', justifyContent: 'center' },
  playBtnActive: { backgroundColor: C.rose },
  voiceTitle: { fontFamily: F.bodySemi, fontSize: 14, color: C.text },
  voiceSub: { fontFamily: F.body, fontSize: 12, color: C.textMuted, marginTop: 2 },

  avoidHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 14, borderRadius: 18, backgroundColor: C.cardGlass, borderWidth: 1, borderColor: C.border },
  avoidLabel: { fontFamily: F.bodySemi, fontSize: 12, letterSpacing: 0.6, color: C.rose },
  avoidCount: { fontFamily: F.bodyMedium, fontSize: 11, color: C.textMuted, backgroundColor: 'rgba(0,0,0,0.04)', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  avoidBody: { paddingHorizontal: 18, paddingBottom: 14, gap: 8, marginTop: -8 },
  avoidX: { fontFamily: F.bodySemi, fontSize: 10, color: C.rose, marginTop: 3 },
  avoidText: { fontFamily: F.script, fontSize: 14, color: C.textSub, lineHeight: 21, flex: 1 },

  feedbackCard: { alignItems: 'center', gap: 12, borderRadius: 18, padding: 18, backgroundColor: C.cardGlass, borderWidth: 1, borderColor: C.border },
  feedbackQuestion: { fontFamily: F.bodySemi, fontSize: 15, color: C.text },
  feedbackRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center' },
  feedbackChip: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 14, backgroundColor: 'rgba(0,0,0,0.04)', borderWidth: 1, borderColor: C.border },
  feedbackChipText: { fontFamily: F.bodyMedium, fontSize: 13, color: C.text },
  feedbackThanks: { alignItems: 'center', paddingVertical: 12 },
  feedbackThanksText: { fontFamily: F.bodyMedium, fontSize: 13, color: C.sage },

  escalationCard: { borderRadius: 18, padding: 18, gap: 10, backgroundColor: 'rgba(201,123,99,0.06)', borderWidth: 1, borderColor: 'rgba(201,123,99,0.15)' },
  escalationTitle: { fontFamily: F.display, fontSize: 18, color: C.rose },
  escalationBody: { fontFamily: F.body, fontSize: 14, color: C.text, lineHeight: 22 },
  escalationBtn: { alignSelf: 'flex-start', paddingVertical: 10, paddingHorizontal: 16, borderRadius: 12, backgroundColor: 'rgba(201,123,99,0.12)', borderWidth: 1, borderColor: 'rgba(201,123,99,0.25)' },
  escalationBtnText: { fontFamily: F.bodySemi, fontSize: 14, color: C.rose },

  followup: { gap: 8 },
  followupLabel: { fontFamily: F.bodyMedium, fontSize: 13, color: C.textMuted, textAlign: 'center', marginBottom: 4 },
  followupScroll: { gap: 8, paddingRight: 16 },
  followupChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 14, backgroundColor: C.cardGlass, borderWidth: 1, borderColor: C.border },
  followupChipText: { fontFamily: F.bodyMedium, fontSize: 13, color: C.textSub },
  followupError: { fontFamily: F.body, fontSize: 13, color: C.rose, textAlign: 'center', marginTop: 4 },

  followUpResultCard: { borderRadius: 18, padding: 16, gap: 12, backgroundColor: 'rgba(201,123,99,0.05)', borderWidth: 1, borderColor: 'rgba(201,123,99,0.12)' },
  followUpBody: { fontFamily: F.body, fontSize: 15, color: C.text, lineHeight: 23 },
  followUpSayThis: { gap: 4, paddingTop: 12, borderTopWidth: 1, borderTopColor: C.border },
  followUpSayLabel: { fontFamily: F.label, fontSize: 10, letterSpacing: 0.8, color: C.rose },
  followUpSayText: { fontFamily: F.bodySemi, fontSize: 18, color: C.text, lineHeight: 26 },

  nudgeCard: { alignItems: 'center', gap: 4, borderRadius: 18, padding: 16, backgroundColor: 'rgba(129,178,154,0.06)', borderWidth: 1, borderColor: 'rgba(129,178,154,0.12)' },
  nudgeText: { fontFamily: F.body, fontSize: 13, color: C.textSub, textAlign: 'center' },
  nudgeLink: { fontFamily: F.bodySemi, fontSize: 13, color: C.sage },

  shareText: { fontFamily: F.bodySemi, fontSize: 13, color: C.rose, textDecorationLine: 'underline' },
  errorText: { fontFamily: F.body, fontSize: 13, color: C.rose, textAlign: 'center' },

  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 10 },
  footerFade: { height: 40 },
  footerContent: { backgroundColor: C.base, paddingHorizontal: 24, paddingBottom: 28, paddingTop: 4 },
  footerRow: { flexDirection: 'row', gap: 10 },
  footerGhost: { flex: 1, borderRadius: 16, minHeight: 50, alignItems: 'center', justifyContent: 'center', backgroundColor: C.cardGlass, borderWidth: 1, borderColor: C.border },
  footerGhostText: { fontFamily: F.bodyMedium, fontSize: 14, color: C.text },
  footerPrimary: { flex: 1, borderRadius: 16, minHeight: 50, minWidth: 100, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20, backgroundColor: C.rose },
  footerPrimaryText: { fontFamily: F.subheading, fontSize: 14, color: '#FFFFFF', letterSpacing: 0.3 },
});


