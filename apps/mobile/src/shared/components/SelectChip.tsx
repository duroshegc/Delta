import React from 'react';
import { Pressable, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { AppColors, BorderRadius, Gradients, Shadows, Spacing, Typography } from '../../core/theme';

interface Props {
  label: string;
  selected: boolean;
  onPress: () => void;
  glyph?: string;
  style?: ViewStyle;
}

export const SelectChip: React.FC<Props> = ({ label, selected, onPress, glyph, style }) => (
  <Pressable
    onPress={onPress}
    style={({ pressed }) => [
      styles.wrap,
      selected && Shadows.soft,
      pressed && styles.pressed,
      style,
    ]}
  >
    {selected ? (
      <LinearGradient
        colors={Gradients.brand as unknown as string[]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.fill}
      >
        <Inner glyph={glyph} label={label} selected />
      </LinearGradient>
    ) : (
      <View style={[styles.fill, styles.fillIdle]}>
        <Inner glyph={glyph} label={label} selected={false} />
      </View>
    )}
  </Pressable>
);

const Inner: React.FC<{ glyph?: string; label: string; selected: boolean }> = ({ glyph, label, selected }) => (
  <>
    {glyph && (
      <Text style={[styles.glyph, { color: selected ? AppColors.white : AppColors.primary }]}>
        {glyph}
      </Text>
    )}
    <Text style={[styles.label, { color: selected ? AppColors.white : AppColors.textPrimary }]}>
      {label}
    </Text>
  </>
);

const styles = StyleSheet.create({
  wrap: { borderRadius: BorderRadius.full, overflow: 'hidden' },
  fill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    paddingVertical: 10,
    borderRadius: BorderRadius.full,
  },
  fillIdle: {
    backgroundColor: AppColors.surface,
    borderWidth: 1,
    borderColor: AppColors.surface3,
  },
  glyph: { fontSize: 14, marginRight: 6 },
  label: { ...Typography.label, fontWeight: '600' },
  pressed: { opacity: 0.9, transform: [{ scale: 0.97 }] },
});
