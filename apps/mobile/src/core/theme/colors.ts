/**
 * Delta — "Soft Daylight Romance" palette.
 * Warm peachy-cream surfaces with vibrant brand accents.
 */

export const AppColors = {
  // Warm light surfaces
  background: '#FEF8F6',     // warm cream
  surface: '#FFFFFF',         // pure card
  surface2: '#FFF1EC',        // peach tint
  surface3: '#F5DDD8',        // peach divider
  surface4: '#EDC9C0',        // peach hover

  // Brand accents
  primary: '#EC4899',
  primaryDim: '#C4306A',
  primaryGlow: 'rgba(236, 72, 153, 0.25)',
  accent2: '#F97316',
  accent2Glow: 'rgba(249, 115, 22, 0.20)',

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

  // Foreground — warm tones
  textPrimary: '#1C0F14',     // warm near-black
  textSecondary: '#6B4455',   // mauve
  textMuted: '#A8889A',       // soft mauve
  textInverse: '#FFFFFF',

  // Aliases retained
  black: '#1C0F14',
  white: '#FFFFFF',
  border: '#F5DDD8',
  secondary: '#6B4455',
} as const;

/**
 * Gradient stops (use with expo-linear-gradient).
 */
export const Gradients = {
  brand: ['#EC4899', '#F97316'] as const,
  brandSoft: ['#FBCFE8', '#FDBA74'] as const,
  live: ['#00D4AA', '#EC4899'] as const,
  delt: ['#F59E0B', '#EF4444'] as const,
  warmBg: ['#FFF1EC', '#FEF8F6'] as const,
  // Per-profile playful gradients (for cards/avatars)
  blush: ['#FBCFE8', '#F472B6'] as const,
  apricot: ['#FED7AA', '#FB923C'] as const,
  sky: ['#BAE6FD', '#38BDF8'] as const,
  mint: ['#BBF7D0', '#34D399'] as const,
  lilac: ['#DDD6FE', '#A78BFA'] as const,
  coral: ['#FECACA', '#FB7185'] as const,
};

/**
 * Cycle through these for variety on cards/avatars without explicit choice.
 */
export const ProfileGradientCycle = [
  Gradients.blush,
  Gradients.apricot,
  Gradients.sky,
  Gradients.mint,
  Gradients.lilac,
  Gradients.coral,
] as const;

export const pickProfileGradient = (seed: string | number) => {
  const key = typeof seed === 'string'
    ? seed.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0)
    : seed;
  return ProfileGradientCycle[Math.abs(key) % ProfileGradientCycle.length];
};

/**
 * Layered shadows. RN ignores shadowOpacity on Android — `elevation` is a fallback.
 */
export const Shadows = {
  none: {
    shadowColor: 'transparent',
    shadowOpacity: 0,
    shadowRadius: 0,
    shadowOffset: { width: 0, height: 0 },
    elevation: 0,
  },
  soft: {
    shadowColor: '#1C0F14',
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  medium: {
    shadowColor: '#1C0F14',
    shadowOpacity: 0.10,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 5,
  },
  large: {
    shadowColor: '#1C0F14',
    shadowOpacity: 0.14,
    shadowRadius: 32,
    shadowOffset: { width: 0, height: 16 },
    elevation: 10,
  },
  glowPink: {
    shadowColor: '#EC4899',
    shadowOpacity: 0.35,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  glowLive: {
    shadowColor: '#00D4AA',
    shadowOpacity: 0.35,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  glowDelt: {
    shadowColor: '#F59E0B',
    shadowOpacity: 0.35,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
} as const;

export type AppColorKey = keyof typeof AppColors;
