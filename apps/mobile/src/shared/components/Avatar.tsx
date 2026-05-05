import React from 'react';
import { Image, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { AppColors, BorderRadius, Shadows, pickProfileGradient } from '../../core/theme';

interface Props {
  uri?: string | null;
  name: string;
  size?: number;
  ring?: boolean;
  style?: ViewStyle;
}

/**
 * Avatar with playful gradient fallback (one of six colorways picked
 * deterministically from the name). Optional gradient ring highlights
 * "new match" or "live" status.
 */
export const Avatar: React.FC<Props> = ({ uri, name, size = 56, ring = false, style }) => {
  const radius = size / 2;
  const innerSize = ring ? size - 6 : size;
  const innerRadius = innerSize / 2;
  const grad = pickProfileGradient(name || 'Delta');
  const initial = (name?.charAt(0) || '?').toUpperCase();

  const inner = uri ? (
    <Image source={{ uri }} style={{ width: innerSize, height: innerSize, borderRadius: innerRadius }} />
  ) : (
    <LinearGradient
      colors={grad as unknown as string[]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[
        styles.fallback,
        { width: innerSize, height: innerSize, borderRadius: innerRadius },
      ]}
    >
      <Text style={[styles.letter, { fontSize: innerSize * 0.42 }]}>{initial}</Text>
    </LinearGradient>
  );

  if (!ring) return <View style={[{ width: size, height: size }, style]}>{inner}</View>;

  return (
    <View
      style={[
        { width: size, height: size, borderRadius: radius, padding: 3 },
        Shadows.soft,
        style,
      ]}
    >
      <LinearGradient
        colors={['#EC4899', '#F97316'] as unknown as string[]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[StyleSheet.absoluteFill, { borderRadius: radius }]}
      />
      <View
        style={{
          width: innerSize,
          height: innerSize,
          borderRadius: innerRadius,
          backgroundColor: AppColors.background,
          padding: 2,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {inner}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  fallback: { alignItems: 'center', justifyContent: 'center' },
  letter: { color: '#1C0F14', fontWeight: '800' },
});
