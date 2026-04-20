// app/(tabs)/settings.tsx
// v3 — Journal identity: pastel gradient, frosted glass cards
// Settings screen with grouped sections

import { useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { router }         from 'expo-router';
import { StatusBar }       from 'expo-status-bar';
import { SafeAreaView }    from 'react-native-safe-area-context';
import { LinearGradient }  from 'expo-linear-gradient';
import * as Haptics        from 'expo-haptics';
import { useAuth }         from '../../src/context/AuthContext';
import { colors as C, fonts as F } from '../../src/theme';

// ─── Components ───

function SectionLabel({ label }: { label: string }) {
  return (
    <View style={s.sectionRow}>
      <Text style={s.sectionLabel}>{label}</Text>
      <View style={s.sectionLine} />
    </View>
  );
}

function SettingGroup({ children, tint }: { children: React.ReactNode; tint?: 'rose' | 'sage' }) {
  const bg = tint === 'rose' ? 'rgba(201,123,99,0.05)'
    : tint === 'sage' ? 'rgba(129,178,154,0.05)'
    : C.cardGlass;
  const bc = tint === 'rose' ? 'rgba(201,123,99,0.12)'
    : tint === 'sage' ? 'rgba(129,178,154,0.12)'
    : C.border;
  return (
    <View style={[s.group, { backgroundColor: bg, borderColor: bc }]}>
      {children}
    </View>
  );
}

function SettingRow({
  label, value, onPress, danger, toggle, toggleValue, onToggle, accent,
}: {
  label: string; value?: string; onPress?: () => void; danger?: boolean;
  toggle?: boolean; toggleValue?: boolean; onToggle?: (v: boolean) => void; accent?: boolean;
}) {
  return (
    <Pressable
      onPress={() => { if (onPress) { Haptics.selectionAsync(); onPress(); } }}
      disabled={!onPress && !toggle}
      style={({ pressed }) => [s.row, onPress && pressed && { opacity: 0.7 }]}
    >
      <Text style={[
        s.rowLabel,
        danger && { color: '#C0524A' },
        accent && { color: C.rose },
      ]}>
        {label}
      </Text>
      {toggle ? (
        <Switch
          value={toggleValue}
          onValueChange={(v) => { Haptics.selectionAsync(); onToggle?.(v); }}
          trackColor={{ false: 'rgba(0,0,0,0.08)', true: C.sage }}
          thumbColor="#FFFFFF"
        />
      ) : value ? (
        <Text style={s.rowValue}>{value}</Text>
      ) : onPress ? (
        <Text style={s.rowChevron}>›</Text>
      ) : null}
    </Pressable>
  );
}

function Divider() {
  return <View style={s.divider} />;
}

// ─── Main ───

export default function SettingsScreen() {
  const { session, signOut } = useAuth();
  const [pushEnabled, setPushEnabled] = useState(false);
  const [researchConsent, setResearchConsent] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  const email = session?.user?.email ?? null;

  const handleSignOut = async () => {
    setSigningOut(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    try {
      await signOut();
      router.replace('/welcome');
    } catch {
      setSigningOut(false);
    }
  };

  return (
    <SafeAreaView style={s.root} edges={['top']}>
      <StatusBar style="dark" />
      <LinearGradient
        colors={[C.gradStart, C.gradMid1, C.gradMid2, C.gradEnd]}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      <ScrollView
        contentContainerStyle={s.scroll}
        showsVerticalScrollIndicator={false}
      >
        <Text style={s.title}>Settings</Text>

        {/* ACCOUNT */}
        <SectionLabel label="ACCOUNT" />
        <SettingGroup>
          <View style={s.accountRow}>
            <View style={s.accountAva}>
              <Text style={s.accountAvaText}>
                {email ? email[0].toUpperCase() : '?'}
              </Text>
            </View>
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={s.accountEmail}>{email ?? 'Guest'}</Text>
              <Text style={s.accountPlan}>Free plan</Text>
            </View>
          </View>
        </SettingGroup>

        {/* SUBSCRIPTION */}
        <SectionLabel label="SUBSCRIPTION" />
        <SettingGroup tint="rose">
          <Pressable
            onPress={() => router.push('/upgrade')}
            style={({ pressed }) => [s.upgradeRow, pressed && { opacity: 0.85 }]}
          >
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={s.upgradeLabel}>Upgrade to Sturdy+</Text>
              <Text style={s.upgradeSub}>Unlimited scripts, full history, insights</Text>
            </View>
            <View style={s.upgradeBtn}>
              <Text style={s.upgradeBtnText}>→</Text>
            </View>
          </Pressable>
          <Divider />
          <SettingRow label="Restore purchase" onPress={() => {}} />
        </SettingGroup>

        {/* CHILDREN */}
        <SectionLabel label="CHILDREN" />
        <SettingGroup tint="sage">
          <SettingRow label="Manage children" onPress={() => router.push('/child/new')} />
        </SettingGroup>

        {/* GENERAL */}
        <SectionLabel label="GENERAL" />
        <SettingGroup>
          <SettingRow
            label="Push notifications"
            toggle toggleValue={pushEnabled} onToggle={setPushEnabled}
          />
        </SettingGroup>

        {/* PRIVACY */}
        <SectionLabel label="PRIVACY" />
        <SettingGroup>
          <SettingRow
            label="Research consent"
            toggle toggleValue={researchConsent} onToggle={setResearchConsent}
          />
          <Divider />
          <SettingRow label="Privacy policy" onPress={() => router.push('/legal/privacy-policy')} />
          <Divider />
          <SettingRow label="Terms of service" onPress={() => router.push('/legal/terms-of-service')} />
        </SettingGroup>

        {/* SUPPORT */}
        <SectionLabel label="SUPPORT" />
        <SettingGroup>
          <SettingRow label="Help & FAQ" onPress={() => {}} />
          <Divider />
          <SettingRow label="Contact us" onPress={() => {}} />
        </SettingGroup>

        {/* ACCOUNT ACTIONS */}
        <SettingGroup>
          <SettingRow
            label={signingOut ? 'Signing out…' : 'Sign out'}
            onPress={handleSignOut}
          />
          <Divider />
          <SettingRow label="Delete account" danger onPress={() => {}} />
        </SettingGroup>

        <Text style={s.version}>Sturdy v6.0 · Made with ♥</Text>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ───

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.base },
  scroll: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 60, gap: 6 },

  title: { fontFamily: F.display, fontSize: 28, color: C.text, letterSpacing: -0.3, marginBottom: 8 },

  sectionRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 12, marginBottom: 4 },
  sectionLabel: { fontFamily: F.label, fontSize: 10, letterSpacing: 0.9, color: C.textMuted },
  sectionLine: { flex: 1, height: StyleSheet.hairlineWidth, backgroundColor: 'rgba(0,0,0,0.08)' },

  group: { borderRadius: 18, borderWidth: 1, overflow: 'hidden' },

  divider: { height: StyleSheet.hairlineWidth, backgroundColor: 'rgba(0,0,0,0.06)', marginLeft: 16 },

  row: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 15, minHeight: 52,
  },
  rowLabel: { fontFamily: F.bodyMedium, fontSize: 15, color: C.text },
  rowValue: { fontFamily: F.body, fontSize: 14, color: C.textMuted },
  rowChevron: { fontSize: 18, color: 'rgba(42,37,32,0.18)' },

  accountRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 14 },
  accountAva: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: C.sage,
    alignItems: 'center', justifyContent: 'center',
  },
  accountAvaText: { fontFamily: F.subheading, fontSize: 16, color: '#FFF' },
  accountEmail: { fontFamily: F.bodyMedium, fontSize: 14, color: C.text },
  accountPlan: { fontFamily: F.body, fontSize: 12, color: C.textMuted },

  upgradeRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 14 },
  upgradeLabel: { fontFamily: F.bodySemi, fontSize: 15, color: C.rose },
  upgradeSub: { fontFamily: F.body, fontSize: 12, color: C.textMuted },
  upgradeBtn: {
    width: 36, height: 36, borderRadius: 12,
    backgroundColor: C.rose,
    alignItems: 'center', justifyContent: 'center',
  },
  upgradeBtnText: { fontSize: 16, color: '#FFFFFF', fontFamily: F.bodySemi },

  version: { fontFamily: F.body, fontSize: 12, color: C.textMuted, textAlign: 'center', marginTop: 16 },
});


