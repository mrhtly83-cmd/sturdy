import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router }        from 'expo-router';
import { StatusBar }     from 'expo-status-bar';
import { SafeAreaView }  from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, type } from '../../src/theme';

export default function PrivacyScreen() {
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

        <Text style={styles.title}>Privacy Policy</Text>
        <Text style={styles.date}>Effective June 15, 2026</Text>

        <Text style={styles.body}>
          Sturdy is a parenting support application that provides AI-generated
          communication scripts and guidance. This Privacy Policy explains how
          we collect, use, store, and protect your information when you use the
          Sturdy mobile application and related services.
        </Text>

        <Text style={styles.sectionTitle}>Information We Collect</Text>
        <Text style={styles.body}>
          When you create an account, we collect your email address and
          authentication credentials. If you sign in through Google or Apple,
          we receive only the email and unique identifier provided by that
          service. We do not receive or store your third-party password.
          {'\n\n'}
          To personalize scripts, you may provide your child's first name, age,
          and behavioral context such as known triggers. You choose what to
          share and can edit or delete this information at any time. We do not
          collect information directly from children.
          {'\n\n'}
          When you request a script or ask a question, the text you type is sent
          to our AI system to generate a response. We store a brief summary and
          metadata (mode used, trigger category) but do not store the full text
          of your input after the response is generated, except in Question mode
          where responses are saved so you can revisit them.
          {'\n\n'}
          We collect basic usage data including which features you use and how
          many scripts you generate per month, for quota enforcement and product
          improvement.
        </Text>

        <Text style={styles.sectionTitle}>Safety Events</Text>
        <Text style={styles.body}>
          If our safety filter detects a crisis situation, we log a brief record
          of the event type for safety monitoring. This includes the risk level
          and type of crisis resource shown, but not the full text of your
          message. Safety event records are deleted when you delete your account.
        </Text>

        <Text style={styles.sectionTitle}>How We Use Your Information</Text>
        <Text style={styles.body}>
          We use your information to generate personalized parenting scripts,
          personalize responses based on your child's profile, enforce your
          monthly usage quota, detect and respond to crisis situations, fix bugs,
          improve AI response quality, and process subscription payments.
          {'\n\n'}
          We do not use your conversations to train AI models. Your parenting
          situations are processed by Anthropic's Claude API to generate
          real-time responses but are not retained by Anthropic for model
          training.
        </Text>

        <Text style={styles.sectionTitle}>How We Share Your Information</Text>
        <Text style={styles.body}>
          We do not sell, rent, or trade your personal information. We share data
          only with service providers who process it on our behalf:
          {'\n\n'}
          Supabase provides our database, authentication, and server
          infrastructure. Anthropic provides the AI model that generates scripts.
          When you submit a situation, your message and child context are sent to
          Anthropic's API, which does not retain it for training. RevenueCat
          manages subscription billing through the Google Play Store or Apple App
          Store. We do not directly handle payment card information.
          {'\n\n'}
          We may disclose information if required by law, to protect the safety
          of a child, or to enforce our Terms of Service.
        </Text>

        <Text style={styles.sectionTitle}>Data Retention and Deletion</Text>
        <Text style={styles.body}>
          We retain your data for as long as your account is active. When you
          delete your account, all associated data is permanently removed through
          cascading deletion — child profiles, saved scripts, usage history,
          interaction logs, and safety event records. No anonymized traces
          remain. Account deletion is irreversible.
          {'\n\n'}
          You can delete your account at any time from the Settings screen. If
          you have an active subscription, cancel it through the app store
          before deleting your account to avoid continued charges.
        </Text>

        <Text style={styles.sectionTitle}>Data Security</Text>
        <Text style={styles.body}>
          We use encrypted connections (TLS) for all data in transit, row-level
          security policies to ensure users can only access their own data, and
          secure authentication through Supabase Auth. No method of storage or
          transmission is completely secure, but we take reasonable precautions.
        </Text>

        <Text style={styles.sectionTitle}>Children's Privacy</Text>
        <Text style={styles.body}>
          Sturdy is designed for parents and guardians, not children. We do not
          knowingly collect information directly from anyone under 13. Child
          profile data is provided by the parent and used solely to personalize
          guidance. If we learn a child under 13 has created an account, we will
          delete it promptly.
        </Text>

        <Text style={styles.sectionTitle}>Your Rights</Text>
        <Text style={styles.body}>
          Depending on your location, you may have the right to access, correct,
          delete, or export your data. You can exercise most of these rights
          directly in the app through Settings.
          {'\n\n'}
          For privacy questions, contact us at sturdymobile@gmail.com.
        </Text>

        <Text style={styles.sectionTitle}>Changes to This Policy</Text>
        <Text style={styles.body}>
          We may update this policy from time to time. Material changes will be
          communicated through the app or by email before they take effect.
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