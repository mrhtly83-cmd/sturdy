// src/components/ui/Screen.tsx
// v5 — Clean dark base, no gradient, no stars


import { PropsWithChildren, ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';
import { colors } from '../../theme/colors';


type ScreenProps = PropsWithChildren<{
  footer?: ReactNode;
  scrollable?: boolean;
  edges?: Edge[];
}>;


export function Screen({
  children,
  footer,
  scrollable = true,
  edges = ['top', 'bottom'],
}: ScreenProps) {
  const content = scrollable ? (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.scrollContent}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      {children}
    </ScrollView>
  ) : (
    <View style={styles.fixed}>{children}</View>
  );


  return (
    <View style={styles.root}>
      <SafeAreaView edges={edges} style={styles.safe}>
        <StatusBar style="light" />
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.keyboard}
        >
          {content}
          {footer ? <View style={styles.footer}>{footer}</View> : null}
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}


const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.base,
  },
  safe: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  keyboard: { flex: 1 },
  scroll: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 40,
    gap: 16,
  },
  fixed: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 16,
    backgroundColor: colors.base,
  },
});
