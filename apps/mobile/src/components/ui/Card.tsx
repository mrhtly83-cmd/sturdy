// src/components/ui/Card.tsx
// v5 — Glass surface card on warm dark background.
//
// Re-exported as `GlassCard` (see ./GlassCard.tsx) — the names are
// interchangeable. v5 design: rgba(255,255,255,0.045) fill, subtle
// rgba(255,255,255,0.07) border, no top-edge highlight, 20px radius.

import { type ReactNode } from 'react';
import { Pressable, StyleSheet, View, type ViewStyle } from 'react-native';
import { colors } from '../../theme/colors';

type AccentColor = 'primary' | 'amber' | 'steel' | 'sage' | 'sos'
                 | 'coral' | 'blue' | 'peach' | 'none';

type Props = {
  children: ReactNode;
  style?: ViewStyle;
  onPress?: () => void;
  accent?: AccentColor;
};

const ACCENT_COLORS: Record<AccentColor, string | null> = {
  // v5 names
  primary: colors.primary,
  amber:   colors.amber,
  steel:   colors.steel,
  sage:    colors.sage,
  sos:     colors.sos,
  // v4 aliases (still used by some screens)
  coral:   colors.coral,   // == primary
  blue:    colors.blue,    // == steel
  peach:   colors.peach,   // == amber
  none:    null,
};

export function Card({ children, style, onPress, accent = 'none' }: Props) {
  const accentColor = ACCENT_COLORS[accent];

  const cardStyle = [
    st.card,
    accentColor && {
      borderLeftWidth: 3,
      borderLeftColor: accentColor,
    },
    style,
  ];

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          ...cardStyle,
          pressed && st.pressed,
        ]}
        accessibilityRole="button"
      >
        {children}
      </Pressable>
    );
  }

  return <View style={cardStyle}>{children}</View>;
}

const st = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 20,
    gap: 8,
    borderWidth: 1,
    borderColor: colors.border,
    // NOTE: do NOT add borderTopWidth or borderTopColor here — it creates a
    // visible highlight line at the top of every card on dark surfaces.
  },
  pressed: {
    backgroundColor: colors.surfaceRaised,
  },
});
