// src/theme/colors.ts
// Sturdy v5 — Logo-derived premium dark palette
//
// Logo colors: Coral #FF5C75, Peach #F79566, Terra #DC785A, Steel #5778A3, Navy #484F6B
//
// Design intent: warm dark base (NOT pure black, NOT blue-black). Glass surfaces
// over a warm charcoal gradient. Premium-app-at-night feel — not bedtime/sleep,
// not cold blue-black, not meditation.

export const colors = {
  // ═══════════════════════════════════════════════
  // SURFACES
  // ═══════════════════════════════════════════════
  background:       '#1A1614',                       // warm dark base
  backgroundDeep:   '#141110',                       // deeper variant for gradients
  surface:          'rgba(255,255,255,0.045)',       // glass card fill
  surfaceRaised:    'rgba(255,255,255,0.07)',        // elevated glass

  // ═══════════════════════════════════════════════
  // PRIMARY — Coral (from logo)
  // Main CTA color, buttons, active states
  // ═══════════════════════════════════════════════
  primary:          '#FF5C75',
  primaryPressed:   '#E8506A',
  primaryLight:     'rgba(255,92,117,0.12)',
  primaryMuted:     'rgba(255,92,117,0.06)',

  // ═══════════════════════════════════════════════
  // ACCENT — Peach/Amber
  // Secondary actions, highlights, active tabs
  // ═══════════════════════════════════════════════
  amber:            '#F79566',
  amberLight:       'rgba(247,149,102,0.12)',
  amberDark:        '#DC785A',                       // terra

  // ═══════════════════════════════════════════════
  // BRAND — Steel Blue (from logo)
  // Trust color — headers, links, informational
  // ═══════════════════════════════════════════════
  steel:            '#5778A3',
  steelLight:       'rgba(87,120,163,0.12)',

  // ═══════════════════════════════════════════════
  // SUPPORT — Sage
  // Success states, positive feedback
  // ═══════════════════════════════════════════════
  sage:             '#8AA060',
  sageLight:        'rgba(138,160,96,0.12)',

  // ═══════════════════════════════════════════════
  // SOS — Red (crisis-distinct from primary coral)
  // ═══════════════════════════════════════════════
  sos:              '#E87461',
  sosLight:         'rgba(232,116,97,0.12)',
  sosDark:          '#C85A48',

  // ═══════════════════════════════════════════════
  // NAVY (from logo)
  // ═══════════════════════════════════════════════
  navy:             '#484F6B',
  navyLight:        'rgba(72,79,107,0.15)',

  // ═══════════════════════════════════════════════
  // TEXT — high contrast on warm dark
  // ═══════════════════════════════════════════════
  text:             'rgba(255,255,255,0.92)',
  textSecondary:    'rgba(255,255,255,0.55)',
  textMuted:        'rgba(255,255,255,0.30)',
  textFaint:        'rgba(255,255,255,0.15)',
  textInverse:      '#1A1614',                       // dark text on light buttons

  // ═══════════════════════════════════════════════
  // STRUCTURE
  // ═══════════════════════════════════════════════
  border:           'rgba(255,255,255,0.07)',
  borderHi:         'rgba(255,255,255,0.12)',
  borderFocus:      '#F79566',                       // amber focus ring
  divider:          'rgba(255,255,255,0.05)',

  // ═══════════════════════════════════════════════
  // COMPONENT-LEVEL
  // ═══════════════════════════════════════════════
  tabActive:        '#F79566',                       // amber for active tab
  tabInactive:      'rgba(255,255,255,0.25)',
  chipBg:           'rgba(255,255,255,0.06)',
  chipBorder:       'rgba(255,255,255,0.10)',
  inputBg:          'rgba(255,255,255,0.04)',
  inputBorder:      'rgba(255,255,255,0.08)',
  inputFocus:       'rgba(247,149,102,0.20)',

  // ═══════════════════════════════════════════════
  // GRADIENTS (use with LinearGradient)
  // ═══════════════════════════════════════════════
  gradientTop:      '#1A1614',
  gradientBottom:   '#14100E',


  // ═══════════════════════════════════════════════
  // BACKWARDS-COMPAT ALIASES
  // Retained because the 21 unmigrated screens still reference the old
  // v3/v4 token names. Drop each alias when its consumer migrates
  // (tracked in Issue #3).
  // ═══════════════════════════════════════════════

  // Old surface names → new dark surfaces
  base:             '#1A1614',
  backgroundLight:  '#1A1614',
  raised:           'rgba(255,255,255,0.045)',
  elevated:         'rgba(255,255,255,0.07)',
  subtle:           'rgba(255,255,255,0.03)',
  glass:            'rgba(255,255,255,0.045)',
  glassStrong:      'rgba(255,255,255,0.07)',
  glassSoft:        'rgba(255,255,255,0.03)',
  cardGlass:        'rgba(255,255,255,0.045)',
  cardGlassStrong:  'rgba(255,255,255,0.07)',
  cardGlassSoft:    'rgba(255,255,255,0.03)',

  // Old brand names → new logo-derived
  coral:            '#FF5C75',                       // → primary
  coralLight:       '#E8506A',
  coralMuted:       'rgba(255,92,117,0.12)',
  rose:             '#FF5C75',                       // → primary
  roseLight:        '#E8506A',
  roseMuted:        'rgba(255,92,117,0.12)',
  peach:            '#F79566',                       // → amber
  peachMuted:       'rgba(247,149,102,0.12)',
  blue:             '#5778A3',                       // → steel
  blueLight:        '#A0C4DA',
  blueMuted:        'rgba(87,120,163,0.12)',
  amberMuted:       'rgba(247,149,102,0.12)',
  sageMuted:        'rgba(138,160,96,0.12)',

  // Old text token aliases
  textBody:         'rgba(255,255,255,0.78)',
  textSub:          'rgba(255,255,255,0.55)',
  textGhost:        'rgba(255,255,255,0.16)',
  textSoft:         'rgba(255,255,255,0.78)',

  // Old border alias
  borderLight:      'rgba(255,255,255,0.12)',

  // Old semantic
  success:          '#8AA060',
  warning:          '#F79566',
  danger:           '#E87461',
  disabled:         'rgba(255,255,255,0.06)',
  disabledText:     'rgba(255,255,255,0.20)',
  pressed:          'rgba(255,255,255,0.04)',

  // Old gradient stops — kept warm-dark, used by some screens
  gradStart:        '#1A1614',
  gradMid1:         '#161210',
  gradMid2:         '#14110F',
  gradEnd:          '#14100E',

  // Old category card backgrounds (now warm-dark tints)
  catPink:          'rgba(255,92,117,0.10)',
  catBlue:          'rgba(87,120,163,0.10)',
  catGreen:         'rgba(138,160,96,0.10)',
  catYellow:        'rgba(247,149,102,0.10)',

  linkAction:       '#F79566',
  linkSecondary:    'rgba(255,255,255,0.30)',
} as const;


// ═══════════════════════════════════════════════
// FONTS — Fraunces (serif) + DM Sans (sans)
// ═══════════════════════════════════════════════
//
// Loaded in app/_layout.tsx via @expo-google-fonts/fraunces and
// @expo-google-fonts/dm-sans. Components use the string family name
// directly: <Text style={{ fontFamily: fonts.body }}>.
//
// The journal-Manrope identity is retired; v5 commits to Fraunces for
// emotional/headline text and DM Sans for everything else (per the
// LOCKED design system).

export const fonts = {
  // ─── Canonical (paired with logical role) ───
  heading:        'Fraunces_700Bold',                // hero, screen titles
  headingItalic:  'Fraunces_700Bold_Italic',         // situation summaries, philosophy lines
  subheading:     'DMSans_600SemiBold',
  body:           'DMSans_400Regular',
  bodyMedium:     'DMSans_500Medium',
  bodySemi:       'DMSans_600SemiBold',
  script:         'Fraunces_600SemiBold',            // AI script text the parent reads aloud
  scriptItalic:   'Fraunces_600SemiBold_Italic',
  label:          'DMSans_700Bold',
  caption:        'DMSans_400Regular',
  accent:         'DMSans_500Medium',

  // ─── Backwards-compat aliases (retained until consumers migrate) ───
  display:           'Fraunces_700Bold',
  displaySemi:       'Fraunces_600SemiBold',
  scriptMedium:      'Fraunces_600SemiBold',
  scriptLight:       'Fraunces_600SemiBold',
  scriptLightItalic: 'Fraunces_600SemiBold_Italic',
  regular:           'DMSans_400Regular',
  medium:            'DMSans_500Medium',
  semi:              'DMSans_600SemiBold',
  bold:              'DMSans_700Bold',
  extraBold:         'Fraunces_700Bold',
} as const;


// ═══════════════════════════════════════════════
// LEGACY API SHIMS — NO-OP
// Older theme (v7 Sunset Proxy) had a setPaletteOverride / setForcedHour
// API. Nothing outside theme/colors.ts ever called it. Shims kept so
// stale imports don't crash.
// ═══════════════════════════════════════════════

export type PaletteMode = 'auto' | 'light' | 'dark';
export type PaletteName = 'sunrise' | 'daylight' | 'golden_hour' | 'dusk';

export function setPaletteOverride(_mode: PaletteMode): void { /* no-op */ }
export function getPaletteOverride(): PaletteMode { return 'dark'; }
export function setForcedHour(_hour: number | null): void { /* no-op */ }
export function getActivePaletteName(): PaletteName { return 'dusk'; }
