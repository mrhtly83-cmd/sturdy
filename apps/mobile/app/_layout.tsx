// app/_layout.tsx
// v8 — Journal identity: Manrope only

import { useEffect } from 'react';
import { Platform, Text, TextInput } from 'react-native';
import { Stack, router } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts } from 'expo-font';
import {
  Manrope_400Regular,
  Manrope_500Medium,
  Manrope_600SemiBold,
  Manrope_700Bold,
  Manrope_800ExtraBold,
} from '@expo-google-fonts/manrope';
import { AuthProvider, useAuth } from '../src/context/AuthContext';
import { ChildProfileProvider }  from '../src/context/ChildProfileContext';

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
      router.replace('/(tabs)');
      return;
    }
    router.replace('/welcome');
  }, [session, isLoading]);

  return null;
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    'Manrope-Regular':    Manrope_400Regular,
    'Manrope-Medium':     Manrope_500Medium,
    'Manrope-SemiBold':   Manrope_600SemiBold,
    'Manrope-Bold':       Manrope_700Bold,
    'Manrope-ExtraBold':  Manrope_800ExtraBold,
  });

  if (!fontsLoaded) return null;

  return (
    <AuthProvider>
      <ChildProfileProvider>
        <AuthGate />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: '#FDFAF5' },
            animation: 'slide_from_right',
            orientation: 'portrait',
          }}
        />
      </ChildProfileProvider>
    </AuthProvider>
  );
}

