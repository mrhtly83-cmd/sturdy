// src/theme/colors.ts
// Sturdy v6 — "Journal" pastel gradient identity
// Rose #C97B63 (accent) + Sage #81B29A (secondary)
// Warm, alive, approachable

export const colors = {
  // Backgrounds
  // Main bg is a gradient: #FDDDE6 → #FDE8D0 → #F5EDD4 → #D4E8D1
  // These are fallbacks and surface colors
  base:            '#FDFAF5',
  raised:          'rgba(255,255,255,0.7)',
  elevated:        'rgba(255,255,255,0.85)',
  subtle:          'rgba(255,255,255,0.5)',

  // Legacy alias
  background:      '#FDFAF5',

  // Brand
  rose:            '#C97B63',
  roseLight:       '#D9917C',
  roseMuted:       'rgba(201,123,99,0.10)',
  sage:            '#81B29A',
  sageLight:       '#97C5AE',
  sageMuted:       'rgba(129,178,154,0.10)',

  // Legacy brand aliases (keeps existing code working during migration)
  blue:            '#81B29A',       // mapped to sage
  blueLight:       '#97C5AE',
  blueMuted:       'rgba(129,178,154,0.12)',
  coral:           '#C97B63',       // mapped to rose
  coralLight:      '#D9917C',
  coralMuted:      'rgba(201,123,99,0.10)',
  peach:           '#F79566',
  peachMuted:      'rgba(247,149,102,0.08)',
  amber:           '#C97B63',       // mapped to rose for CTA consistency
  amberMuted:      'rgba(201,123,99,0.10)',

  // Category card colors (pastel)
  catPink:         '#FDDDE6',
  catBlue:         '#D6E8F7',
  catGreen:        '#D4E8D1',
  catYellow:       '#FDE8D0',

  // Gradient stops (for LinearGradient backgrounds)
  gradStart:       '#FDDDE6',
  gradMid1:        '#FDE8D0',
  gradMid2:        '#F5EDD4',
  gradEnd:         '#D4E8D1',

  // Text — dark on light
  text:            '#2A2520',
  textBody:        'rgba(42,37,32,0.75)',
  textSub:         'rgba(42,37,32,0.50)',
  textMuted:       'rgba(42,37,32,0.30)',
  textGhost:       'rgba(42,37,32,0.12)',

  // Legacy text aliases
  textSoft:        'rgba(42,37,32,0.75)',
  textSecondary:   'rgba(42,37,32,0.50)',
  textFaint:       'rgba(42,37,32,0.18)',

  // Links
  linkAction:      '#C97B63',
  linkSecondary:   'rgba(42,37,32,0.30)',

  // Borders
  border:          'rgba(0,0,0,0.06)',
  borderLight:     'rgba(0,0,0,0.10)',
  borderFocus:     'rgba(129,178,154,0.40)',

  // Semantic
  success:         '#81B29A',
  warning:         '#F79566',
  danger:          '#C97B63',
  disabled:        'rgba(0,0,0,0.06)',
  disabledText:    'rgba(42,37,32,0.20)',
  pressed:         'rgba(0,0,0,0.04)',

  // Card surfaces (frosted glass)
  cardGlass:       'rgba(255,255,255,0.7)',
  cardGlassStrong: 'rgba(255,255,255,0.85)',
  cardGlassSoft:   'rgba(255,255,255,0.5)',
} as const;

// Font family constants
export const fonts = {
  // Manrope — UI body text
  heading:          'Manrope-ExtraBold',
  subheading:       'Manrope-Bold',
  body:             'Manrope-Regular',
  bodyMedium:       'Manrope-Medium',
  bodySemi:         'Manrope-SemiBold',
  label:            'Manrope-Bold',

  // Cormorant Garamond — headings, emotional content, scripts
  display:          'Cormorant-Bold',
  displaySemi:      'Cormorant-SemiBold',
  script:           'Cormorant-Regular',
  scriptItalic:     'Cormorant-Italic',
  accent:           'Cormorant-Italic',

  // Legacy aliases (keeps existing code working during migration)
  scriptMedium:     'Cormorant-SemiBold',
  scriptLight:      'Cormorant-Regular',
  scriptLightItalic:'Cormorant-Italic',
} as const;

