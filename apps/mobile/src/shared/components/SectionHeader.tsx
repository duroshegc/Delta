import React from 'react';
import { Pressable, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { AppColors, Spacing, Typography } from '../../core/theme';

interface Props {
  title: string;
  hint?: string;
  actionLabel?: string;
  onAction?: () => void;
  style?: ViewStyle;
}

export const SectionHeader: React.FC<Props> = ({ title, hint, actionLabel, onAction, style }) => (
  <View style={[styles.row, style]}>
    <View style={styles.text}>
      <Text style={styles.title}>{title}</Text>
      {hint && <Text style={styles.hint}>{hint}</Text>}
    </View>
    {actionLabel && onAction && (
      <Pressable onPress={onAction} hitSlop={8}>
        <Text style={styles.action}>{actionLabel}</Text>
      </Pressable>
    )}
  </View>
);

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  text: { flex: 1 },
  title: { ...Typography.h2, color: AppColors.textPrimary },
  hint: { ...Typography.caption, color: AppColors.textSecondary, marginTop: 2 },
  action: { ...Typography.label, color: AppColors.primary },
});
