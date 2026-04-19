import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';
import { router }       from 'expo-router';
import { StatusBar }    from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, type } from '../../src/theme';

export default function AILimitationsScreen() {
  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      <StatusBar style="dark" />
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

        <Text style={styles.body}>
          Sturdy is an AI-powered tool. Scripts and guidance are generated
          by artificial intelligence and may not always be accurate,
          complete, or appropriate for your specific situation.{'\n\n'}
          AI can make mistakes. Sturdy does not guarantee that any
          generated script will be suitable for your child, your
          circumstances, or the moment you are in. Always use your own
          judgement.{'\n\n'}
          Sturdy does not diagnose conditions, provide clinical assessments,
          or prescribe any course of action. It is a support tool, not a
          professional service.{'\n\n'}
          Sturdy is not a doctor, psychologist, therapist, counsellor, or
          any kind of licensed health professional. Nothing in this app
          should be interpreted as professional advice of any kind.{'\n\n'}
          By using Sturdy you acknowledge that it is an AI tool, that it
          can make mistakes, and that you are responsible for the parenting
          decisions you make.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root:    { flex: 1, backgroundColor: colors.background },
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