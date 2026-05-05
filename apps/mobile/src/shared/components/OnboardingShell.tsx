import React from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { AppColors, BorderRadius, Gradients, Spacing, Typography } from '../../core/theme';
import { ScreenBackdrop } from './ScreenBackdrop';
import { DeltaLogo } from './DeltaLogo';
import { PrimaryButton } from './PrimaryButton';

interface Props {
  step: number;
  total: number;
  eyebrow?: string;
  title: string;
  subtitle?: string;
  ctaTitle: string;
  ctaIcon?: string;
  onCta: () => void;
  ctaLoading?: boolean;
  ctaDisabled?: boolean;
  children: React.ReactNode;
  scrollable?: boolean;
}

export const OnboardingShell: React.FC<Props> = ({
  step,
  total,
  eyebrow,
  title,
  subtitle,
  ctaTitle,
  ctaIcon = '→',
  onCta,
  ctaLoading,
  ctaDisabled,
  children,
  scrollable,
}) => {
  return (
    <ScreenBackdrop tone="mixed">
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.headerRow}>
          <DeltaLogo size={26} />
          <Text style={styles.stepText}>
            Step {step} of {total}
          </Text>
        </View>
        <View style={styles.progressTrack}>
          <LinearGradient
            colors={Gradients.brand}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[styles.progressFill, { width: `${(step / total) * 100}%` }]}
          />
        </View>

        <View style={[styles.body, scrollable && { flex: 1 }]}>
          {eyebrow && <Text style={styles.eyebrow}>{eyebrow}</Text>}
          <Text style={styles.title}>{title}</Text>
          {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
          <View style={{ marginTop: Spacing.lg }}>{children}</View>
        </View>

        <PrimaryButton
          title={ctaTitle}
          iconLeft={ctaIcon}
          onPress={onCta}
          loading={ctaLoading}
          disabled={ctaDisabled}
        />
      </KeyboardAvoidingView>
    </ScreenBackdrop>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: Spacing.xl, paddingTop: Spacing.lg, paddingBottom: Spacing.xl },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  stepText: { ...Typography.caption, color: AppColors.textSecondary, fontWeight: '600' },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: AppColors.surface3,
    overflow: 'hidden',
    marginBottom: Spacing.xl,
  },
  progressFill: {
    height: '100%',
    borderRadius: BorderRadius.full,
  },
  body: { flex: 1 },
  eyebrow: { ...Typography.label, color: AppColors.primary, textTransform: 'uppercase', letterSpacing: 1.4 },
  title: { ...Typography.display, color: AppColors.textPrimary, fontSize: 32, lineHeight: 36, marginTop: Spacing.sm },
  subtitle: { ...Typography.body, color: AppColors.textSecondary, marginTop: Spacing.sm },
});
