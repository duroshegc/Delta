/**
 * Delta App Color Palette
 * Consistent colors across the entire application
 */

export const AppColors = {
  // Primary Colors
  primary: '#6C63FF',
  primaryDark: '#5548E8',
  primaryLight: '#8B84FF',

  // Secondary Colors
  secondary: '#FF6584',
  secondaryDark: '#E84D6D',
  secondaryLight: '#FF8BA0',

  // Accent Colors
  accent: '#00C48C',
  accentDark: '#00A876',
  accentLight: '#00E0A0',

  // Neutral Colors
  white: '#FFFFFF',
  black: '#000000',
  grey50: '#FAFAFA',
  grey100: '#F5F5F5',
  grey200: '#EEEEEE',
  grey300: '#E0E0E0',
  grey400: '#BDBDBD',
  grey500: '#9E9E9E',
  grey600: '#757575',
  grey700: '#616161',
  grey800: '#424242',
  grey900: '#212121',

  // Semantic Colors
  success: '#00C48C',
  error: '#FF3B30',
  warning: '#FFCC00',
  info: '#007AFF',

  // Background Colors
  backgroundLight: '#FFFFFF',
  backgroundDark: '#121212',
  surfaceLight: '#F5F5F5',
  surfaceDark: '#1E1E1E',

  // Text Colors
  textPrimary: '#212121',
  textSecondary: '#757575',
  textDisabled: '#BDBDBD',
  textPrimaryDark: '#FFFFFF',
  textSecondaryDark: '#B0B0B0',

  // Special Colors
  verified: '#007AFF',
  premium: '#FFD700',
  online: '#00C48C',
  offline: '#9E9E9E',

  // Overlay Colors
  overlay: 'rgba(0, 0, 0, 0.5)',
  overlayLight: 'rgba(0, 0, 0, 0.25)',
  overlayDark: 'rgba(0, 0, 0, 0.7)',

  // Shimmer Colors
  shimmerBase: '#E0E0E0',
  shimmerHighlight: '#F5F5F5',
  shimmerBaseDark: '#2C2C2C',
  shimmerHighlightDark: '#3A3A3A',
} as const;

export type AppColorKey = keyof typeof AppColors;

// Made with Bob
