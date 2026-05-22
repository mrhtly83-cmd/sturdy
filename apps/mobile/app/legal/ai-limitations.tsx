import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router }        from 'expo-router';
import { StatusBar }     from 'expo-status-bar';
import { SafeAreaView }  from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, type } from '../../src/theme';

export default function AILimitationsScreen() {
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

        <Text style={styles.title}>AI Limitations</Text>
        <Text style={styles.date}>Last Updated May 21, 2026</Text>

        <Text style={styles.body}>
          Sturdy uses artificial intelligence to generate parenting scripts and
          answers to your questions. We believe in being transparent about what
          our AI can and cannot do.
        </Text>

        <Text style={styles.sectionTitle}>How It Works</Text>
        <Text style={styles.body}>
          When you describe a parenting situation, your message is sent to an AI
          language model along with your child's name and age, if provided. The
          model generates a response based on its training in child development
          principles, attachment theory, and practical parenting communication.
          {'\n\n'}
          The AI does not learn from your individual conversations or retain
          memory between sessions.
        </Text>

        <Text style={styles.sectionTitle}>What the AI Does Well</Text>
        <Text style={styles.body}>
          Sturdy's AI is designed to provide calm, practical language for common
          parenting challenges. It works best when helping you find words for
          emotionally charged moments, generating age-appropriate language based
          on your child's developmental stage, offering multiple script options
          so you can choose what feels natural, and providing context about why
          certain approaches work.
        </Text>

        <Text style={styles.sectionTitle}>What the AI Cannot Do</Text>
        <Text style={styles.body}>
          It cannot fully understand your specific situation. The AI works from a
          brief text description. It does not see your child, hear their tone, or
          know your family history beyond what you share. Important context may
          be missing.
          {'\n\n'}
          It cannot diagnose or treat conditions. If you notice persistent
          patterns that concern you, consult a qualified professional.
          {'\n\n'}
          It may sometimes get it wrong. The AI may misread your situation,
          suggest an approach that doesn't fit, or produce a script that feels
          unnatural. If a suggestion doesn't feel right, trust your own judgment.
          You know your child better than any AI system.
          {'\n\n'}
          It does not replace professional support. For families dealing with
          trauma, abuse, mental health challenges, or neurodevelopmental
          conditions, professional guidance is essential. Sturdy complements
          professional support — it does not substitute for it.
          {'\n\n'}
          It is not a crisis service. While Sturdy detects potential crises and
          shows emergency resources, it is not trained for crisis intervention.
          In an emergency, contact emergency services directly.
        </Text>

        <Text style={styles.sectionTitle}>Neurotype Sensitivity</Text>
        <Text style={styles.body}>
          Sturdy's scripts are designed to work across neurotypes without
          requiring parents to label or diagnose their child. If you share that
          your child has a specific neurotype, the AI will incorporate that
          context. If you don't, scripts aim to be inclusive regardless.
          {'\n\n'}
          Children with specific neurodevelopmental conditions may respond
          differently to certain approaches. We encourage you to discuss Sturdy
          suggestions with your child's care team.
        </Text>

        <Text style={styles.sectionTitle}>Your Role</Text>
        <Text style={styles.body}>
          You are the expert on your child. Sturdy offers language and ideas in
          difficult moments, but every decision about how to respond is yours.
          Use what resonates. Adapt what almost works. Discard what doesn't fit.
          The best parenting script is the one that feels true to you and your
          relationship with your child.
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
    gap:               spacing.md,
  },
  back:         { alignSelf: 'flex-start', paddingVertical: spacing.xs },
  backText:     { ...type.body, fontWeight: '600', color: colors.textSecondary },
  title:        { fontSize: 28, fontWeight: '800', color: colors.text, lineHeight: 34 },
  date:         { ...type.body, fontSize: 13, color: colors.textSecondary, opacity: 0.6 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: colors.text, lineHeight: 24, marginTop: spacing.sm },
  body:         { ...type.body, color: colors.textSecondary, lineHeight: 28 },
});