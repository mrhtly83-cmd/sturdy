// app/(tabs)/_layout.tsx
// v6 — Transparent tab bar with warm fade, amber active tint.

import { Text } from 'react-native';
import { Tabs } from 'expo-router';
import { colors as C, fonts as F } from '../../src/theme/colors';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: 'transparent',
          borderTopWidth: 0,
          paddingBottom: 24,
          paddingTop: 8,
          height: 80,
          position: 'absolute',
          elevation: 0,
          shadowOpacity: 0,
        },
        tabBarBackground: () => null,
        tabBarActiveTintColor: C.tabActive,
        tabBarInactiveTintColor: 'rgba(255,255,255,0.28)',
        tabBarLabelStyle: {
          fontFamily: F.bodySemi,
          fontSize: 10,
          letterSpacing: 0.3,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ focused }) => (
            <Text style={{ fontSize: 22, opacity: focused ? 1 : 0.4 }}>🏠</Text>
          ),
        }}
      />

      <Tabs.Screen
        name="family"
        options={{
          title: 'Family',
          tabBarIcon: ({ focused }) => (
            <Text style={{ fontSize: 22, opacity: focused ? 1 : 0.4 }}>💛</Text>
          ),
        }}
      />

      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ focused }) => (
            <Text style={{ fontSize: 22, opacity: focused ? 1 : 0.4 }}>⚙️</Text>
          ),
        }}
      />
    </Tabs>
  );
}