import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BorderRadius, Shadows } from '../../core/theme';

interface Props {
  colors: readonly [string, string, ...string[]];
  start?: { x: number; y: number };
  end?: { x: number; y: number };
  radius?: number;
  glow?: boolean;
  glowColor?: string;
  style?: ViewStyle;
  children?: React.ReactNode;
}

/**
 * Hero gradient surface — used for balance card, welcome hero, profile
 * cover overlays, and any "moment" component. The glow halo (when enabled)
 * adds a soft colored shadow for premium feel.
 */
export const GradientCard: React.FC<Props> = ({
  colors,
  start = { x: 0, y: 0 },
  end = { x: 1, y: 1 },
  radius = BorderRadius.xl,
  glow = false,
  glowColor,
  style,
  children,
}) => {
  const halo: ViewStyle | undefined = glow
    ? {
        shadowColor: glowColor ?? colors[0],
        shadowOpacity: 0.35,
        shadowRadius: 28,
        shadowOffset: { width: 0, height: 14 },
        elevation: 12,
      }
    : Shadows.medium;

  return (
    <View style={[{ borderRadius: radius }, halo, style]}>
      <LinearGradient
        colors={colors}
        start={start}
        end={end}
        style={[styles.surface, { borderRadius: radius }]}
      >
        {children}
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  surface: { overflow: 'hidden' },
});
