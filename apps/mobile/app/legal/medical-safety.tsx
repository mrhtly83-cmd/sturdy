import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router }        from 'expo-router';
import { StatusBar }     from 'expo-status-bar';
import { SafeAreaView }  from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, type } from '../../src/theme';

export default function MedicalSafetyScreen() {
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

        <Text style={styles.title}>Medical & Safety Notice</Text>
        <Text style={styles.date}>Last Updated May 21, 2026</Text>

        <Text style={styles.body}>
          Sturdy is a parenting support tool, not a medical or mental health
          service. This notice explains when you should seek professional help
          instead of or in addition to using Sturdy.
        </Text>

        <Text style={styles.sectionTitle}>Not Medical Advice</Text>
        <Text style={styles.body}>
          Nothing in Sturdy — including scripts, answers, and suggestions —
          constitutes medical advice, psychological treatment, therapy, or
          clinical diagnosis. The AI-generated content is general parenting
          support only.
          {'\n\n'}
          Do not rely on Sturdy to assess your child's health, development, or
          psychological wellbeing. Do not use it as a substitute for
          consultation with qualified healthcare providers.
        </Text>

        <Text style={styles.sectionTitle}>When to Call Emergency Services</Text>
        <Text style={styles.body}>
          Contact your local emergency services immediately if your child is
          experiencing difficulty breathing, loss of consciousness, a serious
          injury or head trauma, a seizure, a severe allergic reaction,
          ingestion of a harmful substance, or any situation where their life
          may be at risk.
          {'\n\n'}
          Sturdy cannot help in a medical emergency. Do not use the app to
          assess whether a situation is an emergency. When in doubt, call for
          help.
        </Text>

        <Text style={styles.sectionTitle}>When to Seek Mental Health Support</Text>
        <Text style={styles.body}>
          Contact a qualified mental health professional if your child shows
          persistent behavioral changes that concern you, expresses thoughts of
          self-harm or harming others, shows signs of severe anxiety, depression,
          or withdrawal, has experienced trauma or abuse, or displays
          developmental delays or regressions.
          {'\n\n'}
          If you as a parent are experiencing a mental health crisis, please
          reach out for support. In the United States, you can call or text 988
          to reach the Suicide and Crisis Lifeline, or text HOME to 741741 to
          reach the Crisis Text Line.
        </Text>

        <Text style={styles.sectionTitle}>When to Consult Your Pediatrician</Text>
        <Text style={styles.body}>
          Many parenting challenges Sturdy helps with — tantrums, bedtime
          resistance, sibling conflict — are a normal part of child development.
          However, consult your pediatrician if a behavior is significantly more
          intense or frequent than seems typical for your child's age, if it
          affects their ability to function at school or socially, if you notice
          physical symptoms alongside behavioral changes, or if you have any
          concerns about their development.
        </Text>

        <Text style={styles.sectionTitle}>Sturdy's Safety Filter</Text>
        <Text style={styles.body}>
          Sturdy includes a safety filter that scans messages for language
          indicating a potential crisis. When detected, it displays emergency
          resources instead of generating a script.
          {'\n\n'}
          This filter is not perfect — it may miss indirect signals or
          occasionally flag non-crisis messages. If you are in a crisis, do not
          rely on the app to detect it. Reach out to a professional or emergency
          service directly.
          {'\n\n'}
          Crisis resources shown by Sturdy are always free, regardless of your
          subscription status.
        </Text>

        <Text style={styles.sectionTitle}>Your Judgment Comes First</Text>
        <Text style={styles.body}>
          Sturdy exists to support you, not replace your judgment. You know your
          child and your situation better than any app. If something Sturdy
          suggests does not feel right, trust yourself.
          {'\n\n'}
          If you are ever unsure whether your child needs professional
          attention, err on the side of seeking help. No app can replace the
          assessment of a qualified professional who can see, hear, and interact
          with your child directly.
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