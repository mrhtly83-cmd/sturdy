// src/theme/colors.ts
// Sturdy v7 — "Sunset" mature visual identity
//
// Time-aware automatic palette system. The background and surface
// colors shift smoothly based on device time of day, creating the
// "the app knows what time it is for me" feel.
//
// 4 palettes:
//   🌅 Sunrise     — 5am–9am   pale gold + soft peach (hopeful)
//   ☀️ Daylight   — 9am–5pm   warm parchment (quiet daylight)
//   🌇 Golden Hour — 5pm–9pm   burnt sienna + terracotta (exhale)
//   🌃 Deep Dusk  — 9pm–5am   indigo + plum (intimate, weighted)
//
// Architecture:
// - 4 raw palette objects defined below
// - getActivePalette() reads device time + override
// - colors export is a Proxy that resolves to active palette per access
// - Every existing token name still works (backwards compat preserved)
// - setPaletteOverride() lets Settings toggle Auto / Light / Dark
// - DEV-only setForcedHour() for previewing palettes without time-travel

// ═══════════════════════════════════════════════
// PALETTE TYPE
// ═══════════════════════════════════════════════

type Palette = {
  // Backgrounds
  base:            string;
  raised:          string;
  elevated:        string;
  subtle:          string;
  background:      string;

  // Brand
  rose:            string;
  roseLight:       string;
  roseMuted:       string;
  sage:            string;
  sageLight:       string;
  sageMuted:       string;

  // Legacy brand aliases
  blue:            string;
  blueLight:       string;
  blueMuted:       string;
  coral:           string;
  coralLight:      string;
  coralMuted:      string;
  peach:           string;
  peachMuted:      string;
  amber:           string;
  amberMuted:      string;

  // Category card colors
  catPink:         string;
  catBlue:         string;
  catGreen:        string;
  catYellow:       string;

  // Gradient stops
  gradStart:       string;
  gradMid1:        string;
  gradMid2:        string;
  gradEnd:         string;

  // Text
  text:            string;
  textBody:        string;
  textSub:         string;
  textMuted:       string;
  textGhost:       string;
  textSoft:        string;
  textSecondary:   string;
  textFaint:       string;

  // Links
  linkAction:      string;
  linkSecondary:   string;

  // Borders
  border:          string;
  borderLight:     string;
  borderFocus:     string;

  // Semantic
  success:         string;
  warning:         string;
  danger:          string;
  disabled:        string;
  disabledText:    string;
  pressed:         string;

  // Card surfaces
  cardGlass:       string;
  cardGlassStrong: string;
  cardGlassSoft:   string;
};


// ═══════════════════════════════════════════════
// PALETTE 1 — 🌅 SUNRISE  (5am – 9am)
// ═══════════════════════════════════════════════

const SUNRISE: Palette = {
  // Backgrounds
  base:            '#F4D9C4',
  raised:          'rgba(255,255,255,0.55)',
  elevated:        'rgba(255,255,255,0.75)',
  subtle:          'rgba(255,255,255,0.40)',
  background:      '#F4D9C4',

  // Brand
  rose:            '#C97B63',
  roseLight:       '#D9917C',
  roseMuted:       'rgba(201,123,99,0.12)',
  sage:            '#81B29A',
  sageLight:       '#97C5AE',
  sageMuted:       'rgba(129,178,154,0.12)',

  // Legacy aliases
  blue:            '#81B29A',
  blueLight:       '#97C5AE',
  blueMuted:       'rgba(129,178,154,0.12)',
  coral:           '#C97B63',
  coralLight:      '#D9917C',
  coralMuted:      'rgba(201,123,99,0.12)',
  peach:           '#E89F73',
  peachMuted:      'rgba(232,159,115,0.10)',
  amber:           '#C97B63',
  amberMuted:      'rgba(201,123,99,0.12)',

  // Category cards
  catPink:         '#F5C8B5',
  catBlue:         '#D6E8F7',
  catGreen:        '#D4E8D1',
  catYellow:       '#F4D9C4',

  // Gradient: pale gold → peach → dusty rose-cream → warm sage
  gradStart:       '#F4D9C4',
  gradMid1:        '#F5C8B5',
  gradMid2:        '#E8BEB1',
  gradEnd:         '#D4D0BF',

  // Text — dark warm brown for warmth
  text:            '#3D2D1F',
  textBody:        'rgba(61,45,31,0.78)',
  textSub:         'rgba(61,45,31,0.55)',
  textMuted:       'rgba(61,45,31,0.32)',
  textGhost:       'rgba(61,45,31,0.14)',
  textSoft:        'rgba(61,45,31,0.78)',
  textSecondary:   'rgba(61,45,31,0.55)',
  textFaint:       'rgba(61,45,31,0.20)',

  // Links
  linkAction:      '#C97B63',
  linkSecondary:   'rgba(61,45,31,0.32)',

  // Borders
  border:          'rgba(61,45,31,0.08)',
  borderLight:     'rgba(61,45,31,0.12)',
  borderFocus:     'rgba(129,178,154,0.45)',

  // Semantic
  success:         '#81B29A',
  warning:         '#E89F73',
  danger:          '#C97B63',
  disabled:        'rgba(61,45,31,0.08)',
  disabledText:    'rgba(61,45,31,0.22)',
  pressed:         'rgba(61,45,31,0.06)',

  // Cards
  cardGlass:       'rgba(251,246,238,0.78)',
  cardGlassStrong: 'rgba(251,246,238,0.92)',
  cardGlassSoft:   'rgba(251,246,238,0.55)',
};


// ═══════════════════════════════════════════════
// PALETTE 2 — ☀️ DAYLIGHT  (9am – 5pm)
// ═══════════════════════════════════════════════

const DAYLIGHT: Palette = {
  base:            '#F5EDDF',
  raised:          'rgba(255,255,255,0.65)',
  elevated:        'rgba(255,255,255,0.82)',
  subtle:          'rgba(255,255,255,0.45)',
  background:      '#F5EDDF',

  rose:            '#C97B63',
  roseLight:       '#D9917C',
  roseMuted:       'rgba(201,123,99,0.10)',
  sage:            '#81B29A',
  sageLight:       '#97C5AE',
  sageMuted:       'rgba(129,178,154,0.10)',

  blue:            '#81B29A',
  blueLight:       '#97C5AE',
  blueMuted:       'rgba(129,178,154,0.10)',
  coral:           '#C97B63',
  coralLight:      '#D9917C',
  coralMuted:      'rgba(201,123,99,0.10)',
  peach:           '#E89F73',
  peachMuted:      'rgba(232,159,115,0.08)',
  amber:           '#C97B63',
  amberMuted:      'rgba(201,123,99,0.10)',

  catPink:         '#FDDDE6',
  catBlue:         '#D6E8F7',
  catGreen:        '#D4E8D1',
  catYellow:       '#FDE8D0',

  // Gradient: warm parchment → cream → sand → warm linen
  gradStart:       '#F5EDDF',
  gradMid1:        '#EDE3D2',
  gradMid2:        '#E5DBC8',
  gradEnd:         '#DDD3BF',

  // Text
  text:            '#2C2A26',
  textBody:        'rgba(44,42,38,0.78)',
  textSub:         'rgba(44,42,38,0.52)',
  textMuted:       'rgba(44,42,38,0.30)',
  textGhost:       'rgba(44,42,38,0.12)',
  textSoft:        'rgba(44,42,38,0.78)',
  textSecondary:   'rgba(44,42,38,0.52)',
  textFaint:       'rgba(44,42,38,0.18)',

  linkAction:      '#C97B63',
  linkSecondary:   'rgba(44,42,38,0.30)',

  border:          'rgba(44,42,38,0.07)',
  borderLight:     'rgba(44,42,38,0.11)',
  borderFocus:     'rgba(129,178,154,0.40)',

  success:         '#81B29A',
  warning:         '#E89F73',
  danger:          '#C97B63',
  disabled:        'rgba(44,42,38,0.06)',
  disabledText:    'rgba(44,42,38,0.20)',
  pressed:         'rgba(44,42,38,0.04)',

  cardGlass:       'rgba(255,252,246,0.75)',
  cardGlassStrong: 'rgba(255,252,246,0.90)',
  cardGlassSoft:   'rgba(255,252,246,0.50)',
};


// ═══════════════════════════════════════════════
// PALETTE 3 — 🌇 GOLDEN HOUR  (5pm – 9pm)
// ═══════════════════════════════════════════════

const GOLDEN_HOUR: Palette = {
  base:            '#E8B68A',
  raised:          'rgba(251,238,221,0.62)',
  elevated:        'rgba(251,238,221,0.80)',
  subtle:          'rgba(251,238,221,0.45)',
  background:      '#E8B68A',

  rose:            '#C97B63',
  roseLight:       '#D9917C',
  roseMuted:       'rgba(201,123,99,0.14)',
  sage:            '#81B29A',
  sageLight:       '#97C5AE',
  sageMuted:       'rgba(129,178,154,0.14)',

  blue:            '#81B29A',
  blueLight:       '#97C5AE',
  blueMuted:       'rgba(129,178,154,0.14)',
  coral:           '#C97B63',
  coralLight:      '#D9917C',
  coralMuted:      'rgba(201,123,99,0.14)',
  peach:           '#E8A573',
  peachMuted:      'rgba(232,165,115,0.10)',
  amber:           '#C97B63',
  amberMuted:      'rgba(201,123,99,0.14)',

  catPink:         '#E8B68A',
  catBlue:         '#D6E8F7',
  catGreen:        '#D4E8D1',
  catYellow:       '#F4D9C4',

  // Gradient: burnt apricot → terracotta → dusty sienna → warm taupe
  gradStart:       '#E8B68A',
  gradMid1:        '#D89674',
  gradMid2:        '#B8755C',
  gradEnd:         '#6B5644',

  // Text — deep warm brown
  text:            '#2D1E14',
  textBody:        'rgba(45,30,20,0.80)',
  textSub:         'rgba(45,30,20,0.58)',
  textMuted:       'rgba(45,30,20,0.36)',
  textGhost:       'rgba(45,30,20,0.16)',
  textSoft:        'rgba(45,30,20,0.80)',
  textSecondary:   'rgba(45,30,20,0.58)',
  textFaint:       'rgba(45,30,20,0.22)',

  linkAction:      '#3D2418',
  linkSecondary:   'rgba(45,30,20,0.36)',

  border:          'rgba(45,30,20,0.10)',
  borderLight:     'rgba(45,30,20,0.14)',
  borderFocus:     'rgba(129,178,154,0.50)',

  success:         '#81B29A',
  warning:         '#E8A573',
  danger:          '#C97B63',
  disabled:        'rgba(45,30,20,0.10)',
  disabledText:    'rgba(45,30,20,0.26)',
  pressed:         'rgba(45,30,20,0.08)',

  cardGlass:       'rgba(251,238,221,0.78)',
  cardGlassStrong: 'rgba(251,238,221,0.92)',
  cardGlassSoft:   'rgba(251,238,221,0.55)',
};


// ═══════════════════════════════════════════════
// PALETTE 4 — 🌃 DEEP DUSK  (9pm – 5am)
// Inverted: light text on dark backgrounds.
// ═══════════════════════════════════════════════

const DUSK: Palette = {
  base:            '#2D2A3E',
  raised:          'rgba(61,56,72,0.62)',
  elevated:        'rgba(61,56,72,0.80)',
  subtle:          'rgba(61,56,72,0.45)',
  background:      '#2D2A3E',

  rose:            '#D9917C',
  roseLight:       '#E8A89A',
  roseMuted:       'rgba(217,145,124,0.18)',
  sage:            '#97C5AE',
  sageLight:       '#B0D4C2',
  sageMuted:       'rgba(151,197,174,0.18)',

  blue:            '#97C5AE',
  blueLight:       '#B0D4C2',
  blueMuted:       'rgba(151,197,174,0.18)',
  coral:           '#D9917C',
  coralLight:      '#E8A89A',
  coralMuted:      'rgba(217,145,124,0.18)',
  peach:           '#E8A573',
  peachMuted:      'rgba(232,165,115,0.14)',
  amber:           '#D9917C',
  amberMuted:      'rgba(217,145,124,0.18)',

  catPink:         '#4D4252',
  catBlue:         '#3D4858',
  catGreen:        '#3D4D44',
  catYellow:       '#4D4538',

  // Gradient: deep dusk navy → indigo → plum-charcoal → near-black
  gradStart:       '#2D2A3E',
  gradMid1:        '#3D3548',
  gradMid2:        '#4D4252',
  gradEnd:         '#1F1D2B',

  // Text — light cream on dark
  text:            '#F0EBE0',
  textBody:        'rgba(240,235,224,0.82)',
  textSub:         'rgba(240,235,224,0.62)',
  textMuted:       'rgba(240,235,224,0.42)',
  textGhost:       'rgba(240,235,224,0.18)',
  textSoft:        'rgba(240,235,224,0.82)',
  textSecondary:   'rgba(240,235,224,0.62)',
  textFaint:       'rgba(240,235,224,0.28)',

  linkAction:      '#E8A89A',
  linkSecondary:   'rgba(240,235,224,0.42)',

  border:          'rgba(240,235,224,0.10)',
  borderLight:     'rgba(240,235,224,0.16)',
  borderFocus:     'rgba(151,197,174,0.50)',

  success:         '#97C5AE',
  warning:         '#E8A573',
  danger:          '#D9917C',
  disabled:        'rgba(240,235,224,0.10)',
  disabledText:    'rgba(240,235,224,0.32)',
  pressed:         'rgba(240,235,224,0.08)',

  cardGlass:       'rgba(61,56,72,0.78)',
  cardGlassStrong: 'rgba(61,56,72,0.92)',
  cardGlassSoft:   'rgba(61,56,72,0.55)',
};


// ═══════════════════════════════════════════════
// PALETTE SELECTION
// ═══════════════════════════════════════════════

export type PaletteMode = 'auto' | 'light' | 'dark';

let paletteOverride: PaletteMode = 'auto';
let forcedHour: number | null = null; // dev-only override

/**
 * Set the user's palette preference.
 * 'auto' = time-aware (default)
 * 'light' = always Daylight
 * 'dark' = always Deep Dusk
 */
export function setPaletteOverride(mode: PaletteMode): void {
  paletteOverride = mode;
}

export function getPaletteOverride(): PaletteMode {
  return paletteOverride;
}

/**
 * DEV ONLY — force a specific hour for palette preview.
 * Pass null to clear the override.
 * Never used in production.
 */
export function setForcedHour(hour: number | null): void {
  forcedHour = hour;
}

/**
 * Returns the active palette object based on time of day + override.
 * Each call resolves fresh — palette can change mid-session if the
 * device clock crosses a boundary.
 */
export function getActivePalette(): Palette {
  if (paletteOverride === 'light') return DAYLIGHT;
  if (paletteOverride === 'dark')  return DUSK;

  const hour = forcedHour !== null ? forcedHour : new Date().getHours();

  if (hour >= 5  && hour < 9)  return SUNRISE;
  if (hour >= 9  && hour < 17) return DAYLIGHT;
  if (hour >= 17 && hour < 21) return GOLDEN_HOUR;
  return DUSK; // 21–24 and 0–5
}

/**
 * Returns which palette name is currently active.
 * Useful for conditional logic in screens (e.g. swap a logo asset
 * between light and dark variants).
 */
export type PaletteName = 'sunrise' | 'daylight' | 'golden_hour' | 'dusk';

export function getActivePaletteName(): PaletteName {
  if (paletteOverride === 'light') return 'daylight';
  if (paletteOverride === 'dark')  return 'dusk';

  const hour = forcedHour !== null ? forcedHour : new Date().getHours();

  if (hour >= 5  && hour < 9)  return 'sunrise';
  if (hour >= 9  && hour < 17) return 'daylight';
  if (hour >= 17 && hour < 21) return 'golden_hour';
  return 'dusk';
}


// ═══════════════════════════════════════════════
// COLORS PROXY — DYNAMIC RESOLUTION
// Every property access resolves against the active palette.
// All existing screens continue to work without changes.
// ═══════════════════════════════════════════════

export const colors = new Proxy({} as Palette, {
  get(_target, prop: string) {
    const palette = getActivePalette();
    return (palette as any)[prop];
  },
}) as Palette;


// ═══════════════════════════════════════════════
// FONTS — UNCHANGED
// Typography refresh is a separate decision.
// ═══════════════════════════════════════════════

export const fonts = {
  // Manrope — UI body text
  heading:          'Manrope-ExtraBold',
  subheading:       'Manrope-Bold',
  body:             'Manrope-Regular',
  bodyMedium:       'Manrope-Medium',
  bodySemi:         'Manrope-SemiBold',
  label:            'Manrope-Bold',
  display:          'Manrope-ExtraBold',
  displaySemi:      'Manrope-Bold',
  script:           'Manrope-Medium',
  scriptItalic:     'Manrope-Medium',
  accent:           'Manrope-Medium',

  // Legacy aliases
  scriptMedium:     'Manrope-Bold',
  scriptLight:      'Manrope-Medium',
  scriptLightItalic:'Manrope-Medium',
} as const;