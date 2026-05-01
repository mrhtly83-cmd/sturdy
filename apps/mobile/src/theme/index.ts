// Sturdy v6 — Deep Warm Design Tokens
// Single import point: import { colors, spacing, radius, shadow, type } from '../theme';

export { colors, fonts } from './colors';

export const spacing = {
  xxs: 4,
  xs:  8,
  sm:  12,
  md:  16,
  lg:  24,
  xl:  32,
  xxl: 48,
} as const;

export const radius = {
  xs:     8,
  small:  12,
  medium: 14,                                        // outcome cards, chips
  large:  18,                                        // primary card radius (was 20)
  xl:     28,
  pill:   999,
} as const;

export const type = {
  display: {
    fontSize:      32,                                // was 36 — greeting size
    fontWeight:    '700' as const,                    // was 800
    lineHeight:    38,
    letterSpacing: -0.3,
  },
  headline: {
    fontSize:      28,
    fontWeight:    '700' as const,
    lineHeight:    34,
    letterSpacing: -0.2,
  },
  title: {
    fontSize:      22,
    fontWeight:    '700' as const,
    lineHeight:    28,
  },
  sectionTitle: {
    fontSize:      18,
    fontWeight:    '600' as const,
    lineHeight:    24,
  },
  script: {
    fontSize:      18,
    fontWeight:    '600' as const,
    lineHeight:    29,                                // was 28 — slightly more breathing room
  },
  body: {
    fontSize:      15,                                // was 16 — tighter to match mockup
    fontWeight:    '400' as const,
    lineHeight:    22,
  },
  bodySmall: {
    fontSize:      14,
    fontWeight:    '400' as const,
    lineHeight:    20,
  },
  label: {
    fontSize:      10,                                // was 11 — smaller uppercase labels
    fontWeight:    '700' as const,
    lineHeight:    14,
    letterSpacing: 1.2,                               // was 0.8 — wider tracking
  },
  caption: {
    fontSize:      13,
    fontWeight:    '400' as const,
    lineHeight:    18,
  },
} as const;

export const shadow = {
  sm: {
    shadowColor:   '#000000',                        // was #1A1814
    shadowOffset:  { width: 0, height: 2 },
    shadowOpacity: 0.15,                             // was 0.05 — deeper for dark bg
    shadowRadius:  8,
    elevation:     2,
  },
  md: {
    shadowColor:   '#000000',
    shadowOffset:  { width: 0, height: 6 },
    shadowOpacity: 0.35,                             // was 0.08 — card ambient shadow
    shadowRadius:  20,
    elevation:     4,
  },
  lg: {
    shadowColor:   '#000000',
    shadowOffset:  { width: 0, height: 10 },
    shadowOpacity: 0.40,                             // was 0.14 — deep card shadow
    shadowRadius:  32,
    elevation:     6,
  },
} as const;
