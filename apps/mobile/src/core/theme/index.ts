/**
 * Delta App Theme System
 */

import { AppColors, Gradients, Shadows, ProfileGradientCycle, pickProfileGradient } from './colors';
import { Typography, FontSizes, FontWeights, LineHeights, FontFamilies } from './typography';
import { Spacing, BorderRadius, ButtonHeights, Durations } from './spacing';

export const Theme = {
  colors: AppColors,
  gradients: Gradients,
  shadows: Shadows,
  typography: Typography,
  fontSizes: FontSizes,
  fontWeights: FontWeights,
  lineHeights: LineHeights,
  spacing: Spacing,
  borderRadius: BorderRadius,
} as const;

export {
  AppColors,
  Gradients,
  Shadows,
  ProfileGradientCycle,
  pickProfileGradient,
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
