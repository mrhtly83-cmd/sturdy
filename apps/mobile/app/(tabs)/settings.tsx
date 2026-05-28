// app/(tabs)/settings.tsx
// v5 — V1 Launch cleanup:
// - Removed push notification toggle (no backend, was lying)
// - Removed research consent toggle (not persisted, was lying)
// - Wired "Help & FAQ" and "Contact us" to email
// - Fixed upgrade sub copy (removed "insights" — not built)
// - GENERAL section removed (was only push toggle)

import { useState } from 'react';
import {
  Alert,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { router }         from 'expo-router';
import { StatusBar }       from 'expo-status-bar';
import { SafeAreaView }    from 'react-native-safe-area-context';
import { LinearGradient }  from 'expo-linear-gradient';
import * as Haptics        from 'expo-haptics';
import { useAuth }         from '../../src/context/AuthContext';
import { useSubscription } from '../../src/hooks/useSubscription';
import { colors as C, fonts as F, TAB_BAR_HEIGHT } from '../../src/theme';

// ─── Components ───

function SectionLabel({ label }: { label: string }) {
  return (
    <View style={s.sectionRow}>
      <Text style={s.sectionLabel}>{label}</Text>
      <View style={s.sectionLine} />
    </View>
  );
}

function SettingGroup({ children }: { children: React.ReactNode }) {
  return <View style={s.group}>{children}</View>;
}

function SettingRow({
  label, value, onPress, danger, accent,
}: {
  label: string; value?: string; onPress?: () => void; danger?: boolean;
  accent?: boolean;
}) {
  return (
    <Pressable
      onPress={() => { if (onPress) { Haptics.selectionAsync(); onPress(); } }}
      disabled={!onPress}
      style={({ pressed }) => [s.row, onPress && pressed && { opacity: 0.7 }]}
    >
      <Text style={[
        s.rowLabel,
        danger && { color: C.sos },
        accent && { color: C.amber },
      ]}>
        {label}
      </Text>
      {value ? (
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

// ─── Helpers ───

function planDisplayName(plan: 'free' | 'monthly' | 'annual'): string {
  switch (plan) {
    case 'monthly': return 'Sturdy+ Monthly';
    case 'annual':  return 'Sturdy+ Annual';
    default:        return 'Free plan';
  }
}

function handleManageSubscription() {
  if (Platform.OS === 'android') {
    Linking.openURL('https://play.google.com/store/account/subscriptions');
  } else if (Platform.OS === 'ios') {
    Linking.openURL('https://apps.apple.com/account/subscriptions');
  }
}

const SUPPORT_EMAIL = 'sturdymobile@gmail.com';

function handleContactUs() {
  Linking.openURL(`mailto:${SUPPORT_EMAIL}?subject=Sturdy%20Support`);
}

function handleHelpFAQ() {
  Linking.openURL(`mailto:${SUPPORT_EMAIL}?subject=Sturdy%20Help`);
}

// ─── Main ───

export default function SettingsScreen() {
  const { session, signOut } = useAuth();
  const { isPremium, plan, restore } = useSubscription();
  const [signingOut, setSigningOut] = useState(false);
  const [restoring, setRestoring] = useState(false);

  const email = session?.user?.email ?? null;

  const handleSignOut = async () => {
    setSigningOut(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    try {
      await signOut();
    } catch {
      setSigningOut(false);
    }
  };

  const handleRestore = async () => {
    setRestoring(true);
    Haptics.selectionAsync();
    try {
      const restored = await restore();
      if (restored) {
        Alert.alert('Purchase restored', 'Welcome back to Sturdy+!', [{ text: 'OK' }]);
      } else {
        Alert.alert(
          'No purchase found',
          'We couldn\'t find an active Sturdy+ subscription for this account.',
          [{ text: 'OK' }],
        );
      }
    } catch (err) {
      Alert.alert(
        'Restore failed',
        'Something went wrong. Please try again later.',
        [{ text: 'OK' }],
      );
      console.error('[BILLING] Restore error on settings:', err);
    } finally {
      setRestoring(false);
    }
  };

  return (
    <View style={s.root}>
      <StatusBar style="light" />
      <LinearGradient
        colors={[
          C.gradientSettingsTop,
          C.gradientSettingsMid1,
          C.gradientSettingsMid2,
          C.gradientMid3,
          C.gradientMid4,
          C.gradientBottom,
        ]}
        locations={[0, 0.12, 0.26, 0.42, 0.58, 1]}
        style={StyleSheet.absoluteFill}
      />
      <SafeAreaView style={s.safe} edges={['top']}>
        <ScrollView
          contentContainerStyle={s.scroll}
          showsVerticalScrollIndicator={false}
        >
          <Text style={s.title}>Settings</Text>

          {/* ACCOUNT */}
          <SectionLabel label="ACCOUNT" />
          <SettingGroup>
            <View style={s.accountRow}>
              <LinearGradient
                colors={[C.amber, C.amberMid]}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                style={s.accountAva}
              >
                <Text style={s.accountAvaText}>
                  {email ? email[0].toUpperCase() : '?'}
                </Text>
              </LinearGradient>
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={s.accountEmail}>{email ?? 'Guest'}</Text>
                <Text style={[
                  s.accountPlan,
                  isPremium && { color: C.amber },
                ]}>
                  {planDisplayName(plan)}
                </Text>
              </View>
              {isPremium && (
                <View style={s.premiumBadge}>
                  <Text style={s.premiumBadgeText}>✦</Text>
                </View>
              )}
            </View>
          </SettingGroup>

          {/* SUBSCRIPTION */}
          <SectionLabel label="SUBSCRIPTION" />
          <SettingGroup>
            {isPremium ? (
              <>
                <View style={s.activePlanRow}>
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text style={s.activePlanLabel}>{planDisplayName(plan)}</Text>
                    <Text style={s.activePlanSub}>Your subscription is active</Text>
                  </View>
                  <View style={s.activeBadge}>
                    <Text style={s.activeBadgeText}>Active</Text>
                  </View>
                </View>
                <Divider />
                <SettingRow
                  label="Manage subscription"
                  onPress={handleManageSubscription}
                />
              </>
            ) : (
              <Pressable
                onPress={() => router.push('/upgrade')}
                style={({ pressed }) => [s.upgradeRow, pressed && { opacity: 0.85 }]}
              >
                <View style={{ flex: 1, gap: 2 }}>
                  <Text style={s.upgradeLabel}>Upgrade to Sturdy+</Text>
                  <Text style={s.upgradeSub}>Unlimited scripts, tone selector, voice</Text>
                </View>
                <View style={s.upgradeBtn}>
                  <Text style={s.upgradeBtnText}>→</Text>
                </View>
              </Pressable>
            )}
            <Divider />
            <SettingRow
              label={restoring ? 'Restoring…' : 'Restore purchase'}
              onPress={handleRestore}
            />
          </SettingGroup>

          {/* CHILDREN */}
          <SectionLabel label="CHILDREN" />
          <SettingGroup>
            <SettingRow label="Manage children" onPress={() => router.push('/child/new')} />
          </SettingGroup>

          {/* PRIVACY */}
          <SectionLabel label="PRIVACY" />
          <SettingGroup>
            <SettingRow label="Privacy policy" onPress={() => router.push('/legal/privacy-policy')} />
            <Divider />
            <SettingRow label="Terms of service" onPress={() => router.push('/legal/terms-of-service')} />
            <Divider />
            <SettingRow label="AI limitations" onPress={() => router.push('/legal/ai-limitations')} />
            <Divider />
            <SettingRow label="Medical safety" onPress={() => router.push('/legal/medical-safety')} />
          </SettingGroup>

          {/* SUPPORT */}
          <SectionLabel label="SUPPORT" />
          <SettingGroup>
            <SettingRow label="Contact us" onPress={handleContactUs} />
          </SettingGroup>

          {/* MANAGE ACCOUNT */}
          <SectionLabel label="MANAGE ACCOUNT" />
          <SettingGroup>
            <SettingRow label="Export my data" onPress={() => router.push('/account/export')} />
            <Divider />
            <SettingRow label="Pause account"  onPress={() => router.push('/account/pause')} />
            <Divider />
            <SettingRow label="Delete account" danger onPress={() => router.push('/account/delete')} />
          </SettingGroup>

          {/* SIGN OUT */}
          <SettingGroup>
            <SettingRow
              label={signingOut ? 'Signing out…' : 'Sign out'}
              onPress={handleSignOut}
            />
          </SettingGroup>

          <Text style={s.version}>Sturdy v1.0 · Made with ♥</Text>

          <View style={{ height: TAB_BAR_HEIGHT }} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

// ─── Styles ───

const SAGE = '#8DB89A';
const SAGE_BG = 'rgba(141,184,154,0.12)';

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.background },
  safe: { flex: 1 },
  scroll: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 20, gap: 6 },

  title: {
    fontFamily:    F.heading,
    fontSize:      28,
    color:         C.text,
    letterSpacing: -0.3,
    marginBottom:  8,
  },

  sectionRow: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           10,
    marginTop:     14,
    marginBottom:  4,
  },
  sectionLabel: {
    fontFamily:    F.label,
    fontSize:      10,
    letterSpacing: 1.2,
    color:         C.amber,
    textTransform: 'uppercase',
  },
  sectionLine: {
    flex:            1,
    height:          StyleSheet.hairlineWidth,
    backgroundColor: C.divider,
  },

  group: {
    backgroundColor: C.surface,
    borderWidth:     1,
    borderColor:     C.border,
    borderTopWidth:  1,
    borderTopColor:  C.borderHi,
    borderRadius:    18,
    overflow:        'hidden',
    shadowColor:     '#000000',
    shadowOffset:    { width: 0, height: 6 },
    shadowOpacity:   0.35,
    shadowRadius:    20,
    elevation:       4,
  },

  divider: {
    height:          StyleSheet.hairlineWidth,
    backgroundColor: C.divider,
    marginLeft:      16,
  },

  row: {
    flexDirection:     'row',
    alignItems:        'center',
    justifyContent:    'space-between',
    paddingHorizontal: 16,
    paddingVertical:   15,
    minHeight:         52,
  },
  rowLabel:   { fontFamily: F.bodyMedium, fontSize: 15, color: C.text },
  rowValue:   { fontFamily: F.body,       fontSize: 14, color: C.textMuted },
  rowChevron: { fontSize: 22, color: C.textFaint },

  accountRow: {
    flexDirection:     'row',
    alignItems:        'center',
    gap:               12,
    paddingHorizontal: 16,
    paddingVertical:   14,
  },
  accountAva: {
    width:          44,
    height:         44,
    borderRadius:   22,
    alignItems:     'center',
    justifyContent: 'center',
  },
  accountAvaText: {
    fontFamily: F.subheading,
    fontSize:   16,
    color:      C.text,
  },
  accountEmail: { fontFamily: F.bodyMedium, fontSize: 14, color: C.text },
  accountPlan:  { fontFamily: F.body,       fontSize: 12, color: C.textMuted },

  premiumBadge: {
    width:           28,
    height:          28,
    borderRadius:    14,
    backgroundColor: 'rgba(200,136,58,0.15)', // TODO: check token (no exact match at 0.15)
    alignItems:      'center',
    justifyContent:  'center',
  },
  premiumBadgeText: {
    fontSize: 14,
    color:    C.amber,
  },

  activePlanRow: {
    flexDirection:     'row',
    alignItems:        'center',
    gap:               12,
    paddingHorizontal: 16,
    paddingVertical:   14,
  },
  activePlanLabel: { fontFamily: F.bodySemi, fontSize: 15, color: C.text },
  activePlanSub:   { fontFamily: F.body,     fontSize: 12, color: C.textSecondary },

  activeBadge: {
    backgroundColor: SAGE_BG,
    paddingHorizontal: 10,
    paddingVertical:   4,
    borderRadius:      8,
  },
  activeBadgeText: {
    fontFamily: F.bodyMedium,
    fontSize:   11,
    color:      SAGE,
  },

  upgradeRow: {
    flexDirection:     'row',
    alignItems:        'center',
    gap:               12,
    paddingHorizontal: 16,
    paddingVertical:   14,
  },
  upgradeLabel: { fontFamily: F.bodySemi, fontSize: 15, color: C.amber },
  upgradeSub:   { fontFamily: F.body,     fontSize: 12, color: C.textSecondary },
  upgradeBtn: {
    width:          36,
    height:         36,
    borderRadius:   12,
    backgroundColor: C.amber,
    alignItems:     'center',
    justifyContent: 'center',
  },
  upgradeBtnText: { fontSize: 16, color: C.textInverse, fontFamily: F.bodySemi },

  version: {
    fontFamily: F.body,
    fontSize:   12,
    color:      C.textMuted,
    textAlign:  'center',
    marginTop:  20,
  },
});