/**
 * Delta App Theme System
 * Central export for all theme-related constants
 */

import { AppColors, Gradients } from './colors';
import { Typography, FontSizes, FontWeights, LineHeights, FontFamilies } from './typography';
import { Spacing, BorderRadius, ButtonHeights, Durations } from './spacing';

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
export {
  AppColors,
  Gradients,
  Typography,
  FontSizes,
  FontWeights,
  LineHeights,
  FontFamilies,
  Spacing,
  BorderRadius,
  ButtonHeights,
  Durations,
};

export type ThemeType = typeof Theme;

// Made with Bob
