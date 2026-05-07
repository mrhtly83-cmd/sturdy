import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router }        from 'expo-router';
import { StatusBar }     from 'expo-status-bar';
import { SafeAreaView }  from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, type } from '../../src/theme';

export default function TermsScreen() {
  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <LinearGradient
        colors={[
          colors.gradientResultTop,
          colors.gradientResultMid1,
          colors.gradientResultMid2,
          colors.gradientResultMid3,
          colors.gradientMid4,
          colors.gradientBottom,
        ]}
        locations={[0, 0.10, 0.25, 0.42, 0.58, 1]}
        style={StyleSheet.absoluteFill}
      />
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Pressable
          onPress={() =>
            router.canGoBack()
              ? router.back()
              : router.replace('/(tabs)/account')
          }
          style={styles.back}
        >
          <Text style={styles.backText}>← Back</Text>
        </Pressable>

        <Text style={styles.title}>Terms of Service</Text>

        <Text style={styles.body}>
          Sturdy is a parenting support tool designed to help parents find
          calm, practical words in hard moments.{'\n\n'}
          By using Sturdy you agree to use it responsibly and understand
          that AI-generated scripts are suggestions only — not professional
          advice.{'\n\n'}
          Sturdy is not a substitute for medical, psychological, legal, or
          any other professional advice. Always use your own judgement about
          what is right for your child and your family.{'\n\n'}
          In any emergency contact your local emergency services immediately.
          Do not rely on Sturdy in an emergency.
        </Text>
      </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root:    { flex: 1, backgroundColor: colors.background },
  safe:    { flex: 1, backgroundColor: 'transparent' },
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop:        spacing.md,
    paddingBottom:     spacing.xxl,
    gap:               spacing.lg,
  },
  back:     { alignSelf: 'flex-start', paddingVertical: spacing.xs },
  backText: { ...type.body, fontWeight: '600', color: colors.textSecondary },
  title:    { fontSize: 28, fontWeight: '800', color: colors.text, lineHeight: 34 },
  body:     { ...type.body, color: colors.textSecondary, lineHeight: 28 },
});
