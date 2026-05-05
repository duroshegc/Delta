/**
 * Delta Design System — typography tokens.
 * Source: delta-design-system/project/colors_and_type.css
 *
 * Display: Plus Jakarta Sans (headlines)
 * Brand wordmark: Syne (logo only — high-contrast geometric)
 * Body: DM Sans
 */
import { TextStyle } from 'react-native';

export const FontFamilies = {
  display: 'PlusJakartaSans_700Bold',
  displayBold: 'PlusJakartaSans_800ExtraBold',
  displaySemi: 'PlusJakartaSans_600SemiBold',
  body: 'DMSans_400Regular',
  bodyMedium: 'DMSans_500Medium',
  bodySemi: 'DMSans_600SemiBold',
  // Brand wordmark
  brand: 'Syne_800ExtraBold',
  brandBold: 'Syne_700Bold',
} as const;

export const FontSizes = {
  display: 32,
  h1: 24,
  h2: 20,
  h3: 17,
  body: 15,
  label: 13,
  caption: 11,
} as const;

export const FontWeights = {
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
  extrabold: '800',
} as const satisfies Record<string, TextStyle['fontWeight']>;

export const LineHeights = {
  tight: 1.15,
  snug: 1.25,
  normal: 1.3,
  relaxed: 1.55,
} as const;

const make = (
  fontFamily: string,
  size: number,
  lh: number,
  letterSpacing = 0,
): TextStyle => ({
  fontFamily,
  fontSize: size,
  lineHeight: Math.round(size * lh),
  letterSpacing,
});

export const Typography = {
  display: make(FontFamilies.displayBold, FontSizes.display, LineHeights.tight, -0.64),
  h1: make(FontFamilies.display, FontSizes.h1, LineHeights.snug, -0.24),
  h2: make(FontFamilies.displaySemi, FontSizes.h2, LineHeights.normal, -0.1),
  h3: make(FontFamilies.bodySemi, FontSizes.h3, 1.35),
  body: make(FontFamilies.body, FontSizes.body, LineHeights.relaxed),
  bodyMedium: make(FontFamilies.bodyMedium, FontSizes.body, LineHeights.relaxed),
  label: make(FontFamilies.bodyMedium, FontSizes.label, LineHeights.normal, 0.065),
  caption: make(FontFamilies.body, FontSizes.caption, 1.4, 0.11),

  // Aliases retained
  displayLarge: make(FontFamilies.displayBold, FontSizes.display, LineHeights.tight, -0.64),
  headlineLarge: make(FontFamilies.display, FontSizes.h1, LineHeights.snug, -0.24),
  headlineMedium: make(FontFamilies.displaySemi, FontSizes.h2, LineHeights.normal, -0.1),
  titleMedium: make(FontFamilies.bodySemi, FontSizes.h3, 1.35),
  labelSmall: make(FontFamilies.body, FontSizes.caption, 1.4, 0.11),
} as const;

export type TypographyKey = keyof typeof Typography;
