// app/(tabs)/you.tsx
// v2 — "You" tab with glassmorphism 3D card system
// Night sky + Stars + directional border cards + amber CTAs
// Matches welcome/result/child-profile canonical design

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
import { Stars }           from '../../src/components/features/Stars';
import { useAuth }         from '../../src/context/AuthContext';
import { colors as C, fonts as F } from '../../src/theme';

// ═══════════════════════════════════════════════
// GLASS GROUP — Settings card with directional borders
// ═══════════════════════════════════════════════

type GlassTint = 'standard' | 'warm' | 'sage' | 'slate';

const TINT_COLORS: Record<GlassTint, {
  colors: [string, string, string];
  borderTop: string;
  borderLeft: string;
  borderRight: string;
  borderBottom: string;
}> = {
  standard: {
    colors: ['rgba(255,255,255,0.06)', 'rgba(255,255,255,0.02)', 'rgba(0,0,0,0.10)'],
    borderTop: 'rgba(255,255,255,0.12)',
    borderLeft: 'rgba(255,255,255,0.06)',
    borderRight: 'rgba(0,0,0,0.06)',
    borderBottom: 'rgba(0,0,0,0.10)',
  },
  warm: {
    colors: ['rgba(200,136,58,0.10)', 'rgba(200,136,58,0.04)', 'rgba(0,0,0,0.10)'],
    borderTop: 'rgba(200,136,58,0.22)',
    borderLeft: 'rgba(200,136,58,0.12)',
    borderRight: 'rgba(0,0,0,0.06)',
    borderBottom: 'rgba(0,0,0,0.10)',
  },
  sage: {
    colors: ['rgba(124,154,135,0.10)', 'rgba(124,154,135,0.04)', 'rgba(0,0,0,0.10)'],
    borderTop: 'rgba(124,154,135,0.22)',
    borderLeft: 'rgba(124,154,135,0.12)',
    borderRight: 'rgba(0,0,0,0.06)',
    borderBottom: 'rgba(0,0,0,0.10)',
  },
  slate: {
    colors: ['rgba(60,90,115,0.10)', 'rgba(60,90,115,0.04)', 'rgba(0,0,0,0.10)'],
    borderTop: 'rgba(60,90,115,0.22)',
    borderLeft: 'rgba(60,90,115,0.12)',
    borderRight: 'rgba(0,0,0,0.06)',
    borderBottom: 'rgba(0,0,0,0.10)',
  },
};

function GlassGroup({
  children,
  tint = 'standard',
}: {
  children: React.ReactNode;
  tint?: GlassTint;
}) {
  const t = TINT_COLORS[tint];
  return (
    <LinearGradient
      colors={t.colors}
      start={{ x: 0, y: 0 }}
      end={{ x: 0.8, y: 1 }}
      style={[
        s.group,
        {
          borderTopColor: t.borderTop,
          borderLeftColor: t.borderLeft,
          borderRightColor: t.borderRight,
          borderBottomColor: t.borderBottom,
        },
      ]}
    >
      {children}
    </LinearGradient>
  );
}

// ═══════════════════════════════════════════════
// SUB-COMPONENTS
// ═══════════════════════════════════════════════

function SectionLabel({ label }: { label: string }) {
  return (
    <View style={s.sectionRow}>
      <Text style={s.sectionLabel}>{label}</Text>
      <View style={s.sectionLine} />
    </View>
  );
}

function SettingRow({
  label, value, onPress, danger, toggle, toggleValue, onToggle, accent,
}: {
  label: string;
  value?: string;
  onPress?: () => void;
  danger?: boolean;
  toggle?: boolean;
  toggleValue?: boolean;
  onToggle?: (v: boolean) => void;
  accent?: boolean;
}) {
  return (
    <Pressable
      onPress={() => {
        if (onPress) {
          Haptics.selectionAsync();
          onPress();
        }
      }}
      disabled={!onPress && !toggle}
      style={({ pressed }) => [s.row, onPress && pressed && { opacity: 0.7 }]}
    >
      <Text style={[
        s.rowLabel,
        danger && s.rowLabelDanger,
        accent && s.rowLabelAccent,
      ]}>
        {label}
      </Text>
      {toggle ? (
        <Switch
          value={toggleValue}
          onValueChange={(v) => {
            Haptics.selectionAsync();
            onToggle?.(v);
          }}
          trackColor={{ false: 'rgba(255,255,255,0.10)', true: C.blue }}
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

// ═══════════════════════════════════════════════
// MAIN SCREEN
// ═══════════════════════════════════════════════

export default function YouScreen() {
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
      <StatusBar style="light" />

      {/* ─── Night sky background (canonical) ─── */}
      <LinearGradient
        colors={['#0e0a10', '#14101a', '#1a1622', '#1e1a28', '#201c2a', '#1e1a24', '#1a1620', '#18141e', '#14101a']}
        locations={[0, 0.10, 0.22, 0.35, 0.48, 0.60, 0.72, 0.85, 1]}
        style={StyleSheet.absoluteFill}
      />
      <Stars />

      {/* ─── Warm ambient glow ─── */}
      <LinearGradient
        colors={['transparent', 'rgba(212,148,74,0.03)', 'rgba(212,148,74,0.06)']}
        locations={[0, 0.5, 1]}
        style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '35%', zIndex: 1 }}
        pointerEvents="none"
      />

      <ScrollView
        contentContainerStyle={s.scroll}
        showsVerticalScrollIndicator={false}
        style={{ zIndex: 2 }}
      >
        {/* Title */}
        <Text style={s.title}>You</Text>

        {/* ═══ ACCOUNT (slate — personal/identity) ═══ */}
        <SectionLabel label="ACCOUNT" />
        <GlassGroup tint="slate">
          <View style={s.accountRow}>
            <LinearGradient
              colors={['#7C9A87', '#3C5A73']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={s.accountAva}
            >
              <Text style={s.accountAvaText}>
                {email ? email[0].toUpperCase() : '?'}
              </Text>
            </LinearGradient>
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={s.accountEmail}>{email ?? 'Guest'}</Text>
              <Text style={s.accountPlan}>Free plan</Text>
            </View>
          </View>
        </GlassGroup>

        {/* ═══ SUBSCRIPTION (warm — upsell/amber) ═══ */}
        <SectionLabel label="SUBSCRIPTION" />
        <GlassGroup tint="warm">
          <Pressable
            onPress={() => {/* paywall */}}
            style={({ pressed }) => [s.upgradeRow, pressed && { opacity: 0.85 }]}
          >
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={s.upgradeLabel}>Upgrade to Sturdy+</Text>
              <Text style={s.upgradeSub}>Unlimited scripts, full history, insights</Text>
            </View>
            <LinearGradient
              colors={['#C8883A', '#E8A855']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={s.upgradeBtn}
            >
              <Text style={s.upgradeBtnText}>→</Text>
            </LinearGradient>
          </Pressable>
          <Divider />
          <SettingRow label="Restore purchase" onPress={() => {}} />
        </GlassGroup>

        {/* ═══ CHILDREN (sage — growth) ═══ */}
        <SectionLabel label="CHILDREN" />
        <GlassGroup tint="sage">
          <SettingRow
            label="Manage children"
            onPress={() => router.push('/child/new')}
          />
        </GlassGroup>

        {/* ═══ GENERAL (standard) ═══ */}
        <SectionLabel label="GENERAL" />
        <GlassGroup tint="standard">
          <SettingRow
            label="Push notifications"
            toggle
            toggleValue={pushEnabled}
            onToggle={setPushEnabled}
          />
        </GlassGroup>

        {/* ═══ PRIVACY (standard) ═══ */}
        <SectionLabel label="PRIVACY" />
        <GlassGroup tint="standard">
          <SettingRow
            label="Research consent"
            toggle
            toggleValue={researchConsent}
            onToggle={setResearchConsent}
          />
          <Divider />
          <SettingRow
            label="Privacy policy"
            onPress={() => router.push('/legal/privacy-policy')}
          />
          <Divider />
          <SettingRow
            label="Terms of service"
            onPress={() => router.push('/legal/terms-of-service')}
          />
        </GlassGroup>

        {/* ═══ SUPPORT (standard) ═══ */}
        <SectionLabel label="SUPPORT" />
        <GlassGroup tint="standard">
          <SettingRow label="Help & FAQ" onPress={() => {}} />
          <Divider />
          <SettingRow label="Contact us" onPress={() => {}} />
        </GlassGroup>

        {/* ═══ ACCOUNT ACTIONS ═══ */}
        <GlassGroup tint="standard">
          <SettingRow
            label={signingOut ? 'Signing out…' : 'Sign out'}
            onPress={handleSignOut}
          />
          <Divider />
          <SettingRow
            label="Delete account"
            danger
            onPress={() => {}}
          />
        </GlassGroup>

        {/* Version */}
        <Text style={s.version}>Sturdy v4.0 · Made with ♥</Text>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ═══════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0e0a10' },
  scroll: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 60, gap: 6 },

  title: {
    fontFamily: F.heading,
    fontSize: 28,
    color: C.text,
    letterSpacing: -0.3,
    marginBottom: 8,
  },

  // Section headers (matching child-profile pattern)
  sectionRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 12, marginBottom: 4 },
  sectionLabel: {
    fontFamily: F.label,
    fontSize: 10,
    letterSpacing: 0.9,
    color: C.textMuted,
  },
  sectionLine: { flex: 1, height: StyleSheet.hairlineWidth, backgroundColor: 'rgba(255,255,255,0.08)' },

  // Glass group (directional border applied inline via GlassGroup)
  group: {
    borderRadius: 18,
    borderWidth: 1,
    overflow: 'hidden',
  },

  // Divider
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(255,255,255,0.06)',
    marginLeft: 16,
  },

  // Row
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 15,
    minHeight: 52,
  },
  rowLabel: { fontFamily: F.bodyMedium, fontSize: 15, color: C.textBody },
  rowLabelDanger: { color: C.coral },
  rowLabelAccent: { color: C.amber },
  rowValue: { fontFamily: F.body, fontSize: 14, color: C.textMuted },
  rowChevron: { fontSize: 18, color: 'rgba(255,255,255,0.18)' },

  // Account
  accountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  accountAva: {
    width: 44, height: 44, borderRadius: 22,
    alignItems: 'center', justifyContent: 'center',
  },
  accountAvaText: { fontFamily: F.subheading, fontSize: 16, color: '#FFF' },
  accountEmail: { fontFamily: F.bodyMedium, fontSize: 14, color: C.textBody },
  accountPlan: { fontFamily: F.body, fontSize: 12, color: C.textMuted },

  // Upgrade row (custom layout inside warm glass)
  upgradeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  upgradeLabel: { fontFamily: F.bodySemi, fontSize: 15, color: C.amber },
  upgradeSub: { fontFamily: F.body, fontSize: 12, color: C.textMuted },
  upgradeBtn: {
    width: 36, height: 36, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
  },
  upgradeBtnText: { fontSize: 16, color: '#FFFFFF', fontFamily: F.bodySemi },

  // Version
  version: {
    fontFamily: F.body,
    fontSize: 12,
    color: 'rgba(255,255,255,0.15)',
    textAlign: 'center',
    marginTop: 16,
  },
});


