// app/(tabs)/_layout.tsx
// v3 — 3-tab layout: Home · Child · Settings
// Child tab uses avatar initial from active child
// Transparent tab bar, amber active state

import { Text, View, StyleSheet } from 'react-native';
import { Tabs } from 'expo-router';
import { useChildProfile } from '../../src/context/ChildProfileContext';
import { colors as C, fonts as F } from '../../src/theme';

function ChildTabIcon({ focused }: { focused: boolean }) {
  const { activeChild } = useChildProfile();
  const initial = activeChild?.name?.trim()?.[0]?.toUpperCase() ?? '?';

  return (
    <View style={[
      st.childIcon,
      focused ? st.childIconActive : st.childIconInactive,
    ]}>
      <Text style={[
        st.childInitial,
        { opacity: focused ? 1 : 0.5 },
      ]}>
        {initial}
      </Text>
    </View>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: 'transparent',
          borderTopWidth: 1,
          borderTopColor: 'rgba(255,255,255,0.04)',
          paddingBottom: 24,
          paddingTop: 8,
          height: 80,
          position: 'absolute',
          elevation: 0,
        },
        tabBarActiveTintColor: C.amber,
        tabBarInactiveTintColor: 'rgba(255,255,255,0.25)',
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
        name="child"
        options={{
          title: 'Child',
          tabBarIcon: ({ focused }) => <ChildTabIcon focused={focused} />,
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

const st = StyleSheet.create({
  childIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  childIconActive: {
    backgroundColor: C.amber,
  },
  childIconInactive: {
    backgroundColor: 'rgba(255,255,255,0.10)',
  },
  childInitial: {
    fontFamily: F.bodySemi,
    fontSize: 13,
    color: '#FFFFFF',
  },
});

