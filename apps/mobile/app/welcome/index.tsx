// app/welcome/index.tsx
// v11 — Journal identity: 4-screen welcome flow
// FIXED: All screens inlined (no inner component functions) to prevent TextInput remount


import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { router }          from 'expo-router';
import { StatusBar }       from 'expo-status-bar';
import { SafeAreaView }    from 'react-native-safe-area-context';
import { LinearGradient }  from 'expo-linear-gradient';
import * as Haptics        from 'expo-haptics';
import AsyncStorage        from '@react-native-async-storage/async-storage';
import { useAuth }         from '../../src/context/AuthContext';
import { supabase }        from '../../src/lib/supabase';
import { colors as C, fonts as F } from '../../src/theme';


const { width: W } = Dimensions.get('window');
const GUEST_SEEN_KEY = 'sturdy_guest_seen_v1';
const AGES = [2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17];
const NEUROTYPES = ['ADHD', 'Autism', 'Anxiety', 'Sensory', 'PDA'];


// Dots — defined outside, no state dependency
function Dots({ count, active }: { count: number; active: number }) {
  return (
    <View style={s.dots}>
      {Array.from({ length: count }).map((_, i) => (
        <View key={i} style={[s.dot, i === active && s.dotActive]} />
      ))}
    </View>
  );
}


export default function WelcomeScreen() {
  const { session } = useAuth();
  const scrollRef = useRef<ScrollView>(null);


  const [childName, setChildName] = useState('');
  const [childAge, setChildAge] = useState<number | null>(null);
  const [selectedNeuro, setSelectedNeuro] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);


  const splashOpacity = useRef(new Animated.Value(0)).current;


  useEffect(() => {
    if (session) { router.replace('/(tabs)'); return; }
    Animated.timing(splashOpacity, { toValue: 1, duration: 600, useNativeDriver: true }).start();
    const timer = setTimeout(() => {
      scrollRef.current?.scrollTo({ x: W, animated: true });
    }, 2500);
    return () => clearTimeout(timer);
  }, [session]);


  const goTo = (index: number) => {
    Haptics.selectionAsync();
    scrollRef.current?.scrollTo({ x: W * index, animated: true });
  };


  const handleGetStarted = () => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); goTo(2); };
  const handleTryWithChild = () => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); goTo(3); };
  const handleSignIn = () => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push('/auth/sign-in'); };


  const handleSkip = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await AsyncStorage.setItem(GUEST_SEEN_KEY, 'true');
    router.replace('/(tabs)');
  };


  const toggleNeuro = (n: string) => {
    Haptics.selectionAsync();
    setSelectedNeuro(prev => prev.includes(n) ? prev.filter(x => x !== n) : [...prev, n]);
  };


  const handleFinishSetup = async () => {
    if (!childAge) return;
    setSaving(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      if (session?.user?.id) {
        await supabase.from('child_profiles').insert({
          user_id: session.user.id,
          name: childName.trim() || 'My child',
          child_age: childAge,
          neurotype: selectedNeuro.length > 0 ? selectedNeuro : null,
        });
      } else {
        const draft = { name: childName.trim() || 'My child', childAge, neurotype: selectedNeuro.length > 0 ? selectedNeuro : null };
        await AsyncStorage.setItem('sturdy_child_draft', JSON.stringify(draft));
        await AsyncStorage.setItem(GUEST_SEEN_KEY, 'true');
      }
      router.replace('/(tabs)');
    } catch (e) {
      console.warn('[Welcome] save error', e);
      await AsyncStorage.setItem(GUEST_SEEN_KEY, 'true');
      router.replace('/(tabs)');
    } finally { setSaving(false); }
  };


  return (
    <SafeAreaView style={s.root} edges={['top', 'bottom']}>
      <StatusBar style="dark" />
      <LinearGradient
        colors={[C.gradStart, C.gradMid1, C.gradMid2, C.gradEnd]}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />


      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEventThrottle={16}
        keyboardShouldPersistTaps="handled"
      >


        {/* ═══ SCREEN 0 — SPLASH ═══ */}
        <Animated.View style={[s.page, { opacity: splashOpacity }]}>
          <View style={s.splashContent}>
            <View style={s.splashLogoWrap}>
              <View style={s.splashLogoInner}>
                <Image
                  source={require('../../assets/logo.png')}
                  style={{ width: 56, height: 56 }}
                  resizeMode="contain"
                />
              </View>
            </View>
            <Text style={s.splashName}>Sturdy</Text>
            <Text style={s.splashTagline}>For the hard moments.</Text>
          </View>
        </Animated.View>


        {/* ═══ SCREEN 1 — HOOK ═══ */}
        <View style={s.page}>
          <View style={s.hookContent}>
            <View style={{ flex: 1, justifyContent: 'center' }}>
              <View style={s.hookBadge}>
                <Text style={s.hookBadgeText}>FOR PARENTS OF 2–17 YEAR OLDS</Text>
              </View>
              <Text style={s.hookHeadline}>
                Know what to say{'\n'}
                <Text style={s.hookAccent}>in hard moments.</Text>
              </Text>
              <Text style={s.hookSub}>
                Calm, age-specific scripts when you need them most. Not therapy speak — real words a real parent would say.
              </Text>
              <View style={s.hookPromise}>
                <Text style={s.hookPromiseText}>
                  Get a practical, age-specific script in under 3 seconds.
                </Text>
              </View>
            </View>


            <View style={s.btnGroup}>
              <Pressable onPress={handleGetStarted}
                style={({ pressed }) => [pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] }]}>
                <View style={s.ctaBtn}><Text style={s.ctaBtnText}>Get Started — Free</Text></View>
              </Pressable>
              <Pressable onPress={handleSignIn}>
                <Text style={s.secondaryLink}>Already have an account? Sign in</Text>
              </Pressable>
              <Text style={s.trustLabel}>🔒 Your data stays private</Text>
            </View>
            <Dots count={4} active={1} />
          </View>
        </View>


        {/* ═══ SCREEN 2 — EXAMPLE ═══ */}
        <View style={s.page}>
          <View style={s.exContent}>
            <View style={{ flex: 1, justifyContent: 'center', gap: 14 }}>
              <Text style={s.exContext}>HERE'S HOW IT WORKS</Text>


              <View style={s.exScenario}>
                <Text style={s.exScenarioQ}>A PARENT TYPES:</Text>
                <Text style={s.exScenarioText}>
                  "My 4-year-old is screaming because we have to leave the park."
                </Text>
              </View>


              <Text style={s.exArrow}>↓</Text>


              <View style={[s.exCard, s.exCardReg]}>
                <View style={[s.exCardNum, { backgroundColor: C.rose }]}><Text style={s.exCardNumText}>1</Text></View>
                <View style={{ flex: 1 }}><Text style={[s.exCardLabel, { color: C.rose }]}>REGULATE</Text><Text style={s.exCardText}>"Take a breath. I'm here, and I won't let you hit."</Text></View>
              </View>


              <View style={[s.exCard, s.exCardCon]}>
                <View style={[s.exCardNum, { backgroundColor: '#5778A3' }]}><Text style={s.exCardNumText}>2</Text></View>
                <View style={{ flex: 1 }}><Text style={[s.exCardLabel, { color: '#5778A3' }]}>CONNECT</Text><Text style={s.exCardText}>"You really wanted to stay at the park."</Text></View>
              </View>


              <View style={[s.exCard, s.exCardGui]}>
                <View style={[s.exCardNum, { backgroundColor: C.sage }]}><Text style={s.exCardNumText}>3</Text></View>
                <View style={{ flex: 1 }}><Text style={[s.exCardLabel, { color: C.sage }]}>GUIDE</Text><Text style={s.exCardText}>"It's time to leave now. Hold my hand or I will carry you."</Text></View>
              </View>


              <Text style={s.exNote}>Every script adapts to your child's exact age, temperament, and what's happening.</Text>
            </View>


            <View style={s.btnGroup}>
              <Pressable onPress={handleTryWithChild}
                style={({ pressed }) => [pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] }]}>
                <View style={s.ctaBtn}><Text style={s.ctaBtnText}>Try it with my child</Text></View>
              </Pressable>
            </View>
            <Dots count={4} active={2} />
          </View>
        </View>


        {/* ═══ SCREEN 3 — CHILD SETUP ═══ */}
        <View style={s.page}>
          <ScrollView
            contentContainerStyle={s.setupScroll}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            nestedScrollEnabled
          >
            <View style={{ flex: 1, justifyContent: 'center' }}>
              <Text style={s.setupEmoji}>👋</Text>
              <Text style={s.setupHeadline}>Tell us about{'\n'}your child</Text>
              <Text style={s.setupSub}>Sturdy uses this to match scripts{'\n'}to their exact age and neurotype.</Text>


              <View style={s.setupForm}>
                {/* Name */}
                <View style={s.setupField}>
                  <View style={s.setupFieldHeader}>
                    <Text style={s.setupFieldLabel}>FIRST NAME</Text>
                    <Text style={s.setupFieldOpt}>Optional</Text>
                  </View>
                  <TextInput
                    value={childName}
                    onChangeText={setChildName}
                    placeholder="e.g. Alex"
                    placeholderTextColor="rgba(42,37,32,0.18)"
                    style={s.setupInput}
                    autoCorrect={false}
                  />
                </View>


                {/* Age */}
                <View style={s.setupField}>
                  <View style={s.setupFieldHeader}>
                    <Text style={s.setupFieldLabel}>AGE</Text>
                  </View>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}
                    contentContainerStyle={s.ageScroll} nestedScrollEnabled>
                    {AGES.map(age => (
                      <Pressable key={age} onPress={() => { Haptics.selectionAsync(); setChildAge(age); }}>
                        <View style={[s.agePill, childAge === age && s.agePillActive]}>
                          <Text style={[s.agePillText, childAge === age && s.agePillTextActive]}>{age}</Text>
                        </View>
                      </Pressable>
                    ))}
                  </ScrollView>
                </View>


                {/* Neurotype */}
                <View style={s.setupField}>
                  <View style={s.setupFieldHeader}>
                    <Text style={s.setupFieldLabel}>NEUROTYPE</Text>
                    <Text style={s.setupFieldOpt}>Optional</Text>
                  </View>
                  <View style={s.neuroRow}>
                    {NEUROTYPES.map(n => (
                      <Pressable key={n} onPress={() => toggleNeuro(n)}>
                        <View style={[s.neuroChip, selectedNeuro.includes(n) && s.neuroChipActive]}>
                          <Text style={[s.neuroChipText, selectedNeuro.includes(n) && s.neuroChipTextActive]}>{n}</Text>
                        </View>
                      </Pressable>
                    ))}
                  </View>
                </View>
              </View>


              <Pressable onPress={handleSkip}>
                <Text style={s.setupSkip}>I'll set this up later</Text>
              </Pressable>
            </View>


            <View style={[s.btnGroup, { marginTop: 20 }]}>
              <Pressable onPress={handleFinishSetup}
                disabled={!childAge || saving}
                style={({ pressed }) => [pressed && childAge && !saving ? { opacity: 0.9, transform: [{ scale: 0.98 }] } : null]}>
                <View style={[s.ctaBtn, (!childAge || saving) && s.ctaBtnDisabled]}>
                  <Text style={[s.ctaBtnText, (!childAge || saving) && { color: C.textMuted }]}>
                    {saving ? 'Setting up…' : 'Finish Setup'}
                  </Text>
                </View>
              </Pressable>
            </View>


            <View style={s.trustRow}>
              <Text style={s.trustItem}>🔒 Private</Text>
              <Text style={s.trustItem}>📚 Science-backed</Text>
            </View>
            <Dots count={4} active={3} />
            <View style={{ height: 20 }} />
          </ScrollView>
        </View>


      </ScrollView>
    </SafeAreaView>
  );
}


// ═══════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════


const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.base },
  page: { width: W, flex: 1 },


  dots: { flexDirection: 'row', gap: 6, justifyContent: 'center', marginTop: 20, paddingBottom: 8 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(42,37,32,0.10)' },
  dotActive: { width: 20, backgroundColor: C.rose },


  btnGroup: { gap: 12 },
  ctaBtn: { backgroundColor: C.rose, borderRadius: 16, paddingVertical: 18, alignItems: 'center', justifyContent: 'center', shadowColor: C.rose, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.2, shadowRadius: 16, elevation: 4 },
  ctaBtnDisabled: { backgroundColor: 'rgba(0,0,0,0.06)', shadowOpacity: 0 },
  ctaBtnText: { fontFamily: F.subheading, fontSize: 16, color: '#FFFFFF' },
  secondaryLink: { fontFamily: F.subheading, fontSize: 14, color: C.textMuted, textAlign: 'center', paddingVertical: 10 },
  trustLabel: { fontFamily: F.bodySemi, fontSize: 12, color: C.textMuted, textAlign: 'center', marginTop: 2 },


  // Splash
  splashContent: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 },
  splashLogoWrap: { width: 88, height: 88, borderRadius: 28, backgroundColor: 'rgba(201,123,99,0.10)', alignItems: 'center', justifyContent: 'center' },
  splashLogoInner: { width: 72, height: 72, borderRadius: 22, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  splashName: { fontFamily: F.heading, fontSize: 26, color: C.text, letterSpacing: -0.5 },
  splashTagline: { fontFamily: F.bodySemi, fontSize: 15, color: C.textSub },


  // Hook
  hookContent: { flex: 1, paddingHorizontal: 28, paddingTop: 50, paddingBottom: 30 },
  hookBadge: { alignSelf: 'flex-start', backgroundColor: 'rgba(255,255,255,0.6)', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6, marginBottom: 24 },
  hookBadgeText: { fontFamily: F.heading, fontSize: 11, color: C.rose, letterSpacing: 0.5 },
  hookHeadline: { fontFamily: F.heading, fontSize: 34, color: C.text, lineHeight: 40, letterSpacing: -1, marginBottom: 16 },
  hookAccent: { color: C.rose },
  hookSub: { fontFamily: F.bodyMedium, fontSize: 16, color: C.textSub, lineHeight: 24, marginBottom: 24 },
  hookPromise: { backgroundColor: C.cardGlass, borderRadius: 16, padding: 18, borderWidth: 1, borderColor: C.border },
  hookPromiseText: { fontFamily: F.subheading, fontSize: 14, color: C.text, textAlign: 'center' },


  // Example
  exContent: { flex: 1, paddingHorizontal: 24, paddingTop: 40, paddingBottom: 30 },
  exContext: { fontFamily: F.heading, fontSize: 11, letterSpacing: 1, color: C.textMuted, textAlign: 'center' },
  exScenario: { backgroundColor: C.cardGlass, borderRadius: 18, padding: 18, borderWidth: 1, borderColor: C.border },
  exScenarioQ: { fontFamily: F.heading, fontSize: 12, color: C.textMuted, marginBottom: 6 },
  exScenarioText: { fontFamily: F.subheading, fontSize: 16, color: C.text, lineHeight: 22 },
  exArrow: { textAlign: 'center', fontSize: 20, color: 'rgba(42,37,32,0.12)' },
  exCard: { flexDirection: 'row', gap: 14, alignItems: 'flex-start', backgroundColor: C.cardGlass, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: C.border },
  exCardReg: { borderLeftWidth: 4, borderLeftColor: C.rose },
  exCardCon: { borderLeftWidth: 4, borderLeftColor: '#5778A3' },
  exCardGui: { borderLeftWidth: 4, borderLeftColor: C.sage },
  exCardNum: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginTop: 2 },
  exCardNumText: { fontFamily: F.heading, fontSize: 11, color: '#fff' },
  exCardLabel: { fontFamily: F.heading, fontSize: 10, letterSpacing: 0.8, marginBottom: 4 },
  exCardText: { fontFamily: F.bodySemi, fontSize: 15, color: C.text, lineHeight: 21 },
  exNote: { fontFamily: F.bodySemi, fontSize: 13, color: C.textSub, textAlign: 'center', lineHeight: 19, paddingHorizontal: 8 },


  // Setup
  setupScroll: { flexGrow: 1, paddingHorizontal: 24, paddingTop: 40, paddingBottom: 20 },
  setupEmoji: { fontSize: 48, textAlign: 'center', marginBottom: 16 },
  setupHeadline: { fontFamily: F.heading, fontSize: 28, color: C.text, textAlign: 'center', letterSpacing: -0.5, lineHeight: 34, marginBottom: 8 },
  setupSub: { fontFamily: F.bodyMedium, fontSize: 14, color: C.textSub, textAlign: 'center', lineHeight: 21, marginBottom: 28 },


  setupForm: { gap: 16 },
  setupField: { backgroundColor: C.cardGlass, borderRadius: 16, padding: 16, gap: 10, borderWidth: 1, borderColor: C.border },
  setupFieldHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  setupFieldLabel: { fontFamily: F.heading, fontSize: 11, color: C.textMuted, letterSpacing: 0.5 },
  setupFieldOpt: { fontFamily: F.subheading, fontSize: 10, color: C.textMuted },
  setupInput: { fontFamily: F.subheading, fontSize: 18, color: C.text, paddingVertical: 4 },


  ageScroll: { gap: 8, paddingVertical: 2 },
  agePill: { paddingVertical: 12, paddingHorizontal: 20, borderRadius: 12, backgroundColor: 'rgba(42,37,32,0.04)' },
  agePillActive: { backgroundColor: 'rgba(129,178,154,0.15)', borderWidth: 2, borderColor: C.sage, paddingVertical: 10, paddingHorizontal: 18 },
  agePillText: { fontFamily: F.subheading, fontSize: 16, color: C.textMuted },
  agePillTextActive: { color: C.sage },


  neuroRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  neuroChip: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 20, backgroundColor: 'rgba(42,37,32,0.04)' },
  neuroChipActive: { backgroundColor: C.rose },
  neuroChipText: { fontFamily: F.subheading, fontSize: 13, color: C.textSub },
  neuroChipTextActive: { color: '#fff' },


  setupSkip: { fontFamily: F.subheading, fontSize: 14, color: C.textMuted, textAlign: 'center', marginTop: 20 },


  trustRow: { flexDirection: 'row', justifyContent: 'center', gap: 16, marginTop: 12 },
  trustItem: { fontFamily: F.subheading, fontSize: 12, color: C.textMuted },
});



