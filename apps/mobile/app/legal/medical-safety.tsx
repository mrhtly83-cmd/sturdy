import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';
import { router }       from 'expo-router';
import { StatusBar }    from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, type } from '../../src/theme';

export default function MedicalSafetyScreen() {
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

        <Text style={styles.title}>Medical Safety</Text>

        <Text style={styles.body}>
          Sturdy is not a medical tool and is not a substitute for
          professional medical advice, diagnosis, or treatment.{'\n\n'}
          Scripts and guidance provided by Sturdy are for general parenting
          support only. They are not clinical recommendations and should
          never replace advice from a qualified doctor, psychologist,
          therapist, or other healthcare professional.{'\n\n'}
          If your child is injured, unconscious, having difficulty
          breathing, experiencing a seizure, or in any medical emergency
          — call your local emergency services immediately.{'\n\n'}
          Do not use Sturdy during a medical emergency. Always prioritise
          immediate safety above all else.{'\n\n'}
          If you have ongoing concerns about your child's physical or
          mental health, please consult a qualified healthcare professional.
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
