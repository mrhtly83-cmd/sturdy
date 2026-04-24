// app/(tabs)/_layout.tsx
// v5 — Journal identity: frosted glass tab bar, rose active
// 2 tabs: Home · Settings
// Child tab removed — each child now has their own hub at /child/[id]

import { Text } from 'react-native';
import { Tabs } from 'expo-router';
import { colors as C, fonts as F } from '../../src/theme';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: 'rgba(253,250,245,0.85)',
          borderTopWidth: 1,
          borderTopColor: 'rgba(0,0,0,0.06)',
          paddingBottom: 24,
          paddingTop: 8,
          height: 80,
          position: 'absolute',
          elevation: 0,
        },
        tabBarActiveTintColor: C.rose,
        tabBarInactiveTintColor: C.textMuted,
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

      {/* Hide the old Child tab route — the file still exists but is no longer exposed in the tab bar. */}
      <Tabs.Screen
        name="child"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}
