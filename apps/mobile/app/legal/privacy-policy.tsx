import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';
import { router }       from 'expo-router';
import { StatusBar }    from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, type } from '../../src/theme';

export default function PrivacyScreen() {
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

        <Text style={styles.title}>Privacy Policy</Text>

        <Text style={styles.body}>
          Sturdy collects only the information needed to provide parenting
          support. This includes your email address, child profile details
          such as name and age, and the parenting situations you describe.
          {'\n\n'}
          Your data is stored securely and is never sold to third parties.
          Child profile data is used only to personalise scripts for your
          child and improve the support Sturdy provides to you.{'\n\n'}
          Sturdy does not use your conversations to train AI models or share
          your data with third-party advertisers.{'\n\n'}
          You can request deletion of your account and all associated data
          at any time by contacting support.
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
