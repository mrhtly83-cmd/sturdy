import { ReactNode } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  ViewStyle,
} from 'react-native';
import { colors, radius, spacing } from '../../theme';

type Variant = 'primary' | 'ghost' | 'amber' | 'danger';
type Size    = 'lg' | 'md' | 'sm';

type ButtonProps = {
  label:     string;
  onPress:   () => void;
  variant?:  Variant;
  size?:     Size;
  disabled?: boolean;
  loading?:  boolean;
  icon?:     ReactNode;
  style?:    ViewStyle;
  dark?:     boolean;
};

export function Button({
  label,
  onPress,
  variant  = 'primary',
  size     = 'lg',
  disabled = false,
  loading  = false,
  icon,
  style,
  dark     = false,
}: ButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <Pressable
      accessibilityRole="button"
      disabled={isDisabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        styles[`size_${size}`],
        styles[`variant_${variant}`],
        dark && variant === 'ghost' ? styles.ghost_dark : null,
        pressed && !isDisabled ? styles[`variant_${variant}_pressed`] : null,
        isDisabled ? styles.disabled : null,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === 'ghost' ? colors.text : colors.textInverse}
          size="small"
        />
      ) : (
        <>
          {icon ?? null}
          <Text style={[styles.label, styles[`label_${variant}`]]}>{label}</Text>
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius:      radius.medium,
    alignItems:        'center',
    justifyContent:    'center',
    flexDirection:     'row',
    gap:               spacing.xs,
    paddingHorizontal: spacing.lg,
  },

  size_lg: { minHeight: 52, paddingVertical: spacing.sm },
  size_md: { minHeight: 44, paddingVertical: spacing.xs,  paddingHorizontal: spacing.md },
  size_sm: { minHeight: 36, paddingVertical: spacing.xxs, paddingHorizontal: spacing.sm },

  variant_primary:         { backgroundColor: colors.primary },
  variant_primary_pressed: { backgroundColor: colors.primaryPressed },
  variant_ghost:           { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: colors.border },
  variant_ghost_pressed:   { backgroundColor: colors.chipBg },
  ghost_dark:              { borderColor: 'rgba(255,255,255,0.15)' },
  variant_amber:           { backgroundColor: colors.amber },
  variant_amber_pressed:   { backgroundColor: colors.amberDark },
  variant_danger:          { backgroundColor: colors.danger },
  variant_danger_pressed:  { backgroundColor: colors.dangerDark },

  disabled: { opacity: 0.45 },

  label: {
    fontSize:   16,
    fontWeight: '700',
    lineHeight: 22,
    textAlign:  'center',
    flexShrink: 1,
  },
  label_primary: { color: colors.textInverse },
  label_ghost:   { color: colors.text },
  label_amber:   { color: colors.textInverse },
  label_danger:  { color: colors.textInverse },
});
