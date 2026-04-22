// app/welcome/index.tsx
// v12 — Unified welcome flow
// Journal design system: pastel gradient + Manrope + rose accent
// Flow: Animated splash (S0) → 4 feature slides (S1-S4) → Final CTA (S5)
// Auto-advance with progress bar + Skip + tap nav


import { useEffect, useRef, useState } from 'react';
import {
 Dimensions,
 Image,
 Pressable,
 StyleSheet,
 Text,
 View,
} from 'react-native';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import Animated, {
 useSharedValue,
 useAnimatedStyle,
 withTiming,
 withSpring,
 withDelay,
 withRepeat,
 withSequence,
 Easing,
} from 'react-native-reanimated';
import { colors as C, fonts as F } from '../../src/theme';


const { width: SW } = Dimensions.get('window');


// ═══════════════════════════════════════════════
// TIMING
// ═══════════════════════════════════════════════


const SPLASH_AUTO = 3500; // Screen 0 shows for 3.5s total (2.9s reveal + 0.6s settle)
const SLIDE_AUTO  = 4000; // Screens 1-4 show for 4s each
const TOTAL_SCREENS = 6;  // 0..5


const EASE_OUT = Easing.bezier(0.25, 0.1, 0.25, 1);


// ═══════════════════════════════════════════════
// FEATURE SLIDE DATA
// ═══════════════════════════════════════════════


const SLIDES = [
 {
   emoji: '🧘',
   badge: 'IN THE MOMENT',
   titleParts: ['Know ', 'what to say', '\nin seconds'],
   desc: 'Describe the moment. Get calm, age-specific words you can say out loud.',
   items: [
     { icon: '⚡', text: 'Scripts in under 5 seconds' },
     { icon: '🎯', text: "Adapted to your child's exact age" },
     { icon: '🧩', text: 'Neurotype-aware (ADHD, Autism, PDA)' },
   ],
 },
 {
   emoji: '📊',
   badge: 'UNDERSTAND',
   titleParts: ['See ', 'patterns', '\nover time'],
   desc: 'Track what triggers your child and what works — break the cycle.',
   items: [
     { icon: '📈', text: 'Weekly behavior insights' },
     { icon: '📋', text: 'Downloadable progress reports' },
     { icon: '💡', text: 'AI-powered "what works" analysis' },
   ],
 },
 {
   emoji: '👥',
   badge: 'TOGETHER',
   titleParts: ['Parent ', 'together', ',\neven apart'],
   desc: 'Share scripts, sync profiles, stay on the same page with your co-parent.',
   items: [
     { icon: '🔗', text: 'Shared child profiles' },
     { icon: '📤', text: 'Send scripts to your partner' },
     { icon: '📖', text: 'Shared script library & journal' },
   ],
 },
 {
   emoji: '🔬',
   badge: 'SCIENCE-BACKED',
   titleParts: ['', 'Backed', ' by\nscience.'],
   desc: "Every script draws from the world's best parenting research.",
   items: [
     { icon: '🧠', text: 'Developmental psychology' },
     { icon: '💛', text: 'Attachment science' },
     { icon: '🛡️', text: 'Trauma-informed practice' },
   ],
 },
];


// ═══════════════════════════════════════════════
// SCREEN
// ═══════════════════════════════════════════════


export default function WelcomeScreen() {
 const [current, setCurrent] = useState(0);
 const autoTimer = useRef<ReturnType<typeof setTimeout> | null>(null);


 // Splash animations (Screen 0)
 const gradientOpacity = useSharedValue(0);
 const blob1 = useSharedValue(0);
 const blob2 = useSharedValue(0);
 const logoScale = useSharedValue(0.6);
 const logoOpacity = useSharedValue(0);
 const logoBreathe = useSharedValue(1);
 const wordmarkT = useSharedValue(14);
 const wordmarkO = useSharedValue(0);
 const dot1 = useSharedValue(0);
 const dot2 = useSharedValue(0);
 const dot3 = useSharedValue(0);
 const taglineT = useSharedValue(14);
 const taglineO = useSharedValue(0);


 // Screen transition fade
 const sceneOpacity = useSharedValue(1);


 // Feature slide entrance (shared — re-runs on screen change)
 const slideT = useSharedValue(16);
 const slideO = useSharedValue(0);


 // Progress bar fill (animated per active segment)
 const progFill = useSharedValue(0);


 // ───── Initial splash animation ─────
 useEffect(() => {
   gradientOpacity.value = withTiming(1, { duration: 1600, easing: EASE_OUT });
   blob1.value = withDelay(400, withTiming(1, { duration: 2400, easing: EASE_OUT }));
   blob2.value = withDelay(400, withTiming(1, { duration: 2400, easing: EASE_OUT }));


   logoOpacity.value = withDelay(300, withTiming(1, { duration: 300 }));
   logoScale.value = withDelay(
     300,
     withSpring(1, { damping: 8, stiffness: 100, mass: 0.8 })
   );
   logoBreathe.value = withDelay(
     1500,
     withRepeat(
       withSequence(
         withTiming(1.03, { duration: 2000, easing: EASE_OUT }),
         withTiming(1, { duration: 2000, easing: EASE_OUT })
       ),
       -1,
       false
     )
   );


   wordmarkO.value = withDelay(900, withTiming(1, { duration: 650, easing: EASE_OUT }));
   wordmarkT.value = withDelay(900, withTiming(0, { duration: 650, easing: EASE_OUT }));


   dot1.value = withDelay(1400, withTiming(1, { duration: 400, easing: EASE_OUT }));
   dot2.value = withDelay(1550, withTiming(1, { duration: 400, easing: EASE_OUT }));
   dot3.value = withDelay(1700, withTiming(1, { duration: 400, easing: EASE_OUT }));


   taglineO.value = withDelay(2000, withTiming(1, { duration: 650, easing: EASE_OUT }));
   taglineT.value = withDelay(2000, withTiming(0, { duration: 650, easing: EASE_OUT }));
 }, []);


 // ───── Auto-advance + slide entrance ─────
 useEffect(() => {
   if (current > 0 && current <= 4) {
     // Re-run the slide entrance animation
     slideO.value = 0;
     slideT.value = 16;
     slideO.value = withTiming(1, { duration: 500, easing: EASE_OUT });
     slideT.value = withTiming(0, { duration: 500, easing: EASE_OUT });
   }


   // Progress bar: animate the active segment filling
   if (current > 0 && current <= 4) {
     progFill.value = 0;
     progFill.value = withTiming(1, { duration: SLIDE_AUTO, easing: Easing.linear });
   }


   // Schedule auto-advance
   if (autoTimer.current) clearTimeout(autoTimer.current);
   if (current < 5) {
     const delay = current === 0 ? SPLASH_AUTO : SLIDE_AUTO;
     autoTimer.current = setTimeout(() => goTo(current + 1), delay);
   }


   return () => {
     if (autoTimer.current) clearTimeout(autoTimer.current);
   };
 }, [current]);


 // ───── Navigation ─────


 const goTo = (idx: number) => {
   if (idx < 0 || idx >= TOTAL_SCREENS) return;
   if (autoTimer.current) clearTimeout(autoTimer.current);
   // Quick scene fade
   sceneOpacity.value = withTiming(0, { duration: 200, easing: EASE_OUT }, () => {
     sceneOpacity.value = withTiming(1, { duration: 300, easing: EASE_OUT });
   });
   setTimeout(() => setCurrent(idx), 200);
 };


 const next = () => {
   Haptics.selectionAsync();
   if (current < 5) goTo(current + 1);
 };
 const prev = () => {
   Haptics.selectionAsync();
   if (current > 0) goTo(current - 1);
 };
 const skip = () => {
   Haptics.selectionAsync();
   goTo(5);
 };


 const handleGetStarted = () => {
   Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
   router.push('/auth/sign-up');
 };
 const handleSignIn = () => {
   Haptics.selectionAsync();
   router.push('/auth/sign-in');
 };


 // ───── Animated styles ─────


 const gradientStyle = useAnimatedStyle(() => ({ opacity: gradientOpacity.value }));
 const blob1Style = useAnimatedStyle(() => ({
   opacity: blob1.value,
   transform: [{ scale: 0.9 + blob1.value * 0.1 }],
 }));
 const blob2Style = useAnimatedStyle(() => ({
   opacity: blob2.value,
   transform: [{ scale: 0.9 + blob2.value * 0.1 }],
 }));


 const logoStyle = useAnimatedStyle(() => ({
   opacity: logoOpacity.value,
   transform: [{ scale: logoScale.value * logoBreathe.value }],
 }));
 const wordmarkStyle = useAnimatedStyle(() => ({
   opacity: wordmarkO.value,
   transform: [{ translateY: wordmarkT.value }],
 }));
 const taglineStyle = useAnimatedStyle(() => ({
   opacity: taglineO.value,
   transform: [{ translateY: taglineT.value }],
 }));
 const dot1Style = useAnimatedStyle(() => ({ opacity: dot1.value, transform: [{ scale: dot1.value }] }));
 const dot2Style = useAnimatedStyle(() => ({ opacity: dot2.value, transform: [{ scale: dot2.value }] }));
 const dot3Style = useAnimatedStyle(() => ({ opacity: dot3.value, transform: [{ scale: dot3.value }] }));


 const sceneStyle = useAnimatedStyle(() => ({ opacity: sceneOpacity.value }));
 const slideStyle = useAnimatedStyle(() => ({
   opacity: slideO.value,
   transform: [{ translateY: slideT.value }],
 }));


 const activeProgFillStyle = useAnimatedStyle(() => ({ width: `${progFill.value * 100}%` }));


 // ───── Render ─────


 const showChrome = current >= 1 && current <= 4;
 const slideData = current >= 1 && current <= 4 ? SLIDES[current - 1] : null;


 return (
   <View style={s.root}>
     <StatusBar style="dark" />


     {/* Base cream */}
     <View style={s.baseBg} />


     {/* Pastel gradient — fades in on mount, persists */}
     <Animated.View style={[StyleSheet.absoluteFill, gradientStyle]}>
       <LinearGradient
         colors={[C.gradStart, C.gradMid1, C.gradMid2, C.gradEnd]}
         start={{ x: 0, y: 0 }}
         end={{ x: 1, y: 1 }}
         style={StyleSheet.absoluteFill}
       />
     </Animated.View>


     {/* Decorative blobs */}
     <Animated.View style={[s.blob, s.blob1, blob1Style]} />
     <Animated.View style={[s.blob, s.blob2, blob2Style]} />


     <SafeAreaView style={s.safe} edges={['top', 'bottom']}>
       {/* ─── Progress bar + Skip (screens 1-4) ─── */}
       {showChrome && (
         <View style={s.chrome}>
           <View style={s.progressRow}>
             {[0, 1, 2, 3, 4].map((i) => (
               <View key={i} style={s.progSeg}>
                 {i < current - 1 && <View style={[s.progFill, { width: '100%' }]} />}
                 {i === current - 1 && (
                   <Animated.View style={[s.progFill, activeProgFillStyle]} />
                 )}
               </View>
             ))}
           </View>
           <Pressable onPress={skip} hitSlop={12} style={s.skipBtn}>
             <Text style={s.skipText}>Skip</Text>
           </Pressable>
         </View>
       )}


       {/* ─── Scene ─── */}
       <Animated.View style={[s.scene, sceneStyle]}>
         {/* Screen 0 — Splash */}
         {current === 0 && (
           <View style={s.splashContent}>
             <Animated.View style={[s.logoWrap, logoStyle]}>
               <Image
                 source={require('../../assets/logo.png')}
                 style={s.logoImg}
                 resizeMode="contain"
               />
             </Animated.View>


             <Animated.Text style={[s.wordmark, wordmarkStyle]}>Sturdy</Animated.Text>


             <View style={s.dotsRow}>
               <Animated.View style={[s.dot, dot1Style]} />
               <Animated.View style={[s.dot, dot2Style]} />
               <Animated.View style={[s.dot, dot3Style]} />
             </View>


             <Animated.Text style={[s.tagline, taglineStyle]}>
               Know what to say{'\n'}in hard moments.
             </Animated.Text>
           </View>
         )}


         {/* Screens 1-4 — Feature slides */}
         {slideData && (
           <Animated.View style={[s.featContent, slideStyle]}>
             <View style={s.featImage}>
               <Text style={s.featImageEmoji}>{slideData.emoji}</Text>
             </View>


             <View style={s.featBadge}>
               <Text style={s.featBadgeText}>{slideData.badge}</Text>
             </View>


             <Text style={s.featTitle}>
               {slideData.titleParts[0]}
               <Text style={s.accent}>{slideData.titleParts[1]}</Text>
               {slideData.titleParts[2]}
             </Text>


             <Text style={s.featDesc}>{slideData.desc}</Text>


             <View style={s.featList}>
               {slideData.items.map((item, i) => (
                 <View key={i} style={s.featItem}>
                   <Text style={s.featItemIcon}>{item.icon}</Text>
                   <Text style={s.featItemText}>{item.text}</Text>
                 </View>
               ))}
             </View>
           </Animated.View>
         )}


         {/* Screen 5 — Final CTA */}
         {current === 5 && (
           <View style={s.finalContent}>
             <Image
               source={require('../../assets/logo.png')}
               style={s.finalLogo}
               resizeMode="contain"
             />


             <Text style={s.finalTitle}>
               Ready to parent{'\n'}with <Text style={s.accent}>confidence</Text>?
             </Text>


             <Text style={s.finalSub}>
               Join thousands of parents who respond better in hard moments.
             </Text>


             <Pressable
               onPress={handleGetStarted}
               style={({ pressed }) => [
                 s.cta,
                 pressed && { opacity: 0.92, transform: [{ scale: 0.98 }] },
               ]}
             >
               <Text style={s.ctaText}>Get started — free</Text>
             </Pressable>


             <Pressable onPress={handleSignIn} hitSlop={12}>
               <Text style={s.signIn}>Already have an account? Sign in</Text>
             </Pressable>


             <Text style={s.micro}>Your data stays private · Free forever for SOS</Text>
           </View>
         )}
       </Animated.View>


       {/* ─── Tap zones (screens 0-4 only) ─── */}
       {current < 5 && (
         <>
           <Pressable style={s.tapLeft} onPress={prev} />
           <Pressable style={s.tapRight} onPress={next} />
         </>
       )}
     </SafeAreaView>
   </View>
 );
}


// ═══════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════


const s = StyleSheet.create({
 root: { flex: 1, backgroundColor: C.base },
 baseBg: { ...StyleSheet.absoluteFillObject, backgroundColor: '#FDFAF5' },


 // Blobs
 blob: { position: 'absolute', borderRadius: 999 },
 blob1: {
   top: -80, right: -60, width: 280, height: 280,
   backgroundColor: 'rgba(253, 221, 230, 0.55)',
 },
 blob2: {
   bottom: -60, left: -80, width: 240, height: 240,
   backgroundColor: 'rgba(212, 232, 209, 0.50)',
 },


 // Layout
 safe: { flex: 1 },
 scene: { flex: 1, paddingHorizontal: 32, alignItems: 'center', justifyContent: 'center' },


 // Chrome (progress + skip)
 chrome: {
   position: 'absolute',
   top: 60, left: 20, right: 20,
   zIndex: 50,
   flexDirection: 'row',
   alignItems: 'center',
   gap: 12,
 },
 progressRow: {
   flex: 1,
   flexDirection: 'row',
   gap: 4,
 },
 progSeg: {
   flex: 1,
   height: 3,
   borderRadius: 2,
   backgroundColor: 'rgba(42,37,32,0.10)',
   overflow: 'hidden',
 },
 progFill: {
   height: 3,
   borderRadius: 2,
   backgroundColor: C.rose,
 },
 skipBtn: { paddingHorizontal: 6, paddingVertical: 4 },
 skipText: {
   fontFamily: F.bodySemi,
   fontSize: 13,
   color: C.textMuted,
 },


 // Splash (S0)
 splashContent: { alignItems: 'center', gap: 12 },
 logoWrap: {
   width: 72, height: 72,
   alignItems: 'center', justifyContent: 'center',
   shadowColor: '#2A2520',
   shadowOpacity: 0.10,
   shadowRadius: 16,
   shadowOffset: { width: 0, height: 6 },
   elevation: 6,
 },
 logoImg: { width: 72, height: 72 },
 wordmark: {
   fontFamily: F.display,
   fontSize: 32,
   letterSpacing: -0.8,
   color: C.text,
   marginTop: 4,
 },
 dotsRow: { flexDirection: 'row', gap: 8, marginTop: 2, marginBottom: 2 },
 dot: {
   width: 5, height: 5, borderRadius: 999,
   backgroundColor: C.rose, opacity: 0.6,
 },
 tagline: {
   fontFamily: F.body,
   fontSize: 15,
   lineHeight: 23,
   color: C.textBody,
   textAlign: 'center',
   maxWidth: 280,
   marginTop: 8,
 },


 // Feature slides (S1-S4)
 featContent: {
   alignItems: 'center',
   gap: 14,
   width: '100%',
   maxWidth: 340,
 },
 featImage: {
   width: 160, height: 160,
   borderRadius: 24,
   backgroundColor: C.cardGlassSoft,
   borderWidth: 1,
   borderStyle: 'dashed',
   borderColor: 'rgba(42,37,32,0.12)',
   alignItems: 'center',
   justifyContent: 'center',
 },
 featImageEmoji: { fontSize: 56 },
 featBadge: {
   paddingHorizontal: 12,
   paddingVertical: 5,
   borderRadius: 999,
   backgroundColor: C.roseMuted,
 },
 featBadgeText: {
   fontFamily: F.label,
   fontSize: 10,
   letterSpacing: 1,
   color: C.rose,
 },
 featTitle: {
   fontFamily: F.subheading,
   fontSize: 22,
   lineHeight: 29,
   letterSpacing: -0.3,
   color: C.text,
   textAlign: 'center',
 },
 accent: { color: C.rose },
 featDesc: {
   fontFamily: F.body,
   fontSize: 13,
   lineHeight: 20,
   color: C.textBody,
   textAlign: 'center',
   paddingHorizontal: 4,
 },
 featList: { width: '100%', gap: 6, marginTop: 4 },
 featItem: {
   flexDirection: 'row',
   alignItems: 'center',
   gap: 10,
   paddingHorizontal: 14,
   paddingVertical: 10,
   borderRadius: 12,
   backgroundColor: C.cardGlass,
   borderWidth: 1,
   borderColor: C.border,
 },
 featItemIcon: { fontSize: 16 },
 featItemText: {
   fontFamily: F.bodyMedium,
   fontSize: 12,
   lineHeight: 17,
   color: C.text,
   flex: 1,
 },


 // Final CTA (S5)
 finalContent: { alignItems: 'center', gap: 14, width: '100%', maxWidth: 340 },
 finalLogo: {
   width: 56, height: 56,
 },
 finalTitle: {
   fontFamily: F.subheading,
   fontSize: 24,
   lineHeight: 31,
   letterSpacing: -0.3,
   color: C.text,
   textAlign: 'center',
   marginTop: 4,
 },
 finalSub: {
   fontFamily: F.body,
   fontSize: 13,
   lineHeight: 20,
   color: C.textBody,
   textAlign: 'center',
   paddingHorizontal: 6,
 },
 cta: {
   width: '100%',
   backgroundColor: C.rose,
   borderRadius: 14,
   paddingVertical: 16,
   alignItems: 'center',
   shadowColor: C.rose,
   shadowOpacity: 0.25,
   shadowRadius: 20,
   shadowOffset: { width: 0, height: 6 },
   elevation: 4,
   marginTop: 6,
 },
 ctaText: {
   fontFamily: F.bodySemi,
   fontSize: 15,
   color: '#FFFFFF',
   letterSpacing: 0.2,
 },
 signIn: {
   fontFamily: F.bodySemi,
   fontSize: 13,
   color: C.textMuted,
   textAlign: 'center',
   textDecorationLine: 'underline',
 },
 micro: {
   fontFamily: F.body,
   fontSize: 11,
   color: C.textMuted,
   textAlign: 'center',
   letterSpacing: 0.3,
   marginTop: 2,
 },


 // Tap zones
 tapLeft: {
   position: 'absolute',
   top: 100, bottom: 80,
   left: 0, width: '30%',
   zIndex: 30,
 },
 tapRight: {
   position: 'absolute',
   top: 100, bottom: 80,
   right: 0, width: '70%',
   zIndex: 30,
 },
});

