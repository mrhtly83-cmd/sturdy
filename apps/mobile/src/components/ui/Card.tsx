// src/components/ui/Card.tsx
// v5 — Clean raised surface card
// Replaces GlassCard — no gradient, no glow


import { type ReactNode } from 'react';
import { Pressable, StyleSheet, View, type ViewStyle } from 'react-native';
import { colors } from '../../theme/colors';


type AccentColor = 'coral' | 'blue' | 'sage' | 'peach' | 'amber' | 'none';


type Props = {
  children: ReactNode;
  style?: ViewStyle;
  onPress?: () => void;
  accent?: AccentColor;
};


const ACCENT_COLORS: Record<AccentColor, string | null> = {
  coral: colors.coral,
  blue:  colors.blue,
  sage:  colors.sage,
  peach: colors.peach,
  amber: colors.amber,
  none:  null,
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
    backgroundColor: colors.raised,
    borderRadius: 20,
    padding: 20,
    gap: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  pressed: {
    backgroundColor: colors.subtle,
  },
});
