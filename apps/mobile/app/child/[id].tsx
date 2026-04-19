import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Screen } from '../../src/components/ui/Screen';
import { colors, spacing, type } from '../../src/theme';

export default function ChildDetailScreen() {
  return (
    <Screen>
      <Pressable
        onPress={() => router.back()}
        style={styles.back}
      >
        <Text style={styles.backText}>← Back</Text>
      </Pressable>
      <View style={styles.placeholder}>
        <Text style={styles.title}>Child Profile</Text>
        <Text style={styles.body}>
          Editing individual child profiles coming in Phase 2.
        </Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  back:        { alignSelf: 'flex-start', paddingVertical: spacing.xs },
  backText:    { ...type.body, fontWeight: '600', color: colors.textSecondary },
  placeholder: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md },
  title:       { fontSize: 24, fontWeight: '800', color: colors.text, textAlign: 'center' },
  body:        { ...type.body, color: colors.textMuted, textAlign: 'center' },
});
