// app/(tabs)/_layout.tsx
// v5 — Premium dark tab bar; amber active, muted inactive.
// Two tabs (post-Phase-1 architecture): Home · Settings.

import { Text } from 'react-native';
import { Tabs } from 'expo-router';
import { colors as C, fonts as F } from '../../src/theme/colors';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: 'rgba(20,17,14,0.92)',   // warm dark, near-opaque
          borderTopWidth: 1,
          borderTopColor: C.border,
          paddingBottom: 24,
          paddingTop: 8,
          height: 80,
          position: 'absolute',
          elevation: 0,
        },
        tabBarActiveTintColor:   C.tabActive,        // amber #F79566
        tabBarInactiveTintColor: C.tabInactive,
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
