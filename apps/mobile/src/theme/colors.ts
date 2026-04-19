// src/theme/colors.ts
// Sturdy v5 — Premium dark UI inspired by logo palette
// Blue #5778A3 (parent) + Coral #E87461 (child)
// Clean, precise, no atmospheric effects


export const colors = {
  // Backgrounds — neutral charcoal (no purple tint)
  base:            '#09090B',
  raised:          '#111114',
  elevated:        '#18181B',
  subtle:          '#1E1E22',


  // Legacy alias — keeps existing imports working
  background:      '#09090B',


  // Brand — from logo
  blue:            '#5778A3',
  blueLight:       '#6B8DB8',
  blueMuted:       'rgba(87,120,163,0.12)',
  coral:           '#E87461',
  coralLight:      '#F09080',
  coralMuted:      'rgba(232,116,97,0.10)',
  peach:           '#F79566',
  peachMuted:      'rgba(247,149,102,0.08)',


  // Functional
  sage:            '#8AA060',
  sageMuted:       'rgba(138,160,96,0.10)',
  amber:           '#D4944A',
  amberMuted:      'rgba(212,148,74,0.10)',


  // Text — high contrast hierarchy
  text:            '#FAFAFA',
  textBody:        'rgba(255,255,255,0.72)',
  textSub:         'rgba(255,255,255,0.48)',
  textMuted:       'rgba(255,255,255,0.28)',
  textGhost:       'rgba(255,255,255,0.12)',


  // Legacy aliases
  textSoft:        'rgba(255,255,255,0.72)',
  textSecondary:   'rgba(255,255,255,0.48)',
  textFaint:       'rgba(255,255,255,0.18)',


  // Links
  linkAction:      '#E87461',
  linkSecondary:   'rgba(255,255,255,0.28)',


  // Borders — barely there
  border:          'rgba(255,255,255,0.06)',
  borderLight:     'rgba(255,255,255,0.10)',
  borderFocus:     'rgba(87,120,163,0.40)',


  // Semantic
  success:         '#8AA060',
  warning:         '#F79566',
  danger:          '#E87461',
  disabled:        'rgba(255,255,255,0.08)',
  disabledText:    'rgba(255,255,255,0.20)',
  pressed:         'rgba(255,255,255,0.04)',
} as const;


// Font family constants
export const fonts = {
  // Plus Jakarta Sans — UI
  heading:          'Jakarta-ExtraBold',
  subheading:       'Jakarta-Bold',
  body:             'Jakarta-Regular',
  bodyMedium:       'Jakarta-Medium',
  bodySemi:         'Jakarta-SemiBold',
  label:            'Jakarta-Bold',


  // Crimson Pro — scripts, emotional content
  script:           'Crimson-Regular',
  scriptMedium:     'Crimson-Medium',
  scriptLight:      'Crimson-Light',
  scriptItalic:     'Crimson-Italic',
  scriptLightItalic:'Crimson-LightItalic',
  accent:           'Crimson-MediumItalic',
} as const;
