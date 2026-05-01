// src/theme/colors.ts
// Sturdy v6 — Deep Warm (locked April 30 2026)
//
// Visual identity: near-black base (#111111), C-2 fast-fade gradient
// (#d8d5d0 → dark), warmth from atmospheric amber glow — lighting,
// not surface color. Cards are dark semi-transparent glass with
// colored accents (left borders, badges). Calibrated against Open:
// Breathwork + Meditation as primary visual reference.
//
// Logo colors retained: Coral #FF5C75, Peach #F79566, Steel #5778A3
// Amber shifted: #F79566 → #C8883A (deeper, warmer, less peachy)
//
// Card system: dark card bg (rgba(26,24,22,0.78)) used consistently
// across outcome cards, script cards, section cards, and settings.
// Script R/C/G differentiated by left-border accent + badge pill,
// not by tinted card fill.

export const colors = {
  // ═══════════════════════════════════════════════
  // SURFACES
  // ═══════════════════════════════════════════════
  background:       '#111111',                       // near-black neutral base
  backgroundDeep:   '#0C0C0C',                       // deepest gradient stop
  backgroundWarm:   '#d8d5d0',                       // warm parchment (gradient top)
  surface:          'rgba(26,24,22,0.78)',            // card bg — dark glass
  surfaceRaised:    'rgba(26,24,22,0.85)',            // elevated card
  surfaceSubtle:    'rgba(255,255,255,0.03)',          // barely-there separator

  // ═══════════════════════════════════════════════
  // PRIMARY — Coral (from logo)
  // Main CTA color, buttons, active states
  // ═══════════════════════════════════════════════
  primary:          '#FF5C75',
  primaryPressed:   '#E8506A',
  primaryLight:     'rgba(255,92,117,0.12)',
  primaryMuted:     'rgba(255,92,117,0.06)',

  // ═══════════════════════════════════════════════
  // ACCENT — Amber (Deep Warm hero color)
  // CTA gradient, tab active, shimmer text, greeting sub
  // ═══════════════════════════════════════════════
  amber:            '#C8883A',                       // deep amber (was #F79566)
  amberLight:       '#F4C06A',                       // shimmer gradient end
  amberMid:         '#E8A855',                       // CTA gradient end
  amberGlow:        'rgba(200,136,58,0.35)',          // atmospheric glow
  amberBadge:       'rgba(200,136,58,0.22)',          // badge pill bg
  amberBorder:      'rgba(200,136,58,0.45)',          // script card left accent

  // ═══════════════════════════════════════════════
  // BRAND — Steel Blue (from logo)
  // Guide step, informational, understanding mode
  // ═══════════════════════════════════════════════
  steel:            '#5778A3',
  steelDark:        '#3E5D80',
  steelLight:       'rgba(87,120,163,0.12)',
  steelBadge:       'rgba(87,120,163,0.22)',          // badge pill bg
  steelBadgeText:   '#90B8E0',                       // badge text
  steelBorder:      'rgba(87,120,163,0.45)',          // script card left accent

  // ═══════════════════════════════════════════════
  // SUPPORT — Sage
  // Connect step, success states, positive feedback
  // ═══════════════════════════════════════════════
  sage:             '#8AA060',
  sageDark:         '#6B8048',
  sageLight:        'rgba(138,160,96,0.12)',
  sageBadge:        'rgba(138,160,96,0.22)',          // badge pill bg
  sageBadgeText:    '#B8D480',                       // badge text
  sageBorder:       'rgba(138,160,96,0.45)',          // script card left accent

  // ═══════════════════════════════════════════════
  // SOS — Red (crisis-distinct from primary coral)
  // ═══════════════════════════════════════════════
  sos:              '#E87461',
  sosLight:         'rgba(232,116,97,0.12)',
  sosDark:          '#C45540',
  sosBadge:         'rgba(232,116,97,0.12)',          // session mode pill bg
  sosSubtle:        'rgba(232,116,97,0.75)',          // greeting subtitle color

  // ═══════════════════════════════════════════════
  // NAVY (from logo)
  // ═══════════════════════════════════════════════
  navy:             '#484F6B',
  navyLight:        'rgba(72,79,107,0.15)',

  // ═══════════════════════════════════════════════
  // TEXT — light (on dark surfaces)
  // ═══════════════════════════════════════════════
  text:             'rgba(255,255,255,0.94)',
  textSecondary:    'rgba(255,255,255,0.55)',
  textMuted:        'rgba(255,255,255,0.30)',
  textFaint:        'rgba(255,255,255,0.15)',
  textInverse:      '#111111',                       // dark text on amber CTA

  // ═══════════════════════════════════════════════
  // TEXT — dark (on warm gradient surfaces)
  // Used in greeting zone where bg is #d8d5d0
  // ═══════════════════════════════════════════════
  textDark:         '#2a2520',
  textDarkSecondary: 'rgba(42,37,32,0.50)',
  textDarkMuted:    'rgba(42,37,32,0.32)',

  // ═══════════════════════════════════════════════
  // STRUCTURE
  // ═══════════════════════════════════════════════
  border:           'rgba(255,255,255,0.09)',          // card border
  borderHi:         'rgba(255,255,255,0.14)',          // card top highlight
  borderFocus:      '#C8883A',                       // amber focus ring
  divider:          'rgba(255,255,255,0.05)',
  avoidBorder:      'rgba(232,116,97,0.25)',          // avoid card left stripe
  avoidLabel:       'rgba(232,116,97,0.55)',          // avoid section label
  avoidStrike:      'rgba(232,116,97,0.18)',          // strikethrough color

  // ═══════════════════════════════════════════════
  // COMPONENT-LEVEL
  // ═══════════════════════════════════════════════
  tabActive:        '#C8883A',                       // amber for active tab
  tabInactive:      'rgba(255,255,255,0.30)',
  chipBg:           'rgba(255,255,255,0.05)',
  chipBorder:       'rgba(255,255,255,0.09)',
  inputBg:          'rgba(26,24,22,0.55)',            // input on warm gradient
  inputBorder:      'rgba(42,37,32,0.20)',
  inputHighlight:   'rgba(255,255,255,0.08)',          // input top border
  inputPlaceholder: 'rgba(255,255,255,0.50)',          // placeholder text

  // ═══════════════════════════════════════════════
  // GRADIENTS (use with LinearGradient)
  // C-2 fast-fade: warm top → dark bottom
  // ═══════════════════════════════════════════════
  gradientTop:      '#d8d5d0',                       // warm parchment
  gradientMid1:     '#9e9a94',                       // ~14%
  gradientMid2:     '#4a4540',                       // ~28%
  gradientMid3:     '#1e1c1a',                       // ~42%
  gradientMid4:     '#131210',                       // ~58%
  gradientBottom:   '#0C0C0C',                       // near-black

  // Result screen gradient (starts darker — no greeting zone)
  gradientResultTop:    '#b5b1ac',
  gradientResultMid1:   '#6a6560',                   // ~10%
  gradientResultMid2:   '#2e2a27',                   // ~25%
  gradientResultMid3:   '#171513',                   // ~42%

  // Settings gradient
  gradientSettingsTop:  '#c8c5c0',
  gradientSettingsMid1: '#807b76',                   // ~12%
  gradientSettingsMid2: '#353230',                   // ~26%

  // Ambient glow (radial gradient overlays)
  glowAmber:        'rgba(200,136,58,0.09)',          // top of home screen
  glowAmberResult:  'rgba(200,136,58,0.07)',          // top of result screen

  // ═══════════════════════════════════════════════
  // ICON BADGE GRADIENTS (outcome card icons)
  // Each pair: [start, end] for LinearGradient
  // ═══════════════════════════════════════════════
  iconSosStart:         '#E87461',
  iconSosEnd:           '#C45540',
  iconRepairStart:      '#C8883A',
  iconRepairEnd:        '#B87A30',
  iconUnderstandStart:  '#5778A3',
  iconUnderstandEnd:    '#3E5D80',
  iconTalkStart:        '#8AA060',
  iconTalkEnd:          '#6B8048',

  // ═══════════════════════════════════════════════
  // SHADOWS (card system)
  // React Native shadow props, not CSS box-shadow
  // ═══════════════════════════════════════════════
  shadowCard:       'rgba(0,0,0,0.40)',               // card ambient shadow
  shadowAmber:      'rgba(200,136,58,0.08)',           // amber card color bleed
  shadowSage:       'rgba(138,160,96,0.08)',           // sage card color bleed
  shadowSteel:      'rgba(87,120,163,0.08)',           // steel card color bleed
  shadowSos:        'rgba(232,116,97,0.25)',           // SOS icon glow


  // ═══════════════════════════════════════════════
  // BACKWARDS-COMPAT ALIASES
  // Retained because unmigrated screens still reference the old
  // v3/v4/v5 token names. Drop each alias when its consumer migrates.
  // ═══════════════════════════════════════════════

  // Old surface names → new dark surfaces
  base:             '#111111',
  backgroundLight:  '#111111',
  raised:           'rgba(26,24,22,0.78)',
  elevated:         'rgba(26,24,22,0.85)',
  subtle:           'rgba(255,255,255,0.03)',
  glass:            'rgba(26,24,22,0.78)',
  glassStrong:      'rgba(26,24,22,0.85)',
  glassSoft:        'rgba(255,255,255,0.03)',
  cardGlass:        'rgba(26,24,22,0.78)',
  cardGlassStrong:  'rgba(26,24,22,0.85)',
  cardGlassSoft:    'rgba(255,255,255,0.03)',

  // Old brand names → new Deep Warm
  coral:            '#FF5C75',                       // → primary
  coralLight:       '#E8506A',
  coralMuted:       'rgba(255,92,117,0.12)',
  rose:             '#FF5C75',                       // → primary
  roseLight:        '#E8506A',
  roseMuted:        'rgba(255,92,117,0.12)',
  peach:            '#C8883A',                       // → amber (shifted)
  peachMuted:       'rgba(200,136,58,0.12)',
  blue:             '#5778A3',                       // → steel
  blueLight:        '#90B8E0',
  blueMuted:        'rgba(87,120,163,0.12)',
  amberDark:        '#B87A30',                       // terra replacement
  amberMuted:       'rgba(200,136,58,0.12)',
  sageMuted:        'rgba(138,160,96,0.12)',
  amberLight_alias: 'rgba(200,136,58,0.12)',          // old amberLight was rgba

  // Old text token aliases
  textBody:         'rgba(255,255,255,0.78)',
  textSub:          'rgba(255,255,255,0.55)',
  textGhost:        'rgba(255,255,255,0.15)',
  textSoft:         'rgba(255,255,255,0.78)',

  // Old border alias
  borderLight:      'rgba(255,255,255,0.14)',

  // Old semantic
  success:          '#8AA060',
  warning:          '#C8883A',                       // was #F79566
  danger:           '#E87461',
  disabled:         'rgba(255,255,255,0.06)',
  disabledText:     'rgba(255,255,255,0.20)',
  pressed:          'rgba(255,255,255,0.04)',

  // Old gradient stops → C-2 fast fade
  gradStart:        '#d8d5d0',
  gradMid1:         '#9e9a94',
  gradMid2:         '#4a4540',
  gradEnd:          '#0C0C0C',

  // Old category card backgrounds (now dark card system)
  catPink:          'rgba(255,92,117,0.10)',
  catBlue:          'rgba(87,120,163,0.10)',
  catGreen:         'rgba(138,160,96,0.10)',
  catYellow:        'rgba(200,136,58,0.10)',

  linkAction:       '#C8883A',
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
// Deep Warm commits to Fraunces for emotional/headline/script text
// and DM Sans for everything else.

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
