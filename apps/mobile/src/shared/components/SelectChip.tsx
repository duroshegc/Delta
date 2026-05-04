import React from 'react';
import { Pressable, StyleSheet, Text, ViewStyle } from 'react-native';
import { AppColors, BorderRadius, Spacing, Typography } from '../../core/theme';

interface Props {
  label: string;
  selected: boolean;
  onPress: () => void;
  style?: ViewStyle;
}

export const SelectChip: React.FC<Props> = ({ label, selected, onPress, style }) => (
  <Pressable
    onPress={onPress}
    style={({ pressed }) => [
      styles.chip,
      selected && styles.chipSelected,
      pressed && styles.pressed,
      style,
    ]}
  >
    <Text style={[styles.label, selected && styles.labelSelected]}>{label}</Text>
  </Pressable>
);

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.full,
    backgroundColor: AppColors.surface,
    borderWidth: 1,
    borderColor: AppColors.surface3,
  },
  chipSelected: {
    backgroundColor: AppColors.primary,
    borderColor: AppColors.primary,
  },
  pressed: { opacity: 0.85 },
  label: { ...Typography.label, color: AppColors.textSecondary },
  labelSelected: { color: AppColors.white },
});
