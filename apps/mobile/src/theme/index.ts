// Sturdy v3 — Design Tokens
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
  medium: 16,
  large:  20,
  xl:     28,
  pill:   999,
} as const;

export const type = {
  display: {
    fontSize:      36,
    fontWeight:    '800' as const,
    lineHeight:    42,
    letterSpacing: -0.5,
  },
  headline: {
    fontSize:      28,
    fontWeight:    '700' as const,
    lineHeight:    34,
    letterSpacing: -0.3,
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
    lineHeight:    28,
  },
  body: {
    fontSize:      16,
    fontWeight:    '400' as const,
    lineHeight:    24,
  },
  bodySmall: {
    fontSize:      14,
    fontWeight:    '400' as const,
    lineHeight:    20,
  },
  label: {
    fontSize:      11,
    fontWeight:    '700' as const,
    lineHeight:    16,
    letterSpacing: 0.8,
  },
  caption: {
    fontSize:      13,
    fontWeight:    '400' as const,
    lineHeight:    18,
  },
} as const;

export const shadow = {
  sm: {
    shadowColor:   '#1A1814',
    shadowOffset:  { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius:  8,
    elevation:     2,
  },
  md: {
    shadowColor:   '#1A1814',
    shadowOffset:  { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius:  16,
    elevation:     3,
  },
  lg: {
    shadowColor:   '#1A1814',
    shadowOffset:  { width: 0, height: 10 },
    shadowOpacity: 0.14,
    shadowRadius:  32,
    elevation:     6,
  },
} as const;
