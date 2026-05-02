/**
 * Delta App Theme System
 * Central export for all theme-related constants
 */

import { AppColors } from './colors';
import { Typography, FontSizes, FontWeights, LineHeights } from './typography';
import { Spacing, BorderRadius } from './spacing';

export const Theme = {
  colors: AppColors,
  typography: Typography,
  fontSizes: FontSizes,
  fontWeights: FontWeights,
  lineHeights: LineHeights,
  spacing: Spacing,
  borderRadius: BorderRadius,
} as const;

// Re-export individual modules for convenience
export { AppColors, Typography, FontSizes, FontWeights, LineHeights, Spacing, BorderRadius };

export type ThemeType = typeof Theme;

// Made with Bob
