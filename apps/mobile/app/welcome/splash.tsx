// app/welcome/splash.tsx
// v1 — Animated splash screen
// Journal design system: pastel gradient + Manrope + real logo
// Sequence: gradient breathes in → logo pops → wordmark → headline → sub → dots → CTAs
// Total reveal: ~2.9s. Logo breathes subtly forever.




import { useEffect } from 'react';
import {
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




// ═══════════════════════════════════════════════
// TIMING CONSTANTS — matches splash-animated.html
// ═══════════════════════════════════════════════




const T = {
 gradient: { start: 0,    duration: 1600 },
 blobs:    { start: 400,  duration: 2400 },
 logo:     { start: 300,  duration: 900  },
 wordmark: { start: 900,  duration: 650  },
 headline: { start: 1400, duration: 650  },
 sub:      { start: 1750, duration: 650  },
 dots:     { start: 2100, stagger: 150, duration: 400 },
 cta:      { start: 2400, duration: 700  },
 breathe:  { start: 1500, duration: 4000 },
} as const;




const EASE_OUT = Easing.bezier(0.25, 0.1, 0.25, 1);




// ═══════════════════════════════════════════════
// SCREEN
// ═══════════════════════════════════════════════




export default function SplashScreen() {
 // Shared values
 const gradientOpacity = useSharedValue(0);
 const blob1 = useSharedValue(0);
 const blob2 = useSharedValue(0);
 const logoScale = useSharedValue(0.6);
 const logoOpacity = useSharedValue(0);
 const logoBreathe = useSharedValue(1);
 const wordmarkT = useSharedValue(14);
 const wordmarkO = useSharedValue(0);
 const headlineT = useSharedValue(14);
 const headlineO = useSharedValue(0);
 const subT = useSharedValue(14);
 const subO = useSharedValue(0);
 const dot1 = useSharedValue(0);
 const dot2 = useSharedValue(0);
 const dot3 = useSharedValue(0);
 const ctaT = useSharedValue(16);
 const ctaO = useSharedValue(0);




 useEffect(() => {
   // Gradient
   gradientOpacity.value = withTiming(1, { duration: T.gradient.duration, easing: EASE_OUT });




   // Blobs
   blob1.value = withDelay(T.blobs.start, withTiming(1, { duration: T.blobs.duration, easing: EASE_OUT }));
   blob2.value = withDelay(T.blobs.start, withTiming(1, { duration: T.blobs.duration, easing: EASE_OUT }));




   // Logo — spring overshoot
   logoOpacity.value = withDelay(T.logo.start, withTiming(1, { duration: 300 }));
   logoScale.value = withDelay(
     T.logo.start,
     withSpring(1, { damping: 8, stiffness: 100, mass: 0.8, overshootClamping: false })
   );




   // Logo breathe — starts after entrance settles
   logoBreathe.value = withDelay(
     T.breathe.start,
     withRepeat(
       withSequence(
         withTiming(1.03, { duration: T.breathe.duration / 2, easing: EASE_OUT }),
         withTiming(1, { duration: T.breathe.duration / 2, easing: EASE_OUT })
       ),
       -1,
       false
     )
   );




   // Wordmark
   wordmarkO.value = withDelay(T.wordmark.start, withTiming(1, { duration: T.wordmark.duration, easing: EASE_OUT }));
   wordmarkT.value = withDelay(T.wordmark.start, withTiming(0, { duration: T.wordmark.duration, easing: EASE_OUT }));




   // Headline
   headlineO.value = withDelay(T.headline.start, withTiming(1, { duration: T.headline.duration, easing: EASE_OUT }));
   headlineT.value = withDelay(T.headline.start, withTiming(0, { duration: T.headline.duration, easing: EASE_OUT }));




   // Sub
   subO.value = withDelay(T.sub.start, withTiming(1, { duration: T.sub.duration, easing: EASE_OUT }));
   subT.value = withDelay(T.sub.start, withTiming(0, { duration: T.sub.duration, easing: EASE_OUT }));




   // Dots — staggered
   dot1.value = withDelay(T.dots.start, withTiming(1, { duration: T.dots.duration, easing: EASE_OUT }));
   dot2.value = withDelay(T.dots.start + T.dots.stagger, withTiming(1, { duration: T.dots.duration, easing: EASE_OUT }));
   dot3.value = withDelay(T.dots.start + T.dots.stagger * 2, withTiming(1, { duration: T.dots.duration, easing: EASE_OUT }));




   // CTAs
   ctaO.value = withDelay(T.cta.start, withTiming(1, { duration: T.cta.duration, easing: EASE_OUT }));
   ctaT.value = withDelay(T.cta.start, withTiming(0, { duration: T.cta.duration, easing: EASE_OUT }));
 }, []);




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




 const headlineStyle = useAnimatedStyle(() => ({
   opacity: headlineO.value,
   transform: [{ translateY: headlineT.value }],
 }));




 const subStyle = useAnimatedStyle(() => ({
   opacity: subO.value,
   transform: [{ translateY: subT.value }],
 }));




 const dot1Style = useAnimatedStyle(() => ({ opacity: dot1.value, transform: [{ scale: dot1.value }] }));
 const dot2Style = useAnimatedStyle(() => ({ opacity: dot2.value, transform: [{ scale: dot2.value }] }));
 const dot3Style = useAnimatedStyle(() => ({ opacity: dot3.value, transform: [{ scale: dot3.value }] }));




 const ctaStyle = useAnimatedStyle(() => ({
   opacity: ctaO.value,
   transform: [{ translateY: ctaT.value }],
 }));




 // ───── Handlers ─────




 const handleGetStarted = () => {
   Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
   router.push('/child-setup');
 };




 const handleSignIn = () => {
   Haptics.selectionAsync();
   router.push('/auth/sign-in');
 };




 // ───── Render ─────




 return (
   <View style={s.root}>
     <StatusBar style="dark" />




     {/* Base cream — always visible */}
     <View style={s.baseBg} />




     {/* Pastel gradient — fades in */}
     <Animated.View style={[StyleSheet.absoluteFill, gradientStyle]}>
       <LinearGradient
         colors={[C.gradStart, C.gradMid1, C.gradMid2, C.gradEnd]}
         start={{ x: 0, y: 0 }}
         end={{ x: 1, y: 1 }}
         style={StyleSheet.absoluteFill}
       />
     </Animated.View>




     {/* Decorative soft blobs — drift in behind content */}
     <Animated.View style={[s.blob, s.blob1, blob1Style]} />
     <Animated.View style={[s.blob, s.blob2, blob2Style]} />




     <SafeAreaView style={s.safe} edges={['top', 'bottom']}>
       {/* ─── Top: logo + wordmark + headline ─── */}
       <View style={s.topSection}>
         <Animated.View style={[s.logoWrap, logoStyle]}>
           <Image
             source={require('../../assets/logo.png')}
             style={s.logoImg}
             resizeMode="contain"
           />
         </Animated.View>




         <Animated.Text style={[s.wordmark, wordmarkStyle]}>Sturdy</Animated.Text>




         {/* Three dots — staggered reveal */}
         <View style={s.dotsRow}>
           <Animated.View style={[s.dot, dot1Style]} />
           <Animated.View style={[s.dot, dot2Style]} />
           <Animated.View style={[s.dot, dot3Style]} />
         </View>




         <View style={s.headlineBlock}>
           <Animated.Text style={[s.headline, headlineStyle]}>
             Know what to say{'\n'}in hard moments.
           </Animated.Text>
           <Animated.Text style={[s.sub, subStyle]}>
             Calm, age-specific words for the parenting moments that catch you off guard.
           </Animated.Text>
         </View>
       </View>




       {/* ─── Bottom: CTAs ─── */}
       <Animated.View style={[s.bottomSection, ctaStyle]}>
         <Pressable
           onPress={handleGetStarted}
           style={({ pressed }) => [
             s.cta,
             pressed && { opacity: 0.92, transform: [{ scale: 0.98 }] },
           ]}
         >
           <Text style={s.ctaText}>Get started</Text>
         </Pressable>




         <Pressable onPress={handleSignIn} hitSlop={12}>
           <Text style={s.signIn}>Already have an account? Sign in</Text>
         </Pressable>




         <Text style={s.micro}>Your data stays private · Free forever for SOS</Text>
       </Animated.View>
     </SafeAreaView>
   </View>
 );
}




// ═══════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════




const s = StyleSheet.create({
 root: { flex: 1, backgroundColor: C.base },




 // Background layers
 baseBg: {
   ...StyleSheet.absoluteFillObject,
   backgroundColor: '#FDFAF5',
 },




 // Decorative blobs
 blob: {
   position: 'absolute',
   borderRadius: 999,
 },
 blob1: {
   top: -80,
   right: -60,
   width: 280,
   height: 280,
   backgroundColor: 'rgba(253, 221, 230, 0.55)',
 },
 blob2: {
   bottom: -60,
   left: -80,
   width: 240,
   height: 240,
   backgroundColor: 'rgba(212, 232, 209, 0.50)',
 },




 // Layout
 safe: { flex: 1, paddingHorizontal: 32 },




 topSection: {
   flex: 1,
   alignItems: 'center',
   justifyContent: 'center',
   gap: 16,
 },




 // Logo
 logoWrap: {
   width: 72,
   height: 72,
   alignItems: 'center',
   justifyContent: 'center',
   // Soft grounding shadow
   shadowColor: '#2A2520',
   shadowOpacity: 0.10,
   shadowRadius: 16,
   shadowOffset: { width: 0, height: 6 },
   elevation: 6,
 },
 logoImg: {
   width: 72,
   height: 72,
 },




 // Wordmark
 wordmark: {
   fontFamily: F.display,
   fontSize: 32,
   letterSpacing: -0.8,
   color: C.text,
   marginTop: 4,
 },




 // Dots
 dotsRow: {
   flexDirection: 'row',
   gap: 8,
   marginTop: 4,
   marginBottom: 4,
 },
 dot: {
   width: 5,
   height: 5,
   borderRadius: 999,
   backgroundColor: C.rose,
   opacity: 0.6,
 },




 // Headline
 headlineBlock: {
   alignItems: 'center',
   maxWidth: 300,
   marginTop: 4,
 },
 headline: {
   fontFamily: F.subheading,
   fontSize: 22,
   lineHeight: 29,
   letterSpacing: -0.4,
   color: C.text,
   textAlign: 'center',
 },
 sub: {
   fontFamily: F.body,
   fontSize: 14,
   lineHeight: 22,
   color: C.textBody,
   textAlign: 'center',
   marginTop: 12,
 },




 // Bottom CTAs
 bottomSection: {
   paddingBottom: 20,
   gap: 14,
 },
 cta: {
   backgroundColor: C.rose,
   borderRadius: 14,
   paddingVertical: 16,
   paddingHorizontal: 20,
   alignItems: 'center',
   justifyContent: 'center',
   shadowColor: C.rose,
   shadowOpacity: 0.25,
   shadowRadius: 20,
   shadowOffset: { width: 0, height: 6 },
   elevation: 4,
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
});



