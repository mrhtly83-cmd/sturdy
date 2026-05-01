// app/(tabs)/_layout.tsx
// v6 — Deep Warm v5.2 tab bar; amber active, muted inactive, shadow separator.
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
          backgroundColor: 'rgba(10,10,10,0.97)',    // deeper, near-opaque
          borderTopWidth:  0,                         // shadow does the separator
          paddingBottom:   24,
          paddingTop:      8,
          height:          80,
          position:        'absolute',
          shadowColor:     '#000000',
          shadowOffset:    { width: 0, height: -4 },
          shadowOpacity:   0.30,
          shadowRadius:    12,
          elevation:       8,
        },
        tabBarActiveTintColor:   C.tabActive,         // amber #C8883A
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
