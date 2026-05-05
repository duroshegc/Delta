import React from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import { AppColors, FontFamilies, Shadows } from '../../core/theme';

interface Props {
  size?: number;
  showWordmark?: boolean;
  inverse?: boolean;
  style?: ViewStyle;
}

/**
 * Delta brand mark — pink triangle with a carved-out inset, paired with the
 * "Delta" wordmark in Syne. Shadow halo gives the gradient feel without
 * needing react-native-svg.
 */
export const DeltaLogo: React.FC<Props> = ({
  size = 40,
  showWordmark = true,
  inverse = false,
  style,
}) => {
  const half = size / 2;
  const innerSize = size * 0.55;
  const innerHalf = innerSize / 2;
  const innerLeft = half - innerHalf;
  const innerTop = size * 0.32;
  const insetColor = inverse ? '#FFFFFF' : AppColors.background;
  const wordmarkColor = inverse ? '#FFFFFF' : AppColors.textPrimary;

  return (
    <View style={[styles.row, style]}>
      <View style={[{ width: size, height: size }, Shadows.glowPink]}>
        {/* Outer pink triangle */}
        <View
          style={[
            styles.tri,
            {
              borderLeftWidth: half,
              borderRightWidth: half,
              borderBottomWidth: size,
              borderBottomColor: AppColors.primary,
            },
          ]}
        />
        {/* Inset cutout */}
        <View
          style={[
            styles.tri,
            {
              left: innerLeft,
              top: innerTop,
              borderLeftWidth: innerHalf,
              borderRightWidth: innerHalf,
              borderBottomWidth: innerSize,
              borderBottomColor: insetColor,
            },
          ]}
        />
      </View>
      {showWordmark && (
        <Text style={[styles.wordmark, { fontSize: size * 0.68, color: wordmarkColor }]}>
          Delta
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  tri: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: 0,
    height: 0,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
  },
  wordmark: {
    fontFamily: FontFamilies.brand,
    letterSpacing: -0.5,
    fontWeight: '800',
  },
});
