// src/theme/colors.ts
// Sturdy v9 — Deep Ember (palette deepened Jun 6 2026, warmer + more human)
//
// Visual identity: richer warm-brown base (#231508 → #1c1208 → #080604),
// yellow-gold accent (#c9a85c → #a8843a → #8a6820), horizon glow rising
// from the bottom. Cards are warm-linen thin (rgba(255,220,170,0.06))
// with gold-amber borders. Dust motes animated in the warm-ember background.
//
// v8 palette shift (Twilight → Warm Ember): the gradient TOP/upper-mid stops
// warmed from pure black #020202 toward warm brown #1a1206 to lift the app's
// "gloomy" feel, while the BOTTOM stop stays a warm near-black #050402 so
// content-rich screens stay calm. Gold accent unchanged — background only.
//
// Gold shifted: #C8883A (orange-amber) → #c9a85c (yellow-gold, more celestial)
// Card glass shifted: rgba(26,24,22,0.78) → rgba(255,255,255,0.04) (lighter veil)
// Text shifted: pure white → warm gold-tinted (#ffe8c0 family)
//
// Logo coral (#FF5C75) and steel (#5778A3) unchanged — reserved for SOS + trust.

export const colors = {
  // ═══════════════════════════════════════════════
  // SURFACES
  // ═══════════════════════════════════════════════
  background:       '#261408',                       // warm ember base (flat backgrounds)
  backgroundDeep:   '#0C0804',                       // deepest gradient stop (warm near-black nadir)
  backgroundWarm:   '#3A2210',                       // warm brown (gradient top)
  surface:          'rgba(255,220,170,0.08)',         // card bg — warm linen veil
  surfaceRaised:    'rgba(255,220,170,0.065)',        // elevated card (SOS card weight)
  surfaceSubtle:    'rgba(255,220,170,0.05)',         // barely-there separator

  // ═══════════════════════════════════════════════
  // PRIMARY — Coral (from logo)
  // Main CTA color, buttons, active states
  // ═══════════════════════════════════════════════
  primary:          '#FF5C75',
  primaryPressed:   '#E8506A',
  primaryLight:     'rgba(255,92,117,0.12)',
  primaryMuted:     'rgba(255,92,117,0.06)',

  // ═══════════════════════════════════════════════
  // ACCENT — Gold (Twilight × Obsidian Gold hero color)
  // CTA gradient, tab active, shimmer text, greeting sub
  // ═══════════════════════════════════════════════
  amber:            '#c9a85c',                       // celestial yellow-gold (was #C8883A)
  amberLight:       '#e8d4a0',                       // shimmer gradient end
  amberMid:         '#a8843a',                       // CTA gradient mid
  amberGlow:        'rgba(201,168,92,0.35)',          // atmospheric glow
  amberBadge:       'rgba(184,142,74,0.08)',          // badge pill bg
  amberBorder:      'rgba(184,142,74,0.65)',          // script card left accent / SOS badge border

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
  sos:              '#D4705A',
  sosLight:         'rgba(200,100,80,0.12)',
  sosDark:          '#B5604C',
  sosBadge:         'rgba(200,100,80,0.12)',          // session mode pill bg
  sosSubtle:        'rgba(212,112,90,0.65)',          // greeting subtitle color

  // ═══════════════════════════════════════════════
  // NAVY (from logo)
  // ═══════════════════════════════════════════════
  navy:             '#484F6B',
  navyLight:        'rgba(72,79,107,0.15)',

  // ═══════════════════════════════════════════════
  // TEXT — light (on dark surfaces)
  // ═══════════════════════════════════════════════
  text:             'rgba(240,225,185,0.95)',         // warm gold-tinted white (header-title)
  textSecondary:    'rgba(220,195,145,0.70)',         // secondary warm (av-name family)
  textMuted:        'rgba(200,175,120,0.55)',         // muted warm (status bar)
  textFaint:        'rgba(200,180,130,0.28)',         // very faint (free-note)
  textInverse:      '#1a1200',                       // near-black on gold CTA button

  // ═══════════════════════════════════════════════
  // TEXT — warm gold (on deep night-sky surfaces)
  // Replaces old dark-text-on-warm-gradient zone
  // ═══════════════════════════════════════════════
  textDark:         'rgba(235,220,185,0.88)',         // prominent warm (sos-question)
  textDarkSecondary: 'rgba(200,162,74,0.60)',         // gold-tinted secondary
  textDarkMuted:    'rgba(184,142,74,0.45)',          // faint gold (header-subtitle range)

  // ═══════════════════════════════════════════════
  // STRUCTURE
  // ═══════════════════════════════════════════════
  border:           'rgba(200,168,100,0.24)',           // gold-tinted card border
  borderHi:         'rgba(220,185,110,0.10)',          // card top inset highlight
  borderFocus:      '#c9a85c',                        // gold focus ring
  divider:          'rgba(200,168,100,0.32)',           // gold-fade divider line
  avoidBorder:      'rgba(200,100,80,0.25)',           // avoid card left stripe
  avoidLabel:       'rgba(200,100,80,0.55)',           // avoid section label
  avoidStrike:      'rgba(200,100,80,0.18)',           // strikethrough color

  // ═══════════════════════════════════════════════
  // COMPONENT-LEVEL
  // ═══════════════════════════════════════════════
  tabActive:        '#c9a85c',                        // celestial gold active tab
  tabInactive:      'rgba(184,142,74,0.30)',           // gold-tinted inactive tab
  chipBg:           'rgba(184,142,74,0.07)',           // gold-tinted chip bg
  chipBorder:       'rgba(184,142,74,0.10)',           // gold-tinted chip border
  inputBg:          'rgba(255,220,170,0.06)',          // warm linen input (matches card)
  inputBorder:      'rgba(200,168,100,0.24)',           // gold-tinted input border
  inputHighlight:   'rgba(220,185,110,0.10)',          // input top inset highlight
  inputPlaceholder: 'rgba(230,210,165,0.45)',          // warm italic placeholder

  // ═══════════════════════════════════════════════
  // GRADIENTS (use with LinearGradient)
  // Warm Ember: warm brown top → warm near-black bottom (horizon glow from bottom)
  // ═══════════════════════════════════════════════
  gradientTop:      '#3A2210',                        // warm brown (zenith)
  gradientMid1:     '#301C0C',                        // ~16%
  gradientMid2:     '#261508',                        // ~40%
  gradientMid3:     '#1C1006',                        // ~58%
  gradientMid4:     '#140C05',                        // ~70%
  gradientBottom:   '#0C0804',                        // warm near-black (nadir, kept calm)

  // Result screen gradient (same Warm Ember palette)
  gradientResultTop:    '#3A2210',
  gradientResultMid1:   '#301C0C',                    // ~10%
  gradientResultMid2:   '#261508',                    // ~25%
  gradientResultMid3:   '#1C1006',                    // ~42%

  // Settings gradient (same Warm Ember palette)
  gradientSettingsTop:  '#3A2210',
  gradientSettingsMid1: '#301C0C',                    // ~12%
  gradientSettingsMid2: '#261508',                    // ~26%

  // Ambient glow (radial gradient overlays — horizon warmth from bottom)
  glowAmber:        'rgba(184,142,74,0.07)',           // horizon glow (bottom bleed)
  glowAmberResult:  'rgba(184,142,74,0.05)',           // subtler on result screen

  // ═══════════════════════════════════════════════
  // ICON BADGE GRADIENTS (outcome card icons)
  // Each pair: [start, end] for LinearGradient
  // ═══════════════════════════════════════════════
  iconSosStart:         '#D4705A',
  iconSosEnd:           '#B5604C',
  iconRepairStart:      '#c9a85c',                    // gold (was orange #C8883A)
  iconRepairEnd:        '#a8843a',                    // gold mid (was #B87A30)
  iconUnderstandStart:  '#5778A3',
  iconUnderstandEnd:    '#3E5D80',
  iconTalkStart:        '#8AA060',
  iconTalkEnd:          '#6B8048',

  // ═══════════════════════════════════════════════
  // SHADOWS (card system)
  // React Native shadow props, not CSS box-shadow
  // ═══════════════════════════════════════════════
  shadowCard:       'rgba(0,0,0,0.45)',               // card ambient shadow (deeper night)
  shadowAmber:      'rgba(201,168,92,0.08)',           // gold card color bleed
  shadowSage:       'rgba(138,160,96,0.08)',           // sage card color bleed
  shadowSteel:      'rgba(87,120,163,0.08)',           // steel card color bleed
  shadowSos:        'rgba(200,100,80,0.22)',           // SOS icon glow


  // ═══════════════════════════════════════════════
  // BACKWARDS-COMPAT ALIASES
  // Retained because unmigrated screens still reference the old
  // v3/v4/v5 token names. Drop each alias when its consumer migrates.
  // ═══════════════════════════════════════════════

  // Old surface names → new warm-ember surfaces
  base:             '#261408',
  backgroundLight:  '#261408',
  raised:           'rgba(255,220,170,0.08)',
  elevated:         'rgba(255,220,170,0.065)',
  subtle:           'rgba(255,220,170,0.05)',
  glass:            'rgba(255,220,170,0.08)',
  glassStrong:      'rgba(255,220,170,0.065)',
  glassSoft:        'rgba(255,220,170,0.05)',
  cardGlass:        'rgba(255,220,170,0.08)',
  cardGlassStrong:  'rgba(255,220,170,0.065)',
  cardGlassSoft:    'rgba(255,220,170,0.05)',

  // Old brand names → new Twilight × Obsidian Gold
  coral:            '#FF5C75',                        // → primary
  coralLight:       '#E8506A',
  coralMuted:       'rgba(255,92,117,0.12)',
  rose:             '#FF5C75',                        // → primary
  roseLight:        '#E8506A',
  roseMuted:        'rgba(255,92,117,0.12)',
  peach:            '#c9a85c',                        // → gold (was orange #C8883A)
  peachMuted:       'rgba(201,168,92,0.12)',
  blue:             '#5778A3',                        // → steel
  blueLight:        '#90B8E0',
  blueMuted:        'rgba(87,120,163,0.12)',
  amberDark:        '#8a6820',                        // darkest gold stop (was #B87A30)
  amberMuted:       'rgba(201,168,92,0.12)',
  sageMuted:        'rgba(138,160,96,0.12)',
  amberLight_alias: 'rgba(201,168,92,0.12)',           // old amberLight was rgba

  // Old text token aliases
  textBody:         'rgba(230,210,165,0.78)',          // warm gold-tinted body text
  textSub:          'rgba(220,195,145,0.65)',          // warm secondary
  textGhost:        'rgba(200,180,130,0.28)',          // very faint gold
  textSoft:         'rgba(230,210,165,0.78)',          // warm soft body

  // Old border alias
  borderLight:      'rgba(220,185,110,0.10)',          // gold inset highlight

  // Old semantic
  success:          '#8AA060',
  warning:          '#c9a85c',                        // gold (was orange #C8883A)
  danger:           '#D4705A',
  disabled:         'rgba(255,255,255,0.06)',
  disabledText:     'rgba(255,255,255,0.20)',
  pressed:          'rgba(255,255,255,0.04)',

  // Old gradient stops → warm ember (kept in sync with gradient* tokens)
  gradStart:        '#3A2210',
  gradMid1:         '#301C0C',
  gradMid2:         '#261508',
  gradEnd:          '#0C0804',

  // Old category card backgrounds (now dark card system)
  catPink:          'rgba(255,92,117,0.10)',
  catBlue:          'rgba(87,120,163,0.10)',
  catGreen:         'rgba(138,160,96,0.10)',
  catYellow:        'rgba(201,168,92,0.10)',           // gold-shifted cat bg

  linkAction:       '#c9a85c',                        // gold link (was orange #C8883A)
  linkSecondary:    'rgba(184,142,74,0.30)',           // gold-tinted secondary link
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
  heading:        'CormorantGaramond_400Regular',    // greetings, screen titles — light, warm
  headingItalic:  'CormorantGaramond_400Regular_Italic',
  headingLight:   'CormorantGaramond_300Light',
  headingLightItalic: 'CormorantGaramond_300Light_Italic',
  serif:          'CrimsonPro_300Light_Italic',      // question/placeholder text in cards
  serifRegular:   'CrimsonPro_400Regular',
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
  display:           'CormorantGaramond_400Regular',
  displaySemi:       'CormorantGaramond_400Regular',
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

// ═══════════════════════════════════════════════
// PARTICLES BACKGROUND TOKENS
// Shared values for the golden-particles-bg.png overlay used on
// Home, Auth, Child Hub, and Add Child screens.
// ═══════════════════════════════════════════════

export const particlesBg = '#15100a';
export const particlesOverlay = [
  'rgba(0,0,0,0.50)',
  'rgba(0,0,0,0.65)',
  'rgba(0,0,0,0.80)',
  'rgba(0,0,0,0.90)',
  'rgba(0,0,0,0.95)',
] as const;
export const particlesOverlayLocations = [0, 0.25, 0.50, 0.72, 1] as const;


export type PaletteMode = 'auto' | 'light' | 'dark';
export type PaletteName = 'sunrise' | 'daylight' | 'golden_hour' | 'dusk';

export function setPaletteOverride(_mode: PaletteMode): void { /* no-op */ }
export function getPaletteOverride(): PaletteMode { return 'dark'; }
export function setForcedHour(_hour: number | null): void { /* no-op */ }
export function getActivePaletteName(): PaletteName { return 'dusk'; }
