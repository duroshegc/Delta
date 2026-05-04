/**
 * Delta Design System — spacing & radius tokens.
 * Source: delta-design-system/project/colors_and_type.css (4px base grid).
 */

export const Spacing = {
  '0': 0,
  '1': 4,
  '2': 8,
  '3': 12,
  '4': 16,
  '5': 20,
  '6': 24,
  '8': 32,
  '10': 40,
  '12': 48,
  '16': 64,
  '20': 80,
  '24': 96,

  // Friendly aliases (kept stable for older screens).
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  '2xl': 32,
  '3xl': 40,
  '4xl': 48,
  '5xl': 64,
} as const;

export const BorderRadius = {
  none: 0,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 20,
  xl: 28,
  '2xl': 36,
  full: 9999,

  // Aliases
  '3xl': 36,
} as const;

export const ButtonHeights = {
  sm: 36,
  md: 48,
  lg: 56,
} as const;

export const Durations = {
  micro: 150,
  fast: 200,
  std: 300,
  slow: 500,
} as const;

export type SpacingKey = keyof typeof Spacing;
export type BorderRadiusKey = keyof typeof BorderRadius;
