import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { AppColors } from '../../core/theme';

type Tone = 'pink' | 'peach' | 'live' | 'delt' | 'mixed';

interface Props {
  tone?: Tone;
  children: React.ReactNode;
  style?: ViewStyle;
}

/**
 * Soft ambient backdrop — large blurred-looking colored blobs in corners
 * give every screen a warm romantic glow without using images.
 */
export const ScreenBackdrop: React.FC<Props> = ({ tone = 'mixed', children, style }) => {
  const blobs = blobsFor(tone);
  return (
    <View style={[styles.root, style]}>
      {blobs.map((b, i) => (
        <View key={i} style={[styles.blob, b]} pointerEvents="none" />
      ))}
      <View style={styles.content}>{children}</View>
    </View>
  );
};

const blobsFor = (tone: Tone): ViewStyle[] => {
  switch (tone) {
    case 'pink':
      return [
        { top: -160, right: -120, backgroundColor: AppColors.primaryGlow },
        { bottom: -200, left: -160, backgroundColor: 'rgba(236, 72, 153, 0.10)' },
      ];
    case 'peach':
      return [
        { top: -180, left: -120, backgroundColor: AppColors.accent2Glow },
        { bottom: -200, right: -160, backgroundColor: 'rgba(251, 191, 36, 0.10)' },
      ];
    case 'live':
      return [
        { top: -180, right: -120, backgroundColor: AppColors.liveGlow },
        { bottom: -200, left: -160, backgroundColor: 'rgba(0, 212, 170, 0.10)' },
      ];
    case 'delt':
      return [
        { top: -180, right: -120, backgroundColor: AppColors.deltGlow },
        { bottom: -200, left: -160, backgroundColor: 'rgba(245, 158, 11, 0.10)' },
      ];
    case 'mixed':
    default:
      return [
        { top: -180, right: -140, backgroundColor: AppColors.primaryGlow },
        { top: 220, left: -180, backgroundColor: AppColors.accent2Glow },
        { bottom: -220, right: -120, backgroundColor: 'rgba(0, 212, 170, 0.10)' },
      ];
  }
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: AppColors.background, overflow: 'hidden' },
  content: { flex: 1 },
  blob: {
    position: 'absolute',
    width: 360,
    height: 360,
    borderRadius: 360,
  },
});
