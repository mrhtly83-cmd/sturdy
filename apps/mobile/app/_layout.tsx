// app/_layout.tsx
// v6 — Guest detection + auth routing
// New users → /welcome
// Returning guests (seen onboarding before) → /(tabs) directly
// Signed-in users → /(tabs) directly

import { useEffect } from 'react';
import { Platform, Text, TextInput } from 'react-native';
import { Stack, router } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts } from 'expo-font';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
  PlusJakartaSans_800ExtraBold,
} from '@expo-google-fonts/plus-jakarta-sans';
import {
  CrimsonPro_300Light,
  CrimsonPro_400Regular,
  CrimsonPro_500Medium,
  CrimsonPro_300Light_Italic,
  CrimsonPro_400Regular_Italic,
  CrimsonPro_500Medium_Italic,
} from '@expo-google-fonts/crimson-pro';
import { AuthProvider, useAuth } from '../src/context/AuthContext';
import { ChildProfileProvider }  from '../src/context/ChildProfileContext';

const GUEST_SEEN_KEY = 'sturdy_guest_seen_v1';

SplashScreen.preventAutoHideAsync();

// Cap text scaling
if (Platform.OS !== 'web') {
  const originalTextRender = (Text as any).render;
  if (originalTextRender) {
    (Text as any).render = function (props: any, ref: any) {
      return originalTextRender.call(this, {
        ...props,
        maxFontSizeMultiplier: props.maxFontSizeMultiplier ?? 1.3,
      }, ref);
    };
  }
  const originalInputRender = (TextInput as any).render;
  if (originalInputRender) {
    (TextInput as any).render = function (props: any, ref: any) {
      return originalInputRender.call(this, {
        ...props,
        maxFontSizeMultiplier: props.maxFontSizeMultiplier ?? 1.3,
      }, ref);
    };
  }
}

function AuthGate() {
  const { session, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading) {
      SplashScreen.hideAsync();
    }
  }, [isLoading]);

  useEffect(() => {
    if (isLoading) return;

    if (session) {
      // Signed-in user — always go home
      router.replace('/(tabs)');
      return;
    }
router.replace('/welcome');
  }, [session, isLoading]);

  return null;
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    'Jakarta-Regular':    PlusJakartaSans_400Regular,
    'Jakarta-Medium':     PlusJakartaSans_500Medium,
    'Jakarta-SemiBold':   PlusJakartaSans_600SemiBold,
    'Jakarta-Bold':       PlusJakartaSans_700Bold,
    'Jakarta-ExtraBold':  PlusJakartaSans_800ExtraBold,
    'Crimson-Light':        CrimsonPro_300Light,
    'Crimson-Regular':      CrimsonPro_400Regular,
    'Crimson-Medium':       CrimsonPro_500Medium,
    'Crimson-LightItalic':  CrimsonPro_300Light_Italic,
    'Crimson-Italic':       CrimsonPro_400Regular_Italic,
    'Crimson-MediumItalic': CrimsonPro_500Medium_Italic,
  });

  if (!fontsLoaded) return null;

  return (
    <AuthProvider>
      <ChildProfileProvider>
        <AuthGate />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: '#0e0a10' },
            animation: 'slide_from_right',
            orientation: 'portrait',
          }}
        />
      </ChildProfileProvider>
    </AuthProvider>
  );
}
