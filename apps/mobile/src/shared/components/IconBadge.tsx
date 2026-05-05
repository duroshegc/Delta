import React from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { AppColors, BorderRadius, Gradients, Shadows, Typography } from '../../core/theme';

type Tone = 'brand' | 'live' | 'delt' | 'soft';
type Size = 'sm' | 'md' | 'lg';

interface Props {
  glyph: string;
  tone?: Tone;
  size?: Size;
  style?: ViewStyle;
}

const sizeMap: Record<Size, { box: number; text: number }> = {
  sm: { box: 28, text: 14 },
  md: { box: 40, text: 18 },
  lg: { box: 56, text: 24 },
};

const gradientFor = (tone: Tone): readonly [string, string] => {
  switch (tone) {
    case 'brand': return Gradients.brand;
    case 'live':  return Gradients.live;
    case 'delt':  return Gradients.delt;
    case 'soft':  return Gradients.brandSoft;
  }
};

/**
 * A square gradient tile with a centered glyph — used as a "section icon"
 * marker on rows, list items, and metadata pills.
 */
export const IconBadge: React.FC<Props> = ({ glyph, tone = 'brand', size = 'md', style }) => {
  const { box, text } = sizeMap[size];
  const colors = gradientFor(tone);
  return (
    <View
      style={[
        { width: box, height: box, borderRadius: BorderRadius.md },
        Shadows.soft,
        style,
      ]}
    >
      <LinearGradient
        colors={colors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.surface, { borderRadius: BorderRadius.md }]}
      >
        <Text style={[styles.glyph, { fontSize: text }]}>{glyph}</Text>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  surface: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  glyph: { ...Typography.h3, color: AppColors.white, fontSize: 18 },
});
