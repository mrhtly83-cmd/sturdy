// app/_layout.tsx
// v5 — Logo-derived premium dark theme; Fraunces (serif) + DM Sans (sans).

import { useEffect, useState } from 'react';
import { Platform, Text, TextInput } from 'react-native';
import { Stack, router } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts } from 'expo-font';
import {
  Fraunces_600SemiBold,
  Fraunces_600SemiBold_Italic,
  Fraunces_700Bold,
  Fraunces_700Bold_Italic,
} from '@expo-google-fonts/fraunces';
import {
  DMSans_400Regular,
  DMSans_500Medium,
  DMSans_600SemiBold,
  DMSans_700Bold,
} from '@expo-google-fonts/dm-sans';
import { AuthProvider, useAuth } from '../src/context/AuthContext';
import { ChildProfileProvider }   from '../src/context/ChildProfileContext';
import { colors }                 from '../src/theme/colors';
import { hasCompletedOnboarding } from '../src/utils/onboarding';

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
  const [routed, setRouted] = useState(false);

  useEffect(() => {
    if (!isLoading) {
      SplashScreen.hideAsync();
    }
  }, [isLoading]);

  useEffect(() => {
    if (isLoading || routed) return;
    let cancelled = false;

    (async () => {
      // Signed-in users skip onboarding entirely.
      if (session) {
        if (!cancelled) {
          router.replace('/(tabs)');
          setRouted(true);
        }
        return;
      }

      // No session — branch on whether they've finished onboarding before.
      // Returning users land on sign-in; first-timers land on /welcome.
      const done = await hasCompletedOnboarding();
      if (cancelled) return;
      router.replace(done ? '/auth?mode=signin' : '/welcome');
      setRouted(true);
    })();

    return () => { cancelled = true; };
  }, [session, isLoading, routed]);

  return null;
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    // Fraunces (serif) — headings, hero, AI script text
    Fraunces_600SemiBold,
    Fraunces_600SemiBold_Italic,
    Fraunces_700Bold,
    Fraunces_700Bold_Italic,
    // DM Sans (sans) — body, controls, labels
    DMSans_400Regular,
    DMSans_500Medium,
    DMSans_600SemiBold,
    DMSans_700Bold,
  });

  if (!fontsLoaded) return null;

  return (
    <AuthProvider>
      <ChildProfileProvider>
        <AuthGate />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: colors.background },
            animation: 'slide_from_right',
            orientation: 'portrait',
          }}
        />
      </ChildProfileProvider>
    </AuthProvider>
  );
}
