// src/components/ui/PaywallSheet.tsx
//
// Reusable bottom-sheet modal shown when a free user taps a Sturdy+
// feature (locked tone chip, locked voice playback, etc.).
//
// Calls the mock useSubscription().purchase() — when real RevenueCat is
// wired, that hook's body is the only thing that needs to change. The
// purchase button text + behaviour can stay identical.

import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors as C, fonts as F } from '../../theme';
import { useSubscription } from '../../hooks/useSubscription';

type Props = {
  visible:  boolean;
  onClose:  () => void;
  feature:  string;          // e.g. "Soft tone", "Voice playback"
  body?:    string;          // optional supplementary explanation
};

export function PaywallSheet({ visible, onClose, feature, body }: Props) {
  const { purchase } = useSubscription();

  const handlePurchase = async () => {
    await purchase();
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={onClose}
    >
      <Pressable style={s.backdrop} onPress={onClose}>
        <Pressable style={s.sheet} onPress={() => { /* stop bubble */ }}>
          <Text style={s.lock}>🔒</Text>
          <Text style={s.title}>{feature} is part of Sturdy+</Text>
          {body ? <Text style={s.body}>{body}</Text> : null}
          <Text style={s.body}>
            Sturdy+ unlocks tone, voice playback, weekly insights, and the full
            child profile. Try it free, cancel any time.
          </Text>
          <Pressable
            onPress={handlePurchase}
            style={({ pressed }) => [s.cta, pressed && { opacity: 0.9 }]}
            accessibilityRole="button"
          >
            <Text style={s.ctaText}>Start Sturdy+</Text>
          </Pressable>
          <Pressable onPress={onClose} style={s.cancel}>
            <Text style={s.cancelText}>Not right now</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const s = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15,10,18,0.65)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: 'rgba(28,22,30,0.98)',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 36,
    gap: 12,
  },
  lock:  { fontSize: 28, marginBottom: 4 },
  title: {
    fontFamily: F.heading, fontSize: 22, color: C.text,
    letterSpacing: -0.3,
  },
  body:  {
    fontFamily: F.body, fontSize: 14, color: C.textSub, lineHeight: 21,
  },
  cta: {
    backgroundColor: C.amber,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  ctaText: {
    fontFamily: F.bodySemi, fontSize: 17, color: C.textInverse, letterSpacing: 0.3,
  },
  cancel:     { paddingVertical: 12, alignItems: 'center' },
  cancelText: { fontFamily: F.bodyMedium, fontSize: 15, color: C.textMuted },
});
