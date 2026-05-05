import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native';
import { AppColors, BorderRadius, Shadows, Spacing, Typography } from '../../core/theme';

interface Props extends TextInputProps {
  label?: string;
  error?: string | null;
  hint?: string;
  iconLeft?: string;
}

export const TextField: React.FC<Props> = ({ label, error, hint, iconLeft, style, onFocus, onBlur, ...rest }) => {
  const [focused, setFocused] = useState(false);
  return (
    <View style={styles.wrap}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View
        style={[
          styles.shell,
          focused && styles.shellFocused,
          !!error && styles.shellError,
          focused && Shadows.soft,
        ]}
      >
        {iconLeft && <Text style={styles.icon}>{iconLeft}</Text>}
        <TextInput
          placeholderTextColor={AppColors.textMuted}
          {...rest}
          onFocus={(e) => { setFocused(true); onFocus?.(e); }}
          onBlur={(e) => { setFocused(false); onBlur?.(e); }}
          style={[styles.input, style]}
        />
      </View>
      {error ? (
        <Text style={styles.error}>{error}</Text>
      ) : hint ? (
        <Text style={styles.hint}>{hint}</Text>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: { marginBottom: Spacing.base },
  label: {
    ...Typography.label,
    color: AppColors.textSecondary,
    marginBottom: Spacing.sm,
    textTransform: 'uppercase',
  },
  shell: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: AppColors.surface,
    borderWidth: 1.5,
    borderColor: AppColors.surface3,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.base,
    minHeight: 54,
  },
  shellFocused: { borderColor: AppColors.primary, backgroundColor: '#FFFFFF' },
  shellError: { borderColor: AppColors.danger },
  icon: { fontSize: 18, color: AppColors.textSecondary, marginRight: Spacing.sm },
  input: {
    ...Typography.h3,
    color: AppColors.textPrimary,
    flex: 1,
    paddingVertical: Spacing.md,
  },
  error: {
    ...Typography.caption,
    color: AppColors.danger,
    marginTop: Spacing.xs,
  },
  hint: {
    ...Typography.caption,
    color: AppColors.textMuted,
    marginTop: Spacing.xs,
  },
});
