import { StyleSheet, Text, TextInput, View, ViewStyle } from 'react-native';
import { colors, radius, spacing, type } from '../../theme';

type InputProps = {
  label?:          string;
  placeholder?:    string;
  value:           string;
  onChangeText:    (text: string) => void;
  multiline?:      boolean;
  hint?:           string;
  style?:          ViewStyle;
  autoFocus?:      boolean;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  autoComplete?:   string;
  keyboardType?:   'default' | 'email-address' | 'numeric';
  secureTextEntry?: boolean;
  variant?:        'card' | 'underline';
  dark?:           boolean;
};

export function Input({
  label,
  placeholder,
  value,
  onChangeText,
  multiline    = false,
  hint,
  style,
  autoFocus,
  autoCapitalize,
  autoComplete,
  keyboardType = 'default',
  secureTextEntry,
  variant      = 'card',
  dark         = false,
}: InputProps) {
  const isUnderline = variant === 'underline';

  return (
    <View style={[styles.wrapper, style]}>
      {label ? (
        <Text style={[styles.label, dark ? styles.labelDark : null]}>
          {label}
        </Text>
      ) : null}

      <TextInput
        autoFocus={autoFocus}
        autoCapitalize={autoCapitalize}
        autoComplete={autoComplete as any}
        autoCorrect={false}
        keyboardType={keyboardType}
        multiline={multiline}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={dark ? 'rgba(255,255,255,0.25)' : colors.textMuted}
        secureTextEntry={secureTextEntry}
        style={[
          styles.base,
          isUnderline ? styles.underline : styles.card,
          multiline   ? styles.multiline : null,
          dark        ? styles.dark      : null,
        ]}
        value={value}
      />

      {hint ? (
        <Text style={[styles.hint, dark ? styles.hintDark : null]}>{hint}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: spacing.xs },

  label: {
    ...type.label,
    color:         colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  labelDark: { color: 'rgba(255,255,255,0.4)' },

  base: {
    fontSize:   16,
    color:      colors.text,
    lineHeight: 24,
  },

  card: {
    backgroundColor:   colors.surfaceRaised,
    borderWidth:       1.5,
    borderColor:       colors.border,
    borderRadius:      radius.medium,
    paddingHorizontal: spacing.md,
    paddingVertical:   spacing.sm,
    minHeight:         52,
  },

  underline: {
    fontSize:           28,
    fontWeight:         '400',
    borderBottomWidth:  2,
    borderBottomColor:  colors.border,
    paddingBottom:      spacing.xs,
    paddingHorizontal:  0,
    minHeight:          48,
  },

  multiline: {
    minHeight:         110,
    textAlignVertical: 'top',
    paddingTop:        spacing.sm,
  },

  dark: {
    color:           colors.textInverse,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderColor:     'rgba(255,255,255,0.1)',
  },

  hint:     { ...type.caption, color: colors.textMuted },
  hintDark: { color: 'rgba(255,255,255,0.25)' },
});
