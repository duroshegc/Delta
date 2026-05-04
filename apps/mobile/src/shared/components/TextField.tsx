import React from 'react';
import { StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native';
import { AppColors, BorderRadius, Spacing, Typography } from '../../core/theme';

interface Props extends TextInputProps {
  label?: string;
  error?: string | null;
}

export const TextField: React.FC<Props> = ({ label, error, style, ...rest }) => (
  <View style={styles.wrap}>
    {label && <Text style={styles.label}>{label}</Text>}
    <TextInput
      placeholderTextColor={AppColors.textMuted}
      style={[styles.input, !!error && styles.inputError, style]}
      {...rest}
    />
    {error && <Text style={styles.error}>{error}</Text>}
  </View>
);

const styles = StyleSheet.create({
  wrap: { marginBottom: Spacing.base },
  label: {
    ...Typography.label,
    color: AppColors.textSecondary,
    marginBottom: Spacing.sm,
  },
  input: {
    ...Typography.h3,
    color: AppColors.textPrimary,
    backgroundColor: AppColors.surface,
    borderWidth: 1,
    borderColor: AppColors.surface3,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
  },
  inputError: { borderColor: AppColors.danger },
  error: {
    ...Typography.caption,
    color: AppColors.danger,
    marginTop: Spacing.xs,
  },
});
