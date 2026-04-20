// app/(tabs)/_layout.tsx
// v4 — Journal identity: frosted glass tab bar, rose active
// 3 tabs: Home · Child · Settings


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
        { color: focused ? '#FFFFFF' : C.textMuted },
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
    backgroundColor: C.rose,
  },
  childIconInactive: {
    backgroundColor: 'rgba(0,0,0,0.06)',
  },
  childInitial: {
    fontFamily: F.bodySemi,
    fontSize: 13,
  },
});



