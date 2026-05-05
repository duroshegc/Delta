import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { AppColors, BorderRadius, Gradients, Shadows, Spacing, Typography } from '../../core/theme';

type Variant = 'gradient' | 'solid' | 'outline' | 'ghost';
type Tone = 'brand' | 'live' | 'delt';

interface Props {
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: Variant;
  tone?: Tone;
  size?: 'md' | 'lg';
  iconLeft?: string;
  style?: ViewStyle;
}

const gradientFor = (tone: Tone) =>
  tone === 'live' ? Gradients.live : tone === 'delt' ? Gradients.delt : Gradients.brand;

const glowFor = (tone: Tone) =>
  tone === 'live' ? Shadows.glowLive : tone === 'delt' ? Shadows.glowDelt : Shadows.glowPink;

export const PrimaryButton: React.FC<Props> = ({
  title,
  onPress,
  loading,
  disabled,
  variant = 'gradient',
  tone = 'brand',
  size = 'lg',
  iconLeft,
  style,
}) => {
  const isDisabled = disabled || loading;
  const height = size === 'lg' ? 56 : 48;
  const colors = gradientFor(tone);
  const glow = glowFor(tone);

  const Inner = (
    <View style={styles.inner}>
      {loading ? (
        <ActivityIndicator color={variant === 'outline' || variant === 'ghost' ? colors[0] : AppColors.white} />
      ) : (
        <>
          {iconLeft && (
            <Text
              style={[
                styles.icon,
                {
                  color:
                    variant === 'outline' || variant === 'ghost' ? colors[0] : AppColors.white,
                },
              ]}
            >
              {iconLeft}
            </Text>
          )}
          <Text
            style={[
              styles.label,
              {
                color:
                  variant === 'outline' || variant === 'ghost' ? colors[0] : AppColors.white,
              },
            ]}
          >
            {title}
          </Text>
        </>
      )}
    </View>
  );

  if (variant === 'gradient') {
    return (
      <Pressable
        onPress={onPress}
        disabled={isDisabled}
        style={({ pressed }) => [
          styles.wrap,
          { height, borderRadius: BorderRadius.full },
          glow,
          isDisabled && styles.disabled,
          pressed && !isDisabled && styles.pressed,
          style,
        ]}
      >
        <LinearGradient
          colors={colors as unknown as string[]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0.8 }}
          style={[styles.fill, { borderRadius: BorderRadius.full }]}
        >
          {Inner}
        </LinearGradient>
      </Pressable>
    );
  }

  if (variant === 'solid') {
    return (
      <Pressable
        onPress={onPress}
        disabled={isDisabled}
        style={({ pressed }) => [
          styles.wrap,
          {
            height,
            borderRadius: BorderRadius.full,
            backgroundColor: colors[0],
          },
          Shadows.soft,
          isDisabled && styles.disabled,
          pressed && !isDisabled && styles.pressed,
          style,
        ]}
      >
        {Inner}
      </Pressable>
    );
  }

  if (variant === 'outline') {
    return (
      <Pressable
        onPress={onPress}
        disabled={isDisabled}
        style={({ pressed }) => [
          styles.wrap,
          {
            height,
            borderRadius: BorderRadius.full,
            borderWidth: 1.5,
            borderColor: colors[0],
            backgroundColor: AppColors.surface,
          },
          isDisabled && styles.disabled,
          pressed && !isDisabled && styles.pressed,
          style,
        ]}
      >
        {Inner}
      </Pressable>
    );
  }

  // ghost
  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.wrap,
        { height, borderRadius: BorderRadius.full },
        isDisabled && styles.disabled,
        pressed && !isDisabled && styles.pressed,
        style,
      ]}
    >
      {Inner}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  wrap: { overflow: 'hidden' },
  fill: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  inner: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    paddingHorizontal: Spacing.xl,
  },
  label: { ...Typography.bodyMedium, fontSize: 16, fontWeight: '700' },
  icon: { fontSize: 18, marginRight: Spacing.sm },
  disabled: { opacity: 0.45 },
  pressed: { opacity: 0.92, transform: [{ scale: 0.985 }] },
});
