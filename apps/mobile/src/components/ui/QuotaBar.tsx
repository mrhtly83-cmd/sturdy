// src/components/ui/QuotaBar.tsx
// Compact dual-bar usage display shown below the Ask Sturdy pill on the home screen.
// Visible for logged-in free users only — hidden for Sturdy+ and guests.

import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router }          from 'expo-router';
import * as Haptics        from 'expo-haptics';
import { useQuota }        from '../../hooks/useQuota';
import { useSubscription } from '../../hooks/useSubscription';
import { useAuth }         from '../../context/AuthContext';
import { colors as C, fonts as F } from '../../theme';

const AMBER     = C.amber;
const AMBER_DIM = 'rgba(200,136,58,0.45)'; // TODO: check token
const MUTED     = C.textMuted;
const TRACK_BG  = C.surface;

export function QuotaBar() {
  const { session }   = useAuth();
  const { isPremium } = useSubscription();
  const {
    counts, loading,
    scriptsPct, questionsPct,
    isScriptsLow, isQuestionsLow,
  } = useQuota();

  if (isPremium || !session || loading) return null;

  const showCTA = isScriptsLow || isQuestionsLow;

  const handleUpgrade = () => {
    Haptics.selectionAsync();
    router.push('/upgrade' as any);
  };

  return (
    <View style={s.root}>
      {/* Scripts bar */}
      <View style={s.row}>
        <Text style={[s.label, isScriptsLow && { color: AMBER }]}>
          {counts.scriptsUsed} of {counts.scriptsCap} scripts
        </Text>
        {showCTA ? (
          <Pressable onPress={handleUpgrade} hitSlop={8}>
            <Text style={s.cta}>Unlock unlimited →</Text>
          </Pressable>
        ) : (
          <Text style={s.resetLabel}>Resets {counts.resetDate}</Text>
        )}
      </View>
      <View style={s.track}>
        <View style={[
          s.fill,
          {
            width: `${Math.round(scriptsPct * 100)}%` as any,
            backgroundColor: isScriptsLow ? AMBER : AMBER_DIM,
          },
        ]} />
      </View>

      {/* Questions bar */}
      <View style={[s.row, { marginTop: 8 }]}>
        <Text style={[s.label, isQuestionsLow && { color: AMBER }]}>
          {counts.questionsUsed} of {counts.questionsCap} questions
        </Text>
      </View>
      <View style={s.track}>
        <View style={[
          s.fill,
          {
            width: `${Math.round(questionsPct * 100)}%` as any,
            backgroundColor: isQuestionsLow ? AMBER : AMBER_DIM,
          },
        ]} />
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  root:       { paddingHorizontal: 4, marginBottom: 20 },
  row:        { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 },
  label:      { fontFamily: F.body, fontSize: 11, color: MUTED },
  resetLabel: { fontFamily: F.body, fontSize: 11, color: MUTED },
  cta:        { fontFamily: F.bodyMedium, fontSize: 11, color: AMBER },
  track:      { height: 3, backgroundColor: TRACK_BG, borderRadius: 2, overflow: 'hidden' },
  fill:       { height: '100%', borderRadius: 2 },
});
