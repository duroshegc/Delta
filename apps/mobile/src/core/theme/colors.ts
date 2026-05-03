/**
 * Delta — light-mode color tokens.
 * Brand accents, gradients, and feature colors come from the design system
 * (delta-design-system/project/colors_and_type.css); the surface palette is
 * inverted to a light theme per the product preference.
 */

export const AppColors = {
  // Light surfaces
  background: '#FAFAF8',
  surface: '#FFFFFF',
  surface2: '#F4F4F1',
  surface3: '#E7E7E2',
  surface4: '#D8D8D2',

  // Brand accents (from design system)
  primary: '#EC4899',
  primaryDim: '#C4306A',
  primaryGlow: 'rgba(236, 72, 153, 0.25)',
  accent2: '#F97316',

  // Feature colors
  live: '#00D4AA',
  liveDim: '#00A882',
  liveGlow: 'rgba(0, 212, 170, 0.25)',
  delt: '#F59E0B',
  deltDim: '#D97706',
  deltGlow: 'rgba(245, 158, 11, 0.25)',

  // Semantic
  success: '#22C55E',
  successBg: 'rgba(34, 197, 94, 0.12)',
  danger: '#EF4444',
  dangerBg: 'rgba(239, 68, 68, 0.12)',
  warning: '#F59E0B',
  warningBg: 'rgba(245, 158, 11, 0.12)',
  info: '#3B82F6',
  infoBg: 'rgba(59, 130, 246, 0.12)',

  // Foreground (inverted for light bg)
  textPrimary: '#0A0A0F',
  textSecondary: '#5C5C78',
  textMuted: '#A0A0B8',
  textInverse: '#F8F8FC',

  // Aliases used by existing code
  black: '#0A0A0F',
  white: '#FFFFFF',
  border: '#E7E7E2',
  secondary: '#5C5C78',
} as const;

export const Gradients = {
  brand: ['#EC4899', '#F97316'] as const,
  live: ['#00D4AA', '#EC4899'] as const,
  delt: ['#F59E0B', '#EF4444'] as const,
  dark: ['#13131A', '#0A0A0F'] as const,
};

export type AppColorKey = keyof typeof AppColors;
